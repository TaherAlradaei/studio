
"use client";

import React, { createContext, useContext, useState, type ReactNode, useEffect, useCallback } from "react";
import type { TeamRegistration } from "@/lib/types";
import { db } from "@/lib/firebase";
import { 
    collection, 
    query, 
    onSnapshot, 
    addDoc, 
    doc,
    deleteDoc,
    Timestamp,
    where
} from "firebase/firestore";
import { useAuth } from "./auth-context";
import { useToast } from "@/hooks/use-toast";

interface FindATeamContextType {
  registrations: TeamRegistration[];
  isRegistered: boolean;
  addRegistration: (registration: Omit<TeamRegistration, "id" | "status" | "submittedAt">) => Promise<void>;
  deleteRegistration: (id: string) => Promise<void>;
}

const FindATeamContext = createContext<FindATeamContextType | undefined>(undefined);

export const FindATeamProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [registrations, setRegistrations] = useState<TeamRegistration[]>([]);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    // This listener fetches all registrations. This assumes your Firestore rules
    // allow any authenticated user to read the findATeamRegistrations collection.
    if (user) {
        const q = query(collection(db, "findATeamRegistrations"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const regs: TeamRegistration[] = [];
            let userFound = false;
            querySnapshot.forEach((doc) => {
                const data = { id: doc.id, ...doc.data() } as TeamRegistration;
                regs.push(data);
                if (data.userId === user.uid) {
                    userFound = true;
                }
            });
            setRegistrations(regs);
            setIsRegistered(userFound);
        }, (error) => {
            console.error("Error fetching team registrations:", error);
            toast({
                title: "Error",
                description: "Could not fetch player list. You may not have permission.",
                variant: "destructive"
            });
        });

        return () => unsubscribe();
    } else {
        setRegistrations([]);
        setIsRegistered(false);
    }
  }, [user, toast]);

  const addRegistration = useCallback(async (newRegistrationData: Omit<TeamRegistration, "id" | "status" | "submittedAt">) => {
    await addDoc(collection(db, "findATeamRegistrations"), {
      ...newRegistrationData,
      status: 'pending', // 'pending' means they are on the list
      submittedAt: Timestamp.now(),
    });
  }, []);
  
  const deleteRegistration = async (id: string) => {
    await deleteDoc(doc(db, "findATeamRegistrations", id));
  };

  return (
    <FindATeamContext.Provider value={{ registrations, isRegistered, addRegistration, deleteRegistration }}>
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
