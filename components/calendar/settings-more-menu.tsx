"use client";

import { useMemo } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Briefcase01Icon,
  Download03Icon,
  Linkedin02Icon,
  McpServerIcon,
  Message01Icon,
  ThreadsIcon,
} from "@hugeicons/core-free-icons";
import { ResponsiveOverlayShell } from "@/components/ui/responsive-overlay-shell";
import { usePhoneViewport } from "@/lib/use-mobile-viewport";
import { trackZarazEvent, ZARAZ_EVENTS } from "@/lib/zaraz";

const MCP_PAGE_PATH = "/mcp";
const MORE_MENU_TITLE = "Quick links";
const MORE_MENU_DESCRIPTION = "Helpful tools and links in one place.";

const moreMenuGridClassName = "mt-4 grid w-full grid-cols-2 gap-2";
const moreMenuListClassName = "mt-4 flex w-full flex-col gap-1";
const moreMenuGridTileClassName =
  "flex h-16 w-full flex-col items-center justify-center gap-1 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const moreMenuListTileClassName =
  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

interface MoreLinkItem {
  label: string;
  href: string;
  icon: typeof Download03Icon;
  onClick?: () => void;
}

interface SettingsMoreMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hideDownload?: boolean;
}

function MoreLinkTile({
  label,
  href,
  icon,
  layout,
  onClick,
}: MoreLinkItem & { layout: "grid" | "list" }) {
  const isList = layout === "list";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className={isList ? moreMenuListTileClassName : moreMenuGridTileClassName}
    >
      <HugeiconsIcon icon={icon} strokeWidth={2} className="size-5 shrink-0" />
      <span className={isList ? "text-sm font-medium" : "text-center text-xs font-medium"}>
        {label}
      </span>
      <span className="sr-only">(opens in new tab)</span>
    </a>
  );
}

export function SettingsMoreMenu({
  open,
  onOpenChange,
  hideDownload = false,
}: SettingsMoreMenuProps) {
  const isPhone = usePhoneViewport();

  const items = useMemo(() => {
    const links: MoreLinkItem[] = [];

    if (!hideDownload) {
      links.push({
        label: "Download",
        href: "/download",
        icon: Download03Icon,
        onClick: () => {
          trackZarazEvent(ZARAZ_EVENTS.openDownload, { source: "settings" });
        },
      });
    }

    links.push(
      {
        label: "Feedback",
        href: "/feedback",
        icon: Message01Icon,
        onClick: () => {
          trackZarazEvent(ZARAZ_EVENTS.openFeedback, { source: "settings" });
        },
      },
      {
        label: "MCP Server",
        href: MCP_PAGE_PATH,
        icon: McpServerIcon,
      },
      {
        label: "Internship",
        href: "/internship",
        icon: Briefcase01Icon,
      },
      {
        label: "Threads",
        href: "https://www.threads.com/@bilauitmcuti",
        icon: ThreadsIcon,
      },
      {
        label: "LinkedIn",
        href: "https://www.linkedin.com/company/bilauitmcuti/",
        icon: Linkedin02Icon,
      }
    );

    return links;
  }, [hideDownload]);

  return (
    <ResponsiveOverlayShell
      open={open}
      onOpenChange={onOpenChange}
      isMobile={isPhone}
      title={MORE_MENU_TITLE}
      description={MORE_MENU_DESCRIPTION}
      scrollClassName="text-left"
      desktopBodyClassName="w-full"
    >
      <div className={isPhone ? moreMenuListClassName : moreMenuGridClassName}>
        {items.map((item) => (
          <MoreLinkTile
            key={item.href}
            layout={isPhone ? "list" : "grid"}
            {...item}
          />
        ))}
      </div>
    </ResponsiveOverlayShell>
  );
}
