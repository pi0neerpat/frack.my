// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {YieldBoxBase} from "./YieldBoxBase.sol";
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {e18, e, Dec, F} from "./decimalLibrary.sol";

interface IWETH {
    function deposit() external payable;
    function withdraw(uint256) external;
    function transfer(address to, uint256 value) external returns (bool);
}

contract YieldBoxETH is YieldBoxBase {
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
        // Ensure the underlying token is WETH
        // TODO: check it against WETH address
    }
    
    // Allow direct ETH deposits
    receive() external payable {
        depositETH();
    }
    
    // Add a depositETH function for ETH deposits
    function depositETH() public payable {
        require(msg.value >= MINIMUM_DEPOSIT, "Deposit too small");
        
        // Wrap ETH to WETH
        IWETH(address(underlyingToken)).deposit{value: msg.value}();
        
        // Deposit to vault and update accounting
        _depositToVault(msg.value);
        _updateUserAccounting(msg.value, msg.sender);
    }
    
    // Override token transfer to throw since we don't want to accept tokens directly
    function _transferTokensFromUser(uint256, address) internal pure override {
        revert("Direct token deposits not allowed. Use depositETH()");
    }
    
    // Override withdraw to handle ETH
    function _withdrawAndTransfer(e18 amount, address user) internal override {
        // Convert to underlying decimals
        e memory withdrawAmount = F.to(amount, U_VAULT_DEC);
        
        // Withdraw WETH from vault to contract
        underlyingVault.withdraw(
            withdrawAmount.value,
            address(this),
            address(this)
        );
        
        // Unwrap WETH to ETH
        IWETH(address(underlyingToken)).withdraw(withdrawAmount.value);
        
        // Send ETH to user
        (bool success, ) = user.call{value: withdrawAmount.value}("");
        require(success, "ETH transfer failed");
        
        emit Withdraw(user, F.unwrap(amount));
    }
}