"use client";

import { useRouter } from "next/navigation";

export default function ReceiveUsdcPage() {
  const router = useRouter();
  return (
    <main className="min-h-dvh bg-[#F3F4F6] text-[#111827] flex flex-col">
      <header className="flex items-center px-4 pt-4 mb-4">
        <button onClick={() => router.back()} className="px-3 py-2 rounded-lg bg-white shadow-sm">←</button>
      </header>
      <section className="px-4 pb-8">
        <h1 className="text-[24px] md:text-[28px] font-bold mb-6">Recibir USDC</h1>
        <p className="text-[#6B7280]">Pantalla placeholder para recibir USDC.</p>
      </section>
    </main>
  );
}
