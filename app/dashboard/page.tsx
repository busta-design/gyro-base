"use client";

import { USDC_ABI } from "@/lib/constants/abi/usdcAbi";
import { SEPOLIA_BASE_USDC } from "@/lib/constants/contractAddresses";
import { usePrivy } from "@privy-io/react-auth";
import { useSmartWallets } from "@privy-io/react-auth/smart-wallets";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createPublicClient, formatUnits, http } from "viem";
import { baseSepolia } from "viem/chains";

function IconUser({ className = "", color = "currentColor" }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 22a8 8 0 1 0-16 0"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconEye({ className = "", color = "currentColor" }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
    </svg>
  );
}

function IconEyeOff({ className = "", color = "currentColor" }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M17.94 17.94C16.23 19.22 14.21 20 12 20 5.5 20 2 12.999 2 12c.3-.673 1.22-2.41 2.93-4.06M9.9 4.24C10.57 4.08 11.27 4 12 4c6.5 0 10 7 10 8 0 .34-.39 1.2-1.17 2.28"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M1 1l22 22"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconArrowDown({ className = "", color = "currentColor" }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M12 5v14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path
        d="M6 13l6 6 6-6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconArrowUp({ className = "", color = "currentColor" }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M12 19V5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path
        d="M18 11l-6-6-6 6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconTrendUp({ className = "", color = "currentColor" }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M3 17l6-6 4 4 7-7"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 8h7v7"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconChevronDown({ className = "", color = "currentColor" }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M6 9l6 6 6-6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconChevronUp({ className = "", color = "currentColor" }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M18 15l-6-6-6 6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconHome({ className = "", color = "currentColor" }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M3 10l9-7 9 7v9a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2v-4H8v4a2 2 0 0 1-2 2H3z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconQRCode({ className = "", color = "currentColor" }) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M3 3h6v6H3V3zM15 3h6v6h-6V3zM3 15h6v6H3v-6zM15 15h3v3h-3v-3zM18 18h3v3h-3v-3zM15 21v-3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { ready, authenticated, logout } = usePrivy();
  const { client } = useSmartWallets();

  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(true);
  const [depositRate, setDepositRate] = useState<string>("--");
  const [withdrawalRate, setWithdrawalRate] = useState<string>("--");

  const address = client?.account?.address;

  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: baseSepolia,
        transport: http(),
      }),
    []
  );

  useEffect(() => {
    if (!ready) return;
    if (!authenticated) {
      router.replace("/");
      return;
    }
    if (client?.account?.address) {
      loadBalance();
    }
    // Load exchange rates
    fetch("/api/rates")
      .then((res) => res.json())
      .then((data) => {
        if (data.depositRate) setDepositRate(data.depositRate);
        if (data.withdrawalRate) setWithdrawalRate(data.withdrawalRate);
      })
      .catch(() => {
        // Fallback to default if API fails
        setDepositRate("12.60");
        setWithdrawalRate("12.40");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, authenticated, client?.account?.address, router]);

  useEffect(() => {
    if (authenticated && address) {
      loadBalance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, address]);

  const masked = useMemo(() => {
    if (!balance) return "--";
    return visible ? `${balance} USDC` : "•••••";
  }, [balance, visible]);

  const loadBalance = async () => {
    if (!address) return;
    setLoading(true);
    try {
      const bal = (await publicClient.readContract({
        address: SEPOLIA_BASE_USDC,
        abi: USDC_ABI,
        functionName: "balanceOf",
        args: [address],
      })) as bigint;
      setBalance(formatUnits(bal, 6));
    } catch (e) {
      console.error("Error loading USDC balance:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-dvh bg-[#F3F4F6] text-[#111827] flex flex-col">
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="flex items-center justify-between px-4 pt-4 mb-6">
          <button onClick={() => router.push('/ads')} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center">
            <span className="text-xl">🪙</span>
          </button>
          <button
            onClick={logout}
            className="text-sm text-[#EF4444] hover:underline"
          >
            Salir
          </button>
        </header>

        {/* Balance Card */}
        <section className="bg-[#009DA1] mx-4 p-6 rounded-2xl mb-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-white/80 text-[16px]">Balance</span>
              <button
                onClick={loadBalance}
                className="px-2 py-1 rounded-md bg-white/10 text-white/80 text-xs"
                disabled={loading}
              >
                {loading ? "Cargando..." : "Refrescar"}
              </button>
            </div>
            <button
              onClick={() => setVisible((v) => !v)}
              className="flex items-center gap-1 text-white/80 text-sm"
            >
              {visible ? (
                <IconEyeOff color="rgba(255,255,255,0.8)" />
              ) : (
                <IconEye color="rgba(255,255,255,0.8)" />
              )}
              <span>{visible ? "Ocultar" : "Mostrar"}</span>
            </button>
          </div>
          <div className="text-white text-[36px] font-bold mb-6">{masked}</div>

          <div className="flex justify-center gap-8">
            <div className="flex flex-col items-center">
              <button
                onClick={() => router.push("/funding")}
                className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center"
              >
                <IconArrowDown color="#ffffff" />
              </button>
              <span className="text-white text-sm font-medium mt-2 text-center">
                Depositar dinero
              </span>
            </div>
            <div className="flex flex-col items-center">
              <button
                onClick={() => router.push("/withdraw")}
                className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center"
              >
                <IconArrowUp color="#ffffff" />
              </button>
              <span className="text-white text-sm font-medium mt-2 text-center">
                Retirar dinero
              </span>
            </div>
          </div>
        </section>

        {/* Earnings Card */}
        <section className="bg-white mx-4 p-4 rounded-2xl flex items-center mb-6 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
            <IconTrendUp color="#10B981" />
          </div>
          <div className="flex-1 ml-4">
            <div className="text-[18px] font-bold">Gana con GYRO</div>
            <div className="text-[14px] text-[#6B7280]">
              Gana hasta 12% anual
            </div>
          </div>
          <div className="w-16 h-8 flex items-center justify-center"></div>
        </section>

        {/* Dollar Price Card */}
        <section className="bg-white mx-4 p-6 rounded-2xl mb-6 shadow-sm">
          <div className="text-[18px] font-semibold mb-4">Dólar Precio</div>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <IconChevronDown color="#10B981" />
                <span className="text-[14px] text-[#6B7280]">Depósito</span>
              </div>
              <div className="text-[18px] font-bold">{depositRate} Bs</div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <IconChevronUp color="#EF4444" />
                <span className="text-[14px] text-[#6B7280]">Retiro</span>
              </div>
              <div className="text-[18px] font-bold">{withdrawalRate} Bs</div>
            </div>
          </div>
        </section>

        {/* Transactions placeholder */}
        <section className="bg-white mx-4 p-6 rounded-2xl mb-28 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[18px] font-semibold">Transacciones</div>
            <button className="flex items-center gap-1 text-[#009DA1] text-sm">
              <span>Ver todo</span> <span>›</span>
            </button>
          </div>
          <div className="flex items-center justify-center py-8 gap-2 text-[#6B7280]">
            <span className="text-base">Sin transacciones</span>
          </div>
        </section>
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E7EB] h-20 flex items-center justify-between px-4">
        <button className="flex-1 flex flex-col items-center">
          <IconHome color="#009DA1" />
          <span className="text-xs font-medium text-[#009DA1]">Inicio</span>
        </button>
        <button
          onClick={() => router.push("/funding")}
          className="w-16 h-16 rounded-full bg-[#009DA1] text-white flex items-center justify-center -translate-y-6 shadow-lg"
        >
          <IconQRCode color="#ffffff" />
        </button>
        <button onClick={() => router.push('/account')} className="flex-1 flex flex-col items-center">
          <IconUser color="#9CA3AF" />
          <span className="text-xs font-medium text-[#9CA3AF]">Mi cuenta</span>
        </button>
      </nav>
    </main>
  );
}
