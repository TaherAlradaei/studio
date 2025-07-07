"use client";

import React, { createContext, useContext, useState, type ReactNode, useCallback, useMemo } from "react";

const initialBackgrounds = [
  { url: "https://placehold.co/1920x1080.png", hint: "football player kicking" },
  { url: "https://placehold.co/1920x1080.png", hint: "goalkeeper diving save" },
  { url: "https://placehold.co/1920x1080.png", hint: "football player heading" },
  { url: "https://placehold.co/1920x1080.png", hint: "stadium evening lights" },
];

interface Background {
  url: string;
  hint: string;
}

interface BackgroundContextType {
  backgrounds: Background[];
  currentBackground: Background;
  cycleBackground: () => void;
  updateBackground: (index: number, newBackground: Background) => void;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

export const BackgroundProvider = ({ children }: { children: ReactNode }) => {
  const [backgrounds, setBackgrounds] = useState<Background[]>(initialBackgrounds);
  const [currentIndex, setCurrentIndex] = useState(0);

  const cycleBackground = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % backgrounds.length);
  }, [backgrounds.length]);

  const updateBackground = (index: number, newBackground: Background) => {
    setBackgrounds(currentBackgrounds => {
        const newBackgrounds = [...currentBackgrounds];
        if (index >= 0 && index < newBackgrounds.length) {
            newBackgrounds[index] = newBackground;
        }
        return newBackgrounds;
    });
  };

  const value = useMemo(() => ({
    backgrounds,
    currentBackground: backgrounds[currentIndex],
    cycleBackground,
    updateBackground,
  }), [backgrounds, currentIndex, cycleBackground]);

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
