# Demo Project - Web3 Superfluid Platform

## Project Overview

You are building a web3 platform that allows:

- Community Owner to create Superfluid Pools and distribute rewards to their community.
- Community Member to collect units from a Superfluid Pool and claim rewards.

The team has already built the smart contracts, and you will be building the webapp using NextJS, shadcn, tailwindcss. For Web3 interactions, you will be using wagmi, viem, and reown web3 libraries.

## Technical Architecture

### File Structure

```
webapp/src/
├── app/
│   ├── page.tsx               # Landing page (/)
│   ├── pools/
│   │   └── page.tsx           # Community Owner page (/pools)
│   ├── rewards/
│   │   └── page.tsx           # Community Member page (/rewards)
│   └── layout.tsx             # Root layout with providers
├── components/
│   ├── LandingCard.tsx        # Cards for landing page
│   ├── PoolForm.tsx           # Form to create a pool
│   ├── PoolFunding.tsx        # Component for funding pools
│   ├── PoolList.tsx           # List of pools (used in rewards page)
│   └── PoolCard.tsx           # Individual pool card with subscribe buttons
├── hooks/
│   ├── usePoolData.ts         # Hook to fetch pool data 
│   ├── useCreatePool.ts       # Hook for pool creation
│   ├── useFundPool.ts         # Hook for funding pools
│   └── useManageUnits.ts      # Hook for collecting/decreasing units
├── context/
│   └── index.tsx              # Existing Web3 context provider
└── config/
    ├── contracts.ts           # Existing file with contract info
    └── index.ts               # Web3 configuration (wagmiAdapter, projectId, networks)
```

## Core Features - Implementation Details

### 1. Landing Page

- **Location**: `src/app/page.tsx`
- **Components**: `LandingCard.tsx`
- **Implementation Details**:
  - Create a responsive layout with two cards side by side on desktop and stacked on mobile
  - Each card should have a distinct visual style to differentiate target audiences
  - Community Owner card should highlight pool creation and management features
  - Community Member card should emphasize rewards and unit collection benefits
  - Use compelling imagery and concise copy to communicate value proposition
  - Implement animated CTAs that direct users to the appropriate sections

### 2. For Community Owner

#### 2.1 Create a Pool

- **Location**: `src/app/pools/page.tsx`, `src/components/PoolForm.tsx`, `src/hooks/useCreatePool.ts`
- **Implementation Details**:
  - `PoolForm.tsx` should have form validation for all inputs
  - Implement wallet connection status checking before form submission
  - Display transaction status (pending, success, error) with appropriate user feedback
  - Show estimated gas fees before confirmation
  - Implement the form using shadcn/ui components for consistent styling
  - The form should include tooltips explaining technical parameters

#### 2.2 Fund a Pool

- **Location**: `src/app/pools/page.tsx`, `src/components/PoolFunding.tsx`, `src/hooks/useFundPool.ts`
- **Implementation Details**:
  - Create a unified interface for both funding methods with a tab/toggle to switch between one-off (airdrop) and streaming payments
  - For token approval:
    - Display current allowance prominently
    - Implement a "one-click approve" flow that handles both approval and deposit in sequence
    - Show approval status with a progress indicator
  - For funding:
    - Display a confirmation modal with transaction details
    - Show real-time token balance and funding amount
    - Include a transaction summary before confirmation
  - Implement error handling for rejected transactions, insufficient funds, etc.

### 3. Community Member Features

#### 3.1 List of Pools

- **Location**: `src/app/rewards/page.tsx`, `src/components/PoolList.tsx`, `src/components/PoolCard.tsx`
- **Implementation Details**:
  - `PoolList.tsx` should fetch all available pools using `usePoolData.ts` hook
  - Implement sorting options (by reward rate, token type, user units)
  - Add search/filter functionality to find specific pools
  - Implement pagination or infinite scroll for large numbers of pools
  - Each pool card should display:
    - Pool name and description
    - Current reward token with icon
    - Flow rate displayed in tokens/day format
    - User's current units owned with percentage of total pool
    - Visual indicator of pool activity (active, paused, etc.)

#### 3.2 Subscribe to a Pool

