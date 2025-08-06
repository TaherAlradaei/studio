
"use client";

import React, { createContext, useContext, useState, type ReactNode, useMemo, useEffect } from "react";
import { useLanguage } from "./language-context";
import { getWelcomePageContent } from "@/app/(main)/admin/actions";
import type { WelcomePageContent } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";


interface WelcomePageContextType {
  welcomePageContent: WelcomePageContent;
  isWelcomePageLoading: boolean;
  updateWelcomePageContent: (updates: Partial<WelcomePageContent>) => void;
}

const WelcomePageContext = createContext<WelcomePageContextType | undefined>(undefined);

export const WelcomePageProvider = ({ children }: { children: ReactNode }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const [content, setContent] = useState<WelcomePageContent>({
    title: "",
    message: "",
    fieldImageUrl: "",
    coachImageUrl: "",
  });
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
  

  const updateWelcomePageContent = (updates: Partial<WelcomePageContent>) => {
    setContent(prevContent => ({
      ...prevContent,
      ...updates
    }));
  };
  
  useEffect(() => {
    if (!isWelcomePageLoading) {
        setContent(currentContent => {
            const newDefaults = {
                title: t.welcomePage.defaultTitle,
                message: t.welcomePage.defaultMessage
            };
            const isOldEnDefault = currentContent.title === "Welcome to Al Maidan Sporting Club (Al Maidan Academy)" && currentContent.message === "Your premier destination for football in Sana'a. Book a field, join our academy, and become part of our community.";
            const isOldArDefault = currentContent.title === "أهلاً بكم في نادي الميدان الرياضي" && currentContent.message === "وجهتكم الأولى لكرة القدم في صنعاء. احجزوا ملعبًا، انضموا إلى أكاديميتنا، وكونوا جزءًا من مجتمعنا.";
            
            if (isOldEnDefault || isOldArDefault) {
                return { ...currentContent, ...newDefaults };
            }
            return currentContent;
        });
    }
  }, [t.welcomePage.defaultTitle, t.welcomePage.defaultMessage, isWelcomePageLoading]);

  const value = useMemo(() => ({
    welcomePageContent: content,
    isWelcomePageLoading,
    updateWelcomePageContent,
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
