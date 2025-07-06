"use client";

import React, { createContext, useContext, useState, type ReactNode, useCallback, useMemo } from "react";

const backgrounds = [
  { url: "https://placehold.co/1920x1080.png", hint: "football player kicking" },
  { url: "https://placehold.co/1920x1080.png", hint: "goalkeeper diving save" },
  { url: "https://placehold.co/1920x1080.png", hint: "football player heading" },
  { url: "https://placehold.co/1920x1080.png", hint: "stadium evening lights" },
];

interface BackgroundContextType {
  currentBackground: { url: string; hint: string; };
  cycleBackground: () => void;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

export const BackgroundProvider = ({ children }: { children: ReactNode }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const cycleBackground = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % backgrounds.length);
  }, []);
  
  const value = useMemo(() => ({
    currentBackground: backgrounds[currentIndex],
    cycleBackground,
  }), [currentIndex, cycleBackground]);

  return (
    <BackgroundContext.Provider value={value}>
      {children}
    </BackgroundContext.Provider>
  );
};

export const useBackground = () => {
  const context = useContext(BackgroundContext);
  if (context === undefined) {
    throw new Error("useBackground must be used within a BackgroundProvider");
  }
  return context;
};
