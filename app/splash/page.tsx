"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SplashPage() {
  const [progress, setProgress] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const start = Date.now();
    const duration = 2000; // similar a RN example
    const tick = () => {
      const elapsed = Date.now() - start;
      const ratio = Math.min(1, elapsed / duration);
      setProgress(ratio);
      if (ratio < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      router.replace("/register");
    }, 3200); // espera para mostrar animaciones
    return () => clearTimeout(t);
  }, [router]);

  return (
    <main className="min-h-dvh bg-white text-[#171717] flex flex-col items-center justify-center px-8">
      {/* Logo + tagline */}
      <div className="flex flex-col items-center my-auto animate-in fade-in duration-700">
        <Image src="/Gyro$.svg" alt="GYRO" width={160} height={42} priority />
        <p className="text-[18px] text-[#6b7280] mt-6 tracking-wider font-light">
          Digital Wallet
        </p>
      </div>

      {/* Footer with loading */}
      <div className="flex flex-col items-center mb-16">
        <p className="text-[16px] text-[#6b7280] mb-4 font-normal">Inicializando...</p>
        <div className="w-[240px] h-1 bg-[#e5e7eb] rounded-lg overflow-hidden shadow-sm">
          <div
            className="h-full bg-[#009da1] rounded-lg shadow-[0_0_10px_rgba(0,157,161,0.3)] transition-[width] duration-150 ease-out"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
    </main>
  );
}
