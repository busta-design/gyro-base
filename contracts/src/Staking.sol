// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title Staking
 * @notice Simple staking contract where users deposit USDC and earn rewards
 * Fee is charged at the moment of withdrawal
 */
contract Staking is Ownable, ReentrancyGuard, Pausable {
    IERC20 public stakingToken; // The token being staked (USDC)

    // How much each user has staked
    mapping(address => uint256) public stakedBalance;

    // When each user made their stake (to calculate rewards)
    mapping(address => uint256) public stakingStartTime;

    // Weighted sum of staking time per user (for fair rewards calculation)
    // Allows fair resets when funds are partially withdrawn
    mapping(address => uint256) public accumulatedStakingTime;

    // Total staked in the contract
    uint256 public totalStaked;

    // APY: 5% annual = 5 * 10^16 (in base 10^18 for precision)
    uint256 public APY = 5 * 10 ** 16; // 5%

    uint256 public constant SECONDS_PER_YEAR = 365 days;
    uint256 public constant PRECISION = 10 ** 18;

    // Platform fee charged on WITHDRAWAL (0.3% = 30 basis points)
    uint256 public withdrawFee = 30; // 0.3%
    uint256 public constant FEE_DENOMINATOR = 10000;

    address public feeReceiver; // Where fees are sent

    // Events for tracking
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount, uint256 rewards, uint256 fee);
    event RewardsClaimed(address indexed user, uint256 rewards, uint256 fee);
    event RewardsFunded(address indexed funder, uint256 amount);
    event APYChanged(uint256 indexed oldAPY, uint256 indexed newAPY);
    event WithdrawFeeChanged(uint256 indexed oldFee, uint256 indexed newFee);
    event FeeReceiverChanged(address indexed oldReceiver, address indexed newReceiver);

    constructor(address _stakingToken) Ownable(msg.sender) {
        require(_stakingToken != address(0), "Invalid token");
        stakingToken = IERC20(_stakingToken);
        feeReceiver = msg.sender;
    }

    /**
     * @notice User deposits tokens to stake
     * @param amount Amount of USDC to stake
     * NO FEE IS CHARGED HERE - User deposits 100%
     * Rewards can be claimed with claimRewards() without fee
     */
    function stake(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Cannot stake 0");

        // If the user already had a stake, accumulate the previous time before adding new stake
        if (stakedBalance[msg.sender] > 0) {
            // Accumulate previous staking time
            uint256 previousStakingDuration = block.timestamp - stakingStartTime[msg.sender];
            accumulatedStakingTime[msg.sender] += previousStakingDuration;
        }

        // Transfer tokens from user to contract (WITHOUT FEE)
        stakingToken.transferFrom(msg.sender, address(this), amount);

        // Update user balance with 100% of the amount
        stakedBalance[msg.sender] += amount;
        stakingStartTime[msg.sender] = block.timestamp;
        totalStaked += amount;

        emit Staked(msg.sender, amount);
    }

    /**
     * @notice User withdraws their stake + rewards
     * @param amount Amount to withdraw (not including rewards)
     * FEE IS CHARGED ONLY ON REWARDS (not on the principal stake)
     */
    function withdraw(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Cannot withdraw 0");
        require(stakedBalance[msg.sender] >= amount, "Insufficient balance");

        // Calculate pending rewards
        uint256 rewards = calculateRewards(msg.sender);

        // Fee is only charged on rewards, not on the stake
        uint256 rewardFee = (rewards * withdrawFee) / FEE_DENOMINATOR;
        uint256 rewardsAfterFee = rewards - rewardFee;

        // Total that the user receives (stake WITHOUT FEE + rewards WITH FEE)
        uint256 totalToTransfer = amount + rewardsAfterFee;

        // Check liquidity before updating state
        uint256 contractBalance = stakingToken.balanceOf(address(this));
        require(
            contractBalance >= totalToTransfer + rewardFee, "Insufficient liquidity to process the transaction"
        );

        // Update state
        stakedBalance[msg.sender] -= amount;
        totalStaked -= amount;

        // Accumulate previous staking time before resetting
        uint256 previousStakingDuration = block.timestamp - stakingStartTime[msg.sender];
        accumulatedStakingTime[msg.sender] += previousStakingDuration;
        stakingStartTime[msg.sender] = block.timestamp;

        // Transfer to user (complete stake + rewards after fee)
        stakingToken.transfer(msg.sender, totalToTransfer);

        // Transfer fee only if there is any
        if (rewardFee > 0) {
            stakingToken.transfer(feeReceiver, rewardFee);
        }

        emit Withdrawn(msg.sender, amount, rewards, rewardFee);
    }

    /**
     * @notice Claim only the rewards without withdrawing the stake
     * FEE IS CHARGED on the rewards
     */
    function claimRewards() external nonReentrant whenNotPaused {
        uint256 rewards = calculateRewards(msg.sender);
        require(rewards > 0, "No rewards to claim");

        // Calculate fee on the rewards
        uint256 fee = (rewards * withdrawFee) / FEE_DENOMINATOR;
        uint256 rewardsAfterFee = rewards - fee;

        // Check liquidity
        uint256 contractBalance = stakingToken.balanceOf(address(this));
        require(contractBalance >= totalStaked + rewards, "Insufficient rewards in the pool");

        // Accumulate previous staking time before resetting
        uint256 previousStakingDuration = block.timestamp - stakingStartTime[msg.sender];
        accumulatedStakingTime[msg.sender] += previousStakingDuration;
        stakingStartTime[msg.sender] = block.timestamp;

        // Transfer rewards to user (after fee)
        stakingToken.transfer(msg.sender, rewardsAfterFee);

        // Transfer fee
        if (fee > 0) {
            stakingToken.transfer(feeReceiver, fee);
        }

        emit RewardsClaimed(msg.sender, rewardsAfterFee, fee);
    }

    /**
     * @notice Calculates the pending rewards for a user
     * Formula: (balance * APY * accumulated weighted time) / (seconds in a year)
     * Supports partial withdrawals without losing previous staking time
     */
    function calculateRewards(address user) public view returns (uint256) {
        if (stakedBalance[user] == 0) {
            return 0;
        }

        // Total time = accumulated previous time + time since last staking
        uint256 currentStakingDuration = block.timestamp - stakingStartTime[user];
        uint256 totalStakingDuration = accumulatedStakingTime[user] + currentStakingDuration;

        // rewards = (stakedBalance * APY * total time) / (SECONDS_PER_YEAR * PRECISION)
        uint256 rewards = (stakedBalance[user] * APY * totalStakingDuration) / (SECONDS_PER_YEAR * PRECISION);

        return rewards;
    }

    /**
     * @notice View total balance of the user (stake + pending rewards)
     * BEFORE fees
     */
    function getTotalBalance(address user) external view returns (uint256) {
        return stakedBalance[user] + calculateRewards(user);
    }

    /**
     * @notice View how much the user would receive if they withdraw now (AFTER fees)
     * Fee is only applied to rewards, not to the principal stake
     */
    function getTotalBalanceAfterFees(address user) external view returns (uint256) {
        uint256 rewards = calculateRewards(user);
        uint256 rewardFee = (rewards * withdrawFee) / FEE_DENOMINATOR;
        uint256 rewardsAfterFee = rewards - rewardFee;
        // Returns: complete stake + rewards after fee
        return stakedBalance[user] + rewardsAfterFee;
    }

    /**
     * @notice Owner deposits rewards in the contract to pay users
     * @param amount Amount of USDC to deposit as rewards pool
     */
    function fundRewards(uint256 amount) external onlyOwner {
        stakingToken.transferFrom(msg.sender, address(this), amount);
        emit RewardsFunded(msg.sender, amount);
    }

    /**
     * @notice Change the APY (owner only)
     * @param newAPY New APY in base 10^18 (ex: 5% = 5 * 10^16)
     */
    function setAPY(uint256 newAPY) external onlyOwner {
        require(newAPY <= 100 * 10 ** 16, "APY cannot be greater than 100%");
        uint256 oldAPY = APY;
        APY = newAPY;
        emit APYChanged(oldAPY, newAPY);
    }

    /**
     * @notice Change the withdrawal fee (owner only)
     * @param newFee New fee in basis points (ex: 30 = 0.3%)
     */
    function setWithdrawFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee cannot be greater than 10%");
        uint256 oldFee = withdrawFee;
        withdrawFee = newFee;
        emit WithdrawFeeChanged(oldFee, newFee);
    }

    /**
     * @notice Change the address that receives fees (owner only)
     */
    function setFeeReceiver(address newReceiver) external onlyOwner {
        require(newReceiver != address(0), "Invalid address");
        address oldReceiver = feeReceiver;
        feeReceiver = newReceiver;
        emit FeeReceiverChanged(oldReceiver, newReceiver);
    }

    /**
     * @notice View how many rewards are available in the pool
     */
    function getRewardsPool() external view returns (uint256) {
        uint256 contractBalance = stakingToken.balanceOf(address(this));
        if (contractBalance > totalStaked) {
            return contractBalance - totalStaked;
        }
        return 0;
    }

    /**
     * @notice Pause the contract in case of emergency (owner only)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Resume the contract (owner only)
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice View the current status of rewards in the contract
     * @return poolAvailable Rewards available in the pool
     * @return poolRequired Total pending rewards to all users
     * @return hasDeficit Whether there is a rewards deficit
     */
    function getRewardStatus() external view returns (uint256 poolAvailable, uint256 poolRequired, bool hasDeficit) {
        uint256 contractBalance = stakingToken.balanceOf(address(this));

        // Available pool = total balance - total stake
        poolAvailable = contractBalance > totalStaked ? contractBalance - totalStaked : 0;

        // Required pool = total pending rewards (conservative approximation)
        // In a complete implementation, we would sum rewards from all users
        // For this demo, we use an estimate based on APY
        poolRequired = (totalStaked * APY * 365 days) / (SECONDS_PER_YEAR * PRECISION);

        hasDeficit = poolRequired > contractBalance;
    }
}
