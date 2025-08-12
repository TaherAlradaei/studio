
"use client";

import React, { createContext, useContext, useState, type ReactNode, useEffect, useCallback } from "react";
import type { TeamRegistration } from "@/lib/types";
import { db } from "@/lib/firebase";
import { 
    collection, 
    addDoc, 
    doc,
    deleteDoc,
    Timestamp,
    query,
    where,
    onSnapshot
} from "firebase/firestore";
import { useAuth } from "./auth-context";
import { useToast } from "@/hooks/use-toast";
import { getTeamRegistrations } from "@/ai/flows/find-a-team-flow";

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

  const fetchRegistrations = useCallback(async () => {
    if (!user) return;
    try {
      const fetchedRegistrations = await getTeamRegistrations();
      // Handle the serialized Timestamp from the flow
      const formattedRegs = fetchedRegistrations.map(r => ({
          ...r,
          submittedAt: new Timestamp(r.submittedAt.seconds, r.submittedAt.nanoseconds)
      })) as TeamRegistration[];

      setRegistrations(formattedRegs);
      
      const userFound = formattedRegs.some(reg => reg.userId === user.uid);
      setIsRegistered(userFound);

    } catch (error) {
        console.error("Error fetching team registrations:", error);
        toast({
            title: "Error",
            description: "Could not fetch player list. You may not have permission.",
            variant: "destructive"
        });
    }
  }, [user, toast]);

  useEffect(() => {
    // This listener only checks if the current user is registered.
    // The full list is fetched on demand when needed.
    if (user) {
        const q = query(collection(db, "findATeamRegistrations"), where("userId", "==", user.uid));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            setIsRegistered(!querySnapshot.empty);
            if (!querySnapshot.empty) {
                // If user is registered, fetch the full list for them to see.
                fetchRegistrations();
            }
        });

        return () => unsubscribe();
    } else {
        setRegistrations([]);
        setIsRegistered(false);
    }
  }, [user, fetchRegistrations]);


  const addRegistration = useCallback(async (newRegistrationData: Omit<TeamRegistration, "id" | "status" | "submittedAt">) => {
    await addDoc(collection(db, "findATeamRegistrations"), {
      ...newRegistrationData,
      status: 'pending', // 'pending' means they are on the list
      submittedAt: Timestamp.now(),
    });
    // After adding, fetch the new list
    await fetchRegistrations();
  }, [fetchRegistrations]);
  
  const deleteRegistration = async (id: string) => {
    await deleteDoc(doc(db, "findATeamRegistrations", id));
    // After deleting, fetch the new list
    await fetchRegistrations();
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
