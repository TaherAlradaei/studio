
"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { auth, db, googleProvider, signInWithPopup } from "@/lib/firebase";
import { onAuthStateChanged, signOut, type User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getAdminAccessCode } from "@/app/(main)/admin/actions";


// Custom User type definition
export interface User {
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
    phone: string | null;
    isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isUserRegistered: boolean | null;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserDetails: (details: { name: string; phone: string }) => Promise<void>;
  checkAdminStatus: () => Promise<void>;
  adminAccessCode: string;
  updateAdminAccessCode: (code: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUserRegistered, setIsUserRegistered] = useState<boolean | null>(null);
  const [adminAccessCode, setAdminAccessCode] = useState('almaidan');

  useEffect(() => {
    const fetchAdminCode = async () => {
        const code = await getAdminAccessCode();
        setAdminAccessCode(code);
    };
    fetchAdminCode();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          setUser(userData);
          setIsUserRegistered(!!userData.phone);
        } else {
          // New user, create a doc
          const newUser: User = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName,
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL,
            phone: null, // Phone will be added later
            isAdmin: false,
          };
          await setDoc(userDocRef, newUser);
          setUser(newUser);
          setIsUserRegistered(false);
        }
      } else {
        setUser(null);
        setIsUserRegistered(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  const checkAdminStatus = async () => {
    if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            setUser({ ...userDoc.data() as User });
        }
    }
  }

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error during Google sign-in:", error);
    }
  };
  
  const updateUserDetails = async (details: { name: string; phone: string }) => {
    if (user) {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { 
        displayName: details.name, 
        phone: details.phone 
      }, { merge: true });
      setUser(currentUser => currentUser ? { ...currentUser, displayName: details.name, phone: details.phone } : null);
      setIsUserRegistered(true);
    }
  };
  
  const updateAdminAccessCode = async (code: string) => {
    const adminSettingsRef = doc(db, 'settings', 'admin');
    await setDoc(adminSettingsRef, { accessCode: code });
    setAdminAccessCode(code);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isUserRegistered, loginWithGoogle, logout, updateUserDetails, checkAdminStatus, adminAccessCode, updateAdminAccessCode }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
