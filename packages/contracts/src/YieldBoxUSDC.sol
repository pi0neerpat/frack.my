// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {YieldBoxBase} from "./YieldBoxBase.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title YieldBoxUSDC
 * @dev Implementation for USDC vault with USDCx yield token
 * No conversion needed as the vault's underlying token is the same as the yield token's underlying
 */
contract YieldBoxUSDC is YieldBoxBase {
    constructor(
        address _underlyingVault, 
        address _yieldToken,
        string memory _poolName,
        string memory _poolSymbol,
        uint8 _poolDecimals
    ) 
        YieldBoxBase(
            _underlyingVault, 
            _yieldToken, 
            _poolName, 
            _poolSymbol,
            _poolDecimals
        ) 
    {
        // Verify the vault's underlying token is the same as the yield token's underlying
        require(
            address(underlyingToken) == yieldToken.getUnderlyingToken(),
            "Token mismatch: vault underlying must match yield token underlying"
        );
    }

    // No need to override _convertYield as the base implementation (do nothing) is correct
} 