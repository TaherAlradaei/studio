
"use server";

import { analyzeBookingPatterns, type AnalyzeBookingPatternsInput } from "@/ai/flows/scheduling-recommendations";
import { db, storage } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, where, query } from "firebase/firestore";
import type { Background, WelcomePageContent, User, GalleryImage, SponsorImage, Booking } from "@/lib/types";
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

export async function deleteFile(fileUrl: string): Promise<void> {
    if (!fileUrl) {
        console.log("No file URL provided for deletion, skipping.");
        return;
    }
    try {
        const storageRef = ref(storage, fileUrl);
        await deleteObject(storageRef);
    } catch (error: any) {
        if (error.code === 'storage/object-not-found') {
            console.warn("File not found in storage, could not delete:", fileUrl);
        } else if (error.code === 'storage/invalid-argument') {
             console.warn("Invalid URL provided for file deletion:", fileUrl);
        } else {
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

export async function getPublicBookings(): Promise<Omit<Booking, 'id' | 'userId' | 'name' | 'phone' | 'status' | 'price' | 'isRecurring'>[]> {
    const q = query(collection(db, "bookings"), where("status", "in", ["confirmed", "blocked"]));
    const querySnapshot = await getDocs(q);
    const bookingsData: Omit<Booking, 'id' | 'userId' | 'name' | 'phone' | 'status' | 'price' | 'isRecurring'>[] = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        bookingsData.push({
            date: data.date.toDate(),
            time: data.time,
            duration: data.duration,
        });
    });
    return bookingsData;
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
        fieldImageUrl: "https://images.unsplash.com/photo-1551958214-2d5e23a4c053?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w7NDE5ODJ8MHwxfHNlYXJjaHwxfHxmb290YmFsbCUyMHBsYXllcnN8ZW58MHx8fHwxNzU1MDk0MDMwfDA&ixlib=rb-4.1.0&q=80&w=1080",
        coachImageUrl: "https://scontent.fsah1-1.fna.fbcdn.net/v/t39.30808-6/448981428_876644267838531_2111867807758356942_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=a5f93a&_nc_ohc=f68bGsRqzT0Q7kNvgE44uJe&_nc_ht=scontent.fsah1-1.fna&oh=00_AYB42wSnH-s_D-e_3oXF28ZJ6B9XpC3s-L33vOQAnS_33w&oe=66B386C5",
        managerImageUrl: "https://placehold.co/600x400.png",
        sponsors: [
            { url: "https://placehold.co/150x80.png"},
            { url: "https://placehold.co/150x80.png"},
            { url: "https://placehold.co/150x80.png"},
            { url: "https://placehold.co/150x80.png"},
            { url: "https://placehold.co/150x80.png"},
        ],
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
        { url: "https://images.unsplash.com/photo-1556816214-fda351e4a7fb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxMHx8c3RhZGl1bSUyMGZvb3RiYWxsfGVufDB8fHx8MTc1NTA5NDA0Nnww&ixlib=rb-4.1.0&q=80&w=1080"},
        { url: "https://images.unsplash.com/photo-1565483276107-8a1fbf01ab03?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHxzdGFkaXVtJTIwZm9vdGJhbGx8ZW58MHx8fHwxNzU1MDk0MDQ2fDA&ixlib=rb-4.1.0&q=80&w=1080"},
        { url: "https://images.unsplash.com/photo-1473976345543-9ffc928e648d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxzdGFkaXVtJTIwZm9vdGJhbGx8ZW58MHx8fHwxNzU1MDk0MDQ2fDA&ixlib=rb-4.1.0&q=80&w=1080"},
        { url: "https://images.unsplash.com/photo-1430232324554-8f4aebd06683?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxzdGFkaXVtJTIwZm9vdGJhbGx8ZW58MHx8fHwxNzU1MDk0MDQ2fDA&ixlib=rb-4.1.0&q=80&w=1080"},
        { url: "https://images.unsplash.com/photo-1556816214-fda351e4a7fb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxMHx8c3RhZGl1bSUyMGZvb3RiYWxsfGVufDB8fHx8MTc1NTA5NDA0Nnww&ixlib=rb-4.1.0&q=80&w=1080"},
        { url: "https://images.unsplash.com/photo-1511886921337-16ecd3be34b7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw1fHxzdGFkaXVtJTIwZm9vdGJhbGx8ZW58MHx8fHwxNzU1MDk0MDQ2fDA&ixlib=rb-4.1.0&q=80&w=1080"},
        { url: "https://images.unsplash.com/photo-1594465598235-e5982362b1a7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw2fHxzdGFkaXVtJTIwZm9vdGJhbGx8ZW58MHx8fHwxNzU1MDk0MDQ2fDA&ixlib=rb-4.1.0&q=80&w=1080"},
        { url: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw5fHxzdGFkaXVtJTIwZm9vdGJhbGx8ZW58MHx8fHwxNzU1MDk0MDQ2fDA&ixlib=rb-4.1.0&q=80&w=1080"},
        { url: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw3fHxzdGFkaXVtJTIwZm9vdGJhbGx8ZW58MHx8fHwxNzU1MDk0MDQ2fDA&ixlib=rb-4.1.0&q=80&w=1080"},
        { url: "https://images.unsplash.com/photo-1626233405494-a3ebb495476a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxzdGFkaXVtJTIwZm9vdGJhbGx8ZW58MHx8fHwxNzU1MDk0MDQ2fDA&ixlib=rb-4.1.0&q=80&w=1080"}
    ];
}

export async function updateGalleryImages(images: GalleryImage[]): Promise<void> {
    const docRef = doc(db, 'settings', 'gallery');
    await setDoc(docRef, { images });
}

    