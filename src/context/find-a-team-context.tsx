
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
    getDocs
} from "firebase/firestore";
import { useAuth } from "./auth-context";
import { useToast } from "@/hooks/use-toast";
import { getTeamRegistrations } from "@/ai/flows/find-a-team-flow";

interface FindATeamContextType {
  registrations: TeamRegistration[];
  isRegistered: boolean | null; // null means we haven't checked yet
  isLoading: boolean;
  addRegistration: (registration: Omit<TeamRegistration, "id" | "status" | "submittedAt">) => Promise<void>;
  deleteRegistration: (id: string) => Promise<void>;
}

const FindATeamContext = createContext<FindATeamContextType | undefined>(undefined);

export const FindATeamProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [registrations, setRegistrations] = useState<TeamRegistration[]>([]);
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRegistrations = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const fetchedRegistrations = await getTeamRegistrations();
      // Handle the serialized Timestamp from the flow
      const formattedRegs = fetchedRegistrations.map(r => ({
          ...r,
          submittedAt: new Timestamp(r.submittedAt.seconds, r.submittedAt.nanoseconds)
      })) as TeamRegistration[];

      setRegistrations(formattedRegs);
    } catch (error) {
        console.error("Error fetching team registrations:", error);
        toast({
            title: "Error",
            description: "Could not fetch player list. You may not have permission.",
            variant: "destructive"
        });
    } finally {
        setIsLoading(false);
    }
  }, [user, toast]);

  const checkRegistrationStatus = useCallback(async () => {
      if (user) {
        const q = query(collection(db, "findATeamRegistrations"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const registered = !querySnapshot.empty;
        setIsRegistered(registered);
        if (registered) {
            // If user is registered, fetch the full list for them to see.
            fetchRegistrations();
        }
      } else {
        setRegistrations([]);
        setIsRegistered(false);
      }
  }, [user, fetchRegistrations]);


  useEffect(() => {
    checkRegistrationStatus();
  }, [user, checkRegistrationStatus]);


  const addRegistration = useCallback(async (newRegistrationData: Omit<TeamRegistration, "id" | "status" | "submittedAt">) => {
    await addDoc(collection(db, "findATeamRegistrations"), {
      ...newRegistrationData,
      status: 'pending', // 'pending' means they are on the list
      submittedAt: Timestamp.now(),
    });
    // After adding, check status which will trigger a fetch
    await checkRegistrationStatus();
  }, [checkRegistrationStatus]);
  
  const deleteRegistration = async (id: string) => {
    await deleteDoc(doc(db, "findATeamRegistrations", id));
    // After deleting, check status which will trigger a fetch
    await checkRegistrationStatus();
  };

  return (
    <FindATeamContext.Provider value={{ registrations, isRegistered, isLoading, addRegistration, deleteRegistration }}>
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
