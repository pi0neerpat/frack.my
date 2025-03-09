import { Address } from "viem";

export const GDAv1ForwarderAddress =
  "0x6DA13Bde224A05a288748d857b9e7DDEffd1dE08" as const;

export const GDAv1ForwarderABI = [
  {
    inputs: [
      {
        internalType: "contract ISuperfluid",
        name: "host",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "contract ISuperToken",
        name: "token",
        type: "address",
      },
      {
        internalType: "address",
        name: "pool",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "userData",
        type: "bytes",
      },
    ],
    name: "connectPool",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export type GDAv1ForwarderContract = {
  address: Address;
  abi: typeof GDAv1ForwarderABI;
};

export const gdav1Forwarder: GDAv1ForwarderContract = {
  address: GDAv1ForwarderAddress,
  abi: GDAv1ForwarderABI,
};
