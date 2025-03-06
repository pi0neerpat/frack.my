export interface Fluid {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  apy: number;
  activeDrills: number;
  globalFlowRate: number;
  totalDeposited: {
    amount: number;
    usdValue: number;
  };
  strategy: {
    name: string;
    icon: string;
    url: string;
  };
  address: `0x${string}`;
}

export const FLUIDS: Fluid[] = [
  {
    id: "eth",
    name: "Ethereum",
    symbol: "ETH",
    icon: "/icons/eth.svg",
    apy: 4.85,
    activeDrills: 1247,
    globalFlowRate: 158.32,
    totalDeposited: {
      amount: 156432.45,
      usdValue: 485738921.34,
    },
    strategy: {
      name: "Lido",
      icon: "/icons/lido.svg",
      url: "https://lido.fi",
    },
    address: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
  },
  {
    id: "wsteth",
    name: "Wrapped Staked Ethereum",
    symbol: "wstETH",
    icon: "/icons/wsteth.svg",
    apy: 5.12,
    activeDrills: 892,
    globalFlowRate: 142.67,
    totalDeposited: {
      amount: 98654.32,
      usdValue: 306828765.23,
    },
    strategy: {
      name: "Lido",
      icon: "/icons/lido.svg",
      url: "https://lido.fi",
    },
    address: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0",
  },
  {
    id: "reth",
    name: "Rocket Pool ETH",
    symbol: "rETH",
    icon: "/icons/reth.svg",
    apy: 4.92,
    activeDrills: 645,
    globalFlowRate: 98.45,
    totalDeposited: {
      amount: 45678.91,
      usdValue: 142056789.12,
    },
    strategy: {
      name: "Rocket Pool",
      icon: "/icons/rocketpool.svg",
      url: "https://rocketpool.net",
    },
    address: "0xae78736Cd615f374D3085123A210448E74Fc6393",
  },
  {
    id: "btc",
    name: "Bitcoin",
    symbol: "BTC",
    icon: "/icons/btc.svg",
    apy: 3.85,
    activeDrills: 423,
    globalFlowRate: 76.21,
    totalDeposited: {
      amount: 2345.67,
      usdValue: 98765432.1,
    },
    strategy: {
      name: "Base Bridge",
      icon: "/icons/base.svg",
      url: "https://bridge.base.org",
    },
    address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
  },
];

export const findFluidById = (id: string): Fluid | undefined => {
  return FLUIDS.find((fluid) => fluid.id === id);
};

export const sortFluids = (
  fluids: Fluid[],
  sortBy: keyof Fluid,
  ascending: boolean = true
): Fluid[] => {
  return [...fluids].sort((a, b) => {
    const valA = a[sortBy];
    const valB = b[sortBy];
    const sortOrder = ascending ? 1 : -1;

    return valA < valB ? -1 * sortOrder : valA > valB ? 1 * sortOrder : 0;
  });
};

export const filterFluidsByProtocol = (
  fluids: Fluid[],
  protocolName: string
): Fluid[] => {
  if (!protocolName) return fluids;
  return fluids.filter(
    (fluid) => fluid.strategy.name.toLowerCase() === protocolName.toLowerCase()
  );
};
