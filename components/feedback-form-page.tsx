"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, Cancel01Icon, ImageAdd01Icon, InformationCircleIcon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CONTACT_CATEGORY_OPTIONS, CONTACT_WHO_OPTIONS } from "@/lib/contact";
import {
  TurnstileWidget,
  type TurnstileWidgetHandle,
} from "@/components/turnstile-widget";
import { StarRating } from "@/components/star-rating";
import { useTurnstileSiteKey } from "@/hooks/use-turnstile-site-key";

const MAX_MESSAGE_LENGTH = 400;
const MAX_ATTACHMENTS = 2;
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const ALLOWED_ATTACHMENT_TYPES = new Set(["image/jpeg", "image/png"]);
const FEEDBACK_TURNSTILE_COOKIE = "contact_turnstile_verified";

interface FeedbackAttachment {
  id: string;
  file: File;
  url: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function revokeAttachmentUrls(items: FeedbackAttachment[]) {
  for (const item of items) URL.revokeObjectURL(item.url);
}

export function FeedbackFormPage({
  initialTurnstileSiteKey = "",
}: {
  initialTurnstileSiteKey?: string;
}) {
  const router = useRouter();
  const [headerVisible, setHeaderVisible] = useState(true);
  const [who, setWho] = useState("");
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [email, setEmail] = useState("");
  const [emailInfoOpen, setEmailInfoOpen] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileNonce, setTurnstileNonce] = useState(0);
  const [isTurnstileSessionVerified, setIsTurnstileSessionVerified] = useState(false);
  const [website, setWebsite] = useState("");
  const [startedAt, setStartedAt] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const [attachments, setAttachments] = useState<FeedbackAttachment[]>([]);
  const lastScrollTop = useRef(0);
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentsRef = useRef<FeedbackAttachment[]>([]);
  attachmentsRef.current = attachments;

  const { siteKey: turnstileSiteKey, isReady: isTurnstileConfigReady } =
    useTurnstileSiteKey(initialTurnstileSiteKey);
  const requiresTurnstile = Boolean(turnstileSiteKey) && !isTurnstileSessionVerified;
  const waitForTurnstileConfig =
    process.env.NODE_ENV === "production" && !isTurnstileConfigReady;

  useEffect(() => {
    setStartedAt(Date.now());
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const hasVerifiedCookie = document.cookie
      .split(";")
      .some((item) => item.trim().startsWith(`${FEEDBACK_TURNSTILE_COOKIE}=1`));
    if (hasVerifiedCookie) setIsTurnstileSessionVerified(true);
  }, []);

  useEffect(() => {
    return () => {
      revokeAttachmentUrls(attachmentsRef.current);
    };
  }, []);

