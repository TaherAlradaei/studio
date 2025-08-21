import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to convert gs:// URI to a public HTTPS URL
export function convertGsToHttps(gsUri: string): string {
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
