# Demo Project

## Project Overview

You are building a web3 platform that allows :

- Community Owner to create Superfluid Pools and distribute rewards to their community.
- Community Member to collect units from a Superfluid Pool and claim rewards.

The team already build the smart contracts and you will be building the webapp.
You will be using NextJS, shadcn, tailwindcss.
For Web3 interactions, you will be using wagmi, viem, and reown web3 libraries.

## Core Features

### 1. Landing Page

- This landing page should be available in the `/` page.
- It shall display two cards :
  - A card that target Community owner, describing the benefits of using the platform and with a call to actions that bring them to the `/pools` page.
  - A card that target Community member, describing the benefits of using the platform and with a call to actions that bring them to the `/rewards` page.

### 2. For Community Owner

#### 2.1 Create a pool

- This feature should be available in the `/pools` page.
- The page should have a form that allows the user to deploy a new pool by calling the function `createPool` in the `DemoGDA` contract.
- You shall refer to `packages/contracts/src/DemoGDA.sol` for the function signature.

#### 2.2 Fund a pool

- This feature should be available in the `/pools` page.
- There are two ways to fund an pool :

  - One-off payment (airdrop) - this is achieved by calling the function `airdropDistribution` in the `DemoGDA` contract.
  - Streamed payment (reward stream) - this is achieved by calling the function `startDistribution` in the `DemoGDA` contract.

- when funding a pool, an ERC20 token approval is required - this will be achieve prior to calling the `airdropDistribution` or `startDistribution` function.
- current ERC20 token allowance will be displayed in the UI and prompt the user to approve the token if the amount is not enough.
- You shall refer to `packages/contracts/src/DemoGDA.sol` for the function signature.

### 3. Community Member

- This feature should be available in the `/rewards` page.

#### 3.1 List of Pools

- The `/rewards` page should have a list of all the pools are available to subscribe to.
- The different pools should be cards displayed in a table with the following data displayed :
  - the amount of units that the connected user owns
  - the reward token refer to `SUPER_TOKEN_ADDRESS` located in `webapp/src/config/contracts.ts`.
  - the current flow rate of the pool

#### 3.2 Subscribe to a Pool

- In each Pool card, there should be a button that allows the user to collect units from the pool.
- In each Pool card, there should be a button that allows the user to decrease units from the pool.

## File Structure

The project is structured as a monorepo with the following packages:

```
poc-demo
└── packages
    ├── contracts
    └── webapp
```

- `contracts`: The smart contracts that power the platform.
- `webapp`: The web application that allows users to subscribe to protocols and earn incentives.

### contracts structure :

You may have to refer to the contracts in the `contracts` package but you will not be modifying them.
The contracts file structure is as follow :

```
contracts
├── README.md
├── cache
│   └── solidity-files-cache.json
├── foundry.toml
├── lib
│   ├── forge-std
│   ├── openzeppelin-contracts-v4
│   ├── openzeppelin-contracts-v5
│   └── superfluid-protocol
├── remappings.txt
├── script
│   └── Deploy.s.sol
├── src
│   └── DemoGDA.sol
└── test
```

### webapp structure :

This is the webapp file structure that you will be working on :

```
webapp
├── README.md
├── components.json
├── next.config.js
├── package.json
├── postcss.config.js
├── src
│   ├── app
│   ├── components
│   ├── config
│   ├── context
│   ├── hooks
│   └── lib
├── tailwind.config.js
└── tsconfig.json
```

The file `webapp/src/config/contracts.ts` contains the deployed contract addresses and ABIs that the app will interact with.
You will not be modifying this file, unless you are adding new contracts needed for the webapp.

When you interact with `DemoGDA` contract, you will be referencing the `DEMO_GDA_ABI` and `DEMO_GDA_ADDRESS` variables located in the `webapp/src/config/contracts.ts` file.

## Tech Stack

This is the tech stack you will be using :

- React
- TailwindCSS
- Next.js
- TypeScript
- Solidity
- UniswapV4
- W3M
- Wagmi
- Viem
- RainbowKit
- Shadcn/UI