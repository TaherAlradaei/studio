
"use client";

import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { Providers } from './providers';
import { AppBackground } from '@/components/app-background';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useBackground } from '@/context/background-context';
import { useLogo } from '@/context/logo-context';

function BackgroundCycler() {
  const { cycleBackground } = useBackground();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    if (pathnameRef.current !== pathname) {
      cycleBackground();
      pathnameRef.current = pathname;
    }
  }, [pathname, cycleBackground]);

  return null; // This component doesn't render anything
}

function DynamicFavicon() {
  const { logo } = useLogo();

  useEffect(() => {
    const favicon = document.querySelector("link[rel='icon']");
    if (favicon && logo.url) {
      favicon.setAttribute("href", logo.url);
    }
  }, [logo.url]);

  return null;
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&family=Tajawal:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={cn('antialiased min-h-screen flex flex-col font-body bg-background overflow-x-hidden')}>
        <Providers>
          <BackgroundCycler />
          <DynamicFavicon />
          <AppBackground />
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
