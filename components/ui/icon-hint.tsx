'use client';

import { cloneElement, useSyncExternalStore, type ReactElement, type ReactNode } from 'react';
import { Popover as PopoverPrimitive } from '@base-ui/react/popover';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  tooltipArrowClassName,
} from '@/components/ui/tooltip';

const FINE_HOVER_QUERY = '(hover: hover) and (pointer: fine)';

function subscribeFineHover(onChange: () => void): () => void {
  const mql = window.matchMedia(FINE_HOVER_QUERY);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

function useFineHover(): boolean {
  return useSyncExternalStore(
    subscribeFineHover,
    () => window.matchMedia(FINE_HOVER_QUERY).matches,
    () => true,
  );
}

interface IconHintProps {
  label: string;
  trigger: ReactElement;
  children: ReactNode;
  /** Hide the hint, for example while the settings panel is open. */
  disabled?: boolean;
  /**
   * Touch devices open a popover hint. Turn this off when `trigger` is already
   * a popover trigger (settings), so tap opens that panel instead of nesting.
   */
  hintOnTouch?: boolean;
  /** Set false when the trigger renders an anchor, not a button. */
  nativeButton?: boolean;
}

/** Desktop: shadcn tooltip (with arrow). Touch: hover-or-tap popover with the same arrow. */
export function IconHint({
  label,
  trigger,
  children,
  disabled = false,
  hintOnTouch = true,
  nativeButton = true,
}: IconHintProps) {
  const canHover = useFineHover();

  if (!canHover) {
    if (!hintOnTouch || disabled) {
      return cloneElement(trigger, undefined, children);
    }

    return (
      <Popover>
        <PopoverTrigger
          openOnHover
          delay={0}
          closeDelay={0}
          nativeButton={nativeButton}
          render={trigger}
        >
          {children}
        </PopoverTrigger>
        <PopoverContent
          side="top"
          sideOffset={8}
          className="w-auto max-w-xs gap-1.5 border-0 bg-foreground p-0 px-3 py-1.5 text-xs text-background shadow-none ring-0"
        >
          {label}
          <PopoverPrimitive.Arrow className={tooltipArrowClassName} />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Tooltip disabled={disabled}>
      <TooltipTrigger render={trigger}>
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
