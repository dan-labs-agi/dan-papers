import React, { createContext, useContext } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";

export interface User {
  id: string;
  userId: string;
  name: string;
  email?: string;
  image?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
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
  const { signIn: convexSignIn, signOut: convexSignOut } = useAuthActions();
  const viewer = useQuery(api["functions/users"].viewer);
  
  const isLoading = viewer === undefined;
  
  const user: User | null = viewer
    ? {
        id: viewer.userId,
        userId: viewer.userId,
        name: viewer.name || "User",
        email: viewer.email,
        image: viewer.image,
      }
    : null;

  const handleSignIn = async () => {
    try {
      // Redirect back to the exact page/route where the user clicked Connect.
      await convexSignIn("github", { redirectTo: window.location.href });
    } catch (error) {
      console.error("Error signing in:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await convexSignOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
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
