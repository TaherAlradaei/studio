
"use server";

import { analyzeBookingPatterns, type AnalyzeBookingPatternsInput } from "@/ai/flows/scheduling-recommendations";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import type { Background, WelcomePageContent } from "@/lib/types";

export async function getSchedulingRecommendations(input: AnalyzeBookingPatternsInput) {
    return await analyzeBookingPatterns(input);
}

// Admin settings are now managed in Firestore.

export async function getPaymentInstructions(): Promise<string> {
  const docRef = doc(db, 'settings', 'payment');
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data().instructions || "Please contact us at +967 736 333 328 to finalize payment.";
  }
  return "Please contact us at +967 736 333 328 to finalize payment.";
}

export async function updatePaymentInstructions(instructions: string): Promise<void> {
    const docRef = doc(db, 'settings', 'payment');
    await setDoc(docRef, { instructions });
}

export async function getTrustedCustomers(): Promise<string[]> {
    const docRef = doc(db, 'settings', 'trustedCustomers');
    const docSnap = await getDoc(docRef);
    if(docSnap.exists()){
        return docSnap.data().names || [];
    }
    return [];
}

export async function updateTrustedCustomers(customers: string[]): Promise<void> {
    const docRef = doc(db, 'settings', 'trustedCustomers');
    await setDoc(docRef, { names: customers });
}

export async function getAdminAccessCode(): Promise<string> {
    const docRef = doc(db, 'settings', 'admin');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().accessCode) {
        return docSnap.data().accessCode;
    }
    return 'almaidan'; // Default
}

export async function updateAdminAccessCode(code: string): Promise<void> {
    const docRef = doc(db, 'settings', 'admin');
    await setDoc(docRef, { accessCode: code });
}

// Logo Settings
export async function getLogo(): Promise<{ url: string }> {
    const docRef = doc(db, 'settings', 'logo');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data() as { url: string };
    }
    // Return a default if not set
    return { url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIwAAACMCAYAAACuwEE+AAABJUlEQVR42u3bS2nEUBiF0bswkw5eVR2sQqgC3Yk4Qoow4YVkHi+e/4J7QY4LAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMBvcj7331PI+Xw4Z+c+9Sg+t8fG+8fN+lq/VvyncoL3yQhYJkR4XisYLSso1zQy6m1/M9wghPfhM/VjZ/XJMkIWWYQQnhmY1oqG5ckywltZZKsgwsI7wwsWiYR1sgjRQlZJpPgRS7IIIfCsmbKMEEJ2WUSZEGIJUQYhE4QUaQcKYQoMQgghhBBCiCEU3o9n3G+0wU2UMIYQYghBCGGIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCHkP+Q8/gDAo+N8/H/l/4b8BgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAe/AEnrA0bgaed1gAAAABJRU5ErkJggg==" };
}

export async function updateLogo(url: string): Promise<void> {
    const docRef = doc(db, 'settings', 'logo');
    await setDoc(docRef, { url });
}

// Background Settings
export async function getBackgrounds(): Promise<Background[]> {
    const docRef = doc(db, 'settings', 'backgrounds');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().items) {
        return docSnap.data().items as Background[];
    }
    // Return defaults if not set
    return [
      { url: "https://images.unsplash.com/photo-1652190416284-10debef71bfa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxmb290YmFsbCUyMHBsYXllciUyMGtpY2tpbmd8ZW58MHx8fHwxNzUyMjY3NDAwfDA&ixlib=rb-4.1.0&q=80&w=1080", hint: "football player kicking" },
      { url: "https://images.unsplash.com/photo-1659188903747-7af9b849bdf5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw5fHxnb2Fsa2VlcGVyJTIwZGl2aW5nJTIwc2F2ZXxlbnwwfHx8fDE3NTIyNjc0MDB8MA&ixlib=rb-4.1.0&q=80&w=1080", hint: "goalkeeper diving save" },
      { url: "https://images.unsplash.com/photo-1631233143542-c7097a332932?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw3fHxmb290YmFsbCUyMHBsYXllciUyMGhlYWRpbmd8ZW58MHx8fHwxNzUyMjY3NDAwfDA&ixlib=rb-4.1.0&q=80&w=1080", hint: "football player heading" },
      { url: "https://images.unsplash.com/photo-1611587475814-cec57a649bce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxzdGFkaXVtJTIwZXZlbmluZyUyMGxpZ2h0c3xlbnwwfHx8fDE3NTIyNjc0MDB8MA&ixlib=rb-4.1.0&q=80&w=1080", hint: "stadium evening lights" },
    ];
}

export async function updateBackgrounds(backgrounds: Background[]): Promise<void> {
    const docRef = doc(db, 'settings', 'backgrounds');
    await setDoc(docRef, { items: backgrounds });
}

// Welcome Page Settings
export async function getWelcomePageContent(): Promise<WelcomePageContent> {
    const docRef = doc(db, 'settings', 'welcomePage');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data() as WelcomePageContent;
    }
     // Return defaults if not set
    return {
        title: "Welcome to Al Maidan Sporting Club",
        message: "Your premier destination for football in Sana'a. Book a field, join our academy, and become part of our community.",
        fieldImageUrl: "https://images.unsplash.com/photo-1557174949-3b1f5b2e8fac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw5fHxmb290YmFsbCUyMGZpZWxkfGVufDB8fHx8MTc1MjI2NjI3OHww&ixlib=rb-4.1.0&q=80&w=1080",
        coachImageUrl: "https://images.unsplash.com/photo-1603683180670-89e591ecf86a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw5fHxmb290YmFsbCUyMGNvYWNofGVufDB8fHx8MTc1MjI2NjI3OXww&ixlib=rb-4.1.0&q=80&w=1080",
    };
}

export async function updateWelcomePageContent(content: Partial<WelcomePageContent>): Promise<void> {
    const docRef = doc(db, 'settings', 'welcomePage');
    await setDoc(docRef, content, { merge: true });
}
