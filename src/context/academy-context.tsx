
"use client";

import React, { createContext, useContext, useState, type ReactNode } from "react";
import type { AcademyRegistration } from "@/lib/types";

interface AcademyContextType {
  registrations: AcademyRegistration[];
  addRegistration: (registration: Omit<AcademyRegistration, "id" | "status" | "submittedAt" | "accessCode">) => Promise<void>;
  updateRegistrationStatus: (id: string, status: AcademyRegistration['status']) => Promise<void>;
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

  const addRegistration = async (newRegistrationData: Omit<AcademyRegistration, "id" | "status" | "submittedAt" | "accessCode">) => {
    const newRegistration: AcademyRegistration = {
      ...newRegistrationData,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending',
      submittedAt: new Date(),
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

  return (
    <AcademyContext.Provider value={{ registrations, addRegistration, updateRegistrationStatus }}>
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
