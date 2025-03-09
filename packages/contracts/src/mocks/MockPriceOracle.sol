// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Mock price oracle for testing YieldBoxETH
contract MockPriceOracle {
    // ETH/USDC price with 18 decimals (e.g., 2000 * 10^18 for $2000 per ETH)
    uint256 private ethPrice;
    
    // Event emitted when price is updated
    event PriceUpdated(uint256 newPrice);
    
    constructor(uint256 _initialPrice) {
        ethPrice = _initialPrice;
    }
    
    // Get the current ETH/USDC price
    function getETHtoUSDCPrice() external view returns (uint256) {
        return ethPrice;
    }
    
    // Update the ETH/USDC price (for testing)
    function setETHPrice(uint256 _newPrice) external {
        ethPrice = _newPrice;
        emit PriceUpdated(_newPrice);
    }
} 