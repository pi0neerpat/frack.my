## Project Overview - Frack.My

You are building a web3 platform that allows:

- Depositing assets and earning yield
- Automatically streaming the yield back to your wallet as USDC using Superfluid

The team has already built the smart contracts, and you will be building the webapp using NextJS, shadcn, tailwindcss. For Web3 interactions, you will be using wagmi, viem, and reown web3 libraries.

## Core Features

### 1. Landing Page

- This landing page should be available in the `/` page.
- The heading should be centered, with the text: "Frack My ____". The underlined portion should slowly switch between different assets: [ETH, WSTETH, RETH, BTC] 
- The main content should be a carousel of cards:
  - The horizontal carousel always has an "Add Drill" card with a "+" icon to indicate a new drill can be created.
  - Initially, no drills cards are shown. Later, after the user creates them, they will populate the carousel.
- Below the carousel, there is a pool of purple oil collecting:
  - It takes up the bottom of the screen.
  - It is animated to slowly move around like gentle sloshing motion
  - It displays the user's current balance of USDC "Earned so far"
  - It displays secondary text with the user's flow rate in USDC per month.

### 2. Create a new Drill

#### 2.1 List of fracking fluid

- The `/fluids` page should display a list of fluids available to build a drill.
- The user is be prompted to create a new Drill, and must choose a specific deposit asset, called the "fracking fluid"
- Each row displays properties such as the asset (fluid) name, the yield rate, the global drills, the global flow rate, and the source of oil (web3 protocol).
- The available fracking fluids are displayed using a list in `packages/app/src/config/assets.ts`.

#### 2.2 Deposit assets

- This feature should be available in the `/fluids/<asset-type>` page. Where `<asset-type>` is the asset the user selected from the previous page.
- The page should have a form that allows the user to build a new drill, with the specified fluid, by calling the function `deposit` in the `Fracking` contract.
- The asset type will be pre-selected as the current "fluid".
- You shall refer to `packages/app/src/config/contracts.ts` for the function signature.
- When creating a new drill, an ERC20 token approval is required - this will be performed prior to calling the `deposit`function.
- Current ERC20 token allowance will be displayed in the UI and prompt the user to approve the token if the amount is not enough.
- You shall refer to `packages/app/src/config/contracts.ts` for the function signature.
- a fun gif will be displayed next to the form that shows a oil drill
- When a new drill is created, an animation is played an the user is returned to the landing page which shows their new drill

### 3 Withdraw

- On each active drill card, there is a "Shutdown" button, which allows the user to call `withdraw` for that asset type.
- You shall refer to `packages/app/src/config/contracts.ts` for the function signature.

## File Structure

The project is structured as a monorepo with the following packages:

```
frack.my
└── packages
    ├── contracts
    └── app
```

- `contracts`: The smart contracts that power the platform.
- `app`: The web application that allows users to subscribe to protocols and earn incentives.

### webapp structure :

This is the webapp file structure that you will be working on :

```filetree
frack-my/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page with carousel and oil pool
│   │   ├── fluids/
│   │   │   ├── page.tsx          # List of available fracking fluids
│   │   │   └── [asset]/
│   │   │       └── page.tsx      # Deposit form for specific asset
│   │   └── layout.tsx            # Root layout with navigation and theme
│   ├── components/
│   │   ├── carousel/
│   │   │   ├── drill-card.tsx    # Card showing active drill info
│   │   │   └── new-drill-card.tsx # "+" card to create new drill
│   │   ├── fluid-list.tsx        # Table of available fracking fluids
│   │   ├── oil-pool.tsx          # Animated oil pool showing earnings
│   │   ├── theme-toggle.tsx      # Dark/light mode switch
│   │   └── ui/                   # Shared UI components
│   │       └── index.tsx
│   ├── config/
│   │   ├── assets.ts             # List of supported assets
│   │   └── contracts.ts          # Contract addresses and ABIs
│   ├── context/
│   │   └── theme-provider.tsx    # Theme context wrapper
│   └── hooks/
│       ├── use-drills.ts         # Hook for drill operations
│       └── use-web3.ts           # Web3 connection hooks
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## Key Files and Their Purposes

1. **Landing Page (`app/page.tsx`)**
   - Animated heading with rotating asset names
   - Carousel of drill cards
   - Animated oil pool showing earnings

2. **Fluid Pages**
   - List view (`app/fluids/page.tsx`)
   - Individual asset deposit page (`app/fluids/[asset]/page.tsx`)

3. **Components**
   - Reusable UI components organized by feature
   - Shared components in `components/ui`

4. **Configuration**
   - Asset configurations in `config/assets.ts`
   - Contract interactions in `config/contracts.ts`

5. **Hooks**
   - Custom hooks for Web3 functionality
   - Drill management operations

The file `webapp/src/config/contracts.ts` contains the deployed contract addresses and ABIs that the app will interact with.
You will not be modifying this file, unless you are adding new contracts needed for the webapp.

When you interact with `Facking` contract, you will be referencing the `FRACKING_ABI` and `FRACKING_ADDRESS` variables located in the `webapp/src/config/contracts.ts` file.

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
- barba.js

## UI features

- Page transitions should be performed using `barba.js`
- The user should be able to change from dark/light themes
- The overall look and feel of the app is a gamified DeFi app.
- It should feel like the game cookie-clicker, where I try to maximize my output, by building more Drills.
- The dark theme involves oil, drilling, fracking fluids, and oil storage pools.
- The light theme we will not implement yet. It will involve sunshine, flowers and windmills.