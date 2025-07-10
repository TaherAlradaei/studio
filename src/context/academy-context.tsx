
"use client";

import React, { createContext, useContext, useState, type ReactNode } from "react";
import type { AcademyRegistration, MemberPost } from "@/lib/types";

interface AcademyContextType {
  registrations: AcademyRegistration[];
  addRegistration: (registration: Omit<AcademyRegistration, "id" | "status" | "submittedAt" | "accessCode" | "posts">) => Promise<void>;
  updateRegistrationStatus: (id: string, status: AcademyRegistration['status']) => Promise<void>;
  validateAccessCode: (code: string) => AcademyRegistration | null;
  addPost: (memberId: string, post: Omit<MemberPost, 'id'>) => void;
  getPosts: (memberId: string) => MemberPost[];
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

  const addRegistration = async (newRegistrationData: Omit<AcademyRegistration, "id" | "status" | "submittedAt" | "accessCode" | "posts">) => {
    const newRegistration: AcademyRegistration = {
      ...newRegistrationData,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending',
      submittedAt: new Date(),
      posts: [],
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

  const getPosts = (memberId: string): MemberPost[] => {
    const member = registrations.find(r => r.id === memberId);
    return member ? member.posts : [];
  };

  return (
    <AcademyContext.Provider value={{ registrations, addRegistration, updateRegistrationStatus, validateAccessCode, addPost, getPosts }}>
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
