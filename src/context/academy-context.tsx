
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

// Helper function to generate a random alphanumeric code
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

  // This effect fetches all registrations for the admin page.
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

  // This effect fetches only the registrations for the currently logged-in user.
  useEffect(() => {
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


  const addRegistration = useCallback(async (newRegistrationData: Omit<AcademyRegistration, "id" | "status" | "submittedAt" | "accessCode" | "posts" | "birthDate"> & {birthDate: Date}, status: AcademyRegistration['status'] = 'pending') => {
    
    // Ensure birthDate is a valid Date object before converting to Timestamp
    const birthDate = newRegistrationData.birthDate instanceof Date 
      ? newRegistrationData.birthDate 
      : new Date(newRegistrationData.birthDate);

    if (isNaN(birthDate.getTime())) {
      throw new Error("Invalid birth date provided.");
    }
    
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

    await addDoc(collection(db, "academyRegistrations"), registrationPayload);
  }, []);
  
  const updateRegistrationStatus = async (id: string, status: AcademyRegistration['status']) => {
    const registrationDocRef = doc(db, "academyRegistrations", id);
    const updates: Partial<AcademyRegistration> = { status };

    // If accepting, generate an access code if one doesn't exist.
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
    // This function will now use the state fetched for either admin or user,
    // ensuring data is sourced correctly based on permissions.
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
     // Since only admins can comment, we can safely iterate through the admin's 'registrations' state
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
      // Since only admins can delete, we can safely iterate through the admin's 'registrations' state
      for (const reg of registrations) {
        const postToDelete = (reg.posts || []).find(p => p.id === postId);
        if (postToDelete) {
            if (postToDelete.storagePath) {
                await deleteFile(postToDelete.storagePath);
            }
            const memberDocRef = doc(db, "academyRegistrations", reg.id);
            await updateDoc(memberDocRef, {
                posts: arrayRemove(postToDelete)
            });
            break;
        }
      }
  };

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
