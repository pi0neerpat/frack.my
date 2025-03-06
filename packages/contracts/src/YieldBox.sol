// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperToken.sol";
import {SuperTokenV1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperTokenV1Library.sol";
import {
    ISuperfluidPool,
    PoolConfig,
    PoolERC20Metadata
} from
    "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/gdav1/IGeneralDistributionAgreementV1.sol";
import "./mocks/MockSuperToken.sol";
import "./mocks/MockSuperfluidPool.sol";

contract YieldBox {
    using SafeERC20 for IERC20;
    using SuperTokenV1Library for ISuperToken;

    // Events
    event Deposit(address indexed user, uint256 assets, uint256 shares);
    event Withdraw(address indexed user, uint256 assets, uint256 shares);
    event HarvestYield(uint256 yieldAmount);
    event StreamUpdated(address indexed user, int96 flowRate);

    // State variables
    IERC4626 public immutable underlyingVault;
    IERC20 public immutable underlyingToken;
    MockSuperToken public immutable yieldToken;
    MockSuperfluidPool public immutable poolAddress;
    // Share accounting
    mapping(address => uint256) public userAssets;
    uint256 public totalDepositedAssets;

    // Deposit tracking
    mapping(address => uint256) public userDepositTimestamp;

    // Protocol parameters
    uint256 public constant MINIMUM_DEPOSIT = 1e6; // Minimum deposit amount
    uint256 public constant HARVEST_DELAY = 1 days; // Minimum time between harvests
    uint256 public lastHarvestTimestamp;

    function balanceOf(address user) public view returns (uint256) {
        return userAssets[user];
    }

    constructor(address _underlyingVault, address _yieldToken) {
        require(_underlyingVault != address(0), "Invalid vault address");
        underlyingVault = IERC4626(_underlyingVault);
        underlyingToken = IERC20(underlyingVault.asset());
        yieldToken = MockSuperToken(_yieldToken);

        // check that underlyingToken of the vault is the same as the underlyingToken of the yieldToken
        //require(underlyingToken == yieldToken.underlyingToken(), "Underlying token mismatch");

        // approve the yieldToken to spend the underlyingToken
        underlyingToken.safeApprove(address(yieldToken), type(uint256).max);
        // create a distribution pool for the yieldToken
        poolAddress = yieldToken.createPoolWithCustomERC20Metadata(
            address(this), PoolConfig(true, true), PoolERC20Metadata("YieldBox", "YBX", 9)
        );
    }

    /**
     * @notice Deposits assets into the YieldBox
     * @param assets Amount of assets to deposit
     * @return shares Amount of shares minted
     */
    function deposit(uint256 assets) external returns (uint256 shares) {
        require(assets >= MINIMUM_DEPOSIT, "Deposit too small");

        // Transfer assets from user
        underlyingToken.safeTransferFrom(msg.sender, address(this), assets);

        // Approve vault to spend assets
        underlyingToken.safeApprove(address(underlyingVault), assets);

        // Deposit into underlying vault
        underlyingVault.deposit(assets, address(this));

        // give user pool units
        poolAddress.updateMemberUnits(msg.sender, uint128(assets) / 1e9 + (poolAddress.getUnits(msg.sender)));
        // Update user accounting
        userAssets[msg.sender] += assets;
        totalDepositedAssets += assets;
        userDepositTimestamp[msg.sender] = block.timestamp;

        emit Deposit(msg.sender, assets, shares);
    }

    /**
     * @notice Withdraws assets from the YieldBox
     * @param assets Amount of shares to burn
     * @return shares Amount of assets withdrawn
     */
    function withdraw(uint256 assets) external returns (uint256 shares) {
        require(assets > 0, "Cannot withdraw 0");
        require(userAssets[msg.sender] >= assets, "Insufficient assets");

        // Update user accounting
        userAssets[msg.sender] -= assets;
        totalDepositedAssets -= assets;

        // Withdraw from underlying vault
        poolAddress.updateMemberUnits(msg.sender, (poolAddress.getUnits(msg.sender) - uint128(assets) / 1e9));
        shares = underlyingVault.withdraw(assets, msg.sender, address(this));

        emit Withdraw(msg.sender, assets, shares);
    }

    // Harvest logic
    function harvest() external {
        // Harvest yield
        // this is the number of shares we have in the underlyingVault
        uint256 myShares = underlyingVault.balanceOf(address(this));
        uint256 myAssets = underlyingVault.previewRedeem(myShares);
        uint256 yieldAmount = myAssets - totalDepositedAssets;

        // Harvest yield
        underlyingVault.withdraw(yieldAmount, address(this), address(this));

        // upgrade the withdrawn yield to the yieldToken
        yieldToken.upgrade(yieldAmount);
        // trigger the flow smoother
        smother();
        // Update user accounting
        emit HarvestYield(yieldAmount);
    }

    function smother() internal {
        // get the flow rate
        uint256 balance = yieldToken.balanceOf(address(this));
        int96 flowRate = int96(uint96(balance / 1 days));
        // update the flow rate
        yieldToken.distributeFlow(poolAddress, flowRate);
    }

    function underlyingVaultAssets() public view returns (uint256) {
        return underlyingVault.previewRedeem(underlyingVault.balanceOf(address(this)));
    }
}
