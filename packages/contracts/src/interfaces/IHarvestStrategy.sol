// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IHarvestStrategy {
    // Events
    event HarvestExecuted(uint256 harvestedAmount);
    event EmergencyExit(address token, uint256 amount);

    // Functions
    function harvest() external returns (uint256 harvestedAmount);
    function canHarvest() external view returns (bool);
    function estimateHarvest() external view returns (uint256 harvestable);
    function emergencyExit(address token) external;
} 