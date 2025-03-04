"use client";

import { useAuth } from "@/context/auth-context";
import Loading from "@/components/loading";
import ConnectWallet from "@/components/connect-wallet";

/**
 * @dev Wrapper component that conditionally renders content based on authentication state.
 */
export default function AuthWrapper({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return <ConnectWallet />;
  }

  // Show the app content if authenticated
  return children;
}
