
"use client";

import React, { createContext, useContext, useState, type ReactNode, useMemo } from "react";
import { useLanguage } from "./language-context";

interface WelcomePageContent {
  title: string;
  message: string;
  fieldImageUrl: string;
  coachImageUrl: string;
}

interface WelcomePageContextType {
  welcomePageContent: WelcomePageContent;
  updateWelcomePageContent: (updates: Partial<WelcomePageContent>) => void;
}

const WelcomePageContext = createContext<WelcomePageContextType | undefined>(undefined);

export const WelcomePageProvider = ({ children }: { children: ReactNode }) => {
  const { t } = useLanguage();

  const [content, setContent] = useState<WelcomePageContent>({
    title: t.welcomePage.defaultTitle,
    message: t.welcomePage.defaultMessage,
    fieldImageUrl: "https://placehold.co/600x400.png",
    coachImageUrl: "https://placehold.co/600x400.png",
  });

  const updateWelcomePageContent = (updates: Partial<WelcomePageContent>) => {
    setContent(prevContent => ({
      ...prevContent,
      ...updates
    }));
  };
  
  // This is a bit of a trick to update the content if the language changes
  // and the content is still the default.
  React.useEffect(() => {
    setContent(currentContent => {
      const newDefaults = {
        title: t.welcomePage.defaultTitle,
        message: t.welcomePage.defaultMessage
      };

      // Check if current content matches old defaults for 'en' or 'ar'
      const isOldEnDefault = currentContent.title === "Welcome to Al Maidan Football Academy" && currentContent.message === "Your premier destination for football in Sana'a. Book a field, join our academy, and become part of our community.";
      const isOldArDefault = currentContent.title === "أهلاً بكم في أكاديمية الميدان لكرة القدم" && currentContent.message === "وجهتكم الأولى لكرة القدم في صنعاء. احجزوا ملعبًا، انضموا إلى أكاديميتنا، وكونوا جزءًا من مجتمعنا.";
      
      if (isOldEnDefault || isOldArDefault) {
        return { ...currentContent, ...newDefaults };
      }
      return currentContent;
    });
  }, [t.welcomePage.defaultTitle, t.welcomePage.defaultMessage]);

  const value = useMemo(() => ({
    welcomePageContent: content,
    updateWelcomePageContent,
  }), [content]);

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
