
"use client";

import React, { createContext, useContext, useState, type ReactNode, useMemo, useEffect } from "react";
import { getLogo, updateLogo as updateLogoAction } from "@/app/(main)/admin/actions";
import { useToast } from "@/hooks/use-toast";

interface LogoContextType {
  logo: { url: string, path?: string };
  isLogoLoading: boolean;
  updateLogo: (newUrl: string, newPath: string) => Promise<void>;
}

const LogoContext = createContext<LogoContextType | undefined>(undefined);

export const LogoProvider = ({ children }: { children: ReactNode }) => {
  const [logo, setLogo] = useState<{ url: string, path?: string }>({ url: "" });
  const [isLogoLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        setIsLoading(true);
        const fetchedLogo = await getLogo();
        setLogo(fetchedLogo);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load logo.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogo();
  }, [toast]);

  const updateLogo = async (newUrl: string, newPath: string) => {
    try {
      await updateLogoAction(newUrl, newPath);
      setLogo({ url: newUrl, path: newPath }); // Update state after successful db update
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update logo.",
        variant: "destructive",
      });
    }
  };

  const value = useMemo(() => ({
    logo,
    isLogoLoading,
    updateLogo,
  }), [logo, isLogoLoading]);

  return (
    <LogoContext.Provider value={value}>
      {children}
    </LogoContext.Provider>
  );
};

export const useLogo = () => {
  const context = useContext(LogoContext);
  if (context === undefined) {
    throw new Error("useLogo must be used within a LogoProvider");
  }
  return context;
};
