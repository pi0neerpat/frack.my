import { cookieStorage, createStorage, http } from "wagmi";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { base, baseSepolia, sepolia } from "@reown/appkit/networks";
import { Chain } from "viem";

import dotenv from "dotenv";
dotenv.config();

// Define Anvil local network
export const anvilLocal: Chain = {
  id: 84531,
  name: "Anvil - Local",
  nativeCurrency: {
    decimals: 18,
    name: "Ethereum",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["http://127.0.0.1:8545"],
    },
    public: {
      http: ["http://127.0.0.1:8545"],
    },
  },
};

// Get projectId from https://cloud.reown.com
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

if (!projectId) {
  throw new Error("Project ID is not defined");
}

// Include anvilLocal in the networks array
export const networks = [base, baseSepolia, anvilLocal] as const;

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
    [anvilLocal.id]: http("http://127.0.0.1:8545"),
  },
  multiInjectedProviderDiscovery: true,
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
