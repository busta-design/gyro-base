"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSmartWallets } from "@privy-io/react-auth/smart-wallets";
import { createPublicClient, encodeFunctionData, formatUnits, http, parseUnits } from "viem";
import { baseSepolia } from "viem/chains";
import { USDC_ABI } from "@/lib/constants/abi/usdcAbi";
import { SEPOLIA_BASE_USDC } from "@/lib/constants/contractAddresses";

// Uniswap v3 Base Sepolia addresses
const WETH = "0x4200000000000000000000000000000000000006" as const;
const NFPM = "0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2" as const;
const SWAP_ROUTER02 = "0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4" as const;
// Uniswap v3 exige que token0 < token1 por dirección. En Base Sepolia: USDC (0x036c...) < WETH (0x4200...)
const TOKEN0 = SEPOLIA_BASE_USDC; // USDC
const TOKEN1 = WETH;              // WETH

// Minimal ABIs
const ERC20_ABI = [
  { "type": "function", "name": "approve", "stateMutability": "nonpayable", "inputs": [{ "name": "spender", "type": "address" }, { "name": "amount", "type": "uint256" }], "outputs": [{ "type": "bool" }] },
  { "type": "function", "name": "allowance", "stateMutability": "view", "inputs": [{ "name": "owner", "type": "address" }, { "name": "spender", "type": "address" }], "outputs": [{ "type": "uint256" }] },
  { "type": "function", "name": "balanceOf", "stateMutability": "view", "inputs": [{ "name": "owner", "type": "address" }], "outputs": [{ "type": "uint256" }] },
] as const;

const SWAP_EXACT_INPUT_SINGLE_ABI = [
  {
    "type": "function",
    "name": "exactInputSingle",
    "stateMutability": "payable",
    "inputs": [
      {
        "components": [
          { "name": "tokenIn", "type": "address" },
          { "name": "tokenOut", "type": "address" },
          { "name": "fee", "type": "uint24" },
          { "name": "recipient", "type": "address" },
          { "name": "deadline", "type": "uint256" },
          { "name": "amountIn", "type": "uint256" },
          { "name": "amountOutMinimum", "type": "uint256" },
          { "name": "sqrtPriceLimitX96", "type": "uint160" }
        ],
        "name": "params",
        "type": "tuple"
      }
    ],
    "outputs": [{ "name": "amountOut", "type": "uint256" }]
  }
] as const;

const NFPM_MINT_ABI = [
  {
    "type": "function",
    "name": "mint",
    "stateMutability": "payable",
    "inputs": [
      {
        "components": [
          { "name": "token0", "type": "address" },
          { "name": "token1", "type": "address" },
          { "name": "fee", "type": "uint24" },
          { "name": "tickLower", "type": "int24" },
          { "name": "tickUpper", "type": "int24" },
          { "name": "amount0Desired", "type": "uint256" },
          { "name": "amount1Desired", "type": "uint256" },
          { "name": "amount0Min", "type": "uint256" },
          { "name": "amount1Min", "type": "uint256" },
          { "name": "recipient", "type": "address" },
          { "name": "deadline", "type": "uint256" }
        ],
        "name": "params",
        "type": "tuple"
      }
    ],
    "outputs": [
      { "name": "tokenId", "type": "uint256" },
      { "name": "liquidity", "type": "uint128" },
      { "name": "amount0", "type": "uint256" },
      { "name": "amount1", "type": "uint256" }
    ]
  }
] as const;

const TICK_SPACING: Record<number, number> = { 500: 10, 3000: 60, 10000: 200 };

