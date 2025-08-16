
"use client";

import React, { createContext, useContext, useState, type ReactNode, useEffect, useCallback } from "react";
import type { AcademyRegistration, MemberPost, PostComment } from "@/lib/types";
import { db } from "@/lib/firebase";
import { deleteFile } from "@/app/(main)/admin/actions";
import { 
    collection, 
    addDoc, 
    updateDoc, 
    doc,
    getDoc,
    Timestamp,
    arrayUnion,
    arrayRemove,
    getDocs,
    onSnapshot,
    query,
    where
} from "firebase/firestore";
import { useAuth } from "./auth-context";

interface AcademyContextType {
  registrations: AcademyRegistration[];
  addRegistration: (registration: Omit<AcademyRegistration, "id" | "status" | "submittedAt" | "accessCode" | "posts" | "birthDate"> & {birthDate: Date}, status?: AcademyRegistration['status']) => Promise<void>;
  updateRegistrationStatus: (id: string, status: AcademyRegistration['status']) => Promise<void>;
  addPost: (memberId: string, post: Omit<MemberPost, 'id' | 'createdAt'>) => Promise<void>;
  getPosts: (memberId?: string) => MemberPost[];
  addComment: (postId: string, comment: Omit<PostComment, 'createdAt'>) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  myRegistrations: AcademyRegistration[];
}

const AcademyContext = createContext<AcademyContextType | undefined>(undefined);

// --- CODE EDITING GUIDE ---
// This is a helper function to generate a random 6-character code.
// You could change the `length` or the characters in `chars` to customize it.
const generateAccessCode = (length = 6) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const AcademyProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<AcademyRegistration[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<AcademyRegistration[]>([]);

  // --- CODE EDITING GUIDE ---
  // This `useEffect` hook runs when the component loads or `user.isAdmin` changes.
  // It fetches ALL academy registrations if the user is an admin.
  // This is used for the admin dashboard.
  useEffect(() => {
    if (user?.isAdmin) {
        const q = query(collection(db, "academyRegistrations"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedRegistrations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AcademyRegistration));
            setRegistrations(fetchedRegistrations);
        });
        return () => unsubscribe();
    } else {
        setRegistrations([]);
    }
  }, [user?.isAdmin]);

  // --- CODE EDITING GUIDE ---
  // This `useEffect` hook fetches only the registrations for the currently logged-in user.
  // It uses a Firestore `where` clause to filter by `userId`.
  useEffect(() => {
    // This also handles anonymous users, as they have a UID.
    if (user) {
        const q = query(collection(db, "academyRegistrations"), where("userId", "==", user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const userRegs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AcademyRegistration));
            setMyRegistrations(userRegs);
        });
        return () => unsubscribe();
    } else {
        setMyRegistrations([]);
    }
  }, [user]);

  // --- CODE EDITING GUIDE ---
  // This function adds a new academy registration to the Firestore database.
  // `newRegistrationData` is the data passed from the form.
  // `status` is optional and defaults to 'pending'.
  const addRegistration = useCallback(async (newRegistrationData: Omit<AcademyRegistration, "id" | "status" | "submittedAt" | "accessCode" | "posts" | "birthDate"> & {birthDate: Date}, status: AcademyRegistration['status'] = 'pending') => {
    
    const birthDate = newRegistrationData.birthDate instanceof Date 
      ? newRegistrationData.birthDate 
      : new Date(newRegistrationData.birthDate);

    if (isNaN(birthDate.getTime())) {
      throw new Error("Invalid birth date provided.");
    }
    
    // This creates the object that will be saved.
    // `Timestamp.fromDate` converts a JS Date to a Firestore Timestamp.
    const registrationPayload: any = {
      ...newRegistrationData,
      birthDate: Timestamp.fromDate(birthDate),
      status: status,
      submittedAt: Timestamp.now(),
      posts: [],
    };

    if (status === 'accepted') {
        registrationPayload.accessCode = generateAccessCode();
    }

    // This command actually saves the data to the "academyRegistrations" collection.
    await addDoc(collection(db, "academyRegistrations"), registrationPayload);
  }, []);
  
  // --- CODE EDITING GUIDE ---
  // This function updates the status of an existing registration (e.g., to 'accepted').
  // It's used by the admin panel.
  const updateRegistrationStatus = async (id: string, status: AcademyRegistration['status']) => {
    const registrationDocRef = doc(db, "academyRegistrations", id);
    const updates: Partial<AcademyRegistration> = { status };

    if (status === 'accepted') {
      const regDoc = await getDoc(registrationDocRef);
      if (regDoc.exists() && !regDoc.data().accessCode) {
        updates.accessCode = generateAccessCode();
      }
    }
    
    await updateDoc(registrationDocRef, updates as any);
  };

  const addPost = async (memberId: string, postData: Omit<MemberPost, 'id' | 'createdAt'>) => {
    const memberDocRef = doc(db, "academyRegistrations", memberId);
    const newPost: MemberPost = {
      ...postData,
      id: doc(collection(db, 'dummy')).id, // Generate a random ID
      createdAt: Timestamp.now(),
      comments: [],
    };
    await updateDoc(memberDocRef, {
      posts: arrayUnion(newPost)
    });
  };

  const getPosts = (memberId?: string): MemberPost[] => {
    const sourceRegistrations = user?.isAdmin ? registrations : myRegistrations;
    
    const allPosts = sourceRegistrations.flatMap(r => (r.posts || []));

    if (memberId) {
        const member = sourceRegistrations.find(r => r.id === memberId);
        return member?.posts || [];
    }
    
    return allPosts.sort((a,b) => (b.createdAt as Timestamp).toMillis() - (a.createdAt as Timestamp).toMillis());
  };

  const addComment = async (postId: string, commentData: Omit<PostComment, 'createdAt'>) => {
     const newComment: PostComment = {
        ...commentData,
        createdAt: Timestamp.now()
     };
     for (const reg of registrations) {
        const post = (reg.posts || []).find(p => p.id === postId);
        if (post) {
            const memberDocRef = doc(db, "academyRegistrations", reg.id);
            const updatedPosts = (reg.posts || []).map(p => 
                p.id === postId ? {...p, comments: [...(p.comments || []), newComment]} : p
            );
            await updateDoc(memberDocRef, { posts: updatedPosts });
            break;
        }
     }
  };

  const deletePost = async (postId: string) => {
      for (const reg of registrations) {
        const postToDelete = (reg.posts || []).find(p => p.id === postId);
        if (postToDelete) {
            if (postToDelete.photoUrl) {
                await deleteFile(postToDelete.photoUrl);
            }
            const memberDocRef = doc(db, "academyRegistrations", reg.id);
            await updateDoc(memberDocRef, {
                posts: arrayRemove(postToDelete)
            });
            break;
        }
      }
  };
  
  // --- CODE EDITING GUIDE ---
  // The `value` object makes all the functions and state available to any
  // component that uses the `useAcademy()` hook.
  return (
    <AcademyContext.Provider value={{ registrations, myRegistrations, addRegistration, updateRegistrationStatus, addPost, getPosts, addComment, deletePost }}>
      {children}
    </AcademyContext.Provider>
  );
};

export const useAcademy = () => {
  const context = useContext(AcademyContext);
  if (context === undefined) {
    throw new Error("useAcademy must be used within an AcademyProvider");
  }
  return context;
};
