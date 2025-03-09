// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Mock swap router for testing YieldBoxETH
contract MockSwapRouter {
    address public immutable USDC_ADDRESS;
    address public immutable WETH_ADDRESS;
    
    // Conversion rate: 1 ETH = conversionRate USDC (in USDC decimals)
    uint256 public conversionRate;
    
    // Event emitted when a swap occurs
    event Swapped(uint256 ethAmount, uint256 usdcAmount);
    
    constructor(address _usdcAddress, address _wethAddress, uint256 _initialRate) {
        USDC_ADDRESS = _usdcAddress;
        WETH_ADDRESS = _wethAddress;
        conversionRate = _initialRate;
    }
    
    // Swap ETH for USDC
    function swapExactETHForTokens(
        uint256 amountOutMin, 
        address[] calldata path, 
        address to, 
        uint256 deadline
    ) external payable returns (uint256[] memory amounts) {
        require(path.length >= 2, "Invalid path");
        require(path[0] == WETH_ADDRESS, "Path must start with WETH");
        require(path[path.length - 1] == USDC_ADDRESS, "Path must end with USDC");
        require(block.timestamp <= deadline, "Transaction expired");
        
        // Calculate USDC amount based on conversion rate
        // Assuming USDC has 6 decimals and ETH has 18 decimals
        uint256 usdcAmount = (msg.value * conversionRate) / 1e18;
        require(usdcAmount >= amountOutMin, "Insufficient output amount");
        
        // Transfer USDC to recipient
        bool success = IERC20(USDC_ADDRESS).transfer(to, usdcAmount);
        require(success, "USDC transfer failed");
        
        // Return amounts for compatibility with Uniswap interface
        amounts = new uint256[](path.length);
        amounts[0] = msg.value;
        amounts[path.length - 1] = usdcAmount;
        
        emit Swapped(msg.value, usdcAmount);
        
        return amounts;
    }
    
    // Update conversion rate (for testing)
    function setConversionRate(uint256 _newRate) external {
        conversionRate = _newRate;
    }
    
    // Fund the contract with USDC for testing
    function fund(uint256 amount) external {
        IERC20(USDC_ADDRESS).transferFrom(msg.sender, address(this), amount);
    }
    
    // Allow the contract to receive ETH
    receive() external payable {}
} 