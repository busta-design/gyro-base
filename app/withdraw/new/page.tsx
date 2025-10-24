"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface BankAccount {
  id: string;
  name: string;
  accountNumber: string;
  bank: string;
  isOwn: boolean;
}

export default function WithdrawNewPage() {
  const router = useRouter();
  const search = useSearchParams();
  const type = search?.get("type") || "bs";

  const [searchText, setSearchText] = useState("");
  const [showAccountSelection, setShowAccountSelection] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);

  const mockAccounts: BankAccount[] = [
    { id: "1", name: "Leonardo", accountNumber: "****1234", bank: "Banco Nacional de Bolivia", isOwn: true },
    { id: "2", name: "María González", accountNumber: "****5678", bank: "Banco Mercantil Santa Cruz", isOwn: false },
    { id: "3", name: "Carlos Mendoza", accountNumber: "****9012", bank: "Banco Económico", isOwn: false },
  ];

  const filtered = useMemo(() => {
    const t = searchText.toLowerCase();
    return mockAccounts.filter(a => a.name.toLowerCase().includes(t) || a.accountNumber.includes(searchText));
  }, [searchText]);

  const handleBack = () => {
    if (showAccountSelection && selectedAccount) {
      setShowAccountSelection(false);
      setSelectedAccount(null);
      return;
    }
    router.back();
  };

  const handleAccountSelect = (acc: BankAccount) => {
    setSelectedAccount(acc);
    setShowAccountSelection(true);
  };

  const handleAccountTypeSelect = (isOwn: boolean) => {
    window.alert(`Cuenta seleccionada (demo)\n\n${selectedAccount?.name}\n${isOwn ? "Cuenta propia" : "Cuenta de tercero"}`);
    router.push("/withdraw");
  };

  const handleAddNew = () => {
    window.alert("Agregar nueva cuenta (demo)");
  };

  if (type !== "bs") {
    return (
      <main className="min-h-dvh bg-[#F3F4F6] text-[#111827] flex flex-col">
        <header className="flex items-center px-4 pt-4 mb-4">
          <button onClick={handleBack} className="px-3 py-2 rounded-lg bg-white shadow-sm">←</button>
        </header>
        <section className="px-4 pb-8">
          <h1 className="text-[24px] md:text-[28px] font-bold mb-2">Retiro en USDC</h1>
          <p className="text-[#6B7280]">Pantalla placeholder. Define aquí address de destino y monto en USDC.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-[#F3F4F6] text-[#111827] flex flex-col">
      <header className="flex items-center px-4 pt-4 mb-4">
        <button onClick={handleBack} className="px-3 py-2 rounded-lg bg-white shadow-sm">←</button>
      </header>

      <section className="px-4 pb-8">
        {!showAccountSelection ? (
          <div>
            <h1 className="text-[28px] font-bold leading-tight mb-6">¿A qué cuenta en Bolivia deseas depositar?</h1>

            <div className="relative mb-4">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]">🔎</div>
              <input
                className="w-full bg-white border border-[#E5E7EB] rounded-xl py-3 pl-10 pr-3 text-[16px]"
                placeholder="Buscar por nombre o número de cuenta"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            <button onClick={handleAddNew} className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-[#009DA1] text-white">＋</span>
              <span className="text-[#009DA1] font-medium">Agregar nueva cuenta bancaria</span>
            </button>

            <button
              onClick={() => router.push("/qr-transfer")}
              className="w-full bg-white border border-[#E5E7EB] rounded-xl p-4 flex items-center justify-between mb-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#009DA1]20 flex items-center justify-center">▦</div>
                <div>
                  <div className="text-[16px] font-semibold">Escanear QR para transferir</div>
                  <div className="text-[14px] text-[#6B7280]">Detecta automáticamente el destinatario</div>
                </div>
              </div>
              <span className="text-[#9CA3AF]">›</span>
            </button>

            <div className="divide-y divide-[#F3F4F6]">
              {filtered.map((a) => (
                <button
                  key={a.id}
                  onClick={() => handleAccountSelect(a)}
                  className="w-full bg-white border border-[#E5E7EB] rounded-xl p-4 flex items-center justify-between mb-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#F3F4F6] flex items-center justify-center">🏦</div>
                    <div className="text-left">
                      <div className="text-[16px] font-semibold">{a.name}</div>
                      <div className="text-[14px] text-[#6B7280]">Cuenta Bs terminada en {a.accountNumber.slice(-4)}</div>
                    </div>
                  </div>
                  <span className="text-[#9CA3AF]">›</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <h1 className="text-[20px] font-bold leading-tight mb-6">¿De quién es la cuenta?</h1>

            <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-[#F3F4F6] flex items-center justify-center">🏦</div>
              <div className="text-left">
                <div className="text-[16px] font-semibold">{selectedAccount?.name}</div>
                <div className="text-[14px] text-[#6B7280]">Cuenta Bs terminada en {selectedAccount?.accountNumber.slice(-4)}</div>
              </div>
            </div>

            <div className="grid gap-3">
              <button
                onClick={() => handleAccountTypeSelect(true)}
                className="bg-white border border-[#E5E7EB] rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#009DA1]20 flex items-center justify-center">👤</div>
                  <div className="text-[16px] font-medium">La cuenta es mía</div>
                </div>
                <span className="text-[#9CA3AF]">›</span>
              </button>

              <button
                onClick={() => handleAccountTypeSelect(false)}
                className="bg-white border border-[#E5E7EB] rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#009DA1]20 flex items-center justify-center">👥</div>
                  <div className="text-[16px] font-medium">La cuenta es de un tercero</div>
                </div>
                <span className="text-[#9CA3AF]">›</span>
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
