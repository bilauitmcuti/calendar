"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SettingsSwitchRow } from "@/components/ui/settings-switch-row";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/sonner";
import { CONTACT_CATEGORY_OPTIONS, CONTACT_WHO_OPTIONS } from "@/lib/contact";
import {
  TurnstileWidget,
  type TurnstileWidgetHandle,
} from "@/components/turnstile-widget";
import { useTurnstileSiteKey } from "@/hooks/use-turnstile-site-key";

const MAX_MESSAGE_LENGTH = 400;
const FEEDBACK_TURNSTILE_COOKIE = "contact_turnstile_verified";

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
  const [email, setEmail] = useState("");
  const [wantsEmailReply, setWantsEmailReply] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileNonce, setTurnstileNonce] = useState(0);
  const [isTurnstileSessionVerified, setIsTurnstileSessionVerified] = useState(false);
  const [website, setWebsite] = useState("");
  const [startedAt, setStartedAt] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const lastScrollTop = useRef(0);
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);

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

  const messageLength = message.length;

  const isFormValid = useMemo(
    () =>
      who.length > 0 &&
      category.length > 0 &&
      message.trim().length > 0 &&
      (!wantsEmailReply || email.trim().length > 0),
    [category, email, message, wantsEmailReply, who]
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
      if (wantsEmailReply && email.trim().length > 0) {
        formData.append("email", email.trim());
      }
      if (requiresTurnstile) formData.append("turnstileToken", turnstileToken);

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
      setWantsEmailReply(false);
      setWebsite("");
      setTurnstileToken("");
      setTurnstileNonce((prev) => prev + 1);
      setStartedAt(Date.now());
    } catch {
      toast.error("Network issue detected. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    category,
    email,
    isFormValid,
    isSubmitting,
    message,
    requiresTurnstile,
    startedAt,
    turnstileToken,
    wantsEmailReply,
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
            type="button"
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
                <div>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(event) => setMessage(event.target.value.slice(0, MAX_MESSAGE_LENGTH))}
                    maxLength={MAX_MESSAGE_LENGTH}
                    rows={6}
                    placeholder="What happened? What did you expect?"
                    className="min-h-[140px] resize-none bg-background text-sm shadow-none placeholder:text-sm dark:bg-[#2A2A2A]"
                  />
                  <div className="mt-2 text-xs text-muted-foreground">
                    {messageLength}/{MAX_MESSAGE_LENGTH} characters
                  </div>
                </div>

                <div>
                  <label htmlFor="who" className="mb-3 block text-sm font-semibold">
                    Who are you
                  </label>
                  <Select value={who} onValueChange={(value) => setWho(value ?? "")} disabled={isSubmitting}>
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
                  <label htmlFor="category" className="mb-3 block text-sm font-semibold">
                    Category
                  </label>
                  <Select value={category} onValueChange={(value) => setCategory(value ?? "")} disabled={isSubmitting}>
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

                <div className="space-y-3">
                  <SettingsSwitchRow
                    label="I want an email reply"
                    checked={wantsEmailReply}
                    onChange={setWantsEmailReply}
                    ariaLabel="I want an email reply"
                  />
                  {wantsEmailReply ? (
                    <input
                      id="email"
                      type="email"
                      inputMode="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      autoComplete="email"
                      disabled={isSubmitting}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-none outline-none transition-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#2A2A2A]"
                    />
                  ) : null}
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

                <Button
                  type="submit"
                  disabled={!isFormValid || isSubmitting || waitForTurnstileConfig}
                  className="h-[38px] w-full"
                >
                  {isSubmitting ? "Submitting..." : "Send Feedback"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
