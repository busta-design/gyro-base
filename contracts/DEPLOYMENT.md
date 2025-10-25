# Staking Contract Deployment Guide

## Overview
This guide explains how to deploy the Staking contract using Foundry (Forge).

## Prerequisites
- Foundry installed ([installation guide](https://book.getfoundry.sh/getting-started/installation))
- A private key for the deployer account
- USDC tokens on Base Sepolia (for testing)
- ETH for gas fees on Base Sepolia

## Deployment Steps

### 1. Set Environment Variables
Create a `.env` file in the `contracts` directory:

```bash
PRIVATE_KEY=0x... # Your private key (without 0x prefix, or with it - both work)
```

Or export it directly:
```bash
export PRIVATE_KEY=0x...
```

### 2. Deploy to Base Sepolia Testnet

```bash
cd contracts
forge script script/Deploy.s.sol:Deploy --rpc-url https://sepolia.base.org --private-key $PRIVATE_KEY --broadcast
```

### 3. Verify Deployment
Once deployed, the contract address will be printed in the output. You can verify the deployment on [Base Sepolia Blockscout](https://sepolia.basescan.org/)

## Contract Details

### Constructor Parameters
- `_stakingToken`: Address of USDC token on Base Sepolia: `0x853154b2f645b79ef8e4a0f7c4d9db41fffe8df2`

### Initial Configuration
After deployment, the contract owner (deployer) can configure:
- **APY**: Rewards rate (default 5%)
- **Withdrawal Fee**: Fee charged on rewards (default 0.3%)
- **Fee Receiver**: Address that receives fees (default: deployer)

## Key Features

- **Staking**: Users deposit USDC to earn rewards
- **Rewards**: Calculated based on APY and staking duration
- **Fee Structure**: 0.3% fee charged only on rewards (not on principal)
- **Admin Functions**: Owner can adjust APY, fees, and pause the contract

## Usage

### Fund Rewards Pool
Before users can claim rewards, fund the contract with USDC:

```solidity
// Call on the deployed Staking contract
fundRewards(amount)
```

### Stake USDC
Users must approve the Staking contract to transfer USDC first:

```solidity
// User approves Staking contract
USDC.approve(stakingAddress, amount)

// Then stakes
Staking.stake(amount)
```

### Claim Rewards
Users can claim rewards without withdrawing their stake:

```solidity
Staking.claimRewards()
```

### Withdraw
Users can withdraw their stake and earned rewards:

```solidity
Staking.withdraw(amount)
```

## Important Notes

- The USDC token address is hardcoded in the deployment script for Base Sepolia
- The contract uses a fee model where fees are only charged on rewards, not on the principal stake
- The contract can be paused by the owner in case of emergency
- All calculations use 18-decimal precision (standard for ERC20 tokens)

## Troubleshooting

### "Insufficient liquidity" error
This occurs when the rewards pool doesn't have enough funds. Call `fundRewards()` with USDC to replenish the pool.

### Transaction fails during broadcast
- Ensure you have enough ETH for gas fees
- Check that your private key is correct
- Verify the RPC URL is accessible

### Cannot call functions after deployment
Make sure you're interacting with the correct contract address from the deployment output.
