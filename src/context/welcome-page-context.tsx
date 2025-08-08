
"use client";

import React, { createContext, useContext, useState, type ReactNode, useMemo, useEffect, useCallback } from "react";
import { getWelcomePageContent } from "@/app/(main)/admin/actions";
import type { WelcomePageContent } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";


interface WelcomePageContextType {
  welcomePageContent: WelcomePageContent | null;
  isWelcomePageLoading: boolean;
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
  
  const value = useMemo(() => ({
    welcomePageContent: content,
    isWelcomePageLoading,
  }), [content, isWelcomePageLoading]);

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