  const clearAttachments = useCallback(() => {
    setAttachments((prev) => {
      revokeAttachmentUrls(prev);
      return [];
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  function handleAttachmentPick(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (selected.length === 0) return;

    setAttachments((prev) => {
      const next = [...prev];
      for (const file of selected) {
        if (next.length >= MAX_ATTACHMENTS) {
          toast.error(`You can attach up to ${MAX_ATTACHMENTS} images.`);
          break;
        }
        if (!ALLOWED_ATTACHMENT_TYPES.has(file.type)) {
          toast.error("Only JPEG and PNG images are allowed.");
          continue;
        }
        if (file.size > MAX_ATTACHMENT_BYTES) {
          toast.error("Each image must be 5 MB or smaller.");
          continue;
        }
        next.push({
          id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
          file,
          url: URL.createObjectURL(file),
        });
      }
      return next;
    });
  }

  function handleRemoveAttachment(id: string) {
    setAttachments((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((item) => item.id !== id);
    });
  }

  const messageLength = message.length;
  const isFormValid = useMemo(
    () =>
      who.length > 0 &&
      category.length > 0 &&
      rating >= 1 &&
      rating <= 5 &&
      message.trim().length > 0,
    [who, category, message, rating]
  );

  const submitFeedbackForm = useCallback(async () => {
    if (!isFormValid || isSubmitting) return;
    if (requiresTurnstile && !turnstileToken.trim()) return;
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("who", who);
      formData.append("category", category);
      formData.append("message", message.trim());
      formData.append("startedAt", String(startedAt));
      formData.append("website", website);
      formData.append("rating", String(rating));
      if (email.trim().length > 0) formData.append("email", email.trim());
      if (requiresTurnstile) formData.append("turnstileToken", turnstileToken);
      for (const item of attachments) {
        formData.append("files", item.file, item.file.name);
      }

      const response = await fetch("/feedback/api", {
        method: "POST",
        body: formData,
      });

      const raw = (await response.json().catch(() => ({}))) as { message?: string; error?: string };
      if (!response.ok) {
        if (response.status === 403) {
          setIsTurnstileSessionVerified(false);
          setTurnstileToken("");
          setTurnstileNonce((prev) => prev + 1);
        }
        toast.error(raw.error ?? "Unable to submit right now. Please try again.");
        return;
      }

      toast.success(raw.message ?? "Thanks! Your feedback was sent.");
      setIsTurnstileSessionVerified(true);
      setMessage("");
      setCategory("");
      setWho("");
      setEmail("");
      setRating(0);
      setWebsite("");
      clearAttachments();
      setTurnstileToken("");
      setTurnstileNonce((prev) => prev + 1);
      setStartedAt(Date.now());
    } catch {
      toast.error("Network issue detected. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    attachments,
    category,
    clearAttachments,
    email,
    isFormValid,
    isSubmitting,
    message,
    rating,
    requiresTurnstile,
    startedAt,
    turnstileToken,
    website,
    who,
  ]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isFormValid || isSubmitting || waitForTurnstileConfig) return;
    if (requiresTurnstile && !turnstileToken.trim()) {
      setPendingSubmit(true);
      turnstileRef.current?.execute();
      return;
    }
    await submitFeedbackForm();
  }

  useEffect(() => {
    if (!pendingSubmit || !turnstileToken.trim() || isSubmitting) return;
    setPendingSubmit(false);
    void submitFeedbackForm();
  }, [pendingSubmit, requiresTurnstile, turnstileToken, isSubmitting, submitFeedbackForm]);

  function handleReset() {
    setWho("");
    setCategory("");
    setMessage("");
    setEmail("");
    setRating(0);
    setWebsite("");
    clearAttachments();
    setTurnstileToken("");
    setPendingSubmit(false);
    setTurnstileNonce((prev) => prev + 1);
    setStartedAt(Date.now());
  }

  useEffect(() => {
    const onScroll = () => {
      const currentScrollTop = window.scrollY;
      if (currentScrollTop <= 10 || currentScrollTop < lastScrollTop.current) {
        setHeaderVisible(true);
      } else if (currentScrollTop > lastScrollTop.current) {
        setHeaderVisible(false);
      }
      lastScrollTop.current = currentScrollTop;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <Toaster position="top-center" />
      <div className="chat-top-fade absolute left-0 right-0 top-0 z-[9] pointer-events-none" />

      <div
        className={`chat-header absolute left-0 right-0 top-0 z-10 px-4 md:px-0 ${
          headerVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <header className="mx-auto flex w-full max-w-[600px] items-center gap-3 pt-8 pb-3">
          <button
            onClick={() => router.push("/")}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary hover:opacity-80"
            aria-label="Back to home"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="h-5 w-5" />
          </button>
        </header>
      </div>

      <div className="px-4 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] pt-24 md:px-0">
        <div className="mx-auto w-full max-w-[600px]">
          <Card className="gap-0 rounded-[10px] shadow-none">
            <CardHeader className="space-y-1 pb-4 px-3 sm:px-6">
              <div>
                <CardTitle className="text-2xl font-semibold">Send Feedback</CardTitle>
                <CardDescription className="mt-1 text-sm text-foreground">
                  We&apos;d love to hear what you think. Help us improve by sharing your feedback, or send an email to{" "}
                  <a
                    href="mailto:hello@bilauitmcuti.com"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    hello@bilauitmcuti.com
                  </a>
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="px-3 sm:px-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="who" className="mb-3 block text-sm font-semibold">
                      Who are you
                    </label>
                    <Select value={who} onValueChange={(value) => setWho(value ?? "")}>
                      <SelectTrigger id="who" className="h-11 w-full justify-between bg-background shadow-none">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent
                        alignItemWithTrigger={false}
                        sideOffset={6}
                        align="start"
                        className="w-[var(--anchor-width)]"
                      >
                        {CONTACT_WHO_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <div className="mb-3 flex items-center gap-1.5">
                      <label htmlFor="email" className="block text-sm font-semibold">
                        Email address{" "}
                        <span className="font-normal text-muted-foreground">(optional)</span>
                      </label>
                      <TooltipProvider delay={0}>
                        <Tooltip open={emailInfoOpen} onOpenChange={setEmailInfoOpen}>
                          <TooltipTrigger
                            type="button"
                            aria-label="Why we ask for your email"
                            onClick={() => setEmailInfoOpen((prev) => !prev)}
                            className="inline-flex size-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                          >
                            <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} className="size-4" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[260px] text-center">
                            Your email will only be used to follow up on your feedback. Leave it empty if you&apos;d
                            prefer not to receive a reply.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <input
                      id="email"
                      type="email"
                      inputMode="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      autoComplete="email"
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-none outline-none transition-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#2A2A2A]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="category" className="mb-3 block text-sm font-semibold">
                      Category
                    </label>
                    <Select value={category} onValueChange={(value) => setCategory(value ?? "")}>
                      <SelectTrigger id="category" className="h-11 w-full justify-between bg-background shadow-none">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent
                        alignItemWithTrigger={false}
                        sideOffset={6}
                        align="start"
                        className="w-[var(--anchor-width)]"
                      >
                        {CONTACT_CATEGORY_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="mb-3 block text-sm font-semibold">Rating</label>
                    <StarRating
                      rating={rating}
                      onRatingChange={setRating}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="mb-3 block text-sm font-semibold">
                    Feedback
                  </label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(event) => setMessage(event.target.value.slice(0, MAX_MESSAGE_LENGTH))}
                    maxLength={MAX_MESSAGE_LENGTH}
                    rows={6}
                    placeholder="Write your feedback..."
                    className="resize-none bg-background text-sm shadow-none placeholder:text-sm dark:bg-[#2A2A2A]"
                  />
                  <div className="mt-2 text-xs text-muted-foreground">
                    {messageLength}/{MAX_MESSAGE_LENGTH} characters
                  </div>

                  <div className="mt-3 flex flex-col gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png"
                      multiple
                      className="hidden"
                      onChange={handleAttachmentPick}
                    />
                    <div className="flex flex-col gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isSubmitting || attachments.length >= MAX_ATTACHMENTS}
                        onClick={() => fileInputRef.current?.click()}
                        className="h-[38px] w-fit"
                      >
                        <HugeiconsIcon icon={ImageAdd01Icon} strokeWidth={2} data-icon="inline-start" />
                        Add image
                        <span className="font-normal text-muted-foreground">
                          ({attachments.length}/{MAX_ATTACHMENTS})
                        </span>
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Images are optional. You can submit feedback without attaching any.
                      </p>
                    </div>

                    {attachments.length > 0 ? (
                      <AttachmentGroup>
                        {attachments.map((item) => (
                          <Attachment
                            key={item.id}
                            state="done"
                            orientation="vertical"
                            className="w-36 rounded-md"
                          >
                            <AttachmentMedia variant="image" className="rounded-md">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={item.url} alt={item.file.name} />
                            </AttachmentMedia>
                            <AttachmentContent>
                              <AttachmentTitle>{item.file.name}</AttachmentTitle>
                              <AttachmentDescription>
                                {item.file.type === "image/png" ? "PNG" : "JPEG"} ·{" "}
                                {formatFileSize(item.file.size)}
                              </AttachmentDescription>
                            </AttachmentContent>
                            <AttachmentActions>
                              <AttachmentAction
                                type="button"
                                aria-label={`Remove ${item.file.name}`}
                                disabled={isSubmitting}
                                onClick={() => handleRemoveAttachment(item.id)}
                              >
                                <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
                              </AttachmentAction>
                            </AttachmentActions>
                          </Attachment>
                        ))}
                      </AttachmentGroup>
                    ) : null}
                  </div>
                </div>

                {requiresTurnstile ? (
                  <div className="space-y-2">
                    <TurnstileWidget
                      ref={turnstileRef}
                      key={turnstileNonce}
                      siteKey={turnstileSiteKey}
                      action="contact_form"
                      onToken={setTurnstileToken}
                    />
                  </div>
                ) : null}

                <div className="hidden" aria-hidden>
                  <label htmlFor="website">Website</label>
                  <input
                    id="website"
                    name="website"
                    value={website}
                    onChange={(event) => setWebsite(event.target.value)}
                    autoComplete="off"
                    tabIndex={-1}
                  />
                </div>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto h-[38px]"
                  >
                    Reset
                  </Button>
                  <Button
                    type="submit"
                    disabled={!isFormValid || isSubmitting || waitForTurnstileConfig}
                    className="w-full sm:w-auto h-[38px]"
                  >
                    {isSubmitting ? "Submitting..." : "Submit"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="mt-4 gap-0 rounded-[10px] shadow-none">
            <CardHeader className="space-y-1 pb-4 px-3 sm:px-6">
              <CardTitle className="text-xl font-semibold">Become Our Sponsors</CardTitle>
              <CardDescription className="mt-1 text-sm text-foreground">
                Support the project and help keep the calendar free for everyone.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 px-3 sm:px-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                  render={
                    <a
                      href="https://shahrulestar.com/sponsor"
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                  nativeButton={false}
                  className="w-full sm:w-auto h-[38px]"
                >
                  Sponsor
                </Button>
                <Button
                  variant="outline"
                  render={
                    <a
                      href="https://github.com/sponsors/shahrulestar"
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                  nativeButton={false}
                  className="w-full sm:w-auto h-[38px]"
                >
                  Github Sponsor
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
