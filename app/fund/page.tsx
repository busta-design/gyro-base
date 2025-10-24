"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function FundPage() {
  const router = useRouter();
  const search = useSearchParams();

  const currentAmount = search?.get("currentAmount") ?? "";
  const currentExpiry = search?.get("currentExpiry") ?? "1";

  const [bsAmount, setBsAmount] = useState<string>(currentAmount);
  const [selectedExpiry, setSelectedExpiry] = useState<string>(currentExpiry);
  const [loading, setLoading] = useState(false);

  const rate = useMemo(() => {
    const envRate = Number(process.env.NEXT_PUBLIC_BOB_USDC_RATE || process.env.BOB_USDC_RATE || 12.6);
    return isNaN(envRate) || envRate <= 0 ? 12.6 : envRate;
  }, []);

  const usdAmount = useMemo(() => {
    const n = Number(bsAmount);
    if (!n || n <= 0) return "";
    return (n / rate).toFixed(2);
  }, [bsAmount, rate]);

  const continueToQR = async () => {
    if (!bsAmount || Number(bsAmount) < 1 || loading) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("amount", bsAmount);
      if (usdAmount) params.set("usdAmount", usdAmount);
      params.set("expiryDays", selectedExpiry);
      params.set("updated", "true");
      router.push(`/deposit-qr?${params.toString()}`);
    } finally {
      setLoading(false);
    }
  };

  const expiryLabel = (d: string) => {
    switch (d) {
      case "1":
        return "1 día";
      case "7":
        return "1 semana";
      case "365":
        return "1 año";
      default:
        return "1 día";
    }
  };

  return (
    <main className="min-h-dvh bg-[#F3F4F6] text-[#111827] flex flex-col">
      <header className="flex items-center px-4 pt-4 mb-2">
        <button onClick={() => router.back()} className="px-3 py-2 rounded-lg bg-white shadow-sm">←</button>
      </header>

      <section className="px-4 pb-8">
        <h1 className="text-[24px] md:text-[28px] font-bold mb-4">¿Cuánto quieres depositar?</h1>

        <div className="flex items-center gap-2 text-sm text-[#111827] mb-6">
          <span>1 USD = {rate.toFixed(2)} Bs</span>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
          {/* Depositing */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[14px] text-[#6B7280] mb-1">Depositando</div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#f0f0f0] flex items-center justify-center text-[16px]">🇧🇴</div>
                <div className="text-[16px] font-medium">Bs</div>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <input
                className="text-right text-[24px] font-bold outline-none border-b border-[#E5E7EB] w-28"
                placeholder="0,00"
                value={bsAmount}
                onChange={(e) => setBsAmount(e.target.value)}
                inputMode="decimal"
              />
              <span className="text-[24px] font-bold">Bs</span>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center my-2">
            <div className="w-8 h-8 rounded-full bg-[#009DA1] text-white flex items-center justify-center">↓</div>
          </div>

          {/* Receiving */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[14px] text-[#6B7280] mb-1">Recibes</div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#F3F4F6] flex items-center justify-center">
                  <Image src="/usdc.svg" alt="USDC" width={16} height={16} />
                </div>
                <div className="text-[16px] font-medium">USDC</div>
              </div>
            </div>
            <div className="text-[24px] font-bold">${usdAmount || "0.00"}</div>
          </div>
        </div>

        {/* Expiry options */}
        <div className="mb-4">
          <div className="text-[14px] font-medium text-[#6B7280] mb-2">Tiempo de vencimiento del QR</div>
          <div className="flex flex-col gap-2">
            {(["1", "7", "365"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setSelectedExpiry(d)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                  selectedExpiry === d ? "border-[#009DA1] bg-[#009DA1]10" : "border-[#E5E7EB] bg-white"
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedExpiry === d ? "border-[#009DA1]" : "border-[#E5E7EB]"
                  }`}
                >
                  {selectedExpiry === d && <span className="w-2.5 h-2.5 rounded-full bg-[#009DA1]" />}
                </span>
                <span className={`${selectedExpiry === d ? "text-[#009DA1] font-semibold" : "text-[#111827]"}`}>
                  {expiryLabel(d)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Warning */}
        <div className="flex items-start gap-2 text-[12px] text-[#6B7280] mb-6">
          <span>⚠️</span>
          <p>La tasa de cambio se calcula al momento del pago, puede cambiar.</p>
        </div>

        {/* Continue */}
        <div className="pb-6">
          <button
            onClick={continueToQR}
            disabled={!bsAmount || Number(bsAmount) < 1 || loading}
            className={`w-full rounded-full py-4 font-bold ${
              !bsAmount || Number(bsAmount) < 1 || loading
                ? "bg-[#D1D5DB] text-[#9CA3AF]"
                : "bg-[#009DA1] text-white"
            }`}
          >
            {loading ? "Procesando..." : "Continue"}
          </button>
        </div>
      </section>
    </main>
  );
}
