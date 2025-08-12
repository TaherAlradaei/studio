
"use server";

import { analyzeBookingPatterns, type AnalyzeBookingPatternsInput } from "@/ai/flows/scheduling-recommendations";
import { db, storage } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import type { Background, WelcomePageContent } from "@/lib/types";
import { getDownloadURL, ref, uploadString, deleteObject } from "firebase/storage";
import { v4 as uuidv4 } from 'uuid';


export async function uploadFile(base64DataUrl: string, folder: string): Promise<{ url: string, path: string }> {
    const mimeTypeMatch = base64DataUrl.match(/^data:(image\/[a-z]+|image\/gif);base64,/);
    if (!mimeTypeMatch) {
        throw new Error("Invalid data URL format");
    }
    const mimeType = mimeTypeMatch[1];
    const base64Data = base64DataUrl.split(',')[1];
    const fileExtension = mimeType.split('/')[1];
    
    const filePath = `${folder}/${uuidv4()}.${fileExtension}`;
    const storageRef = ref(storage, filePath);

    await uploadString(storageRef, base64Data, 'base64', {
        contentType: mimeType
    });

    const downloadURL = await getDownloadURL(storageRef);

    return { url: downloadURL, path: filePath };
}

export async function deleteFile(filePath: string): Promise<void> {
    if (!filePath) {
        console.log("No file path provided for deletion, skipping.");
        return;
    }
    const storageRef = ref(storage, filePath);
    try {
        await deleteObject(storageRef);
    } catch (error: any) {
        // If the file doesn't exist, Firebase throws an error. We can ignore it.
        if (error.code !== 'storage/object-not-found') {
            console.error("Error deleting file from storage:", error);
            throw error;
        }
    }
}


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
export async function getLogo(): Promise<{ url: string, path?: string }> {
    const docRef = doc(db, 'settings', 'logo');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().url) {
        return docSnap.data() as { url: string, path?: string };
    }
    // Return a default if not set
    return { url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIwAAACMCAYAAACuwEE+AAABJUlEQVR42u3bS2nEUBiF0bswkw5eVR2sQqgC3Yk4Qoow4YVkHi+e/4J7QY4LAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMBvcj7331PI+Xw4Z+c+9Sg+t8fG+8fN+lq/VvyncoL3yQhYJkR4XisYLSso1zQy6m1/M9wghPfhM/VjZ/XJMkIWWYQQnhmY1oqG5ckywltZZKsgwsI7wwsWiYR1sgjRQlZJpPgRS7IIIfCsmbKMEEJ2WUSZEGIJUQYhE4QUaQcKYQoMQgghhBBCiCEU3o9n3G+0wU2UMIYQYghBCGGIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCHkP+Q8/gDAo+N8/H/l/4b8BgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAe/AEnrA0bgaed1gAAAABJRU5ErkJggg==" };
}

export async function updateLogo(url: string, path: string): Promise<void> {
    const docRef = doc(db, 'settings', 'logo');
    await setDoc(docRef, { url, path });
}

// Background Settings
export async function getBackgrounds(): Promise<Background[]> {
    const docRef = doc(db, 'settings', 'backgrounds');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().items) {
        const backgrounds = docSnap.data().items as Background[];
        // Filter out invalid Facebook photo page URLs
        return backgrounds.filter(bg => !bg.url.includes("facebook.com/photo"));
    }
    // Return empty array to allow for clean testing
    return [];
}

export async function updateBackgrounds(backgrounds: Background[]): Promise<void> {
    const docRef = doc(db, 'settings', 'backgrounds');
    await setDoc(docRef, { items: backgrounds }, { merge: true });
}

// Welcome Page Settings
export async function getWelcomePageContent(): Promise<WelcomePageContent> {
    const docRef = doc(db, 'settings', 'welcomePage');
    const docSnap = await getDoc(docRef);
    const defaults: WelcomePageContent = {
        fieldImageUrl: "https://images.unsplash.com/photo-1557174949-3b1f5b2e8fac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw5fHxmb290YmFsbCUyMGZpZWxkfGVufDB8fHx8MTc1MjI2NjI3OHww&ixlib=rb-4.1.0&q=80&w=1080",
        coachImageUrl: "https://images.unsplash.com/photo-1603683180670-89e591ecf86a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw5fHxmb290YmFsbCUyMGNvYWNofGVufDB8fHx8MTc1MjI2NjI3OXww&ixlib=rb-4.1.0&q=80&w=1080",
        galleryImages: [
            { url: "https://placehold.co/800x600.png", path: ""},
            { url: "https://placehold.co/800x600.png", path: ""},
            { url: "https://placehold.co/800x600.png", path: ""},
            { url: "https://placehold.co/800x600.png", path: ""},
            { url: "https://placehold.co/800x600.png", path: ""}
        ]
    };
    
    if (docSnap.exists()) {
        const data = docSnap.data() as WelcomePageContent;
        // Ensure galleryImages has a default value if it's missing from the database
        if (!data.galleryImages) {
            data.galleryImages = defaults.galleryImages;
        }
        return data;
    }
    
    // Return defaults if document doesn't exist
    return defaults;
}


export async function updateWelcomePageContent(content: Partial<WelcomePageContent>): Promise<void> {
    const docRef = doc(db, 'settings', 'welcomePage');
    // Using updateDoc with merge:true is safer as it won't overwrite the entire document
    // if only partial data is sent. Let's switch to setDoc with merge.
    await setDoc(docRef, content, { merge: true });
}
