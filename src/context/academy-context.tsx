
"use client";

import React, { createContext, useContext, useState, type ReactNode, useEffect } from "react";
import type { AcademyRegistration, MemberPost, PostComment } from "@/lib/types";
import { db } from "@/lib/firebase";
import { 
    collection, 
    query, 
    onSnapshot, 
    addDoc, 
    updateDoc, 
    doc,
    Timestamp,
    arrayUnion,
    arrayRemove,
    where,
    getDocs,
    deleteDoc,
    setDoc
} from "firebase/firestore";

interface AcademyContextType {
  registrations: AcademyRegistration[];
  addRegistration: (registration: Omit<AcademyRegistration, "id" | "status" | "submittedAt" | "accessCode" | "posts" | "birthDate"> & {birthDate: Date}, status?: AcademyRegistration['status']) => Promise<void>;
  updateRegistrationStatus: (id: string, status: AcademyRegistration['status']) => Promise<void>;
  validateAccessCode: (code: string) => AcademyRegistration | null;
  addPost: (memberId: string, post: Omit<MemberPost, 'id' | 'createdAt'>) => Promise<void>;
  getPosts: (memberId?: string) => MemberPost[];
  addComment: (postId: string, comment: Omit<PostComment, 'createdAt'>) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
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
  const [registrations, setRegistrations] = useState<AcademyRegistration[]>([]);

  useEffect(() => {
    const q = query(collection(db, "academyRegistrations"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const registrationsData: AcademyRegistration[] = [];
      querySnapshot.forEach((doc) => {
        registrationsData.push({ id: doc.id, ...doc.data() } as AcademyRegistration);
      });
      setRegistrations(registrationsData);
    });
    return () => unsubscribe();
  }, []);

  const addRegistration = async (newRegistrationData: Omit<AcademyRegistration, "id" | "status" | "submittedAt" | "accessCode" | "posts" | "birthDate"> & {birthDate: Date}, status: AcademyRegistration['status'] = 'pending') => {
    const accessCode = status === 'accepted' ? generateAccessCode() : undefined;
    
    await addDoc(collection(db, "academyRegistrations"), {
      ...newRegistrationData,
      birthDate: Timestamp.fromDate(newRegistrationData.birthDate),
      status: status,
      submittedAt: Timestamp.now(),
      posts: [],
      accessCode: accessCode,
    });
  };
  
  const updateRegistrationStatus = async (id: string, status: AcademyRegistration['status']) => {
    const registrationDocRef = doc(db, "academyRegistrations", id);
    const updates: Partial<AcademyRegistration> = { status };

    const currentReg = registrations.find(r => r.id === id);
    if (status === 'accepted' && currentReg && !currentReg.accessCode) {
        updates.accessCode = generateAccessCode();
    }
    
    await updateDoc(registrationDocRef, updates as any);
  };

  const validateAccessCode = (code: string): AcademyRegistration | null => {
    if (!code) return null;
    return registrations.find(r => r.accessCode === code && r.status === 'accepted') || null;
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
    const allPosts = registrations.flatMap(r => (r.posts || []));
    if (memberId) {
        const member = registrations.find(r => r.id === memberId);
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
            const memberDocRef = doc(db, "academyRegistrations", reg.id);
            await updateDoc(memberDocRef, {
                posts: arrayRemove(postToDelete)
            });
            break;
        }
      }
  };

  return (
    <AcademyContext.Provider value={{ registrations, addRegistration, updateRegistrationStatus, validateAccessCode, addPost, getPosts, addComment, deletePost }}>
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
