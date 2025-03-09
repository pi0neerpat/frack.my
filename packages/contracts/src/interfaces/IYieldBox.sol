// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperToken.sol";
import {ISuperfluidPool} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/gdav1/ISuperfluidPool.sol";
import {e18, e, decimal} from "../decimalLibrary.sol";

/**
 * @title IYieldBox
 * @dev Interface for the YieldBox contract which manages deposits, withdrawals, and yield distribution
 */
interface IYieldBox {
    // Events
    event Deposit(address indexed user, uint256 assets18);
    event Withdraw(address indexed user, uint256 assets18);
    event HarvestYield(uint256 yieldAmount18, int96 flowRate);
    event StreamUpdated(address indexed user, int96 flowRate);
    event YieldConverted(uint256 fromAmount, uint256 toAmount);
    event FeePaid(address indexed recipient, uint256 amount);

    // View functions
    function underlyingVault() external view returns (IERC4626);
    function underlyingToken() external view returns (IERC20Metadata);
    function yieldToken() external view returns (ISuperToken);
    function distributionPool() external view returns (ISuperfluidPool);
    function userAssets(address user) external view returns (e18);
    function totalDepositedAssets() external view returns (e18);
    function MINIMUM_DEPOSIT() external view returns (uint256);
    function HARVEST_DELAY() external view returns (e18);
    function lastHarvestTimestamp() external view returns (uint256);
    function U_TOKEN_DEC() external view returns (decimal);
    function U_VAULT_DEC() external view returns (decimal);
    function POOL_DEC() external view returns (decimal);
    function E18_DEC() external view returns (decimal);
    function balanceOf(address user) external view returns (e18);
    function yieldTokenBalance() external view returns (uint256);
    function availableYield() external view returns (e18);

    // State-changing functions
    function setFeeRecipient(address feeRecipient) external;
    function deposit(uint256 assets) external;
    function depositFor(address user) external;
    function withdraw(e18 amount) external;
    function harvest() external returns (e memory);
    function adjustFlow() external returns (int96 flowRate);
}