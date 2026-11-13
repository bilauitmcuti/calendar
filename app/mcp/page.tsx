'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
            Connect Claude, Grok, Cursor, VS Code, or Codex to a read-only server for the UiTM academic calendar
            and Malaysia public holidays. There is no API key, and nothing on the calendar can be changed.
          </p>

          <h2>Server URL</h2>
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
          <p>Hosted. Streamable HTTP. No sign-in.</p>

          <h2>Quick start</h2>
          <ol>
            <li>Add the URL in your client.</li>
            <li>Restart the client, or refresh the tools list, so the six tools show up.</li>
            <li>Ask something like &ldquo;List Malaysia public holidays in Selangor for 2026.&rdquo;</li>
          </ol>

          <h2>In chat</h2>
          <p>
            <strong>Claude.</strong> Open{' '}
            <a href="https://claude.ai/plugins" target="_blank" rel="noopener noreferrer">
              claude.ai/plugins
            </a>{' '}
            and choose <strong>Add custom connector</strong>. Name it Bila UiTM Cuti, paste the server URL, leave
            authentication as None, then turn it on in the chat.
          </p>
          <p>
            <strong>Grok.</strong> Open{' '}
            <a href="https://grok.com/connectors" target="_blank" rel="noopener noreferrer">
              grok.com/connectors
            </a>
            , then New Connector, Custom, and paste the URL. If it asks, pick None.
          </p>
          <p>
            <strong>Grok Bot.</strong> In chat, send{' '}
            <code>Add this MCP server: {MCP_SERVER_URL}</code>. Confirm the name and URL. Tools show up on the next
            message.
          </p>

          <h2>In an editor</h2>
          <p>
            Cursor, Claude Code, VS Code, Codex, and OpenCode use the same URL. Config files and commands are on
            the{' '}
            <a href="https://docs.bilauitmcuti.com/mcp-server" target="_blank" rel="noopener noreferrer">
              MCP docs
            </a>
            .
          </p>

          <h2>What you can ask</h2>
          <ul>
            <li>When does lecture week 1 start for session B-20264?</li>
            <li>Is 2026-03-09 a class day for Group B Diploma?</li>
            <li>List Malaysia public holidays in Selangor for 2026.</li>
            <li>What UiTM sessions are available for Group A?</li>
          </ul>
          <p>
            The server can read sessions and activities, the 14 lecture weeks, whether a date is a class day, break,
            exam week, or study week, and public holidays by year and state. Calls follow the public API limit of
            500 requests a minute per IP.
          </p>

          <h2>Video</h2>
          <div className="not-typeset mt-[var(--typeset-flow)]">
            <Button
              render={<a href="https://youtu.be/q-WjGOBagkc" target="_blank" rel="noopener noreferrer" />}
              nativeButton={false}
              className="h-[38px] w-fit gap-2"
            >
              <HugeiconsIcon icon={PlayIcon} strokeWidth={2} className="size-4" />
              Watch how to add the custom connector in Claude
            </Button>
          </div>
        </article>
      </div>
    </div>
  );
}
