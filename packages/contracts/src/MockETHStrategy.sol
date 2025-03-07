// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Simple mock ETH strategy for testing YieldBoxETH
contract MockETHStrategy {
    mapping(address => uint256) private deposits;
    uint256 private totalDeposits;
    
    // Event emitted when yield is simulated
    event YieldSimulated(uint256 amount);
    
    // Deposit ETH into the strategy
    function deposit() external payable {
        require(msg.value > 0, "Cannot deposit 0");
        deposits[msg.sender] += msg.value;
        totalDeposits += msg.value;
    }
    
    // Withdraw ETH from the strategy
    function withdraw(uint256 amount) external returns (uint256) {
        require(deposits[msg.sender] >= amount, "Insufficient balance");
        
        deposits[msg.sender] -= amount;
        totalDeposits -= amount;
        
        // Transfer ETH back to the caller
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "ETH transfer failed");
        
        return amount;
    }
    
    // Get the balance of a specific account
    function balanceOf(address account) external view returns (uint256) {
        return deposits[account];
    }
    
    // Get the total assets managed by the strategy
    function totalAssets() external view returns (uint256) {
        return address(this).balance;
    }
    
    // Simulate yield generation by sending ETH directly to the contract
    function simulateYield() external payable {
        require(msg.value > 0, "Cannot simulate 0 yield");
        emit YieldSimulated(msg.value);
    }
    
    // Allow the contract to receive ETH
    receive() external payable {}
} 