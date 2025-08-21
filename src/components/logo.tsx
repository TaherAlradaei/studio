
"use client";

import Image from 'next/image';
import { useLogo } from '@/context/logo-context';

// Helper function to convert gs:// URI to a public HTTPS URL
function convertGsToHttps(gsUri: string): string {
    if (!gsUri || !gsUri.startsWith('gs://')) {
        return gsUri;
    }
    // Extracts the bucket and path from the gs:// URI
    const bucketAndPath = gsUri.substring(5); 
    const [bucket, ...pathParts] = bucketAndPath.split('/');
    const path = pathParts.join('/');
    // Constructs the public URL
    return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media`;
}


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

    