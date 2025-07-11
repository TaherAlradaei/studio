
"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

// Local User type definition
export interface User {
    uid: string;
    displayName: string | null;
    phone: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (userData: Omit<User, 'uid'>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GUEST_USER_ID = 'guest-user-session';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        localStorage.removeItem('user');
    }
    setIsLoading(false);
  }, []);

  const login = (userData: Omit<User, 'uid'>) => {
      const newUser = {
          uid: `user-${Date.now()}`,
          ...userData,
      };
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
  };

  const logout = () => {
      localStorage.removeItem('user');
      setUser(null);
      // Optional: redirect to home or login page after logout
      // window.location.href = '/login'; 
  };


  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
