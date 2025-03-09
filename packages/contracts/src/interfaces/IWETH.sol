// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title IWETH
 * @dev Interface for the Wrapped Ether (WETH) contract
 */
interface IWETH is IERC20 {
    /**
     * @notice Deposit ETH and receive WETH tokens
     */
    function deposit() external payable;
    
    /**
     * @notice Withdraw ETH by burning WETH tokens
     * @param amount Amount of WETH to burn and ETH to receive
     */
    function withdraw(uint256 amount) external;
} 