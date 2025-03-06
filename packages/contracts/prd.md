# YieldBox contracts

These contracts are designed to allow the user to deposit and asset and receive a stream of the yield in USDC back to their wallet. It uses the ERC4626 Vault standard for yield, and Superfluid protocol for streaming. 

My goal for this repo is to make development and testing easier for the frontend app. I'm not working on developing the contracts here, but rather creating an easy-to-use and integrated environment for working on the frontend app. This means the setup should give me everything I need to update my browser wallet, and test the app using the anvil testnet.

## Functional Requirements

1. **Asset Deposit**: Users can deposit an ERC20 token into the YieldBox.
2. **Yield Generation**: The deposited assets generate yield through an underlying ERC4626 vault.
3. **Yield Streaming**: Generated yield is harvested, converted to a SuperToken, and distributed to users via Superfluid pools.
4. **Withdrawal**: Users can withdraw their principal at any time.
5. **Yield Distribution**: Yield is automatically distributed proportionally based on user deposits in the pool.

## Technical Implementation Details

### YieldBox Contract
- Integrates with an existing ERC4626 vault for yield generation
- Uses Superfluid's pool system for distributing yield streams
- Tracks user deposits and updates pool units accordingly
- Uses SuperToken upgrade mechanism to convert yield tokens for streaming
- Implements yield harvesting and distribution through Superfluid pools

### Function Interface
- `deposit(uint256 assets)`: Deposit assets into the underlying vault and receive pool units
- `withdraw(uint256 assets)`: Withdraw assets from the underlying vault by burning pool units
- `harvest()`: Harvest yield from the underlying vault and distribute it via Superfluid
- `smother()`: Internal function to update flow rates for the distribution pool
- `balanceOf(address user)`: View function to check a user's deposited assets
- `underlyingVaultAssets()`: View function to check the total assets in the underlying vault

### Superfluid Integration
- Uses SuperTokenV1Library for token management
- Creates a Superfluid distribution pool during contract initialization
- Updates member units in the pool based on user deposits/withdrawals
- Distributes yield via the pool's flow distribution mechanism
- Converts regular tokens to SuperTokens using the upgrade method

## Contracts

- `src/YieldBox.sol` The main contract for the user to interact with
- `src/mocks/MockSuperToken.sol` Mock implementation of Superfluid's SuperToken
- `src/mocks/MockSuperfluidPool.sol` Mock implementation of Superfluid's pool

## Scripts

- `scripts/DeployToAnvil.sol` Deploys the contracts, including necessary mock contracts to enable local testing
- `scripts/SetupTestEnvironment.sol` Creates test users with token balances and approvals

## Project Structure

```
yieldbox/
├── src/
│   ├── YieldBox.sol                # Main contract
│   └── mocks/
│       ├── MockSuperToken.sol      # Mock implementation of SuperToken
│       ├── MockSuperfluidPool.sol  # Mock implementation of Superfluid pool
│       └── MockERC20.sol           # Mock ERC20 for testing
│       └── MockStrategy.sol         
├── scripts/
│   ├── DeployToAnvil.sol           # Deployment script
│   └── SetupTestEnvironment.sol    # Creates test scenario
├── test/
│   ├── YieldBox.t.sol              # Tests for YieldBox
│   └── Integration.t.sol           # End-to-end integration tests
├── foundry.toml                    # Foundry configuration
└── .env                            # Environment variables
```

## Key Components

1. **YieldBox.sol**: 
   - Uses an existing ERC4626 vault for yield generation
   - Creates and manages a Superfluid distribution pool
   - Handles deposit/withdrawal accounting
   - Implements yield harvesting and distribution

2. **Dependencies and Interfaces**:
   - OpenZeppelin: IERC4626, IERC20, SafeERC20
   - Superfluid: ISuperToken, SuperTokenV1Library, ISuperfluidPool

3. **Mock Implementations**:
   - MockSuperToken: Simulates Superfluid SuperToken functionality
   - MockSuperfluidPool: Simulates Superfluid pool distribution
   - MockERC4626: Simulates an ERC4626 vault generating yield

4. **Key State Variables**:
   - underlyingVault: The ERC4626 vault generating yield
   - underlyingToken: The asset token users deposit
   - yieldToken: SuperToken used for streaming yield
   - poolAddress: Superfluid pool for distribution
   - userAssets: Mapping of user to deposited assets
   - totalDepositedAssets: Total assets deposited by all users

5. **Configuration Parameters**:
   - MINIMUM_DEPOSIT: Minimum deposit amount (1e6)
   - HARVEST_DELAY: Minimum time between harvests (1 day)

## Implementation Plan

1. **Setup Foundry project**:
   ```bash
   forge init yieldbox
   cd yieldbox
   ```

2. **Install dependencies**:
   ```bash
   forge install superfluid-finance/protocol-monorepo
   forge install OpenZeppelin/openzeppelin-contracts
   ```

3. **Implementation Order**:
   1. Create mock contracts for Superfluid components
   2. Implement YieldBox.sol that integrates with ERC4626 and Superfluid
   3. Create deployment scripts for local testing
   4. Implement comprehensive tests

4. **Run local tests** with:
   ```bash
   forge test
   ```

5. **Deploy to local anvil** for frontend testing:
   ```bash
   anvil
   forge script script/DeployToAnvil.sol --broadcast --rpc-url http://localhost:8545
   ```

## Testing Guidelines

1. **Unit Tests**:
   - Test deposit functionality with proper accounting
   - Test withdraw functionality with proper accounting
   - Test yield harvesting and distribution
   - Test pool unit updates on deposit/withdraw

2. **Integration Tests**:
   - Full flow from deposit to yield harvesting and distribution
   - Multiple users with different deposit amounts
   - Edge cases like zero deposits, maximum harvests

3. **Test Scenarios**:
   - User deposits assets and receives yield through the pool
   - User withdraws partial and full principal
   - Multiple users with different deposit amounts receive proportional yield

This implementation leverages Superfluid's pool system rather than direct streams to each user, which simplifies management and ensures proportional distribution based on deposit amount.


