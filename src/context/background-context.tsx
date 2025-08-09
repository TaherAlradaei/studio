
"use client";

import React, { createContext, useContext, useState, type ReactNode, useCallback, useMemo, useEffect } from "react";
import { getBackgrounds, updateBackgrounds } from "@/app/(main)/admin/actions";
import type { Background } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface BackgroundContextType {
  backgrounds: Background[];
  currentBackground: Background | undefined;
  isBackgroundsLoading: boolean;
  cycleBackground: () => void;
  updateBackground: (index: number, newBackground: Background) => Promise<void>;
  deleteBackground: (index: number) => Promise<void>;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

export const BackgroundProvider = ({ children }: { children: ReactNode }) => {
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isBackgroundsLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchBackgrounds = async () => {
      try {
        setIsLoading(true);
        const fetchedBackgrounds = await getBackgrounds();
        setBackgrounds(fetchedBackgrounds);
        if (fetchedBackgrounds.length > 0) {
            setCurrentIndex(Math.floor(Math.random() * fetchedBackgrounds.length));
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load background images.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchBackgrounds();
  }, [toast]);

  const cycleBackground = useCallback(() => {
    if (backgrounds.length > 0) {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % backgrounds.length);
    }
  }, [backgrounds.length]);

  const updateBackground = async (index: number, newBackground: Background) => {
    const newBackgrounds = [...backgrounds];
    if (index >= 0 && index <= newBackgrounds.length) {
        if(index === newBackgrounds.length) {
             newBackgrounds.push(newBackground);
        } else {
            // When replacing, ensure old file is deleted if path exists
            const oldPath = newBackgrounds[index]?.path;
            if (oldPath && oldPath !== newBackground.path) {
                // This part should be handled in the calling component (admin page)
                // to ensure we can also call deleteFile server action.
            }
            newBackgrounds[index] = newBackground;
        }
        await updateBackgrounds(newBackgrounds);
        setBackgrounds(newBackgrounds);
    }
  };

  const deleteBackground = async (index: number) => {
    const newBackgrounds = backgrounds.filter((_, i) => i !== index);
    await updateBackgrounds(newBackgrounds);
    setBackgrounds(newBackgrounds);
    if(currentIndex >= newBackgrounds.length && newBackgrounds.length > 0){
        setCurrentIndex(newBackgrounds.length - 1);
    } else if (newBackgrounds.length === 0) {
        setCurrentIndex(0);
    }
  };
  
  const currentBackground = useMemo(() => {
      if (isBackgroundsLoading || backgrounds.length === 0) {
          // Provide a default fallback background if none are loaded
          return {
              url: "https://placehold.co/1920x1080.png",
              hint: "placeholder",
              path: "",
          };
      }
      return backgrounds[currentIndex];
  }, [backgrounds, currentIndex, isBackgroundsLoading]);


  const value = useMemo(() => ({
    backgrounds,
    currentBackground,
    isBackgroundsLoading,
    cycleBackground,
    updateBackground,
    deleteBackground,
  }), [backgrounds, currentBackground, isBackgroundsLoading, cycleBackground, updateBackground, deleteBackground]);

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
