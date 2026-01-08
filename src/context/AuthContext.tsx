import React, { createContext, useContext, useState, useEffect } from "react";
import { useMutation } from "../lib/api";

interface User {
  _id: string;
  _creationTime: number;
  userId: string;
  name: string;
  email?: string;
  image: string;
  createdAt: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const signIn = useMutation("signIn" as any);
  const signOut = useMutation("signOut" as any);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const identity = await fetch("/api/auth/identity", {
          method: "GET",
          credentials: "include",
        });
        if (identity.ok) {
          const userData = await identity.json();
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleSignIn = async () => {
    await signIn({ provider: "github" } as any);
  };

  const handleSignOut = async () => {
    await signOut({} as any);
    setUser(null);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn: handleSignIn,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
