"use client";
import React, { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { IncoEnv } from "@/lib/inco-lite";

interface ContractData {
  encryptedERC20: {
    address: string;
    abi: any;
  };
  erc20: {
    address: string;
    abi: any;
  };
  incoEnv: IncoEnv;
  REOWN_APP_ID: string;
}

interface ContractContextType {
  contracts: ContractData | undefined;
  isLoading: boolean;
  isError: boolean;
}

const ContractContext = createContext<ContractContextType | undefined>(
  undefined
);

export const ContractProvider = ({ children }: { children: ReactNode }) => {
  const { data, isLoading, isError } = useQuery<ContractData>({
    queryKey: ["contracts"],
    queryFn: async () => {
      const res = await fetch("/api/contracts");
      if (!res.ok) throw new Error("Failed to fetch contract data");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
       <Loader2
       className="w-10 h-10 animate-spin text-primary"
       />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="w-full h-screen flex items-center bg-background justify-center text-red-500">
        Failed to load.
      </div>
    );
  }

  return (
    <ContractContext.Provider value={{ contracts: data, isLoading, isError }}>
      {children}
    </ContractContext.Provider>
  );
};

export const useContracts = () => {
  const context = useContext(ContractContext);
  if (!context) {
    throw new Error("useContracts must be used within a ContractProvider");
  }
  return context;
};
