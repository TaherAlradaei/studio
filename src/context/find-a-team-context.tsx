
"use client";

import React, { createContext, useContext, useState, type ReactNode, useEffect, useCallback } from "react";
import type { TeamRegistration } from "@/lib/types";
import { db } from "@/lib/firebase";
import { 
    collection, 
    query, 
    onSnapshot, 
    addDoc, 
    updateDoc, 
    doc,
    Timestamp
} from "firebase/firestore";

interface FindATeamContextType {
  registrations: TeamRegistration[];
  addRegistration: (registration: Omit<TeamRegistration, "id" | "status" | "submittedAt">) => Promise<void>;
  updateRegistrationStatus: (id: string, status: TeamRegistration['status']) => Promise<void>;
}

const FindATeamContext = createContext<FindATeamContextType | undefined>(undefined);

export const FindATeamProvider = ({ children }: { children: ReactNode }) => {
  const [registrations, setRegistrations] = useState<TeamRegistration[]>([]);

  useEffect(() => {
    const q = query(collection(db, "findATeamRegistrations"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const registrationsData: TeamRegistration[] = [];
      querySnapshot.forEach((doc) => {
        registrationsData.push({ id: doc.id, ...doc.data() } as TeamRegistration);
      });
      setRegistrations(registrationsData);
    });
    return () => unsubscribe();
  }, []);

  const addRegistration = useCallback(async (newRegistrationData: Omit<TeamRegistration, "id" | "status" | "submittedAt">) => {
    await addDoc(collection(db, "findATeamRegistrations"), {
      ...newRegistrationData,
      status: 'pending',
      submittedAt: Timestamp.now(),
    });
  }, []);
  
  const updateRegistrationStatus = async (id: string, status: TeamRegistration['status']) => {
    const registrationDocRef = doc(db, "findATeamRegistrations", id);
    await updateDoc(registrationDocRef, { status });
  };

  return (
    <FindATeamContext.Provider value={{ registrations, addRegistration, updateRegistrationStatus }}>
      {children}
    </FindATeamContext.Provider>
  );
};

export const useFindATeam = () => {
  const context = useContext(FindATeamContext);
  if (context === undefined) {
    throw new Error("useFindATeam must be used within a FindATeamProvider");
  }
  return context;
};
