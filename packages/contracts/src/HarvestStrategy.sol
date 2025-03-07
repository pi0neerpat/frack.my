// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IHarvestStrategy} from "./interfaces/IHarvestStrategy.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

abstract contract HarvestStrategy is IHarvestStrategy, Ownable {
    using SafeERC20 for IERC20;

    // Constants
    uint256 public constant MINIMUM_HARVEST_AMOUNT = 1e6;
    uint256 public constant HARVEST_WINDOW = 24 hours;

    // State variables
    uint256 public lastHarvestTimestamp;
    address public yieldBox;

    modifier onlyYieldBox() {
        require(msg.sender == yieldBox, "Only YieldBox");
        _;
    }

    constructor(address _yieldBox) {
        require(_yieldBox != address(0), "Invalid YieldBox");
        yieldBox = _yieldBox;
    }

    /**
     * @notice Checks if harvest conditions are met
     * @return bool Whether harvest can be executed
     */
    function canHarvest() public view virtual override returns (bool) {
        return block.timestamp >= lastHarvestTimestamp + HARVEST_WINDOW &&
               estimateHarvest() >= MINIMUM_HARVEST_AMOUNT;
    }

    /**
     * @notice Emergency withdrawal of stuck tokens
     * @param token Address of token to withdraw
     */
    function emergencyExit(address token) external override onlyOwner {
        require(token != address(0), "Invalid token");
        uint256 balance = IERC20(token).balanceOf(address(this));
        IERC20(token).safeTransfer(owner(), balance);
        emit EmergencyExit(token, balance);
    }

    // Abstract functions to be implemented by specific strategies
    function harvest() external virtual override returns (uint256);
    function estimateHarvest() public view virtual override returns (uint256);
} 