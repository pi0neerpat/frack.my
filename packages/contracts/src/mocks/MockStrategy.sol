// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

contract MockStrategy is ERC4626 {
    constructor(IERC20 asset_, string memory name_, string memory symbol_) ERC20(name_, symbol_) ERC4626(asset_) {}

    // Mock function to simulate yield generation
    function generateYield(uint256 amount) external {
        _mint(address(this), amount);
    }
}
