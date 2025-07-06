"use client";

import { useLanguage } from "@/context/language-context";

export function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="py-6 md:px-8 md:py-0 bg-transparent border-t border-border/40">
      <div className="container flex flex-col items-center justify-between gap-2 py-4 md:h-auto md:flex-row">
        <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
          {t.footer.copyright.replace('{year}', year.toString())}
        </p>
        <div className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-right">
          <p>{t.footer.address}</p>
          <p>{t.footer.phone}</p>
        </div>
      </div>
    </footer>
  );
}
