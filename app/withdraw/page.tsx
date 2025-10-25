"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function WithdrawOptionsPage() {
  const router = useRouter();

  const handleBack = () => router.back();
  const goBs = () => router.push("/withdraw/new?type=bs");
  const goUsdc = () => router.push("/withdraw/new?type=usdc");

  return (
    <main className="min-h-dvh bg-[#F3F4F6] text-[#111827] flex flex-col">
      <header className="flex items-center px-4 pt-4 mb-4">
        <button onClick={handleBack} className="px-3 py-2 rounded-lg bg-white shadow-sm">←</button>
      </header>

      <section className="px-4 pb-8">
        <h1 className="text-[24px] md:text-[28px] font-bold mb-4 leading-tight">
          Elige cómo retirar tu dinero
        </h1>

        <div className="flex flex-col gap-2">
          <button
            onClick={goBs}
            className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-2 w-full pr-3">
              <div className="w-10 h-10 shrink-0 rounded-full bg-[#F3F4F6] flex items-center justify-center text-2xl">
                <span role="img" aria-label="Bolivia flag">🇧🇴</span>
              </div>
              <div className="text-left leading-tight">
                <div className="text-[16px] font-semibold">Bolivianos</div>
                <div className="text-[14px] text-[#6B7280]">Retiro a cuenta bancaria en Bolivia</div>
              </div>
            </div>
            <span className="text-[#9CA3AF]">›</span>
          </button>

          <button
            onClick={goUsdc}
            className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-2 w-full pr-3">
              <div className="w-10 h-10 shrink-0 rounded-full bg-[#F3F4F6] flex items-center justify-center">
                <Image src="/usdc.svg" alt="USDC" width={24} height={24} />
              </div>
              <div className="text-left leading-tight">
                <div className="text-[16px] font-semibold">USDC</div>
                <div className="text-[14px] text-[#6B7280]">Retiro a billetera crypto</div>
              </div>
            </div>
            <span className="text-[#9CA3AF]">›</span>
          </button>
        </div>
      </section>
    </main>
  );
}
