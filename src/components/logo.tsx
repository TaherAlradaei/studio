
"use client";

import Image from 'next/image';
import { useLogo } from '@/context/logo-context';
import { convertGsToHttps } from '@/lib/utils';


export function Logo() {
  const { logo } = useLogo();

  if (!logo.url) {
    return <div className="h-11 w-11" />; // Return a placeholder or null to avoid rendering Image with empty src
  }
  
  const imageUrl = convertGsToHttps(logo.url);

  return (
    <Image
      src={imageUrl}
      alt="Al Maidan Sporting Club Logo"
      width={44}
      height={48}
      className="h-11 w-auto"
      priority
    />
  );
}

    
