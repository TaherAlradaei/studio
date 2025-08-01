
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
import { User, LogOut, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle } from "@/components/ui/sheet";
import { useState } from "react";

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
  const { t, lang } = useLanguage();
  const { user, logout } = useAuth();
  const { bookings } = useBookings();
  const { registrations } = useAcademy();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const pendingBookingsCount = bookings.filter(b => b.status === 'pending').length;
  const pendingRegistrationsCount = registrations.filter(r => r.status === 'pending').length;
  const totalPendingCount = pendingBookingsCount + pendingRegistrationsCount;

  // Admin link should only be visible for a specific user.
  // In a real app, this would be based on user roles from a database.
  const isAdmin = user?.phone === '+967736333328' && user?.displayName === 'Waheeb';

  const navLinks = [
    { href: "/booking", label: t.header.bookField },
    { href: "/academy", label: t.header.academy },
    { href: "/bookings", label: t.header.myBookings },
  ];
  
  if (isAdmin) {
    navLinks.push({ href: "/admin", label: t.header.admin, notificationCount: totalPendingCount });
  }


  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <Link href="/" className="mr-4 flex items-center space-x-2">
          <Logo />
          <span className="hidden sm:inline font-bold text-xl text-primary font-headline">
            {t.header.title}
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-4 text-sm lg:gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "transition-colors hover:text-foreground/80",
                (pathname === link.href || (link.href === '/booking' && pathname === '/')) ? "text-foreground" : "text-foreground/60"
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
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>
           {user ? (
             <div className="flex items-center gap-2">
               <span className="text-sm font-medium hidden sm:inline">{user.displayName}</span>
                <Button onClick={logout} variant="outline" size="sm" className="hidden sm:flex">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t.auth.logout}
                </Button>
             </div>
           ) : (
            <Button asChild variant="default" size="sm" className="hidden sm:flex">
                <Link href="/login">
                    {t.auth.login}
                </Link>
            </Button>
           )}
           <div className="md:hidden">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Open menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side={lang === 'ar' ? 'right' : 'left'}>
                    <SheetTitle className="sr-only">{t.header.menu}</SheetTitle>
                    <div className="flex flex-col gap-6 pt-8">
                       <Link href="/" className="flex items-center space-x-2" onClick={() => setIsSheetOpen(false)}>
                          <Logo />
                          <span className="font-bold text-lg text-primary font-headline">
                            {t.header.title}
                          </span>
                        </Link>
                        <nav className="flex flex-col gap-4 text-lg">
                          {navLinks.map((link) => (
                            <Link
                              key={link.href}
                              href={link.href}
                              onClick={() => setIsSheetOpen(false)}
                              className={cn(
                                "transition-colors hover:text-foreground/80 flex items-center",
                                pathname === link.href ? "text-foreground font-semibold" : "text-foreground/60"
                              )}
                            >
                                {link.label}
                                {link.notificationCount > 0 && link.href === '/admin' && (
                                  <Badge variant="destructive" className="ml-2 h-5 w-5 flex items-center justify-center rounded-full p-0">
                                    {link.notificationCount}
                                  </Badge>
                                )}
                            </Link>
                          ))}
                        </nav>
                        <div className="mt-auto space-y-4">
                           {user ? (
                             <div className="flex flex-col gap-2">
                               <p className="text-center text-muted-foreground">{user.displayName}</p>
                                <Button onClick={() => {logout(); setIsSheetOpen(false);}} variant="outline" size="sm">
                                  <LogOut className="mr-2 h-4 w-4" />
                                  {t.auth.logout}
                                </Button>
                             </div>
                           ) : (
                            <SheetClose asChild>
                                <Button asChild variant="default" size="sm">
                                    <Link href="/login">
                                        {t.auth.login}
                                    </Link>
                                </Button>
                            </SheetClose>
                           )}
                          <LanguageSwitcher />
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
           </div>
        </div>
      </div>
    </header>
  );
}
