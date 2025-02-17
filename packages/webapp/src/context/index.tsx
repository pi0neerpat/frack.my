"use client";

import { wagmiAdapter, projectId, networks } from "@/config";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { type ReactNode } from "react";
import { cookieToInitialState, WagmiProvider, type Config } from "wagmi";
import { hashFn } from "wagmi/query";
import { createAppKit } from "@reown/appkit/react";

// Set up queryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryKeyHashFn: hashFn,
    },
    mutations: {
      onError: (error) => {
        console.error(error);
      },
    },
  },
});

if (!projectId) {
  throw new Error("Project ID is not defined");
}

// Create the modal
createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  defaultNetwork: networks[0],
  networks: [...networks],
  features: {
    analytics: false,
  },
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "#004cfe",
    "--w3m-border-radius-master": "8px",
    "--w3m-font-family":
      "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif",
  },
});

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
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