- **Location**: `src/components/PoolCard.tsx`, `src/hooks/useManageUnits.ts`
- **Implementation Details**:
  - Each card should have two clearly labeled buttons:
    - "Collect Units" - for increasing units
    - "Decrease Units" - for reducing units
  - Implement a modal for each action that:
    - Shows current units owned
    - Allows user to input desired units to collect/decrease
    - Displays estimated impact on rewards
    - Shows transaction details before confirmation
  - Provide real-time feedback during transaction processing
  - Update UI immediately after successful transactions
  - Handle errors gracefully with user-friendly messages

## Data Models

### Pool Data Structure

```typescript
interface Pool {
  id: string;              // Pool unique identifier
  owner: string;           // Creator's address
  rewardToken: string;     // Token address
  rewardTokenSymbol: string; // Token symbol
  rewardTokenDecimals: number; // Token decimals
  totalUnits: bigint;      // Total units in pool
  flowRate: bigint;        // Current flow rate
  lastUpdated: number;     // Timestamp of last update
  isActive: boolean;       // Whether the pool is active
}

interface UserPoolData {
  poolId: string;          // Pool identifier
  userUnits: bigint;       // User's units in pool
  userShare: number;       // Percentage of total pool
  claimableRewards: bigint; // Unclaimed rewards
}
```

## Technical Requirements

### Web3 Integration

- Leverage the existing Web3 context provider in `context/index.tsx`
- Use Wagmi hooks for all contract interactions
- Implement proper error handling for all blockchain interactions
- Support multiple networks (mainnet, testnet)
- Cache contract data where appropriate to minimize RPC calls

### UI/UX Requirements

- Mobile-responsive design for all pages
- Loading states for all async operations
- Clear error messages for failed transactions
- Consistent styling using shadcn/ui components
- Dark/light mode support
- Accessibility compliance (WCAG standards)

### Performance Considerations

- Optimize rendering with React.memo where appropriate
- Implement data caching for blockchain calls
- Use React Query for data fetching (already integrated in the Web3 provider)
- Lazy load components for better initial load time

## Testing Requirements

- Unit tests for all hooks
- Component tests for form validation
- Integration tests for end-to-end user flows
- Test on multiple browsers and devices

## Deployment and Configuration

- Support for multiple environments (dev, staging, production)
- Environment-specific contract addresses
- Feature flags for gradual rollout

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

### contracts structure:

You may have to refer to the contracts in the `contracts` package but you will not be modifying them.
The contracts file structure is as follows:

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

### webapp structure:

This is the webapp file structure that you will be working on:

```
webapp
├── README.md
├── components.json
├── next.config.js
├── package.json
├── postcss.config.js
├── src
│   ├── app
│   │   ├── page.tsx               # Landing page (/)
│   │   ├── pools/
│   │   │   └── page.tsx           # Community Owner page (/pools)
│   │   ├── rewards/
│   │   │   └── page.tsx           # Community Member page (/rewards)
│   │   └── layout.tsx             # Root layout with providers
│   ├── components
│   │   ├── LandingCard.tsx        # Cards for landing page
│   │   ├── PoolForm.tsx           # Form to create a pool
│   │   ├── PoolFunding.tsx        # Component for funding pools
│   │   ├── PoolList.tsx           # List of pools (used in rewards page)
│   │   ├── PoolCard.tsx           # Individual pool card with subscribe buttons
│   │   └── ui/                    # shadcn UI components
│   ├── hooks
│   │   ├── usePoolData.ts         # Hook to fetch pool data 
│   │   ├── useCreatePool.ts       # Hook for pool creation
│   │   ├── useFundPool.ts         # Hook for funding pools
│   │   └── useManageUnits.ts      # Hook for collecting/decreasing units
│   ├── context
│   │   └── index.tsx              # Existing Web3 context provider
│   ├── config
│   │   ├── contracts.ts           # Existing file with contract info
│   │   └── index.ts               # Web3 configuration 
│   └── lib
├── tailwind.config.js
└── tsconfig.json
```

The file `webapp/src/config/contracts.ts` contains the deployed contract addresses and ABIs that the app will interact with. You will not be modifying this file, unless you are adding new contracts needed for the webapp.

When you interact with `DemoGDA` contract, you will be referencing the `DEMO_GDA_ABI` and `DEMO_GDA_ADDRESS` variables located in the `webapp/src/config/contracts.ts` file.

## Tech Stack

This is the tech stack you will be using:

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
