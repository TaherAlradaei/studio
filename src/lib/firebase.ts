import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, getRedirectResult, signInWithRedirect } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  "projectId": "al-maidan-arena",
  "appId": "1:183587615468:web:f291f692ed021ca1e22bc9",
  "storageBucket": "al-maidan-arena.firebasestorage.app",
  "apiKey": "AIzaSyBI7rhT-6JhAVjVAXSlhztRnp4I310VrCc",
  "authDomain": "al-maidan-arena.firebaseapp.com",
  "measurementId": "G-37T02SS82J",
  "messagingSenderId": "183587615468"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { db, auth, googleProvider, getRedirectResult, signInWithRedirect };
