
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
  adminAccessCode: string;
  isAdminAccessCode: (code: string) => boolean;
  updateAdminAccessCode: (newCode: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GUEST_USER_ID = 'guest-user-session';
const ADMIN_CODE_STORAGE_KEY = 'admin_access_code';
const DEFAULT_ADMIN_CODE = 'almaidan';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [adminAccessCode, setAdminAccessCode] = useState(DEFAULT_ADMIN_CODE);

  useEffect(() => {
    try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        const storedAdminCode = localStorage.getItem(ADMIN_CODE_STORAGE_KEY);
        if (storedAdminCode) {
            setAdminAccessCode(storedAdminCode);
        }
    } catch (error) {
        console.error("Failed to parse data from localStorage", error);
        localStorage.removeItem('user');
        localStorage.removeItem(ADMIN_CODE_STORAGE_KEY);
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
  };

  const isAdminAccessCode = (code: string) => {
    return code === adminAccessCode;
  };

  const updateAdminAccessCode = (newCode: string) => {
    localStorage.setItem(ADMIN_CODE_STORAGE_KEY, newCode);
    setAdminAccessCode(newCode);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, setAdminStatus, adminAccessCode, isAdminAccessCode, updateAdminAccessCode }}>
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
