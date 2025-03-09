// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";
import {IERC20, IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol"; 
import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperToken.sol";
import {SuperTokenV1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperTokenV1Library.sol";
import {ISuperfluidPool, PoolConfig, PoolERC20Metadata} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/gdav1/IGeneralDistributionAgreementV1.sol";
import {ISuperfluidPool} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/gdav1/ISuperfluidPool.sol";
import {e18, e, decimal, Dec, F, A, D} from "./decimalLibrary.sol";
import {IYieldBox} from "./interfaces/IYieldBox.sol";
import {console} from "forge-std/console.sol";
// Abstract base contract with modular harvest functionality
abstract contract YieldBoxBase is IYieldBox {
    using SafeERC20 for IERC20;
    using SuperTokenV1Library for ISuperToken;
    using Dec for uint256;
    using Dec for uint8;

    // State variables
    IERC4626 public immutable underlyingVault;
    IERC20Metadata public immutable underlyingToken;
    ISuperToken public immutable yieldToken;
    ISuperfluidPool public immutable distributionPool;
    
    // Share accounting - stored in 18 decimals
    mapping(address => e18) public userAssets;
    e18 public totalDepositedAssets;
    
    // Protocol parameters
    uint256 public constant MINIMUM_DEPOSIT = 1e6;
    e18 public constant HARVEST_DELAY = e18.wrap(6 hours);
    uint256 public lastHarvestTimestamp;
    address public feeRecipient;

    // Decimal precisions as type-safe decimal values
    decimal public immutable U_TOKEN_DEC;
    decimal public immutable U_VAULT_DEC;
    decimal public immutable POOL_DEC;
    decimal public immutable E18_DEC = uint(18).d();

    // Add a configurable fee percentage constant
    uint256 public constant FEE_PERCENTAGE_BASIS_POINTS = 500; // 5% = 500 basis points
    uint256 public constant BASIS_POINTS_DENOMINATOR = 10000;

    constructor(
        address _underlyingVault, 
        address _yieldToken, 
        string memory _name, 
        string memory _symbol, 
        uint8 _poolDecimals
    ) {
        feeRecipient = msg.sender;
        require(_underlyingVault != address(0), "Invalid vault address");
        underlyingVault = IERC4626(_underlyingVault);
        underlyingToken = IERC20Metadata(underlyingVault.asset());
        yieldToken = ISuperToken(_yieldToken);

        // Store decimal precisions with type safety
        U_TOKEN_DEC = underlyingToken.decimals().d();
        U_VAULT_DEC = underlyingVault.decimals().d();
        POOL_DEC = uint(_poolDecimals).d();

        // Setup approvals and pool
        _setupApprovals();
        distributionPool = _setupDistributionPool(_name, _symbol, _poolDecimals);
    }

    function setFeeRecipient(address _feeRecipient) external {
        require(msg.sender == feeRecipient, "Only fee recipient can set a new fee recipient");
        require(_feeRecipient != address(0), "Invalid fee recipient address");
        feeRecipient = _feeRecipient;
    }

    // Virtual function for setting up token approvals
    function _setupApprovals() internal virtual {
        IERC20(yieldToken.getUnderlyingToken()).approve(address(yieldToken), type(uint256).max);
    }

    // Virtual function for setting up the distribution pool
    function _setupDistributionPool(string memory name, string memory symbol, uint8 decimals) internal virtual returns (ISuperfluidPool) {
        return yieldToken.createPoolWithCustomERC20Metadata(
            address(this),
            PoolConfig(true, true),
            PoolERC20Metadata(name, symbol, decimals)
        );
    }

    // View function to get user's balance
    function balanceOf(address user) public view returns (e18) {
        return userAssets[user];
    }

    // View function to get yield token balance
    function yieldTokenBalance() public view returns (uint256) {
        return yieldToken.balanceOf(address(this));
    }

    // deposit underlying assets in its own decimals
    function deposit(uint256 assets) external virtual {
        require(assets >= MINIMUM_DEPOSIT, "Deposit too small");
        
        // Acquire tokens from user
        _transferTokensFromUser(assets, msg.sender);
        
        // Handle vault deposit
        _depositToVault(assets);
        
        // Handle accounting and pool updates
        _updateUserAccounting(assets, msg.sender);
    }

    // this function allows for easier batching by not requiring msg.sender or approve.
    // users can simply batch a transfer and a deposit in one function call.
    function depositFor(address user) external virtual {
        require(user != address(0), "Cannot deposit for zero address");
        uint256 assets = underlyingToken.balanceOf(address(this));
        require(assets >= MINIMUM_DEPOSIT, "Deposit too small");
        _depositToVault(assets);
        _updateUserAccounting(assets, user);
    }
    
    // Internal functions that can be overridden by child contracts
    function _transferTokensFromUser(uint256 assets, address user) internal virtual {
        // Create amount with underlying decimals and handle transfers
        underlyingToken.transferFrom(user, address(this), assets);
    }
    
    function _depositToVault(uint256 assets) internal virtual {
        underlyingToken.approve(address(underlyingVault), assets);
        underlyingVault.deposit(assets, address(this));
    }
    
    function _updateUserAccounting(uint256 assets, address user) internal virtual {
        e memory assetsE = Dec.make(assets, U_TOKEN_DEC);
        
        // Convert to pool units (9 decimals) and update pool
        e memory poolUnits = A.to(assetsE, POOL_DEC);
        distributionPool.updateMemberUnits(
            user,
            uint128(poolUnits.value) + distributionPool.getUnits(user)
        );

        // Update user accounting in 18 decimals
        userAssets[user] = F.add(userAssets[user], A.to18(assetsE));
        totalDepositedAssets = F.add(totalDepositedAssets, A.to18(assetsE));
        
        emit Deposit(user, assetsE.value);
    }

    // user provides amount in 18 decimals as the amount defined by the vault is in 18 decimals
    function withdraw(e18 amount) external virtual {
        // Validate withdrawal
        _validateWithdrawal(amount, msg.sender);
        
        // Update accounting
        _updateWithdrawalAccounting(amount, msg.sender);
        
        // Handle token withdrawal and transfer
        _withdrawAndTransfer(amount, msg.sender);
    }
    
    function _validateWithdrawal(e18 amount, address user) internal virtual {
        require(F.gt(amount, Dec.make18(0)), "Cannot withdraw 0");
        require(F.gte(userAssets[user], amount), "Insufficient balance");
    }
    
    function _updateWithdrawalAccounting(e18 amount, address user) internal virtual {
        userAssets[user] = F.sub(userAssets[user], amount);
        totalDepositedAssets = F.sub(totalDepositedAssets, amount);

        // Convert to pool units and update pool
        e memory poolUnits = F.to(amount, POOL_DEC);
        uint128 currentUnits = distributionPool.getUnits(user);
        uint128 newUnits;
        if (currentUnits < uint128(poolUnits.value) || F.unwrap(userAssets[user]) == 0) {
            newUnits = 0;
        } else {
            newUnits = currentUnits - uint128(poolUnits.value);
        }
        distributionPool.updateMemberUnits(user, newUnits);
    }
    
    function _withdrawAndTransfer(e18 amount, address user) internal virtual {
        // Convert to underlying decimals and withdraw
        e memory withdrawAmount = F.to(amount, U_VAULT_DEC);
        underlyingVault.withdraw(
            withdrawAmount.value,
            user,
            address(this)
        );
        
        emit Withdraw(user, F.unwrap(amount));
    }
    
    // Consolidated harvest functionality
    function harvest() external returns (e memory) {
        require(block.timestamp >= lastHarvestTimestamp + F.unwrap(HARVEST_DELAY), "Too soon to harvest");
        
        // Calculate and validate yield
        e memory yieldAmount = _calculateYield();
        require(yieldAmount.value > 0, "No yield to harvest");
        
        // Update timestamp before operations to prevent reentrancy
        lastHarvestTimestamp = block.timestamp;
        
        // Execute the harvest steps
        _withdrawYield(yieldAmount);
        _convertYield();
        e18 upgradedYield = _upgradeYield();
        e18 feeAmount = _payHarvestFee(upgradedYield);
        int96 flowRate = _distributeYield();
        
        // Use remaining yield instead of total balance for distribution
        emit HarvestYield(yieldToken.balanceOf(address(this)), flowRate);
        
        // Return the yield amount
        return A.sub(yieldAmount, F.to(feeAmount, U_TOKEN_DEC), U_TOKEN_DEC);
    }

    // Calculate available yield
    function _calculateYield() internal view virtual returns (e memory) {
        // Get current vault balance
        e memory myShares = Dec.make(underlyingVault.balanceOf(address(this)), U_VAULT_DEC);
        e memory myAssets = Dec.make(underlyingVault.previewRedeem(myShares.value), U_TOKEN_DEC);
        
        // Convert e18 to underlying decimals using F.to
        e memory totalAssetsUnderlying = F.to(totalDepositedAssets, U_TOKEN_DEC);
        
        // Calculate yield in underlying token decimals
        e memory yield = A.sub(myAssets, totalAssetsUnderlying, U_TOKEN_DEC);
        
        return yield;
    }

    // Withdraw yield from the vault
    function _withdrawYield(e memory yieldAmount) internal {
        // Withdraw yield from vault to this contract
        underlyingVault.withdraw(
            yieldAmount.value,
            address(this),
            address(this)
        );
    }

    // Convert yield tokens if needed (to be overridden by implementations)
    function _convertYield() internal virtual {
        // Base implementation does nothing - assumes vault token is the same as yield token's underlying
    }

    // Upgrade yield tokens to SuperTokens
    function _upgradeYield() internal virtual returns (e18 yieldAmount) {
        // Get balance of the yield token's underlying token
        IERC20 underlyingYieldToken = IERC20(yieldToken.getUnderlyingToken());
        e memory balance = Dec.make(underlyingYieldToken.balanceOf(address(this)), U_TOKEN_DEC);
        
        if (balance.value > 0) {
            // Upgrade all available tokens
            yieldToken.upgrade(F.unwrap(A.to18(balance)));
        }
        return A.to18(balance);
    }

    function _payHarvestFee(e18 harvestedYield) internal virtual returns (e18) {
        // Calculate fee amount (5% of yield) using basis points for precision
        e18 feeAmount = F.wrap(F.unwrap(harvestedYield) * FEE_PERCENTAGE_BASIS_POINTS / BASIS_POINTS_DENOMINATOR);
        
        // Transfer fee to recipient if non-zero
        if (F.gt(feeAmount, Dec.make18(0))) {
            yieldToken.transfer(feeRecipient, F.unwrap(feeAmount));
            emit FeePaid(feeRecipient, F.unwrap(feeAmount));
        }
        return feeAmount;
    }

    function adjustFlow() external returns (int96 flowRate) {
        // get the available yield in 18 decimals which is the same as the total balance
        return _distributeYield();
    }
    // Distribute yield via Superfluid stream
    function _distributeYield() internal returns (int96 actualFlowRate) {
        // Use the passed yield amount for distribution
        uint256 balance = yieldToken.balanceOf(address(this));

        console.log("yieldToDistribute: ", balance);
        if (balance > 0) {
            // Calculate flow rate based on harvest delay
            uint256 flowRate256 = balance / 24 hours;
            int96 flowRate;
            if(flowRate256 > uint256(int256(type(int96).max))){
                flowRate = type(int96).max;
            } else {
                flowRate = int96(int256(flowRate256));
            }
            console.log("flowRate");
            console.logInt(flowRate);
            // Create or update the distribution stream
            actualFlowRate = yieldToken.distributeFlow(distributionPool, flowRate);
            console.log("actualFlowRate");
            console.logInt(actualFlowRate);
            
            emit StreamUpdated(address(this), flowRate);
            return actualFlowRate;
        }
    }

    // Public view function to check available yield
    function availableYield() public view returns (e18) {
        e memory yieldAmount = _calculateYield();
        return A.to18(yieldAmount);
    }

} 