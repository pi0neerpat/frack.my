"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode } from "react";
import { WagmiProvider, type Config, cookieToInitialState } from "wagmi";
import { hashFn } from "wagmi/query";
import { createAppKit } from "@reown/appkit/react";
import { wagmiAdapter, projectId, networks } from "@/config";
import { Web3Context } from "./web3Context";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useChainId,
  useSwitchChain,
} from "wagmi";
import { injected } from "wagmi/connectors";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryKeyHashFn: hashFn,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 3,
    },
  },
});

// Initialize AppKit
createAppKit({
  adapters: [wagmiAdapter],
  projectId: projectId!,
  defaultNetwork: networks[0],
  networks: [...networks],
  features: {
    analytics: false,
  },
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "#004cfe",
    "--w3m-border-radius-master": "8px",
  },
});

function Web3Provider({ children }: { children: ReactNode }) {
  const account = useAccount();
  const chainId = useChainId();
  const { connectAsync } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const { switchChainAsync, error: switchError } = useSwitchChain();

  const value = {
    address: account?.address,
    isConnected: account?.isConnected ?? false,
    isConnecting: account?.isConnecting ?? false,
    chainId,
    connect: () => connectAsync({ connector: injected() }),
    disconnect: () => disconnectAsync(),
    switchChain: (chainId: number) => switchChainAsync({ chainId }),
    error: switchError ? (switchError as Error) : undefined,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

export default function ContextProvider({
  children,
  cookies,
}: {
  children: ReactNode;
  cookies: string | null;
}) {
  const initialState = cookieToInitialState(
    wagmiAdapter.wagmiConfig as Config,
    cookies
  );

  return (
    <WagmiProvider
      config={wagmiAdapter.wagmiConfig as Config}
      initialState={initialState}
      reconnectOnMount={true}
    >
      <QueryClientProvider client={queryClient}>
        <Web3Provider>{children}</Web3Provider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export { useWeb3 } from "./web3Context";
