// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperToken.sol";
import {
    PoolConfig,
    PoolERC20Metadata
} from
    "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/gdav1/IGeneralDistributionAgreementV1.sol";
import "./MockSuperfluidPool.sol";

// This is a simplified mock implementation that doesn't try to implement the full ISuperToken interface
contract MockSuperToken is ERC20 {
    IERC20 private _underlyingToken;

    constructor(string memory name, string memory symbol, IERC20 underlyingToken_) ERC20(name, symbol) {
        _underlyingToken = underlyingToken_;
    }

    function upgrade(uint256 amount) external {
        // Transfer underlying tokens from sender to this contract
        _underlyingToken.transferFrom(msg.sender, address(this), amount);
        // Mint equivalent super tokens to sender
        _mint(msg.sender, amount);
    }

    function createPoolWithCustomERC20Metadata(
        address admin,
        PoolConfig memory config,
        PoolERC20Metadata memory metadata
    ) external returns (MockSuperfluidPool) {
        // Create and return a new mock pool
        return new MockSuperfluidPool(admin);
    }

    function distributeFlow(MockSuperfluidPool pool, int96 flowRate) external {
        // Mock implementation - do nothing
    }
}
