
## Data

The app refers to the YieldBox contract as a "fluid". When you deposit to a YieldBox

- The total amount of 


Data to load: 

Get `distributionPool` address from the vault. Use this to query the subgraph to get the total number of users in the pool and the total flow rate.

https://subgraph-endpoints.superfluid.dev/base-mainnet/protocol-v1

## User flows

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
- Each row displays properties such as the asset (fluid) name, the yield rate, the global drills, the global flow rate, and the strategy type.
- The available fracking fluids are displayed using a list in `packages/app/src/config/fluids.ts`. Eventually this will be read from the contracts, but for now it can be hardcoded data.
- A filter is shown to filter by asset type. Sorting is available by ascending/descending for the numeric properties

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