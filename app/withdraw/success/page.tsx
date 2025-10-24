"use client";

import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function WithdrawSuccessPage() {
  const router = useRouter();
  const search = useSearchParams();

  const amountUsd = search?.get("amountUsd") || "0.00";
  const amountBs = search?.get("amountBs") || "0.00";
  const withdrawalId = search?.get("withdrawalId") || "";

  const dateText = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString("es-BO", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  useEffect(() => {
    // kick animations by adding a class after mount
    const t = setTimeout(() => {
      document.documentElement.classList.add("ws-mounted");
    }, 0);
    return () => clearTimeout(t);
  }, []);

  return (
    <main className="min-h-dvh bg-[#F3F4F6] text-[#111827] flex flex-col items-center px-4 pt-16">
      {/* Success Icon */}
      <div className="mb-8 ws-fade ws-slide">
        <div className="w-[120px] h-[120px] rounded-full bg-[#22C55E] shadow-[0_10px_30px_rgba(34,197,94,0.35)] flex items-center justify-center ws-pop">
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-8 ws-fade ws-delay-1">
        <div className="text-[28px] font-bold mb-1">¡Retiro Exitoso!</div>
        <div className="text-[16px] text-[#6B7280]">Tu retiro ha sido procesado correctamente</div>
      </div>

      {/* Details card */}
      <div className="w-full max-w-[560px] mb-6 ws-fade ws-delay-2">
        <div className="bg-white rounded-2xl p-5 shadow-[0_6px_18px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between py-2">
            <div className="text-[14px] text-[#6B7280]">Monto retirado:</div>
            <div className="text-[16px] font-semibold text-right">{amountBs} Bs <span className="text-[14px] text-[#6B7280] font-normal">({amountUsd} USDC)</span></div>
          </div>
          <div className="h-px bg-[#E5E7EB] my-2" />
          <div className="flex items-center justify-between py-2">
            <div className="text-[14px] text-[#6B7280]">ID de retiro:</div>
            <div className="text-[14px] font-semibold text-[#009DA1] font-mono">{withdrawalId || "--"}</div>
          </div>
          <div className="h-px bg-[#E5E7EB] my-2" />
          <div className="flex items-center justify-between py-2">
            <div className="text-[14px] text-[#6B7280]">Fecha y hora:</div>
            <div className="text-[16px] font-semibold">{dateText}</div>
          </div>
          <div className="h-px bg-[#E5E7EB] my-2" />
          <div className="flex items-center justify-between py-2">
            <div className="text-[14px] text-[#6B7280]">Estado:</div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-[#F59E0B]" />
              <span className="text-[14px] font-semibold text-[#F59E0B]">Procesando</span>
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="w-full max-w-[560px] mb-10 ws-fade ws-delay-3">
        <div className="flex items-center gap-2 bg-[#009DA1]15 px-4 py-3 rounded-xl">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 9v4m0 4h.01M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10Z" stroke="#009DA1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div className="text-[14px] text-[#009DA1]">El dinero llegará a tu cuenta bancaria en 24-48 horas</div>
        </div>
      </div>

      {/* Actions */}
      <div className="w-full max-w-[560px] grid grid-cols-2 gap-3 ws-fade ws-delay-4 mb-10">
        <button onClick={() => router.push('/history')} className="h-12 rounded-xl border border-[#009DA1] bg-white text-[#009DA1] font-semibold">Ver Historial</button>
        <button onClick={() => router.replace('/dashboard')} className="h-12 rounded-xl bg-[#009DA1] text-white font-semibold shadow-[0_6px_18px_rgba(0,157,161,0.35)]">Ir al Inicio</button>
      </div>

      <style jsx>{`
        .ws-fade{opacity:0;transition:opacity .3s ease}
        .ws-slide{transform:translateY(50px);transition:transform .4s cubic-bezier(.22,.61,.36,1)}
        .ws-pop{transform:scale(0);transition:transform .6s cubic-bezier(.34,1.56,.64,1)}
        .ws-delay-1{transition-delay:.1s}
        .ws-delay-2{transition-delay:.2s}
        .ws-delay-3{transition-delay:.3s}
        .ws-delay-4{transition-delay:.4s}
        :global(.ws-mounted) .ws-fade{opacity:1}
        :global(.ws-mounted) .ws-slide{transform:translateY(0)}
        :global(.ws-mounted) .ws-pop{transform:scale(1)}
      `}</style>
    </main>
  );
}
