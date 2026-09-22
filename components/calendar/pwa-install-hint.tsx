'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { drawerPrimaryButtonClassName } from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import { trackZarazEvent, ZARAZ_EVENTS } from '@/lib/zaraz';

interface PwaInstallButtonProps {
  isInstalled: boolean;
  className?: string;
}

export function PwaInstallButton({ isInstalled, className }: PwaInstallButtonProps) {
  const router = useRouter();

  if (isInstalled) return null;

  return (
    <Button
      size="sm"
      variant="default"
      onMouseEnter={() => router.prefetch('/download')}
      onClick={() => {
        trackZarazEvent(ZARAZ_EVENTS.openDownload, { source: 'pwa_hint' });
        router.push('/download');
      }}
      className={cn(drawerPrimaryButtonClassName, className)}
    >
      Download
    </Button>
  );
}
