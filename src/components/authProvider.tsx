"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";

// Define the shape of our auth context
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  loginWithGoogle: () => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  loginWithOtp: (email: string) => Promise<{ error: Error | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
  getAvatarUrl: () => string;
  getUserInitials: () => string;
  savePreviousPath: () => void;
  getPreviousPath: () => string | null;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider props interface
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  // Store the previous path for redirection after login
  const savePreviousPath = useCallback(() => {
    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname + window.location.search;
      // Don't save login/signup/auth pages as previous paths
      if (
        !currentPath.includes("/login") &&
        !currentPath.includes("/signup") &&
        !currentPath.includes("/auth/")
      ) {
        localStorage.setItem("previousPath", currentPath);
      }
    }
  }, []);

  const getPreviousPath = useCallback(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("previousPath");
    }
    return null;
  }, []);

  // Refresh auth state - can be called from any component
  const refreshAuth = useCallback(async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        setIsAuthenticated(false);
        setUser(null);
        return false;
      }

      setIsAuthenticated(true);
      setUser(data.session.user);
      return true;
    } catch {
      setIsAuthenticated(false);
      setUser(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [supabase.auth]);

  // Check auth status on mount and setup listener
  useEffect(() => {
    const checkAuth = async () => {
      await refreshAuth();
    };

    // Check immediately
    checkAuth();

    // Check for auth cookie
    const checkAuthCookie = () => {
      const cookies = document.cookie.split(";");
      const authSuccess = cookies.find((cookie) =>
        cookie.trim().startsWith("auth_success="),
      );

      if (authSuccess) {
        checkAuth();
        // Clear cookie to prevent repeated refreshes
        document.cookie =
          "auth_success=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      }
    };

    // Check cookie on page load
    checkAuthCookie();

    // Add timer to check cookie every 10 seconds to capture login state after redirect
    const cookieInterval = setInterval(checkAuthCookie, 10000);

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" && session) {
          setIsAuthenticated(true);
          setUser(session.user);
        } else if (event === "SIGNED_OUT") {
          setIsAuthenticated(false);
          setUser(null);
        }
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
      clearInterval(cookieInterval);
    };
  }, [supabase.auth, refreshAuth]);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Login with Google function
  const loginWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error("Google login error:", error);
      return { error: error as Error };
    }
  };

  // Login with OTP function
  const loginWithOtp = async (email: string) => {
    try {
      // Save current path for redirection after login
      savePreviousPath();

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      });

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Verify OTP function
  const verifyOtp = async (email: string, token: string) => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "email",
      });

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Sign up function
  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Logout function
  const logout = async () => {
    await supabase.auth.signOut();
  };

  // Get user display information
  const getUserInitials = () => {
    if (user?.user_metadata?.full_name) {
      const nameParts = user.user_metadata.full_name.split(" ");
      if (nameParts.length >= 2) {
        return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
      }
      return user.user_metadata.full_name.substring(0, 2).toUpperCase();
    }

    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }

    return "?";
  };

  const getAvatarUrl = () => {
    if (user?.user_metadata?.avatar_url) {
      return user.user_metadata.avatar_url;
    }

    if (user?.user_metadata?.picture) {
      return user.user_metadata.picture;
    }

    return "";
  };

  // Provide the auth context value
  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    loginWithGoogle,
    signUp,
    loginWithOtp,
    verifyOtp,
    logout,
    refreshAuth,
    getAvatarUrl,
    getUserInitials,
    savePreviousPath,
    getPreviousPath,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
