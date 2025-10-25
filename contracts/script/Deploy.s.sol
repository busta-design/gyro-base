// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/Staking.sol";

/**
 * @title Deploy
 * @notice Deployment script for the Staking contract
 * @dev Usage: forge script script/Deploy.s.sol:Deploy --rpc-url <RPC_URL> --private-key <PRIVATE_KEY> --broadcast
 *      Example: forge script script/Deploy.s.sol:Deploy --rpc-url https://sepolia.base.org --private-key 0x... --broadcast
 */
contract Deploy is Script {
    function run() public {
        // Start broadcasting transactions
        vm.startBroadcast();

        // Address of USDC token on Base Sepolia
        // Base Sepolia USDC: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
        address usdcToken = address(0x036CbD53842c5426634e7929541eC2318f3dCF7e);

        // Deploy the Staking contract
        Staking staking = new Staking(usdcToken);

        // Stop broadcasting
        vm.stopBroadcast();

        // Log the deployed address
        console.log("Staking contract deployed at:", address(staking));
        console.log("USDC token address:", usdcToken);
    }
}
