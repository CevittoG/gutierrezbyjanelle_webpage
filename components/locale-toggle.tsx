"use client";

import { useLocale } from "@/lib/locale-context";
import { LOCALES, type Locale } from "@/lib/i18n";
import { cn } from "@/utils";

interface LocaleToggleProps {
  className?: string;
}

export function LocaleToggle({ className }: LocaleToggleProps) {
  const { locale, setLocale, t } = useLocale();

  return (
    <div
      role="group"
      aria-label={t("toggle.aria")}
      className={cn("inline-flex items-center gap-1 text-xs", className)}
    >
      {LOCALES.map((code, i) => {
        const isActive = locale === code;
        return (
          <span key={code} className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={() => setLocale(code)}
              aria-pressed={isActive}
              aria-label={t(`toggle.${code}` as const)}
              className={cn(
                "px-1 py-0.5 transition-colors rounded-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isActive
                  ? "text-foreground underline decoration-accent decoration-2 underline-offset-4"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t(`toggle.${code}` as const)}
            </button>
            {i < LOCALES.length - 1 && (
              <span aria-hidden="true" className="text-border select-none">·</span>
            )}
          </span>
        );
      })}
    </div>
  );
}

type LocaleCode = Locale;
export type { LocaleCode };
