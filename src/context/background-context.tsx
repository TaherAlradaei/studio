
"use client";

import React, { createContext, useContext, useState, type ReactNode, useCallback, useMemo } from "react";

const initialBackgrounds = [
  { url: "https://images.unsplash.com/photo-1652190416284-10debef71bfa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxmb290YmFsbCUyMHBsYXllciUyMGtpY2tpbmd8ZW58MHx8fHwxNzUyMjY3NDAwfDA&ixlib=rb-4.1.0&q=80&w=1080", hint: "football player kicking" },
  { url: "https://images.unsplash.com/photo-1659188903747-7af9b849bdf5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw5fHxnb2Fsa2VlcGVyJTIwZGl2aW5nJTIwc2F2ZXxlbnwwfHx8fDE3NTIyNjc0MDB8MA&ixlib=rb-4.1.0&q=80&w=1080", hint: "goalkeeper diving save" },
  { url: "https://images.unsplash.com/photo-1631233143542-c7097a332932?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw3fHxmb290YmFsbCUyMHBsYXllciUyMGhlYWRpbmd8ZW58MHx8fHwxNzUyMjY3NDAwfDA&ixlib=rb-4.1.0&q=80&w=1080", hint: "football player heading" },
  { url: "https://images.unsplash.com/photo-1611587475814-cec57a649bce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxzdGFkaXVtJTIwZXZlbmluZyUyMGxpZ2h0c3xlbnwwfHx8fDE3NTIyNjc0MDB8MA&ixlib=rb-4.1.0&q=80&w=1080", hint: "stadium evening lights" },
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
