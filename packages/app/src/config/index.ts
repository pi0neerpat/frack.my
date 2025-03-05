import { cookieStorage, createStorage, http } from "wagmi";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { base, baseSepolia, sepolia } from "@reown/appkit/networks";

import dotenv from "dotenv";
dotenv.config();

// Get projectId from https://cloud.reown.com
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

if (!projectId) {
  throw new Error("Project ID is not defined");
}

export const networks = [sepolia, base, baseSepolia] as const;

// Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId,
  networks: [...networks],
  batch: {
    multicall: {
      wait: 50,
    },
  },
  transports: {
    [sepolia.id]: http("https://rpc-endpoints.superfluid.dev/eth-sepolia"),
    [base.id]: http("https://rpc-endpoints.superfluid.dev/base-mainnet"),
    [baseSepolia.id]: http("https://rpc-endpoints.superfluid.dev/base-sepolia"),
  },
  multiInjectedProviderDiscovery: true,
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
