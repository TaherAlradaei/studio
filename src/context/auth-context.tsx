"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

// Local User type definition
export interface User {
    uid: string;
    email: string | null;
    emailVerified: boolean;
    displayName: string | null;
    isAnonymous: boolean;
    photoURL: string | null;
    providerData: any[]; // Using any for simplicity as it's a mock
    getIdToken: () => Promise<string>;
    getIdTokenResult: () => Promise<any>;
    reload: () => Promise<void>;
    delete: () => Promise<void>;
    toJSON: () => object;
    providerId: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
}

// Create a mock user object to represent a guest session.
const guestUser: User = {
    uid: 'guest-user-001',
    email: null,
    emailVerified: false,
    displayName: 'Guest',
    isAnonymous: true,
    photoURL: null,
    providerData: [],
    getIdToken: async () => 'mock-guest-token',
    getIdTokenResult: async () => ({ token: 'mock-guest-token', claims: {}, authTime: '', issuedAtTime: '', signInProvider: null, signInSecondFactor: null, expirationTime: '' }),
    reload: async () => {},
    delete: async () => {},
    toJSON: () => ({}),
    providerId: 'guest'
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Automatically set the guest user.
    setUser(guestUser);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
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
