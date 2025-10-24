"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function FundingOptionsPage() {
  const router = useRouter();

  const handleBack = () => router.back();
  const goBolivianos = () => router.push("/deposit-qr");
  const goUSDC = () => router.push("/receive");

  return (
    <main className="min-h-dvh bg-[#F3F4F6] text-[#111827] flex flex-col">
      <header className="flex items-center px-4 pt-4 mb-4">
        <button onClick={handleBack} className="px-3 py-2 rounded-lg bg-white shadow-sm">←</button>
      </header>

      <section className="px-4 pb-8">
        <h1 className="text-[24px] md:text-[28px] font-bold mb-6 leading-tight">
          Elige cómo cargar plata a tu cuenta
        </h1>

        <div className="flex flex-col gap-4">
          <button
            onClick={goBolivianos}
            className="bg-white rounded-2xl p-5 flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#F3F4F6] flex items-center justify-center text-2xl">
                <span role="img" aria-label="Bolivia flag">🇧🇴</span>
              </div>
              <div>
                <div className="text-[16px] font-semibold">Bolivianos</div>
                <div className="text-[14px] text-[#6B7280]">Desde cualquier cuenta en Bolivia</div>
              </div>
            </div>
            <span className="text-[#9CA3AF]">›</span>
          </button>

          <button
            onClick={goUSDC}
            className="bg-white rounded-2xl p-5 flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#F3F4F6] flex items-center justify-center">
                <Image src="/usdc.svg" alt="USDC" width={24} height={24} />
              </div>
              <div>
                <div className="text-[16px] font-semibold">USDC</div>
                <div className="text-[14px] text-[#6B7280]">Desde una billetera crypto</div>
              </div>
            </div>
            <span className="text-[#9CA3AF]">›</span>
          </button>
        </div>
      </section>
    </main>
  );
}
