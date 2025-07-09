
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/language-context";
import { Logo } from "./logo";
import { useAuth } from "@/context/auth-context";
import { useBookings } from "@/context/booking-context";
import { useAcademy } from "@/context/academy-context";
import { Badge } from "@/components/ui/badge";

const LanguageSwitcher = () => {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex gap-2">
      <Button
        variant={lang === 'en' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => setLang('en')}
      >
        English
      </Button>
      <Button
        variant={lang === 'ar' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => setLang('ar')}
      >
        العربية
      </Button>
    </div>
  );
};

export function Header() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { bookings } = useBookings();
  const { registrations } = useAcademy();

  const pendingBookingsCount = bookings.filter(b => b.status === 'pending').length;
  const pendingRegistrationsCount = registrations.filter(r => r.status === 'pending').length;
  const totalPendingCount = pendingBookingsCount + pendingRegistrationsCount;

  const navLinks = [
    { href: "/", label: t.header.bookField },
    { href: "/academy", label: t.header.academy },
    { href: "/bookings", label: t.header.myBookings },
    { href: "/admin", label: t.header.admin, notificationCount: totalPendingCount },
  ];

  const visibleNavLinks = user ? navLinks : [];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Logo />
          <span className="font-bold text-lg text-primary font-headline">
            {t.header.title}
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm lg:gap-6">
          {visibleNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "transition-colors hover:text-foreground/80",
                pathname === link.href ? "text-foreground" : "text-foreground/60"
              )}
            >
              <div className="relative flex items-center">
                {link.label}
                {link.notificationCount > 0 && link.href === '/admin' && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 flex items-center justify-center rounded-full p-0">
                    {link.notificationCount}
                  </Badge>
                )}
              </div>
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
