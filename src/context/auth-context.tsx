
"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

// Local User type definition
export interface User {
    uid: string;
    displayName: string | null;
    phone: string | null;
    isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (userData: Omit<User, 'uid'>, isAdmin?: boolean) => void;
  logout: () => void;
  setAdminStatus: (isAdmin: boolean) => void;
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

  const login = (userData: Omit<User, 'uid'>, isAdmin = false) => {
      const newUser: User = {
          uid: `user-${Date.now()}`,
          ...userData,
          isAdmin,
      };
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
  };
  
  const setAdminStatus = (isAdmin: boolean) => {
    setUser(currentUser => {
        if (!currentUser) return null;
        const updatedUser = { ...currentUser, isAdmin };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return updatedUser;
    });
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
    <AuthContext.Provider value={{ user, isLoading, login, logout, setAdminStatus }}>
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
