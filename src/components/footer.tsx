"use client";

import { useLanguage } from "@/context/language-context";

export function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="py-6 md:px-8 md:py-0 bg-background border-t">
      <div className="container flex flex-col items-center justify-center gap-4 md:h-24 md:flex-row">
        <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
          {t.footer.copyright.replace('{year}', year.toString())}
        </p>
      </div>
    </footer>
  );
}
