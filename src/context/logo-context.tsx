"use client";

import React, { createContext, useContext, useState, type ReactNode, useMemo } from "react";

const initialLogo = {
  url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIwAAACMCAYAAACuwEE+AAABJUlEQVR42u3bS2nEUBiF0bswkw5eVR2sQqgC3Yk4Qoow4YVkHi+e/4J7QY4LAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMBvcj7331PI+Xw4Z+c+9Sg+t8fG+8fN+lq/VvyncoL3yQhYJkR4XisYLSso1zQy6m1/M9wghPfhM/VjZ/XJMkIWWYQQnhmY1oqG5ckywltZZKsgwsI7wwsWiYR1sgjRQlZJpPgRS7IIIfCsmbKMEEJ2WUSZEGIJUQYhE4QUaQcKYQoMQgghhBBCiCEU3o9n3G+0wU2UMIYQYghBCGGIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCHkP+Q8/gDAo+N8/H/l/4b8BgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAe/AEnrA0bgaed1gAAAABJRU5ErkJggg==",
};

interface LogoContextType {
  logo: { url: string };
  updateLogo: (newUrl: string) => void;
}

const LogoContext = createContext<LogoContextType | undefined>(undefined);

export const LogoProvider = ({ children }: { children: ReactNode }) => {
  const [logo, setLogo] = useState(initialLogo);

  const updateLogo = (newUrl: string) => {
    setLogo({ url: newUrl });
  };

  const value = useMemo(() => ({
    logo,
    updateLogo,
  }), [logo]);

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
