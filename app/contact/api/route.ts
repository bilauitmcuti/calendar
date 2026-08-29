export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";
import { CONTACT_CATEGORY_OPTIONS, CONTACT_WHO_OPTIONS } from "@/lib/contact";
import {
  buildContactNotificationEmbed,
  sendDiscordWebhook,
  type DiscordWebhookFile,
} from "@/lib/discord-webhook";
import { logger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  getClientIpForTurnstile,
  getTurnstileExpectedHostname,
  verifyTurnstileToken,
} from "@/lib/turnstile";
import { isTurnstileVerificationRequired } from "@/lib/turnstile-config";
import { jsonError, getClientIp, formatNotificationTime } from "@/lib/api-response";


const MAX_BODY_SIZE_BYTES = 10 * 1024;
const MAX_UPLOAD_BYTES = 11 * 1024 * 1024;
const MAX_ATTACHMENT_COUNT = 2;
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const ALLOWED_ATTACHMENT_TYPES = new Set(["image/jpeg", "image/png"]);
const MIN_SUBMIT_TIME_MS = 3000;
const CONTACT_TURNSTILE_COOKIE = "contact_turnstile_verified";
const CONTACT_TURNSTILE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 12;

interface ContactRequest {
  who: string;
  category: string;
  message: string;
  startedAt: number;
  website?: string;
  email?: string;
  turnstileToken?: string;
  rating: number;
}

const WHO_SET = new Set<string>(CONTACT_WHO_OPTIONS);
const CATEGORY_SET = new Set<string>(CONTACT_CATEGORY_OPTIONS);

function parseContactRequest(raw: unknown): { success: true; data: ContactRequest } | { success: false } {
  if (!raw || typeof raw !== "object") return { success: false };
  const o = raw as Record<string, unknown>;
  const who = String(o.who ?? "");
  const category = String(o.category ?? "");
  const message = String(o.message ?? "");
  const startedAt = Number(o.startedAt);
  if (!WHO_SET.has(who)) return { success: false };
  if (!CATEGORY_SET.has(category)) return { success: false };
  if (message.length < 1 || message.length > 400) return { success: false };
  if (!Number.isFinite(startedAt) || startedAt <= 0) return { success: false };
  const website = o.website != null ? String(o.website) : undefined;
  const email = o.email != null ? String(o.email) : undefined;
  const turnstileToken = o.turnstileToken != null && String(o.turnstileToken).trim().length > 0
    ? String(o.turnstileToken) : undefined;
  const parsedRating = Number(o.rating);
  if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    return { success: false };
  }
  return {
    success: true,
    data: { who, category, message, startedAt, website, email, turnstileToken, rating: parsedRating },
  };
}

function isFileLike(value: FormDataEntryValue): value is File {
  return typeof value === "object" && value !== null && "arrayBuffer" in value && "type" in value;
}

function sanitizeAttachmentFilename(name: string, index: number, contentType: string): string {
  const ext = contentType === "image/png" ? "png" : "jpg";
  const sanitized = name.replace(/[^\w.\-]+/g, "_").replace(/^\.+/, "").slice(0, 80);
  const stem = sanitized.replace(/\.(jpe?g|png)$/i, "").trim() || "attachment";
  return `${stem}-${index + 1}.${ext}`;
}

function parseAttachmentFiles(formData: FormData): { success: true; files: File[] } | { success: false } {
  // Empty / zero-byte entries are ignored so feedback can be sent with no image.
  const files = formData
    .getAll("files")
    .filter(isFileLike)
    .filter((file) => file.size > 0 && (file.name?.length ?? 0) > 0);
  if (files.length > MAX_ATTACHMENT_COUNT) return { success: false };
  for (const file of files) {
    if (!ALLOWED_ATTACHMENT_TYPES.has(file.type)) return { success: false };
    if (file.size > MAX_ATTACHMENT_BYTES) return { success: false };
  }
  return { success: true, files };
}

