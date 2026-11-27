'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon, Copy01Icon, Tick02Icon } from '@hugeicons/core-free-icons';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { copyTextToClipboard } from '@/lib/web-share';

const MCP_SERVER_URL = 'https://mcp.bilauitmcuti.com/mcp';
const GROK_BOT_ADD_PROMPT = `Add this MCP server: ${MCP_SERVER_URL}`;
const DOCS_MCP_SEARCH_URL = 'https://docs.bilauitmcuti.com/mcp';
const MCP_DOCS_URL = 'https://docs.bilauitmcuti.com/mcp-server';

export default function McpPage() {
  const router = useRouter();
  const [headerVisible, setHeaderVisible] = useState(true);
  const [copied, setCopied] = useState(false);
  const [grokPromptCopied, setGrokPromptCopied] = useState(false);
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

  const handleCopyGrokPrompt = useCallback(async () => {
    const ok = await copyTextToClipboard(GROK_BOT_ADD_PROMPT);
    if (ok) {
      setGrokPromptCopied(true);
      toast.success('Message copied');
      window.setTimeout(() => setGrokPromptCopied(false), 2000);
    } else {
      toast.error('Could not copy message');
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
          <h1>MCP Server - Kalendar Akademik UiTM</h1>
          <div className="not-typeset mt-[var(--typeset-flow)]">
            <Badge variant="destructive">Not affiliated with UiTM</Badge>
          </div>
          <p>
            Connect Claude, Grok, Cursor, or your code editor to read-only UiTM calendar and Malaysia public holiday
            data. The first time you connect, allow access when your app asks.
          </p>

          <h2>Server address</h2>
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
              className="absolute top-0 right-0.5 bottom-0 my-auto text-muted-foreground active:not-aria-[haspopup]:translate-none"
              onClick={() => void handleCopy()}
            >
              <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} strokeWidth={2} className="size-4" />
            </Button>
          </div>
          <p>
            This is a hosted online server. The first time you use it, your app opens a browser so you can allow
            access.
          </p>

          <h2>Get started in three steps</h2>
          <ol>
            <li>Add the server address above in your AI app or editor.</li>
            <li>Allow access when prompted, then refresh or restart so the calendar tools appear.</li>
            <li>Try a question, for example: &ldquo;List Malaysia public holidays in Selangor for 2026.&rdquo;</li>
          </ol>
          <p>
            Do not use the <code>mcp-remote</code> workaround. Follow the setup steps in our{' '}
            <a href={MCP_DOCS_URL} target="_blank" rel="noopener noreferrer">
              full guide
            </a>{' '}
            instead.
          </p>

          <h2>Use the right link</h2>
          <p>
            For calendar dates, use <code>{MCP_SERVER_URL}</code>. The docs site has a separate search connector at{' '}
            <code>{DOCS_MCP_SEARCH_URL}</code> for finding help articles. That one does not load calendar tools.
          </p>

          <h2>Claude on the web</h2>
          <ol>
            <li>
              Open Settings → Connectors, or tap <strong>+</strong> in chat → Connectors, then{' '}
              <strong>Add custom connector</strong>.
            </li>
            <li>
              Name it <strong>Bila UiTM Cuti</strong>, paste the server address, and when Claude asks how to log in,
              choose sign-in (OAuth), not &ldquo;no login&rdquo;.
            </li>
            <li>Turn on Bila UiTM Cuti in chat and allow access in the browser.</li>
          </ol>
          <p>
            If you added the connector earlier without sign-in, delete it and add it again, then allow access when
            asked.
            Turning it off is not enough.
          </p>

          <h2>Grok on the web</h2>
          <ol>
            <li>
              Open{' '}
              <a href="https://grok.com/connectors" target="_blank" rel="noopener noreferrer">
                grok.com/connectors
              </a>
              .
            </li>
            <li>Tap <strong>New Connector</strong>, then <strong>Custom</strong>, and paste the server address.</li>
            <li>Allow access in the popup. Allow pop-ups for grok.com if the window does not open.</li>
          </ol>
          <p>
            Grok on the web and Grok Bot in Cursor keep sign-in separately. Fix each one on its own if one still
            thinks sign-in is turned off.
          </p>

          <h2>Grok Bot</h2>
          <p>In chat, send:</p>
          <div className="not-typeset mt-[var(--typeset-flow)] relative">
            <Input
              readOnly
              value={GROK_BOT_ADD_PROMPT}
              aria-label="Grok Bot add MCP server message"
              className="pr-11 font-mono text-xs sm:text-sm"
              onFocus={(e) => e.currentTarget.select()}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={grokPromptCopied ? 'Copied' : 'Copy message'}
              className="absolute top-0 right-0.5 bottom-0 my-auto text-muted-foreground active:not-aria-[haspopup]:translate-none"
              onClick={() => void handleCopyGrokPrompt()}
            >
              <HugeiconsIcon
                icon={grokPromptCopied ? Tick02Icon : Copy01Icon}
                strokeWidth={2}
                className="size-4"
              />
            </Button>
          </div>
          <p>Confirm the name and address, then allow access when prompted. Use @ in chat to attach the connector again if needed.</p>

          <h2>Cursor, VS Code, and other apps</h2>
          <p>
            Cursor, Claude Code, VS Code, Codex, and OpenCode all use the same server address. Each app has its own
            config file or command. If you use Cursor, the full guide includes one extra line in the settings file
            so sign-in works. Step-by-step setup for every app is in the{' '}
            <a href={MCP_DOCS_URL} target="_blank" rel="noopener noreferrer">
              MCP server guide
            </a>
            .
          </p>

          <h2>Questions you can ask</h2>
          <ul>
            <li>What UiTM sessions are available for Group A?</li>
            <li>When does lecture week 1 start for this session?</li>
            <li>Is 2026-03-09 a class day for Group B Diploma?</li>
            <li>List Malaysia public holidays in Selangor for 2026.</li>
          </ul>
          <p>
            Session codes change each semester. Ask for the current session list first if your question needs a
            specific term. The server can read lecture weeks, class days, breaks, exams, and holidays by state. It
            cannot edit the calendar.
          </p>

          <h2>Something not working?</h2>
          <ul>
            <li>
              <strong>Tools do not show up:</strong> Remove the old connector, add the server address again, allow
              access when prompted, then restart the app or refresh the tools list.
            </li>
            <li>
              <strong>Sign-in keeps failing:</strong> Start again from the app, not from a saved consent page.
              Cursor users should follow the Cursor section in the full guide.
            </li>
            <li>
              <strong>Claude says no login needed:</strong> Delete the connector and add it again, choose sign-in, and
              allow access.
            </li>
            <li>
              <strong>Works in one app but not another:</strong> Each app stores its own sign-in. Set up each one
              separately.
            </li>
          </ul>
          <p>
            More fixes are in the{' '}
            <a href={MCP_DOCS_URL} target="_blank" rel="noopener noreferrer">
              troubleshooting section
            </a>{' '}
            of the full guide.
          </p>

          <h2>Full guide</h2>
          <p>
            Config files, privacy policy, and terms of use:{' '}
            <a href={MCP_DOCS_URL} target="_blank" rel="noopener noreferrer">
              docs.bilauitmcuti.com/mcp-server
            </a>
            .
          </p>
        </article>
      </div>
    </div>
  );
}