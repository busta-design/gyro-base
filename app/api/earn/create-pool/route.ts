import { NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http, Hex, toHex } from "viem";
import { baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

// Minimal ABI for NonfungiblePositionManager createAndInitializePoolIfNecessary
const NFPM_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "token0", "type": "address" },
      { "internalType": "address", "name": "token1", "type": "address" },
      { "internalType": "uint24", "name": "fee", "type": "uint24" },
      { "internalType": "uint160", "name": "sqrtPriceX96", "type": "uint160" }
    ],
    "name": "createAndInitializePoolIfNecessary",
    "outputs": [{ "internalType": "address", "name": "pool", "type": "address" }],
    "stateMutability": "payable",
    "type": "function"
  }
] as const;

const NFPM = "0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2" as const; // Base Sepolia
const WETH = "0x4200000000000000000000000000000000000006" as const; // Base Sepolia WETH
import { SEPOLIA_BASE_USDC } from "@/lib/constants/contractAddresses";

// Encode sqrt price: sqrt(amount1/amount0) * 2^96
function encodeSqrtRatioX96(amount1: bigint, amount0: bigint): bigint {
  // Use JS BigInt sqrt via Newton's method
  function sqrt(y: bigint): bigint {
    if (y === BigInt(0)) return BigInt(0);
    let z = y;
    let x = y / BigInt(2) + BigInt(1);
    while (x < z) {
      z = x;
      x = (y / x + x) / BigInt(2);
    }
    return z;
  }
  const ratio = (amount1 << BigInt(192)) / amount0; // (amount1/amount0) * 2^192
  return sqrt(ratio);
}

export async function POST(req: Request) {
  try {
    const { priceUSDCperWETH = "3000", fee = 3000 } = await req.json().catch(() => ({}));

    const pk = process.env.PRIVATE_KEY;
    if (!pk) {
      return NextResponse.json({ success: false, error: "Missing PRIVATE_KEY in env" }, { status: 500 });
    }
    const account = privateKeyToAccount(pk as Hex);

    const wallet = createWalletClient({ account, chain: baseSepolia, transport: http() });

    // price: 1 WETH = X USDC. Assume both 18 decimals (your USDC test might be 6/18; this is an approximation for demo)
    const price = BigInt(Math.floor(parseFloat(String(priceUSDCperWETH))));
    const sqrtPriceX96 = encodeSqrtRatioX96(price, BigInt(1));

    const hash = await wallet.writeContract({
      address: NFPM,
      abi: NFPM_ABI,
      functionName: "createAndInitializePoolIfNecessary",
      args: [WETH, SEPOLIA_BASE_USDC, fee, sqrtPriceX96],
      // NFPM requires a small msg.value sometimes = 0
      value: BigInt(0),
    });

    return NextResponse.json({ success: true, data: { txHash: hash, sqrtPriceX96: sqrtPriceX96.toString() } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || String(e) }, { status: 500 });
  }
}
