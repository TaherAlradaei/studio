
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// This function safely parses the config from environment variables
function getFirebaseConfig() {
    const config = process.env.NEXT_PUBLIC_FIREBASE_WEBAPP_CONFIG;
    if (config) {
        try {
            return JSON.parse(config);
        } catch (e) {
            console.error("Could not parse FIREBASE_WEBAPP_CONFIG. Please check the format in your environment variables.", e);
        }
    }
    // Fallback for client-side where process.env is not available directly,
    // though the above should work with Next.js's env handling.
    if (typeof window !== "undefined") {
        const globalConfig = (window as any).FIREBASE_WEBAPP_CONFIG;
        if (globalConfig) {
            return globalConfig;
        }
    }
    
    // As a final fallback, use the hardcoded config if the env var is not set.
    // This is useful for local development without needing a .env file.
    return {
      "projectId": "al-maidan-arena",
      "appId": "1:183587615468:web:f291f692ed021ca1e22bc9",
      "storageBucket": "al-maidan-arena.firebasestorage.app",
      "apiKey": "AIzaSyBI7rhT-6JhAVjVAXSlhztRnp4I310VrCc",
      "authDomain": "al-maidan-arena.firebaseapp.com",
      "measurementId": "G-37T02SS82J",
      "messagingSenderId": "183587615468"
    };
}

const firebaseConfig = getFirebaseConfig();

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// Enable offline persistence
try {
    enableIndexedDbPersistence(db);
} catch (err: any) {
    if (err.code == 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one.
        console.warn('Firestore persistence failed: multiple tabs open.');
    } else if (err.code == 'unimplemented') {
        // The current browser does not support all of the
        // features required to enable persistence
        console.warn('Firestore persistence not available in this browser.');
    }
}


export { db, auth, storage, googleProvider, signInWithPopup };
