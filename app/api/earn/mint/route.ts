import { NextResponse } from "next/server";
import { baseSepolia } from "viem/chains";
import { createWalletClient, http, Hex, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { SEPOLIA_BASE_USDC } from "@/lib/constants/contractAddresses";

const NFPM = "0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2" as const;
const WETH = "0x4200000000000000000000000000000000000006" as const;

// Minimal ABIs
const ERC20_ABI = [
  { "constant": true, "inputs": [{ "name": "", "type": "address" }, { "name": "", "type": "address" }], "name": "allowance", "outputs": [{ "name": "", "type": "uint256" }], "type": "function", "stateMutability": "view" },
  { "constant": false, "inputs": [{ "name": "spender", "type": "address" }, { "name": "amount", "type": "uint256" }], "name": "approve", "outputs": [{ "name": "", "type": "bool" }], "type": "function", "stateMutability": "nonpayable" }
] as const;

const NFPM_ABI = [
  {
    "inputs": [
      {
        "components": [
          { "internalType": "address", "name": "token0", "type": "address" },
          { "internalType": "address", "name": "token1", "type": "address" },
          { "internalType": "uint24", "name": "fee", "type": "uint24" },
          { "internalType": "int24", "name": "tickLower", "type": "int24" },
          { "internalType": "int24", "name": "tickUpper", "type": "int24" },
          { "internalType": "uint256", "name": "amount0Desired", "type": "uint256" },
          { "internalType": "uint256", "name": "amount1Desired", "type": "uint256" },
          { "internalType": "uint256", "name": "amount0Min", "type": "uint256" },
          { "internalType": "uint256", "name": "amount1Min", "type": "uint256" },
          { "internalType": "address", "name": "recipient", "type": "address" },
          { "internalType": "uint256", "name": "deadline", "type": "uint256" }
        ],
        "internalType": "struct INonfungiblePositionManager.MintParams",
        "name": "params",
        "type": "tuple"
      }
    ],
    "name": "mint",
    "outputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "internalType": "uint128", "name": "liquidity", "type": "uint128" },
      { "internalType": "uint256", "name": "amount0", "type": "uint256" },
      { "internalType": "uint256", "name": "amount1", "type": "uint256" }
    ],
    "stateMutability": "payable",
    "type": "function"
  }
] as const;

// Simple tick spacing map
const TICK_SPACING: Record<number, number> = {
  500: 10,
  3000: 60,
  10000: 200,
};

function alignToSpacing(value: number, spacing: number): number {
  return Math.floor(value / spacing) * spacing;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      amountWeth = "0.1", // in ETH units
      amountUsdc = "300", // string
      fee = 3000,
      token0 = WETH,
      token1 = SEPOLIA_BASE_USDC,
      usdcDecimals = 6,
      wethDecimals = 18,
      tickLower,
      tickUpper,
    } = body || {};

    const pk = process.env.PRIVATE_KEY;
    if (!pk) {
      return NextResponse.json({ success: false, error: "Missing PRIVATE_KEY in env" }, { status: 500 });
    }

    const account = privateKeyToAccount(pk as Hex);
    const wallet = createWalletClient({ account, chain: baseSepolia, transport: http() });

    const spender = NFPM;

    // Approve tokens
    const amt0 = parseUnits(amountWeth, wethDecimals);
    const amt1 = parseUnits(amountUsdc, usdcDecimals);

    // Approve WETH
    await wallet.writeContract({ address: token0, abi: ERC20_ABI, functionName: "approve", args: [spender, amt0] });
    // Approve USDC
    await wallet.writeContract({ address: token1, abi: ERC20_ABI, functionName: "approve", args: [spender, amt1] });

    const spacing = TICK_SPACING[fee] ?? 60;
    const lower = alignToSpacing(typeof tickLower === "number" ? tickLower : -120000, spacing);
    const upper = alignToSpacing(typeof tickUpper === "number" ? tickUpper : 120000, spacing);

    const deadline = Math.floor(Date.now() / 1000) + 600;

    const hash = await wallet.writeContract({
      address: NFPM,
      abi: NFPM_ABI,
      functionName: "mint",
      args: [
        {
          token0,
          token1,
          fee,
          tickLower: lower,
          tickUpper: upper,
          amount0Desired: amt0,
          amount1Desired: amt1,
          amount0Min: BigInt(0),
          amount1Min: BigInt(0),
          recipient: account.address,
          deadline,
        },
      ],
      value: BigInt(0),
    });

    return NextResponse.json({ success: true, data: { txHash: hash, tickLower: lower, tickUpper: upper } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || String(e) }, { status: 500 });
  }
}
