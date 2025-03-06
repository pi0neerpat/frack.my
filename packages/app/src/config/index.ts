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

export const networks = [base, baseSepolia] as const;

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
    [base.id]: http("https://base-mainnet.rpc.x.superfluid.dev/"),
    [baseSepolia.id]: http("http://127.0.0.1:8545"),
  },
  multiInjectedProviderDiscovery: true,
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
