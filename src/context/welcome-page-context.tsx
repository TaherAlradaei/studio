
"use client";

import React, { createContext, useContext, useState, type ReactNode, useMemo, useEffect, useCallback } from "react";
import { getWelcomePageContent, updateWelcomePageContent as updateWelcomePageContentAction } from "@/app/(main)/admin/actions";
import type { WelcomePageContent } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";


interface WelcomePageContextType {
  welcomePageContent: WelcomePageContent | null;
  isWelcomePageLoading: boolean;
  updateWelcomePageContent: (updates: Partial<WelcomePageContent>) => Promise<void>;
}

const WelcomePageContext = createContext<WelcomePageContextType | undefined>(undefined);

export const WelcomePageProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  
  const [content, setContent] = useState<WelcomePageContent | null>(null);
  const [isWelcomePageLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setIsLoading(true);
        const fetchedContent = await getWelcomePageContent();
        setContent(fetchedContent);
      } catch (error) {
        toast({ title: "Error", description: "Failed to load welcome page content.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchContent();
  }, [toast]);
  

  const updateWelcomePageContent = useCallback(async (updates: Partial<WelcomePageContent>) => {
    setContent(prevContent => ({
      ...prevContent!,
      ...updates
    }));
    try {
        await updateWelcomePageContentAction(updates);
    } catch(e) {
        toast({ title: "Error", description: "Failed to save welcome page content.", variant: "destructive" });
         const fetchedContent = await getWelcomePageContent();
         setContent(fetchedContent);
    }
  }, [toast]);
  

  const value = useMemo(() => ({
    welcomePageContent: content,
    isWelcomePageLoading,
    updateWelcomePageContent,
  }), [content, isWelcomePageLoading, updateWelcomePageContent]);

  return (
    <WelcomePageContext.Provider value={value}>
      {children}
    </WelcomePageContext.Provider>
  );
};

export const useWelcomePage = () => {
  const context = useContext(WelcomePageContext);
  if (context === undefined) {
    throw new Error("useWelcomePage must be used within a WelcomePageProvider");
  }
  return context;
};
