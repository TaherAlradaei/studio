
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
    getDocs,
    onSnapshot
} from "firebase/firestore";
import { useAuth } from "./auth-context";
import { useToast } from "@/hooks/use-toast";

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
  
  const fetchAllRegistrations = useCallback(() => {
    setIsLoading(true);
    const listQuery = collection(db, "findATeamRegistrations");
    const unsubscribe = onSnapshot(listQuery, (snapshot) => {
        const fetchedRegistrations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeamRegistration));
        setRegistrations(fetchedRegistrations);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching team registrations:", error);
        toast({
            title: "Error",
            description: "Could not fetch player list. You may not have permission.",
            variant: "destructive"
        });
        setIsLoading(false);
    });
    return unsubscribe;
  }, [toast]);


  useEffect(() => {
    let unsubscribe: () => void = () => {};

    const checkRegistrationStatus = async () => {
      if (user) {
        setIsLoading(true);
        const q = query(collection(db, "findATeamRegistrations"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const registered = !querySnapshot.empty;
        setIsRegistered(registered);

        if (registered) {
            unsubscribe = fetchAllRegistrations();
        } else {
          setRegistrations([]);
          setIsLoading(false);
        }
      } else {
        setRegistrations([]);
        setIsRegistered(false);
        setIsLoading(false);
      }
    };

    checkRegistrationStatus();
    
    return () => unsubscribe();
  }, [user, toast, fetchAllRegistrations]);


  const addRegistration = useCallback(async (newRegistrationData: Omit<TeamRegistration, "id" | "status" | "submittedAt">) => {
    await addDoc(collection(db, "findATeamRegistrations"), {
      ...newRegistrationData,
      status: 'pending', // 'pending' means they are on the list
      submittedAt: Timestamp.now(),
    });
    setIsRegistered(true);
    fetchAllRegistrations();
  }, [fetchAllRegistrations]);
  
  const deleteRegistration = async (id: string) => {
    await deleteDoc(doc(db, "findATeamRegistrations", id));
    setIsRegistered(false);
    setRegistrations([]);
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
