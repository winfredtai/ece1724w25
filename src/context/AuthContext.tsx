// src/contexts/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

// Extended user interface with more properties
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  initials: string;
  role: string;
  createdAt: string;
  lastLogin: string;
  preferences?: {
    theme: "light" | "dark" | "system";
    notifications: boolean;
    language: string;
  };
}

// Google OAuth user information interface
export interface GoogleUserInfo {
  sub: string;
  email: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  email_verified?: boolean;
  locale?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  accessToken: string | null;
  idToken: string | null;
  refreshToken: string | null;
  tokenExpiry: number | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string) => Promise<void>;
  googleLogin: (userInfo: GoogleUserInfo) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshTokens: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [tokenExpiry, setTokenExpiry] = useState<number | null>(null);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      // This would be replaced with your actual API call
      // Simulating API response for demo
      console.log("Logging in with email:", email, "and password:", password);
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock successful login
      const mockUser: User = {
        id: "user123",
        email,
        name: email.split("@")[0],
        avatarUrl: "",
        initials: email.substring(0, 2).toUpperCase(),
        role: "user",
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        preferences: {
          theme: "system",
          notifications: true,
          language: "en",
        },
      };

      const mockAccessToken = "mock-jwt-token";
      const mockRefreshToken = "mock-refresh-token";
      const expiryTime = Date.now() + 3600 * 1000; // 1 hour from now

      // Save to state
      setUser(mockUser);
      setAccessToken(mockAccessToken);
      setRefreshToken(mockRefreshToken);
      setTokenExpiry(expiryTime);
      setIsAuthenticated(true);

      // Save to localStorage
      localStorage.setItem("user", JSON.stringify(mockUser));
      localStorage.setItem("accessToken", mockAccessToken);
      localStorage.setItem("refreshToken", mockRefreshToken);
      localStorage.setItem("tokenExpiry", expiryTime.toString());

      console.log("Logged in as", mockUser);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string): Promise<void> => {
    setIsLoading(true);
    try {
      // This would be your API call to register and send activation email
      await new Promise((resolve) => setTimeout(resolve, 800));

      console.log("Registration initiated for:", email);
      console.log("Activation email sent to:", email);

      // No automatic login after registration as user needs to activate account first
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      // This would be your API call to logout (invalidate token on server)
      await new Promise((resolve) => setTimeout(resolve, 300));

      // For Google Sign-In, you might need to revoke access
      // const isGoogleSession = !!idToken;
      // if (isGoogleSession && window.google?.accounts) {
      //   window.google.accounts.oauth2.revoke(accessToken);
      // }

      // Clear state
      setUser(null);
      setAccessToken(null);
      setIdToken(null);
      setRefreshToken(null);
      setTokenExpiry(null);
      setIsAuthenticated(false);

      // Clear storage
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("idToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("tokenExpiry");

      console.log("Logged out");
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = async (userData: Partial<User>): Promise<void> => {
    setIsLoading(true);
    try {
      // This would be your API call to update user profile
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (user) {
        const updatedUser = {
          ...user,
          ...userData,
          lastLogin: new Date().toISOString(),
        };

        // Update state
        setUser(updatedUser);

        // Update storage
        localStorage.setItem("user", JSON.stringify(updatedUser));

        console.log("Profile updated:", updatedUser);
      }
    } catch (error) {
      console.error("Profile update failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    setIsLoading(true);
    try {
      // This would be your API call to request password reset
      await new Promise((resolve) => setTimeout(resolve, 500));
      console.log("Password reset requested for:", email);
    } catch (error) {
      console.error("Password reset request failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTokens = useCallback(async (): Promise<void> => {
    try {
      // Only attempt refresh if we have a refresh token
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      // This would be your API call to refresh the tokens
      // In a real implementation, you'd send the refresh token to your backend
      // and get back new access and possibly ID tokens

      console.log("Refreshing tokens using refresh token:", refreshToken);
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock refreshed tokens
      const newAccessToken = "new-mock-jwt-token";
      const newIdToken = idToken ? "new-mock-id-token" : null; // Only refresh ID token if we had one
      const newRefreshToken = "new-mock-refresh-token"; // Some auth providers issue new refresh tokens
      const newExpiry = Date.now() + 3600 * 1000; // 1 hour from now

      // Update state
      setAccessToken(newAccessToken);
      if (newIdToken) {
        setIdToken(newIdToken);
      }
      setRefreshToken(newRefreshToken);
      setTokenExpiry(newExpiry);

      // Update storage
      localStorage.setItem("accessToken", newAccessToken);
      if (newIdToken) {
        localStorage.setItem("idToken", newIdToken);
      }
      localStorage.setItem("refreshToken", newRefreshToken);
      localStorage.setItem("tokenExpiry", newExpiry.toString());

      console.log("Tokens refreshed successfully");
    } catch (error) {
      console.error("Token refresh failed. Please login.\n", error);
      // If token refresh fails, log out the user
      await logout();
      throw error; // Re-throw to allow calling code to handle it
    }
  }, [refreshToken, idToken, logout]);

  const googleLogin = async (userInfo: GoogleUserInfo): Promise<void> => {
    setIsLoading(true);
    try {
      // 这里应该调用后端 API 进行 Google 登录验证
      // 现在我们模拟一个成功的登录
      const mockUser: User = {
        id: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name,
        avatarUrl: userInfo.picture,
        initials:
          userInfo.given_name.substring(0, 1) +
          userInfo.family_name.substring(0, 1),
        role: "user",
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        preferences: {
          theme: "system",
          notifications: true,
          language: "en",
        },
      };

      const mockAccessToken = "mock-google-jwt-token";
      const mockRefreshToken = "mock-google-refresh-token";
      const expiryTime = Date.now() + 3600 * 1000; // 1 hour from now

      // 保存到状态
      setUser(mockUser);
      setAccessToken(mockAccessToken);
      setRefreshToken(mockRefreshToken);
      setTokenExpiry(expiryTime);
      setIsAuthenticated(true);

      // 保存到 localStorage
      localStorage.setItem("user", JSON.stringify(mockUser));
      localStorage.setItem("accessToken", mockAccessToken);
      localStorage.setItem("refreshToken", mockRefreshToken);
      localStorage.setItem("tokenExpiry", expiryTime.toString());

      console.log("Google 登录成功:", mockUser);
    } catch (error) {
      console.error("Google 登录失败:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      setIsLoading(true);
      try {
        // Check localStorage or sessionStorage for tokens
        const savedAccessToken = localStorage.getItem("accessToken");
        const savedIdToken = localStorage.getItem("idToken");
        const savedRefreshToken = localStorage.getItem("refreshToken");

        if (savedAccessToken) {
          // Validate token and get user info
          // This would normally be an API call to verify the token
          const savedUser = JSON.parse(localStorage.getItem("user") || "null");
          if (savedUser) {
            setUser(savedUser);
            setAccessToken(savedAccessToken);
            if (savedIdToken) {
              setIdToken(savedIdToken);
            }
            if (savedRefreshToken) {
              setRefreshToken(savedRefreshToken);
            }
            setIsAuthenticated(true);

            // Set token expiry (example: 1 hour from now)
            const expiryTime = localStorage.getItem("tokenExpiry");
            if (expiryTime && Number(expiryTime) > Date.now()) {
              setTokenExpiry(Number(expiryTime));
            } else if (savedRefreshToken) {
              // Token expired but we have a refresh token, try to refresh
              try {
                await refreshTokens();
              } catch (refreshError) {
                console.error(
                  "Token refresh failed during init:",
                  refreshError,
                );
                await logout();
              }
            } else {
              // Token expired and no refresh token, log out
              await logout();
            }
          }
        }
      } catch (error) {
        console.error("Auth status check failed:", error);
        // Clear any invalid auth data
        await logout();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, [logout, refreshTokens]);

  // Set up token refresh interval
  useEffect(() => {
    if (!accessToken || !tokenExpiry || !refreshToken) return;

    const refreshInterval = setInterval(() => {
      // Refresh token 5 minutes before expiry
      if (tokenExpiry - Date.now() < 5 * 60 * 1000) {
        refreshTokens();
      }
    }, 60000); // Check every minute

    return () => clearInterval(refreshInterval);
  }, [accessToken, tokenExpiry, refreshToken, refreshTokens]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        accessToken,
        idToken,
        refreshToken,
        tokenExpiry,
        login,
        register,
        googleLogin,
        logout,
        updateProfile,
        resetPassword,
        refreshTokens,
      }}
    >
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
