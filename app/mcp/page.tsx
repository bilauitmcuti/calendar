'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon, Copy01Icon, PlayIcon, Tick02Icon } from '@hugeicons/core-free-icons';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BrandName } from '@/components/brand-name';
import { copyTextToClipboard } from '@/lib/web-share';

const MCP_SERVER_URL = 'https://mcp.bilauitmcuti.com/mcp';

export default function McpPage() {
  const router = useRouter();
  const [headerVisible, setHeaderVisible] = useState(true);
  const [copied, setCopied] = useState(false);
  const lastScrollTop = useRef(0);

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

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleCopy = useCallback(async () => {
    const ok = await copyTextToClipboard(MCP_SERVER_URL);
    if (ok) {
      setCopied(true);
      toast.success('URL copied');
      window.setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('Could not copy URL');
    }
  }, []);

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="chat-top-fade pointer-events-none absolute left-0 right-0 top-0 z-[9]" />

      <div
        className={`chat-header absolute left-0 right-0 top-0 z-10 px-4 md:px-0 ${
          headerVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <header className="mx-auto flex w-full max-w-[600px] items-center gap-3 pb-3 pt-8">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary hover:opacity-80"
            aria-label="Back To Home"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="h-5 w-5" />
          </button>
        </header>
      </div>

      <div className="px-4 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] pt-24 md:px-0">
        <article className="typeset typeset-article mx-auto w-full max-w-[600px]">
          <h1>
            MCP Server — <BrandName />
          </h1>
          <p>
            Connect Claude to the <BrandName /> MCP server to ask about the UiTM academic calendar and Malaysia
            public holidays in plain language.
          </p>

          <h2>Remote MCP URL</h2>
          <div className="not-typeset mt-[var(--typeset-flow)] relative">
            <Input
              readOnly
              value={MCP_SERVER_URL}
              aria-label="Remote MCP server URL"
              className="pr-11 font-mono text-xs sm:text-sm"
              onFocus={(e) => e.currentTarget.select()}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={copied ? 'Copied' : 'Copy URL'}
              className="absolute top-1/2 right-0.5 -translate-y-1/2 text-muted-foreground"
              onClick={() => void handleCopy()}
            >
              <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} strokeWidth={2} className="size-4" />
            </Button>
          </div>

          <h2>Add it to Claude</h2>
          <p>
            In Claude, go to <strong>Customize → Connectors</strong>, click <strong>Add custom connector</strong>,
            paste the URL above, and set authentication to <strong>None</strong>. Then enable it per conversation
            from the <strong>+</strong> menu → <strong>Connectors</strong>.
          </p>

          <div className="not-typeset mt-[var(--typeset-flow)] flex flex-col gap-6">
            <figure className="flex flex-col items-center gap-2">
              <Image
                src="/image/claude-enable-connector.webp"
                alt="Adding the Bila UiTM Cuti custom connector in Claude"
                width={1280}
                height={720}
                className="h-auto w-full rounded-lg ring-1 ring-border"
              />
              <span className="text-center text-xs text-muted-foreground">
                Add the custom connector and paste the MCP URL.
              </span>
            </figure>
            <figure className="flex flex-col items-center gap-2">
              <Image
                src="/image/claude-add-custom-connector.webp"
                alt="Enabling the Bila UiTM Cuti custom connector in a Claude conversation"
                width={1280}
                height={720}
                className="h-auto w-full rounded-lg ring-1 ring-border"
              />
              <span className="text-center text-xs text-muted-foreground">
                Enable the connector for your conversation.
              </span>
            </figure>
          </div>

          <h2>Try it on Grok Bot</h2>
          <p>
            Want an instant assistant already set up? Add the <BrandName /> bot on Grok to get answers about lectures, cuti, exams, registration, and public holidays—no connector setup needed.
            <br />
            <br />
            <strong>Note:</strong> A paid subscription is required to use the Grok bot.
          </p>
          <div className="not-typeset mt-[var(--typeset-flow)]">
            <Button
              render={
                <a
                  href="https://x.ai/bot/NdfYE7nsqkzFLbgVmWx1U"
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
              nativeButton={false}
              className="h-[38px] w-fit"
            >
              Add to Grok Bot
            </Button>
          </div>

          <h2>Need more help?</h2>
          <p>Watch the step-by-step video tutorial for adding the connector in Claude.</p>
          <div className="not-typeset mt-[var(--typeset-flow)]">
            <Button
              render={<a href="https://youtu.be/P4Gm59-Je-4" target="_blank" rel="noopener noreferrer" />}
              nativeButton={false}
              className="h-[38px] w-fit gap-2"
            >
              <HugeiconsIcon icon={PlayIcon} strokeWidth={2} className="size-4" />
              Watch video tutorial
            </Button>
          </div>
        </article>
      </div>
    </div>
  );
}
