"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdsPage() {
  const router = useRouter();

  const [coins, setCoins] = useState(0);
  const [adOpen, setAdOpen] = useState(false);
  const [watching, setWatching] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const USD_PER_COIN = 0.10; // 1 moneda = $0.10
  const REWARD_COINS = 2.0; // 2 monedas por anuncio = $0.20

  useEffect(() => {
    // cargar progreso desde localStorage
    const saved = localStorage.getItem("gyro_coins");
    if (saved) setCoins(parseFloat(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("gyro_coins", String(coins));
  }, [coins]);

  const startAd = () => {
    if (watching) return;
    setAdOpen(true);
    setWatching(true);
    let t = 5; // demo 5s
    setCountdown(t);
    const int = setInterval(() => {
      t -= 1;
      setCountdown(t);
      if (t <= 0) {
        clearInterval(int);
        setWatching(false);
        setAdOpen(false);
        setCountdown(null);
        setCoins((c) => parseFloat((c + REWARD_COINS).toFixed(2)));
      }
    }, 1000);
  };

  return (
    <main className="min-h-dvh bg-gradient-to-b from-[#EAF7F7] to-[#EDE7F7] text-[#111827] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-4 mb-2">
        <button onClick={() => router.back()} className="px-3 py-2 rounded-lg bg-white shadow-sm">←</button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#009DA1] text-white flex items-center justify-center">🪙</div>
          <div className="text-[14px] text-[#6B7280]">1 moneda = $0.10</div>
        </div>
      </header>

      {/* Balance */}
      <section className="mx-4 bg-white rounded-2xl p-6 shadow-sm mb-4 text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-[#009DA1]10 flex items-center justify-center mb-3">
          <div className="w-12 h-12 rounded-full bg-[#FDE68A] flex items-center justify-center text-2xl">🪙</div>
        </div>
        <div className="text-[12px] text-[#6B7280]">Saldo en USD</div>
        <div className="text-[36px] font-bold">${(coins * USD_PER_COIN).toFixed(2)}</div>
        <div className="inline-block mt-2 px-3 py-1 rounded-full bg-[#E5E7EB] text-[12px] text-[#6B7280]">Monedas: {coins.toFixed(2)}</div>
      </section>

      {/* Quest card */}
      <section className="mx-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-[16px] font-bold">Reto del día</div>
              <div className="text-[14px] text-[#6B7280]">Mira anuncios para ganar $0.20</div>
            </div>
            <button onClick={startAd} className="h-9 px-4 rounded-lg bg-[#009DA1] text-white text-[14px] disabled:opacity-50" disabled={watching}>Ver anuncio</button>
          </div>
          <div className="w-full h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
            <div className="h-full bg-[#009DA1]" style={{ width: `${Math.min(coins * 5, 100)}%` }} />
          </div>
          <div className="text-right text-[12px] text-[#6B7280] mt-1">{Math.round(Math.min(coins * 5, 100))}%</div>
        </div>
      </section>

      {/* Activities placeholder */}
      <section className="mx-4 mt-4 mb-28">
        <div className="text-[16px] font-bold mb-2">Actividades</div>
        <div className="bg-white rounded-2xl p-6 text-center text-[#6B7280]">No tienes actividades</div>
      </section>

      {adOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
            <div className="text-[18px] font-bold mb-2">Anuncio</div>
            <div className="text-[14px] text-[#6B7280] mb-3">Patrocinado · Mira {countdown ?? 5}s para ganar $0.20 (2.00 monedas)</div>
            <div className="h-40 bg-[#F3F4F6] rounded-xl mb-4 flex items-center justify-center">Ad</div>
            <div className="flex gap-2">
              <button onClick={() => { setAdOpen(false); setWatching(false); setCountdown(null); }} className="flex-1 h-11 rounded-xl border border-[#E5E7EB]">Cerrar</button>
              <button disabled className="flex-1 h-11 rounded-xl bg-[#009DA1] text-white">{countdown ? `Terminando en ${countdown}s` : "Completado"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav simple */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E7EB] h-20 flex items-center justify-center">
        <button onClick={() => router.replace("/dashboard")} className="px-4 py-2 rounded-xl bg-[#009DA1] text-white">Volver al inicio</button>
      </nav>
    </main>
  );
}
