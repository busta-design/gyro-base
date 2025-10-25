"use client";

import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useSmartWallets } from "@privy-io/react-auth/smart-wallets";
import { useMemo } from "react";

export default function AccountPage() {
  const router = useRouter();
  const { user, logout } = usePrivy();
  const { client } = useSmartWallets();

  const address = client?.account?.address || "--";
  const displayName = useMemo(() => {
    return user?.email?.address || user?.phone?.number || "Mi cuenta";
  }, [user]);

  return (
    <main className="min-h-dvh bg-[#F3F4F6] text-[#111827] flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <header className="flex items-center justify-between px-4 pt-4 mb-6">
          <button onClick={() => router.back()} className="px-4 py-2 rounded-xl bg-white shadow-sm">←</button>
          <div className="text-[16px] font-semibold">Mi cuenta</div>
          <div className="w-10" />
        </header>

        <section className="bg-white mx-4 p-5 rounded-2xl mb-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#009DA1] text-white flex items-center justify-center text-xl font-bold">
              {String(displayName || "").charAt(0).toUpperCase() || "G"}
            </div>
            <div className="flex-1">
              <div className="text-[18px] font-bold">{displayName}</div>
              <div className="text-[14px] text-[#6B7280]">{user?.email?.address || user?.phone?.number || ""}</div>
            </div>
          </div>
        </section>

        <section className="bg-white mx-4 p-5 rounded-2xl mb-6 shadow-sm">
          <div className="text-[14px] text-[#6B7280] mb-1">Dirección de billetera</div>
          <div className="flex items-center justify-between gap-3">
            <div className="font-mono text-[14px] break-all">{address}</div>
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(address);
                  alert("Dirección copiada");
                } catch {}
              }}
              className="px-3 h-10 rounded-lg bg-[#009DA1] text-white text-[14px]"
            >
              Copiar
            </button>
          </div>
        </section>

        <section className="bg-white mx-4 p-2 rounded-2xl mb-6 shadow-sm">
          <div className="divide-y divide-[#E5E7EB]">
            <button onClick={() => router.push("/withdraw")} className="w-full flex items-center justify-between p-4 text-left">
              <span className="text-[16px]">Retiros</span>
              <span>›</span>
            </button>
            <button onClick={() => router.push("/funding")} className="w-full flex items-center justify-between p-4 text-left">
              <span className="text-[16px]">Depósitos</span>
              <span>›</span>
            </button>
            <button onClick={() => router.push("/qr-transfer")} className="w-full flex items-center justify-between p-4 text-left">
              <span className="text-[16px]">Transferir con QR</span>
              <span>›</span>
            </button>
            <button onClick={() => router.push("/ads")} className="w-full flex items-center justify-between p-4 text-left">
              <span className="text-[16px]">Ver anuncios</span>
              <span>›</span>
            </button>
          </div>
        </section>

        <section className="mx-4 mb-28 grid gap-3">
          <button onClick={() => router.push("/dashboard")} className="h-12 rounded-xl bg-white border border-[#E5E7EB]">Ir al inicio</button>
          <button onClick={logout} className="h-12 rounded-xl bg-[#EF4444] text-white shadow-[0_6px_18px_rgba(239,68,68,0.35)]">Cerrar sesión</button>
        </section>
      </div>
    </main>
  );
}
