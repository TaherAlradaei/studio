
"use client";

import { AuthProvider } from "@/context/auth-context";
import { BookingProvider } from "@/context/booking-context";
import { LanguageProvider, useLanguage } from "@/context/language-context";
import React, { useEffect } from "react";
import { BackgroundProvider } from "@/context/background-context";
import { LogoProvider } from "@/context/logo-context";
import { AcademyProvider } from "@/context/academy-context";

function AppDirectionManager({ children }: { children: React.ReactNode }) {
    const { lang } = useLanguage();

    useEffect(() => {
        document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
        if (lang === 'ar') {
            document.body.classList.add('font-arabic');
            document.body.classList.remove('font-body');
        } else {
            document.body.classList.add('font-body');
            document.body.classList.remove('font-arabic');
        }
    }, [lang]);

    return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BookingProvider>
          <AcademyProvider>
            <LogoProvider>
              <BackgroundProvider>
                <AppDirectionManager>
                    {children}
                </AppDirectionManager>
              </BackgroundProvider>
            </LogoProvider>
          </AcademyProvider>
        </BookingProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
