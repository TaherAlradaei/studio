
"use server";

import { analyzeBookingPatterns, type AnalyzeBookingPatternsInput } from "@/ai/flows/scheduling-recommendations";
import { db, storage } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import type { Background, WelcomePageContent, User, GalleryImage, SponsorImage } from "@/lib/types";
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

export async function getAllUsers(): Promise<User[]> {
    const usersCollection = collection(db, 'users');
    const userSnapshot = await getDocs(usersCollection);
    const userList = userSnapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as User));
    return userList;
}

export async function updateUserTrustedStatus(uid: string, isTrusted: boolean): Promise<void> {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, { isTrusted });
}

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
        // A simple filter to ensure we don't use invalid URLs.
        return backgrounds.filter(bg => bg.url && typeof bg.url === 'string' && (bg.url.startsWith('http') || bg.url.startsWith('data:')));
    }
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
        fieldImageUrl: "data:image/jpeg;base64,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7Zn7Z37Z/7Z/7Z/7aX7Z/7aH7Z/7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH7aH-u/AAs+Hn/AQS/wDBZ9bQ2P8Aw+o/b/GmL7Gbf8FLjD9g/tfH833f8J39r+0f2h+5+2+d5f2f+Dzvs/k/Y/tH9/0UV/Hj/wAOp/g7+z34w+D/AO3N+y9/wUj/AOCnHwC8N+Of2xvi18aPC/x2/Yr/AOCi37aHwE8a/tE+C/8Agqb+yr+3B+0H4v8A2bvgJ4i+K37VPxS/Yu/4KVf8FPv+Cifw3+B3gLwD+0v/AMFLf+Cmfxo/Yr/Ym/b2+N3w5/ac/wCClf7ev7E37G37af7eH7f/wC3l+3h+35+35+3/wD8FPP2/v29/wBv79vf9v8A/b+/b/8At+ft+ft+ft+/t+ft+ft+/t+/t+ft+/t+ft+/t+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t+ft+/t... ",
        managerImageUrl: "https://placehold.co/600x400.png",
        sponsors: [
            { url: "https://placehold.co/150x80.png", path: ""},
            { url: "https://placehold.co/150x80.png", path: ""},
            { url: "https://placehold.co/150x80.png", path: ""}
        ]
    };
    
    if (docSnap.exists()) {
        const data = docSnap.data();
        // Merge defaults with existing data
        return { ...defaults, ...data } as WelcomePageContent;
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


// Gallery Settings
export async function getGalleryImages(): Promise<GalleryImage[]> {
    const docRef = doc(db, 'settings', 'gallery');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().images) {
        return docSnap.data().images as GalleryImage[];
    }
    // Return default gallery if not set
    return [
        { url: "https://images.unsplash.com/photo-1556816214-fda351e4a7fb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxMHx8c3RhZGl1bSUyMGZvb3RiYWxsfGVufDB8fHx8MTc1NTA5NDA0Nnww&ixlib=rb-4.1.0&q=80&w=1080", path: ""},
        { url: "https://images.unsplash.com/photo-1565483276107-8a1fbf01ab03?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHxzdGFkaXVtJTIwZm9vdGJhbGx8ZW58MHx8fHwxNzU1MDk0MDQ2fDA&ixlib=rb-4.1.0&q=80&w=1080", path: ""},
        { url: "https://images.unsplash.com/photo-1473976345543-9ffc928e648d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxzdGFkaXVtJTIwZm9vdGJhbGx8ZW58MHx8fHwxNzU1MDk0MDQ2fDA&ixlib=rb-4.1.0&q=80&w=1080", path: ""},
        { url: "https://images.unsplash.com/photo-1430232324554-8f4aebd06683?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxzdGFkaXVtJTIwZm9vdGJhbGx8ZW58MHx8fHwxNzU1MDk0MDQ2fDA&ixlib=rb-4.1.0&q=80&w=1080", path: ""},
        { url: "https://images.unsplash.com/photo-1556816214-fda351e4a7fb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxMHx8c3RhZGl1bSUyMGZvb3RiYWxsfGVufDB8fHx8MTc1NTA5NDA0Nnww&ixlib=rb-4.1.0&q=80&w=1080", path: ""}
    ];
}

export async function updateGalleryImages(images: GalleryImage[]): Promise<void> {
    const docRef = doc(db, 'settings', 'gallery');
    await setDoc(docRef, { images });
}
