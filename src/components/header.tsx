
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
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

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

const AdminNavWithNotifications = () => {
    const { t } = useLanguage();
    const { bookings } = useBookings();
    const { registrations } = useAcademy();

    const pendingBookingsCount = bookings.filter(b => b.status === 'pending').length;
    const pendingRegistrationsCount = registrations.filter(r => r.status === 'pending').length;
    const totalPendingCount = pendingBookingsCount + pendingRegistrationsCount;

    return (
        <Link
          href="/admin"
          className={cn(
            "transition-colors hover:text-foreground/80",
            usePathname() === "/admin" ? "text-foreground" : "text-foreground/60"
          )}
        >
          <div className="relative flex items-center">
            {t.header.admin}
            {totalPendingCount > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 flex items-center justify-center rounded-full p-0">
                {totalPendingCount}
              </Badge>
            )}
          </div>
        </Link>
    );
};


export function Header() {
  const pathname = usePathname();
  const { t, lang } = useLanguage();
  const { user, logout } = useAuth();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const isAdmin = user?.isAdmin;
  
  // Conditionally render AdminNavWithNotifications only on admin page to avoid context errors
  const onAdminPage = pathname === '/admin';

  const navLinks = [
    { href: "/booking", label: t.header.bookField },
    { href: "/academy", label: t.header.academy },
    { href: "/bookings", label: t.header.myBookings },
    { href: "/member-area", label: t.welcomePage.memberAreaButton },
  ];
  
  if (isAdmin && !onAdminPage) {
    navLinks.push({ href: "/admin", label: t.header.admin });
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <Link href="/" className="flex items-center space-x-2 mr-4 flex-1 sm:flex-none">
          <Logo />
          <span className="font-bold text-lg sm:text-xl text-primary font-headline truncate">
            {t.header.title}
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-4 text-sm lg:gap-6 ml-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "transition-colors hover:text-foreground/80",
                (pathname === link.href || (link.href === '/booking' && pathname === '/')) ? "text-foreground" : "text-foreground/60"
              )}
            >
              {link.label}
            </Link>
          ))}
          {isAdmin && onAdminPage && isClient && <AdminNavWithNotifications />}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>
           {user ? (
             <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                    <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                </Avatar>
               <span className="text-sm font-medium hidden sm:inline">{user.displayName}</span>
                <Button onClick={logout} variant="outline" size="sm" className="hidden sm:flex">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t.auth.logout}
                </Button>
             </div>
           ) : (
            <Button asChild variant="default" size="sm">
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
                    <div className="flex flex-col gap-6 pt-8 h-full">
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
                            </Link>
                          ))}
                           {isAdmin && onAdminPage && isClient && <AdminNavWithNotifications />}
                        </nav>
                        <div className="mt-auto space-y-4">
                           {user && (
                             <div className="flex flex-col gap-2">
                                <Button onClick={() => {logout(); setIsSheetOpen(false);}} variant="outline" size="sm">
                                  <LogOut className="mr-2 h-4 w-4" />
                                  {t.auth.logout}
                                </Button>
                             </div>
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
