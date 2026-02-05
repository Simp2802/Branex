"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { User, SignupRequest, LoginRequest } from "@/types";
import * as api from "@/lib/api";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<{ success: boolean; error?: string }>;
  signup: (data: SignupRequest) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("auth_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("auth_user");
        api.clearToken();
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    try {
      if (!data.email || !data.password) {
        throw new Error("Email and password are required");
      }

      // Client-side authentication
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const idToken = await userCredential.user.getIdToken();

      // Send ID token to backend for session/profile sync
      const response = await api.login({ idToken });

      if (response.success && response.data) {
        setUser(response.data.user);
        api.setToken(response.data.token);
        localStorage.setItem("auth_user", JSON.stringify(response.data.user));
        setShowAuthModal(false);
        return { success: true };
      }

      return {
        success: false,
        error: response.error?.message || "Login failed",
      };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Login failed",
      };
    }
  }, []);

  const signup = useCallback(async (data: SignupRequest) => {
    const response = await api.signup(data);

    if (response.success && response.data) {
      setUser(response.data.user);
      api.setToken(response.data.token);
      localStorage.setItem("auth_user", JSON.stringify(response.data.user));
      setShowAuthModal(false);
      return { success: true };
    }

    return {
      success: false,
      error: response.error?.message || "Signup failed",
    };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    api.clearToken();
    localStorage.removeItem("auth_user");
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        showAuthModal,
        setShowAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
