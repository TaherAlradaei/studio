
"use client";

import React, { createContext, useContext, useState, type ReactNode } from "react";
import type { AcademyRegistration, MemberPost, PostComment } from "@/lib/types";

interface AcademyContextType {
  registrations: AcademyRegistration[];
  addRegistration: (registration: Omit<AcademyRegistration, "id" | "status" | "submittedAt" | "accessCode" | "posts">, status?: AcademyRegistration['status']) => Promise<void>;
  updateRegistrationStatus: (id: string, status: AcademyRegistration['status']) => Promise<void>;
  validateAccessCode: (code: string) => AcademyRegistration | null;
  addPost: (memberId: string, post: Omit<MemberPost, 'id'>) => void;
  getPosts: (memberId?: string) => MemberPost[];
  addComment: (postId: string, comment: PostComment) => void;
  deletePost: (postId: string) => void;
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

  const addRegistration = async (newRegistrationData: Omit<AcademyRegistration, "id" | "status" | "submittedAt" | "accessCode" | "posts">, status: AcademyRegistration['status'] = 'pending') => {
    const newRegistration: AcademyRegistration = {
      ...newRegistrationData,
      id: Math.random().toString(36).substr(2, 9),
      status: status,
      submittedAt: new Date(),
      posts: [],
      accessCode: status === 'accepted' ? generateAccessCode() : undefined,
    };
    setRegistrations(prev => [...prev, newRegistration]);
  };
  
  const updateRegistrationStatus = async (id: string, status: AcademyRegistration['status']) => {
    setRegistrations(prev => prev.map(r => {
      if (r.id === id) {
        const updatedRegistration = { ...r, status };
        if (status === 'accepted' && !r.accessCode) {
          updatedRegistration.accessCode = generateAccessCode();
        }
        return updatedRegistration;
      }
      return r;
    }));
  };

  const validateAccessCode = (code: string): AcademyRegistration | null => {
    if (!code) return null;
    return registrations.find(r => r.accessCode === code && r.status === 'accepted') || null;
  };

  const addPost = (memberId: string, post: Omit<MemberPost, 'id'>) => {
    const newPost: MemberPost = {
      ...post,
      id: Math.random().toString(36).substr(2, 9),
    };

    setRegistrations(prev => prev.map(r => {
      if (r.id === memberId) {
        return {
          ...r,
          posts: [newPost, ...r.posts],
        };
      }
      return r;
    }));
  };

  const getPosts = (memberId?: string): MemberPost[] => {
    if (memberId) {
        const member = registrations.find(r => r.id === memberId);
        return member ? member.posts : [];
    }
    // If no memberId, return all posts from all members
    return registrations.flatMap(r => r.posts).sort((a,b) => b.id.localeCompare(a.id)); // sort vaguely by time
  };

  const addComment = (postId: string, comment: PostComment) => {
     setRegistrations(prev => prev.map(r => ({
        ...r,
        posts: r.posts.map(p => {
            if (p.id === postId) {
                return {
                    ...p,
                    comments: [...(p.comments || []), comment]
                }
            }
            return p;
        })
     })));
  };

  const deletePost = (postId: string) => {
      setRegistrations(prev => prev.map(r => ({
        ...r,
        posts: r.posts.filter(p => p.id !== postId)
      })));
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
