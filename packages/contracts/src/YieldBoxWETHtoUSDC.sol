// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {YieldBoxBase} from "./YieldBoxBase.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {e18, e, Dec, F} from "./decimalLibrary.sol";

/**
 * @title YieldBoxWETHtoUSDC
 * @dev Implementation for WETH vault with USDCx yield token
 * Requires conversion from WETH to USDC
 */
contract YieldBoxWETHtoUSDC is YieldBoxBase {
    // Uniswap router or other DEX interface
    address public immutable swapRouter;
    
    constructor(
        address _underlyingVault, 
        address _yieldToken, 
        address _swapRouter,
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
        swapRouter = _swapRouter;
        
        // Approve router to spend WETH
        IERC20(address(underlyingToken)).approve(swapRouter, type(uint256).max);
    }
    
    // Override to convert WETH to USDC
    function _convertYield() internal override {
        // Get WETH balance
        uint256 wethBalance = IERC20(address(underlyingToken)).balanceOf(address(this));
        
        if (wethBalance > 0) {
            uint256 beforeBalance = IERC20(yieldToken.getUnderlyingToken()).balanceOf(address(this));
            
            // Swap WETH to USDC using router
            // This is a simplified example - actual implementation would use the router interface
            _swapWETHtoUSDC(wethBalance);
            
            uint256 afterBalance = IERC20(yieldToken.getUnderlyingToken()).balanceOf(address(this));
            
            emit YieldConverted(wethBalance, afterBalance - beforeBalance);
        }
    }
    
    // Implement the swap logic
    function _swapWETHtoUSDC(uint256 wethAmount) internal {
        // Implementation would use the router to swap WETH to USDC
        // This is a placeholder for the actual swap logic
    }
} 