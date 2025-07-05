import {initializeApp, getApps, getApp} from 'firebase/app';
import {getFirestore} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// We will only initialize firebase if all credentials are provided.
const canInitializeFirebase = firebaseConfig.apiKey && firebaseConfig.projectId;

if (!canInitializeFirebase) {
    console.warn("Firebase credentials are not provided or are incomplete in your .env file. Firebase-dependent features will not work.");
}

const app = canInitializeFirebase && !getApps().length ? initializeApp(firebaseConfig) : (getApps().length > 0 ? getApp() : null);
const db = app ? getFirestore(app) : null;


export {db};
