"use client";

import Image from 'next/image';
import { useLogo } from '@/context/logo-context';

export function Logo() {
  const { logo } = useLogo();

  return (
    <Image
      src={logo.url}
      alt="Al Maidan Football Academy Logo"
      width={44}
      height={48}
      className="h-11 w-auto"
      priority
    />
  );
}
