"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSmartWallets } from "@privy-io/react-auth/smart-wallets";
import { createPublicClient, formatUnits, http, parseUnits, encodeFunctionData } from "viem";
import { baseSepolia } from "viem/chains";
import { USDC_ABI } from "@/lib/constants/abi/usdcAbi";
import { SEPOLIA_BASE_USDC, SEPOLIA_BASE_STAKING } from "@/lib/constants/contractAddresses";
import { STAKING_ABI } from "@/lib/constants/abi/stakingAbi";

export default function EarnPage() {
  const router = useRouter();
  const { client } = useSmartWallets();
  const address = client?.account?.address;

  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [staked, setStaked] = useState<string>("0.00");
  const [rewards, setRewards] = useState<string>("0.00");
  const [apy, setApy] = useState<string>("5.00");
  const [feeBps, setFeeBps] = useState<number>(30);
  const [usdcBal, setUsdcBal] = useState<string>("--");
  const [error, setError] = useState<string | null>(null);

  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: baseSepolia,
        transport: http(),
      }),
    []
  );

  const fetchAll = useCallback(async () => {
    if (!address) return;
    try {
      const [stakedBal, rew, apyRaw, feeRaw, usdc] = await Promise.all([
        publicClient.readContract({ address: SEPOLIA_BASE_STAKING, abi: STAKING_ABI, functionName: "stakedBalance", args: [address] }) as Promise<bigint>,
        publicClient.readContract({ address: SEPOLIA_BASE_STAKING, abi: STAKING_ABI, functionName: "calculateRewards", args: [address] }) as Promise<bigint>,
        publicClient.readContract({ address: SEPOLIA_BASE_STAKING, abi: STAKING_ABI, functionName: "APY" }) as Promise<bigint>,
        publicClient.readContract({ address: SEPOLIA_BASE_STAKING, abi: STAKING_ABI, functionName: "withdrawFee" }) as Promise<bigint>,
        publicClient.readContract({ address: SEPOLIA_BASE_USDC, abi: USDC_ABI, functionName: "balanceOf", args: [address] }) as Promise<bigint>,
      ]);
      setStaked(formatUnits(stakedBal, 6));
      setRewards(formatUnits(rew, 6));
      const apyPct = Number(apyRaw) / 1e16; // 500 => 5.00
      setApy((apyPct / 100).toFixed(2));
      setFeeBps(Number(feeRaw));
      setUsdcBal(formatUnits(usdc, 6));
    } catch (e) {
      console.error(e);
    }
  }, [address, publicClient]);

  useEffect(() => {
    // initial fetch
    fetchAll();
    // polling every 3s
    const id = setInterval(fetchAll, 3000);
    return () => clearInterval(id);
  }, [fetchAll]);

  const ensureAllowance = async (needed: bigint) => {
    if (!client || !address) throw new Error("Wallet not ready");
    const current = (await publicClient.readContract({
      address: SEPOLIA_BASE_USDC,
      abi: USDC_ABI,
      functionName: "allowance",
      args: [address, SEPOLIA_BASE_STAKING],
    })) as bigint;
    if (current >= needed) return;
    const data = {
      to: SEPOLIA_BASE_USDC,
      data: encodeFunctionData({
        abi: USDC_ABI,
        functionName: "approve",
        args: [SEPOLIA_BASE_STAKING, needed],
      }) as `0x${string}`,
      chain: baseSepolia,
    };
    await client.sendTransaction(data);
  };

  const handleStake = async () => {
    setError(null);
    try {
      setLoading(true);
      if (!client) throw new Error("Wallet not ready");
      const amt = parseFloat(amount);
      if (!amt || amt <= 0) throw new Error("Ingresa un monto válido");
      const value = parseUnits(amt.toFixed(6), 6);
      await ensureAllowance(value);
      const data = {
        to: SEPOLIA_BASE_STAKING,
        data: encodeFunctionData({ abi: STAKING_ABI, functionName: "stake", args: [value] }) as `0x${string}`,
        chain: baseSepolia,
      };
      await client.sendTransaction(data);
      setAmount("");
      await fetchAll();
    } catch (e: any) {
      setError(e?.message || "Error al hacer stake");
    }
    finally { setLoading(false); }
  };

  const handleClaim = async () => {
    setError(null);
    try {
      setLoading(true);
      if (!client) throw new Error("Wallet not ready");
      const data = {
        to: SEPOLIA_BASE_STAKING,
        data: encodeFunctionData({ abi: STAKING_ABI, functionName: "claimRewards" }) as `0x${string}`,
        chain: baseSepolia,
      };
      await client.sendTransaction(data);
      await fetchAll();
    } catch (e: any) {
      setError(e?.message || "Error al reclamar recompensas");
    }
    finally { setLoading(false); }
  };

  const handleWithdraw = async () => {
    setError(null);
    try {
      setLoading(true);
      if (!client) throw new Error("Wallet not ready");
      const amt = parseFloat(amount);
      if (!amt || amt <= 0) throw new Error("Ingresa un monto válido");
      const value = parseUnits(amt.toFixed(6), 6);
      const data = {
        to: SEPOLIA_BASE_STAKING,
        data: encodeFunctionData({ abi: STAKING_ABI, functionName: "withdraw", args: [value] }) as `0x${string}`,
        chain: baseSepolia,
      };
      await client.sendTransaction(data);
      setAmount("");
      await fetchAll();
    } catch (e: any) {
      setError(e?.message || "Error al retirar");
    }
    finally { setLoading(false); }
  };

  return (
    <main className="min-h-dvh bg-[#F3F4F6] text-[#111827] flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <header className="flex items-center justify-between px-4 pt-4 mb-6">
          <button onClick={() => router.back()} className="px-4 py-2 rounded-xl bg-white shadow-sm">←</button>
          <div className="text-[16px] font-semibold">Gana con GYRO</div>
          <div className="w-10" />
        </header>

        {/* Overview */}
        <section className="bg-white mx-4 p-6 rounded-2xl mb-6 shadow-sm">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-[12px] text-[#6B7280]">APY</div>
              <div className="text-[22px] font-bold">{apy}%</div>
            </div>
            <div>
              <div className="text-[12px] text-[#6B7280]">Fee retiro (rewards)</div>
              <div className="text-[22px] font-bold">{(feeBps / 100).toFixed(2)}%</div>
            </div>
          </div>
        </section>

        {/* Balances */}
        <section className="bg-white mx-4 p-6 rounded-2xl mb-6 shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[12px] text-[#6B7280]">USDC en billetera</div>
              <div className="text-[18px] font-bold">{usdcBal} USDC</div>
            </div>
            <div>
              <div className="text-[12px] text-[#6B7280]">Staked</div>
              <div className="text-[18px] font-bold">{staked} USDC</div>
            </div>
            <div>
              <div className="text-[12px] text-[#6B7280]">Recompensas pendientes</div>
              <div className="text-[18px] font-bold">{rewards} USDC</div>
            </div>
          </div>
        </section>

        {/* Actions */}
        <section className="bg-white mx-4 p-6 rounded-2xl mb-28 shadow-sm">
          <div className="mb-3">
            <div className="text-[14px] text-[#6B7280] mb-1">Monto (USDC)</div>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full h-12 px-4 rounded-xl border border-[#E5E7EB] focus:outline-none"
            />
          </div>
          {error && <div className="text-[12px] text-[#EF4444] mb-3">{error}</div>}
          <div className="grid grid-cols-3 gap-3">
            <button onClick={handleStake} disabled={!client || loading} className="h-12 rounded-xl bg-[#009DA1] text-white disabled:opacity-60">Stake</button>
            <button onClick={handleClaim} disabled={!client || loading} className="h-12 rounded-xl bg-[#10B981] text-white disabled:opacity-60">Claim</button>
            <button onClick={handleWithdraw} disabled={!client || loading} className="h-12 rounded-xl bg-[#EF4444] text-white disabled:opacity-60">Withdraw</button>
          </div>
        </section>
      </div>
    </main>
  );
}
