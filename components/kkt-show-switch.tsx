"use client";

import { useEffect } from "react";
import { IconHint } from "@/components/ui/icon-hint";
import { SettingsSwitchRow } from "@/components/ui/settings-switch-row";

const KKT_FLAG_IMAGES = [
  { src: "/flags/kedah.webp", alt: "Kedah", hint: "Laksa Kedah 🍜" },
  { src: "/flags/kelantan.webp", alt: "Kelantan", hint: "Nasi Kerabu 💙" },
  { src: "/flags/terengganu.webp", alt: "Terengganu", hint: "Keropok Lekor 🐟" },
] as const;

function KktFlagHint({ flag }: { flag: (typeof KKT_FLAG_IMAGES)[number] }) {
  return (
    <IconHint
      label={flag.hint}
      trigger={
        <button
          type="button"
          aria-label={flag.alt}
          className="inline-flex size-5 shrink-0 items-center justify-center rounded-full p-0"
        />
      }
    >
      <img
        src={flag.src}
        alt=""
        width={20}
        height={20}
        className="size-5 rounded-full object-cover"
        loading="lazy"
      />
    </IconHint>
  );
}

interface KktShowSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  hasRegionalDateRange: boolean;
}

export function KktShowSwitch({ checked, onChange, hasRegionalDateRange }: KktShowSwitchProps) {
  useEffect(() => {
    if (!hasRegionalDateRange && checked) onChange(false);
  }, [checked, hasRegionalDateRange, onChange]);

  useEffect(() => {
    if (!hasRegionalDateRange) return;
    for (const { src } of KKT_FLAG_IMAGES) {
      const img = new Image();
      img.src = src;
    }
  }, [hasRegionalDateRange]);

  if (!hasRegionalDateRange) return null;

  return (
    <SettingsSwitchRow
      label={
        <>
          <span className="text-sm font-medium text-foreground">Show</span>
          <div className="flex gap-1">
            {KKT_FLAG_IMAGES.map((flag) => (
              <KktFlagHint key={flag.src} flag={flag} />
            ))}
          </div>
        </>
      }
      checked={checked}
      onChange={onChange}
      ariaLabel="Toggle Kedah, Kelantan, and Terengganu regional dates"
    />
  );
}