// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ISuperfluidPool} from
    "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/gdav1/ISuperfluidPool.sol";
import {
    PoolConfig,
    PoolERC20Metadata
} from
    "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/gdav1/IGeneralDistributionAgreementV1.sol";
import {ISuperfluidToken} from
    "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluidToken.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// This is a simplified mock implementation that only implements the functions we need
contract MockSuperfluidPool {
    mapping(address => uint128) private _units;
    address private _admin;

    constructor(address admin) {
        _admin = admin;
    }

    function getUnits(address member) external view returns (uint128) {
        return _units[member];
    }

    function updateMemberUnits(address member, uint128 newUnits) external returns (bool) {
        require(msg.sender == _admin, "Only admin can update units");
        _units[member] = newUnits;
        return true;
    }

    function getAdmin() external view returns (address) {
        return _admin;
    }

    function admin() external view returns (address) {
        return _admin;
    }

    function getTotalUnits() external view returns (uint128) {
        return 0;
    }

    function getConnectedSuperToken() external view returns (address) {
        return address(0);
    }

    function superToken() external view returns (ISuperfluidToken) {
        return ISuperfluidToken(address(0));
    }

    function getPoolConfig() external view returns (PoolConfig memory) {
        return PoolConfig(true, true);
    }

    function getPoolERC20Metadata() external view returns (PoolERC20Metadata memory) {
        return PoolERC20Metadata("Mock", "MOCK", 9);
    }

    // Stub implementations for other required functions
    function distributionFromAnyAddress() external view returns (bool) {
        return false;
    }

    function transferabilityForUnitsOwner() external view returns (bool) {
        return false;
    }

    function getTotalConnectedUnits() external view returns (uint128) {
        return 0;
    }

    function getTotalDisconnectedUnits() external view returns (uint128) {
        return 0;
    }

    function getTotalFlowRate() external view returns (int96) {
        return 0;
    }

    function getTotalConnectedFlowRate() external view returns (int96) {
        return 0;
    }

    function getTotalDisconnectedFlowRate() external view returns (int96) {
        return 0;
    }

    function getDisconnectedBalance(uint32) external view returns (int256) {
        return 0;
    }

    function getTotalAmountReceivedByMember(address) external view returns (uint256) {
        return 0;
    }

    function getMemberFlowRate(address) external view returns (int96) {
        return 0;
    }

    function getClaimable(address, uint32) external view returns (int256) {
        return 0;
    }

    function getClaimableNow(address) external view returns (int256, uint256) {
        return (0, 0);
    }

    function claimAll(address) external returns (bool) {
        return true;
    }

    function claimAll() external returns (bool) {
        return true;
    }

    // ERC20 functions (minimal implementation)
    function totalSupply() external view returns (uint256) {
        return 0;
    }

    function balanceOf(address) external view returns (uint256) {
        return 0;
    }

    function transfer(address, uint256) external returns (bool) {
        return true;
    }

    function allowance(address, address) external view returns (uint256) {
        return 0;
    }

    function approve(address, uint256) external returns (bool) {
        return true;
    }

    function transferFrom(address, address, uint256) external returns (bool) {
        return true;
    }

    function name() external view returns (string memory) {
        return "Mock Pool";
    }

    function symbol() external view returns (string memory) {
        return "MPOOL";
    }

    function decimals() external view returns (uint8) {
        return 18;
    }

    function increaseAllowance(address, uint256) external returns (bool) {
        return true;
    }

    function decreaseAllowance(address, uint256) external returns (bool) {
        return true;
    }
}
