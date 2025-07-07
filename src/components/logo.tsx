"use client";

import Image from 'next/image';
import { useLogo } from '@/context/logo-context';

export function Logo() {
  const { logo } = useLogo();

  return (
    <Image
      src={logo.url}
      alt="Al Maidan Football Academy Logo"
      width={40}
      height={44}
      className="h-10 w-auto"
      priority
    />
  );
}
