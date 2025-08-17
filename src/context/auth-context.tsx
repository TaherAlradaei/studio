
"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from "react";
import { auth, db, googleProvider, signInWithPopup, signInAnonymously, linkWithCredential, onFirebaseAuthStateChanged } from "@/lib/firebase";
import { onAuthStateChanged as onAuth, signOut, type User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, setDoc, writeBatch, collection, getDocs, where, query } from "firebase/firestore";
import { getAdminAccessCode, updateUserTrustedStatus } from "@/app/(main)/admin/actions";


// Custom User type definition
export interface User {
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
    phone: string | null;
    isAdmin?: boolean;
    isTrusted?: boolean;
    isAnonymous: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isUserRegistered: boolean | null;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserDetails: (details: { name: string; phone: string }) => Promise<void>;
  checkAdminStatus: () => Promise<void>;
  updateUserPermissions: (uid: string, permissions: Partial<{isTrusted: boolean, isAdmin: boolean}>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- CODE EDITING GUIDE ---
// This is a failsafe list of super-admins. Their admin status is hardcoded
// and cannot be accidentally revoked from the database.
const ADMIN_UIDS = [
    "vQF7GtgIRNeq66ktYosLQtk9W9w2", 
    "WG8c2fN7Z9cEoHj8nebLEktLM332",
    "2tNIh9jQISg0zzWiYPWXq3K0RHS2",
    "redbn6RZ4YafH7xDPHtZDMHmGYA2",
    "tgpBCQIt9Ea2FEaXmJq1A0HxHK53",
    "YOUR_ADMIN_UID_HERE",
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUserRegistered, setIsUserRegistered] = useState<boolean | null>(null);

  const handleUserDocument = useCallback(async (firebaseUser: FirebaseUser): Promise<User> => {
    const userDocRef = doc(db, "users", firebaseUser.uid);
    let userDoc = await getDoc(userDocRef);

    const isHardcodedAdmin = ADMIN_UIDS.includes(firebaseUser.uid);
    let userData: User;

    if (userDoc.exists()) {
      userData = { uid: firebaseUser.uid, isAnonymous: firebaseUser.isAnonymous, ...userDoc.data() } as User;
      // Ensure hardcoded admins always have admin status in their document
      if (isHardcodedAdmin && !userData.isAdmin) {
          userData.isAdmin = true;
          await setDoc(userDocRef, { isAdmin: true }, { merge: true });
      }
    } else {
      const newUser: User = {
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName,
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL,
        phone: null,
        isAdmin: isHardcodedAdmin,
        isTrusted: false,
        isAnonymous: firebaseUser.isAnonymous,
      };
      await setDoc(userDocRef, newUser);
      userData = newUser;
    }

    setUser(userData);
    setIsUserRegistered(!!userData.phone && !userData.isAnonymous);
    return userData;
  }, []);

  useEffect(() => {
      const unsubscribe = onFirebaseAuthStateChanged(auth, async (firebaseUser) => {
          setIsLoading(true);
          if (firebaseUser) {
              await handleUserDocument(firebaseUser);
          } else {
              try {
                  const { user: anonUser } = await signInAnonymously(auth);
                  await handleUserDocument(anonUser);
              } catch (error) {
                  console.error("Anonymous sign-in failed:", error);
                  setUser(null);
                  setIsUserRegistered(null);
              }
          }
          setIsLoading(false);
      });

      return () => unsubscribe();
  }, [handleUserDocument]);
  
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
      const result = await signInWithPopup(auth, googleProvider);
      const currentUser = auth.currentUser;

      if (currentUser && currentUser.isAnonymous) {
          const anonUid = currentUser.uid;
          const bookingsRef = collection(db, "bookings");
          const bookingsQuery = query(bookingsRef, where("userId", "==", anonUid));
          const bookingsSnapshot = await getDocs(bookingsQuery);
          
          const teamRef = collection(db, "findATeamRegistrations");
          const teamQuery = query(teamRef, where("userId", "==", anonUid));
          const teamSnapshot = await getDocs(teamQuery);

          const credential = result.credential;
          if (!credential) throw new Error("Could not get credential from Google sign-in.");
          const linkResult = await linkWithCredential(currentUser, credential);
          const newFirebaseUser = linkResult.user;

          const batch = writeBatch(db);
          bookingsSnapshot.forEach(doc => {
              batch.update(doc.ref, { userId: newFirebaseUser.uid });
          });
          teamSnapshot.forEach(doc => {
              batch.update(doc.ref, { userId: newFirebaseUser.uid });
          });
          
          batch.delete(doc(db, "users", anonUid));

          await batch.commit();
          
          await handleUserDocument(newFirebaseUser);
      } else {
          await handleUserDocument(result.user);
      }
    } catch (error) {
      console.error("Error during Google sign-in:", error);
      throw error;
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
  
  const updateUserPermissions = async (uid: string, permissions: Partial<{isTrusted: boolean, isAdmin: boolean}>) => {
    await updateUserTrustedStatus(uid, permissions);
  }

  const logout = async () => {
    await signOut(auth);
    // After signing out, the onAuthStateChanged listener will automatically
    // sign the user in anonymously.
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isUserRegistered, loginWithGoogle, logout, updateUserDetails, checkAdminStatus, updateUserPermissions }}>
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
