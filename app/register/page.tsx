"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const { ready, authenticated, login } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    // Podríamos redirigir si ya está autenticado
    if (authenticated) router.replace("/dashboard");
  }, [authenticated]);

  const handleCreateAccount = async () => {
    try {
      await login();
    } catch (e) {
      console.error("Error iniciando Privy login:", e);
    }
  };

  return (
    <main className="min-h-dvh bg-white text-[#171717] flex flex-col">
      {/* Content */}
      <section className="flex-1 flex flex-col items-center px-6 pt-12">
        {/* Logo + title */}
        <div className="flex flex-col items-center mt-10 mb-6 animate-in fade-in slide-in-from-top-2 duration-700 ease-out">
          <Image src="/Gyro$.svg" alt="GYRO" width={160} height={43} priority />
          <div className="flex flex-col items-center mt-6 mb-6 animate-in fade-in duration-700 delay-200">
            <h1 className="text-[28px] font-bold text-[#171717] mt-4 text-center">¡Bienvenido a GYRO!</h1>
            <p className="text-[16px] text-[#555] text-center mt-2 leading-[22px] px-4 font-normal max-w-xl">
              Tu billetera digital para enviar y recibir dinero de forma segura y rápida
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="w-full max-w-xl mt-6 mb-10 px-4 animate-in fade-in duration-700 delay-300">
          <div className="flex items-center mb-2 py-2 px-4 rounded-md shadow-sm" style={{ backgroundColor: "rgba(0, 157, 161, 0.05)" }}>
            <div className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0, 157, 161, 0.1)" }}>
              <span className="text-[#009da1] text-base">✓</span>
            </div>
            <span className="text-[15px] text-[#171717] font-medium ml-3">Seguro y confiable</span>
          </div>
          <div className="flex items-center mb-2 py-2 px-4 rounded-md shadow-sm" style={{ backgroundColor: "rgba(0, 157, 161, 0.05)" }}>
            <div className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0, 157, 161, 0.1)" }}>
              <span className="text-[#009da1] text-base">⚡</span>
            </div>
            <span className="text-[15px] text-[#171717] font-medium ml-3">Transacciones rápidas</span>
          </div>
          <div className="flex items-center mb-2 py-2 px-4 rounded-md shadow-sm" style={{ backgroundColor: "rgba(0, 157, 161, 0.05)" }}>
            <div className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0, 157, 161, 0.1)" }}>
              <span className="text-[#009da1] text-base">🌐</span>
            </div>
            <span className="text-[15px] text-[#171717] font-medium ml-3">Red global Stellar</span>
          </div>
        </div>

        {/* Botones */}
        <div className="w-full max-w-xl mt-4 mb-2 px-6">
          <button
            onClick={handleCreateAccount}
            disabled={!ready}
            className="w-full bg-[#009da1] text-white text-[16px] font-bold rounded-md py-3 px-6 text-center shadow-md mb-2 hover:opacity-95 transition disabled:opacity-60"
          >
            {ready ? "Crear cuenta" : "Preparando..."}
          </button>
          {/*<Link
            href="/login"
            className="block border-2 border-[#009da1] text-[#009da1] text-[15px] font-semibold rounded-md py-3 px-6 text-center bg-transparent mb-4 hover:bg-[#009da10d] transition"
          >
            Ya tengo una cuenta
          </Link>*/}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 pb-2 mt-2">
        <p className="text-[12px] text-[#777] text-center leading-[18px]">
          Al continuar, aceptas nuestros términos y condiciones
        </p>
      </footer>
    </main>
  );
}
