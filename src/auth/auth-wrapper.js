"use client";

import { useAuth } from "@/context/auth-context";
import Loading from "@/components/loading";
import ConnectWallet from "@/components/connect-wallet";
import { Loader2 } from "lucide-react";

/**
 * @dev Wrapper component that conditionally renders content based on authentication state.
 */
export default function AuthWrapper({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <ConnectWallet />;
  }

  // Show the app content if authenticated
  return children;
}
