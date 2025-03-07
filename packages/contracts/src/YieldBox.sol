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

// This contract should format any return values to 18 decimals
contract YieldBox {
    using SafeERC20 for IERC20;
    using SuperTokenV1Library for ISuperToken;
    using Dec for uint256;
    using Dec for uint8;  // Add this to use .d() on uint8

    // Events with explicit decimal precision
    event Deposit(address indexed user, uint256 assets18);
    event Withdraw(address indexed user, uint256 assets18);
    event HarvestYield(uint256 yieldAmount18);
    event StreamUpdated(address indexed user, int96 flowRate);

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
    e18 public constant HARVEST_DELAY = e18.wrap(12 hours);
    uint256 public lastHarvestTimestamp;
    // Decimal precisions as type-safe decimal values
    decimal public immutable U_TOKEN_DEC;
    decimal public immutable U_VAULT_DEC;
    decimal public immutable POOL_DEC;
    decimal public immutable E18_DEC = uint(18).d();

    constructor(address _underlyingVault, address _yieldToken) {
        require(_underlyingVault != address(0), "Invalid vault address");
        underlyingVault = IERC4626(_underlyingVault);
        underlyingToken = IERC20Metadata(underlyingVault.asset());
        yieldToken = ISuperToken(_yieldToken);

        // Store decimal precisions with type safety
        U_TOKEN_DEC = underlyingToken.decimals().d();
        U_VAULT_DEC = underlyingVault.decimals().d();
        POOL_DEC = uint(9).d();

        require(address(underlyingToken) == yieldToken.getUnderlyingToken(), "Token mismatch");

        underlyingToken.approve(address(yieldToken), type(uint256).max);
        distributionPool = yieldToken.createPoolWithCustomERC20Metadata(
            address(this),
            PoolConfig(true, true),
            PoolERC20Metadata("YieldBox", "YBX", 9)
        );
    }

    function balanceOf(address user) public view returns (e18) {
        return userAssets[user];
    }

    // deposit underlying assets in its own decimals
    function deposit(uint256 assets) external {
        require(assets >= MINIMUM_DEPOSIT, "Deposit too small");
        
        // Create amount with underlying decimals and handle transfers
        underlyingToken.transferFrom(msg.sender, address(this), assets);
        underlyingToken.approve(address(underlyingVault), assets);
        underlyingVault.deposit(assets, address(this));

        e memory assetsE = Dec.make(assets, U_TOKEN_DEC);
        
        // Convert to pool units (9 decimals) and update pool
        e memory poolUnits = A.to(assetsE, POOL_DEC);
        distributionPool.updateMemberUnits(
            msg.sender,
            uint128(poolUnits.value) + distributionPool.getUnits(msg.sender)
        );

        // Update user accounting in 18 decimals
        userAssets[msg.sender] = F.add(userAssets[msg.sender], A.to18(assetsE));
        totalDepositedAssets = F.add(totalDepositedAssets, A.to18(assetsE));
        
        emit Deposit(msg.sender, assetsE.value);
    }

    // user provides amount in 18 decimals as the amount defined by the vault is in 18 decimals
    function withdraw(e18 amount) external {
        require(F.gt(amount, Dec.make18(0)), "Cannot withdraw 0");
        require(F.gte(userAssets[msg.sender], amount), "Insufficient balance");

        userAssets[msg.sender] = F.sub(userAssets[msg.sender], amount);
        totalDepositedAssets = F.sub(totalDepositedAssets, amount);

        // Convert to pool units and update pool
        e memory poolUnits = F.to(amount, POOL_DEC);
        uint128 currentUnits = distributionPool.getUnits(msg.sender);
        uint128 newUnits;
        if (currentUnits < uint128(poolUnits.value) || F.unwrap(userAssets[msg.sender]) == 0) {
            newUnits = 0;
        } else {
            newUnits = currentUnits - uint128(poolUnits.value);
        }
        distributionPool.updateMemberUnits(msg.sender, newUnits);

        // Convert to underlying decimals and withdraw
        e memory withdrawAmount = F.to(amount, U_VAULT_DEC);
        underlyingVault.withdraw(
            withdrawAmount.value,
            msg.sender,
            address(this)
        );
        
        emit Withdraw(msg.sender, F.unwrap(amount));
    }

    function harvest() external {
        e18 yieldAmount = upgradeAll();
        smother();
        emit HarvestYield(e18.unwrap(yieldAmount));
    }

    function upgradeAll() public returns (e18 yield) {
        // Get current vault balance
        e memory myShares = Dec.make(underlyingVault.balanceOf(address(this)), U_VAULT_DEC);
        e memory myAssets = Dec.make(underlyingVault.previewRedeem(myShares.value), U_TOKEN_DEC);
        
        // Convert e18 to underlying decimals using F.to
        e memory totalAssetsUnderlying = F.to(totalDepositedAssets, U_TOKEN_DEC);
        // Use A.sub for subtracting two 'e' types with same decimals
        e memory yieldAmountUnderlying = A.sub(myAssets, totalAssetsUnderlying, U_TOKEN_DEC);

        require(yieldAmountUnderlying.value > 0, "No yield to upgrade");
        // Withdraw and upgrade yield
        underlyingVault.withdraw(yieldAmountUnderlying.value, address(this), address(this));
        yield = A.to18(yieldAmountUnderlying);
        
        yieldToken.upgrade(e18.unwrap(yield));
    }

    function smother() public {
        e18 balance = Dec.make18(yieldToken.balanceOf(address(this)));
        int96 flowRate = F.toInt96(balance) / (F.toInt96(HARVEST_DELAY) * 2);
        yieldToken.distributeFlow(distributionPool, flowRate);
        emit StreamUpdated(address(this), flowRate);
    }

    function latentYield() public view returns (e18) {
        e memory ourShares = Dec.make(underlyingVault.balanceOf(address(this)), U_VAULT_DEC);
        e memory ourAssets = Dec.make(underlyingVault.previewRedeem(ourShares.value), U_TOKEN_DEC);
        e18 ourAssets18 = A.to18(ourAssets);

        return F.sub(ourAssets18, totalDepositedAssets);
    }

    function yieldTokenBalance() public view returns (uint256) {
        return yieldToken.balanceOf(address(this));
    }
}