export default function EarnPage() {
  const router = useRouter();
  const { client } = useSmartWallets();
  const user = client?.account?.address;

  const publicClient = useMemo(() => createPublicClient({ chain: baseSepolia, transport: http() }), []);

  const [price, setPrice] = useState("3000"); // referencia para split 50/50
  const [fee, setFee] = useState(3000);
  const [amountUsdc, setAmountUsdc] = useState("100");
  const [balUsdc, setBalUsdc] = useState<string>("--");
  const [balWeth, setBalWeth] = useState<string>("--");
  const [logs, setLogs] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const append = (m: string) => setLogs((l) => [m, ...l].slice(0, 200));

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        const [u, w] = await Promise.all([
          publicClient.readContract({ address: SEPOLIA_BASE_USDC, abi: ERC20_ABI, functionName: "balanceOf", args: [user] }) as Promise<bigint>,
          publicClient.readContract({ address: WETH, abi: ERC20_ABI, functionName: "balanceOf", args: [user] }) as Promise<bigint>,
        ]);
        setBalUsdc(formatUnits(u, 6));
        setBalWeth(formatUnits(w, 18));
      } catch {}
    };
    load();
  }, [user, publicClient]);

  const invest = async () => {
    if (!client || !user) {
      append("Conéctate para invertir");
      return;
    }
    const usdcFloat = parseFloat(amountUsdc);
    if (isNaN(usdcFloat) || usdcFloat <= 0) return;

    setBusy(true);
    try {
      const feeTier = fee;
      const spacing = TICK_SPACING[feeTier] ?? 60;
      const lower = Math.floor(-120000 / spacing) * spacing;
      const upper = Math.floor(120000 / spacing) * spacing;
      const deadline = Math.floor(Date.now() / 1000) + 600;

      // 1) Swap 50% USDC -> WETH via SwapRouter02
      const halfUsdc = parseUnits((usdcFloat / 2).toFixed(6), 6);
      const approveUsdcData = encodeFunctionData({ abi: ERC20_ABI, functionName: "approve", args: [SWAP_ROUTER02, halfUsdc] });
      append("Aprobando USDC al router...");
      await client.sendTransaction({ to: SEPOLIA_BASE_USDC, data: approveUsdcData, chain: baseSepolia, value: 0n });

      const swapData = encodeFunctionData({
        abi: SWAP_EXACT_INPUT_SINGLE_ABI,
        functionName: "exactInputSingle",
        args: [
          {
            tokenIn: SEPOLIA_BASE_USDC,
            tokenOut: WETH,
            fee: feeTier,
            recipient: user,
            deadline,
            amountIn: halfUsdc,
            amountOutMinimum: 0n,
            sqrtPriceLimitX96: 0n,
          },
        ],
      });
      append("Swappeando 50% USDC -> WETH...");
      await client.sendTransaction({ to: SWAP_ROUTER02, data: swapData, chain: baseSepolia, value: 0n });

      // 2) Calcular montos deseados: mitad USDC restante + WETH obtenido (estimación simplificada)
      // Releer balances post-swap
      const [u2, w2] = await Promise.all([
        publicClient.readContract({ address: TOKEN0, abi: ERC20_ABI, functionName: "balanceOf", args: [user] }) as Promise<bigint>,
        publicClient.readContract({ address: TOKEN1, abi: ERC20_ABI, functionName: "balanceOf", args: [user] }) as Promise<bigint>,
      ]);

      // token0 = USDC (mitad restante), token1 = WETH (obtenido del swap)
      const amount0Desired = parseUnits((usdcFloat / 2).toFixed(6), 6); // USDC
      const amount1Desired = w2; // WETH

      // 3) Approvals al NFPM
      append("Aprobando WETH/USDC al NFPM...");
      const approveUsdcNfpm = encodeFunctionData({ abi: ERC20_ABI, functionName: "approve", args: [NFPM, amount0Desired] });
      await client.sendTransaction({ to: TOKEN0, data: approveUsdcNfpm, chain: baseSepolia, value: 0n });
      const approveWeth = encodeFunctionData({ abi: ERC20_ABI, functionName: "approve", args: [NFPM, amount1Desired] });
      await client.sendTransaction({ to: TOKEN1, data: approveWeth, chain: baseSepolia, value: 0n });

      // 4) Mint posición
      const mintData = encodeFunctionData({
        abi: NFPM_MINT_ABI,
        functionName: "mint",
        args: [
          {
            token0: TOKEN0,
            token1: TOKEN1,
            fee: feeTier,
            tickLower: lower,
            tickUpper: upper,
            amount0Desired,
            amount1Desired,
            amount0Min: 0n,
            amount1Min: 0n,
            recipient: user,
            deadline,
          },
        ],
      });
      append("Minteando posición LP...");
      const txHash = await client.sendTransaction({ to: NFPM, data: mintData, chain: baseSepolia, value: 0n });
      append(`✅ LP creada. Tx: ${txHash}`);

      // Actualizar balances UI
      const [u3, w3] = await Promise.all([
        publicClient.readContract({ address: SEPOLIA_BASE_USDC, abi: ERC20_ABI, functionName: "balanceOf", args: [user] }) as Promise<bigint>,
        publicClient.readContract({ address: WETH, abi: ERC20_ABI, functionName: "balanceOf", args: [user] }) as Promise<bigint>,
      ]);
      setBalUsdc(formatUnits(u3, 6));
      setBalWeth(formatUnits(w3, 18));
    } catch (e: any) {
      append(`Error: ${e?.message || String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-dvh bg-[#F3F4F6] text-[#111827] flex flex-col">
      <header className="flex items-center justify-between px-4 pt-4 mb-4">
        <button onClick={() => router.back()} className="px-3 py-2 rounded-lg bg-white shadow-sm">←</button>
        <div className="text-[18px] font-bold">Ganar con GYRO</div>
        <div />
      </header>

      <section className="px-4 pb-8 grid gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="text-[14px] text-[#6B7280] mb-2">Tus balances (Base Sepolia)</div>
          <div className="flex gap-6 text-[14px]">
            <div>USDC: <span className="font-semibold">{balUsdc}</span></div>
            <div>WETH: <span className="font-semibold">{balWeth}</span></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <div className="text-[12px] text-[#6B7280] mb-1">Monto a invertir (USDC)</div>
              <input value={amountUsdc} onChange={(e)=>setAmountUsdc(e.target.value.replace(/,/g, "."))} className="w-full bg-[#F3F4F6] border border-[#D1D5DB] rounded-xl py-2 px-3"/>
            </div>
            <div>
              <div className="text-[12px] text-[#6B7280] mb-1">Fee tier</div>
              <select value={fee} onChange={(e)=>setFee(parseInt(e.target.value))} className="w-full bg-[#F3F4F6] border border-[#D1D5DB] rounded-xl py-2 px-3">
                <option value={500}>0.05% (500)</option>
                <option value={3000}>0.3% (3000)</option>
                <option value={10000}>1% (10000)</option>
              </select>
            </div>
            <div className="flex items-end">
              <button disabled={busy || !user} onClick={invest} className="w-full h-11 rounded-xl bg-[#009DA1] text-white disabled:opacity-50">{busy?"Procesando...":"Invertir y Proveer liquidez"}</button>
            </div>
          </div>
          <div className="text-[12px] text-[#6B7280] mt-2">Se swappea ~50% USDC→WETH y luego se mintea una posición LP (WETH/USDC) en rango amplio.</div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="text-[16px] font-semibold mb-3">Actividad</div>
          <div className="text-[12px] text-[#374151] whitespace-pre-wrap break-words min-h-[100px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-3">
            {logs.length===0?"Sin actividad todavía":logs.map((l,i)=>(<div key={i}>• {l}</div>))}
          </div>
        </div>
      </section>
    </main>
  );
}
