"use client";

import { createContext, useContext } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useChainId,
  useSwitchChain,
} from "wagmi";
import { injected } from "wagmi/connectors";

interface Web3ContextType {
  address?: `0x${string}`;
  isConnected: boolean;
  isConnecting: boolean;
  chainId?: number;
  connect: () => void;
  disconnect: () => void;
  switchChain: (chainId: number) => void;
  error?: Error;
}

export const Web3Context = createContext<Web3ContextType>(
  {} as Web3ContextType
);

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
}
