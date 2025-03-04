"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAccount, useDisconnect } from "wagmi";

// @dev AuthContext provides authentication state and functions across the app.
const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const { address, isConnected, isConnecting } = useAccount();
  const { disconnect } = useDisconnect();

  /**
   * @dev Tracks the authentication state based on the wallet connection status.
   * Ensures the component waits for Wagmi's initialization before setting the state.
   */
  useEffect(() => {
    if (isConnecting) {
      setIsLoading(true);
      return;
    }
    setIsLoading(false);
  }, [isConnecting, isConnected]);

  /**
   * @dev Disconnects the wallet.
   */
  const logout = async () => {
    try {
      disconnect();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  /**
   * @dev Auth context value containing authentication state and functions.
   */
  const value = {
    user: isConnected ? { address } : null,
    isLoading: isLoading || isConnecting,
    isAuthenticated: isConnected,
    logout,
    walletAddress: address,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * @dev Custom hook to access authentication context.
 * @returns {object} Auth context with authentication state and functions.
 * @throws Error if used outside an AuthProvider.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