export async function POST(request: NextRequest) {
  const correlationId = `contact-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  let shouldSetVerifiedCookie = false;
  const withVerifiedCookie = (response: NextResponse): NextResponse => {
    if (!shouldSetVerifiedCookie) return response;
    response.cookies.set({
      name: CONTACT_TURNSTILE_COOKIE,
      value: "1",
      maxAge: CONTACT_TURNSTILE_COOKIE_MAX_AGE_SECONDS,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: false,
    });
    return response;
  };
  try {
    const contentType = request.headers.get("content-type") ?? "";
    const isMultipart = contentType.includes("multipart/form-data");
    const isJson = contentType.includes("application/json");
    if (!isMultipart && !isJson) {
      return jsonError("Content-Type must be application/json or multipart/form-data", 415);
    }

    const contentLength = request.headers.get("content-length");
    const maxBody = isMultipart ? MAX_UPLOAD_BYTES : MAX_BODY_SIZE_BYTES;
    if (contentLength && Number.parseInt(contentLength, 10) > maxBody) {
      return jsonError("Request body too large", 413);
    }

    const ip = getClientIp(request);
    const limitResult = checkRateLimit(ip, request);
    if (limitResult.limited) return jsonError(limitResult.message, 429);

    let parsed: { success: true; data: ContactRequest } | { success: false };
    let attachmentFiles: File[] = [];

    if (isMultipart) {
      const formData = await request.formData();
      const attachments = parseAttachmentFiles(formData);
      if (!attachments.success) return jsonError("Invalid attachment.", 400);
      attachmentFiles = attachments.files;

      parsed = parseContactRequest({
        who: formData.get("who"),
        category: formData.get("category"),
        message: formData.get("message"),
        startedAt: formData.get("startedAt"),
        website: formData.get("website") ?? undefined,
        email: formData.get("email") ?? undefined,
        turnstileToken: formData.get("turnstileToken") ?? undefined,
        rating: formData.get("rating"),
      });
    } else {
      const rawBody = await request.json();
      const bodyStr = JSON.stringify(rawBody);
      if (bodyStr.length > MAX_BODY_SIZE_BYTES) {
        return jsonError("Request body too large", 413);
      }
      parsed = parseContactRequest(rawBody);
    }

    if (!parsed.success) return jsonError("Invalid form values.", 400);

    const { who, category, message, startedAt, website, email, rating } = parsed.data;

    if ((website ?? "").trim().length > 0) {
      return NextResponse.json({ message: "Thanks! Your message was sent." });
    }

    if (Date.now() - startedAt < MIN_SUBMIT_TIME_MS) {
      return jsonError("Please take a moment before submitting the form.", 429);
    }

    const isTurnstileRequired = isTurnstileVerificationRequired();
    const hasVerifiedCookie =
      request.cookies.get(CONTACT_TURNSTILE_COOKIE)?.value === "1";
    if (isTurnstileRequired && !hasVerifiedCookie) {
      const token = parsed.data.turnstileToken?.trim() ?? "";
      if (!token) {
        return jsonError("Please complete verification first.", 403);
      }
      const hostname = request.headers.get("host") ?? "";
      const expectedAction = "contact_form";
      const turnstileResult = await verifyTurnstileToken({
        token,
        expectedAction,
        expectedHostname: getTurnstileExpectedHostname(hostname),
        remoteip: getClientIpForTurnstile(request),
      });
      if (!turnstileResult.success) {
        return jsonError("Access was blocked. Please complete the challenge and try again.", 403);
      }
      shouldSetVerifiedCookie = true;
    }

    const embed = buildContactNotificationEmbed({
      who,
      category,
      message: message.trim(),
      rating,
      email,
      time: formatNotificationTime(new Date()),
    });

    const files: DiscordWebhookFile[] = await Promise.all(
      attachmentFiles.map(async (file, index) => ({
        filename: sanitizeAttachmentFilename(file.name, index, file.type),
        contentType: file.type,
        data: await file.arrayBuffer(),
      }))
    );

    await sendDiscordWebhook({
      kind: "rate_feedback",
      embeds: [embed],
      ...(files.length > 0 ? { files } : {}),
    });

    return withVerifiedCookie(NextResponse.json({ message: "Thanks! Your message has been submitted." }));
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    logger.error("Contact API error", { correlationId, errMsg });
    return withVerifiedCookie(jsonError("Failed to submit your message. Please try again.", 500));
  }
}
