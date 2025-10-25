"use client";

import { USDC_ABI } from "@/lib/constants/abi/usdcAbi";
import { SEPOLIA_BASE_USDC } from "@/lib/constants/contractAddresses";
import { useSmartWallets } from "@privy-io/react-auth/smart-wallets";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  createPublicClient,
  encodeFunctionData,
  formatUnits,
  http,
  isAddress,
  parseUnits,
} from "viem";
import { baseSepolia } from "viem/chains";

interface BankAccount {
  id: string;
  name: string;
  accountNumber: string;
  bank: string;
  isOwn: boolean;
}

function WithdrawUsdc() {
  const router = useRouter();
  const { client } = useSmartWallets();
  const address = client?.account?.address;

  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: baseSepolia,
        transport: http(),
      }),
    []
  );

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [adOpen, setAdOpen] = useState(false);
  const [adWatched, setAdWatched] = useState(false);
  const baseFee = 0.12;
  const networkFee = adWatched ? 0 : baseFee;
  const [exchangeRate, setExchangeRate] = useState<number>(12.4); // 1 USD = 12.40 Bs (withdrawal rate)

  useEffect(() => {
    const load = async () => {
      if (!address) return;
      try {
        const bal = (await publicClient.readContract({
          address: SEPOLIA_BASE_USDC,
          abi: USDC_ABI,
          functionName: "balanceOf",
          args: [address],
        })) as bigint;
        setBalance(formatUnits(bal, 6));
      } catch (e) {
        console.error("Error reading USDC balance:", e);
      }
    };
    load();
  }, [address, publicClient]);

  // Load withdrawal exchange rate (for success screen Bs amount)
  useEffect(() => {
    fetch("/api/rates")
      .then((res) => res.json())
      .then((data) => {
        if (data.withdrawalRate) {
          setExchangeRate(parseFloat(data.withdrawalRate));
        }
      })
      .catch(() => setExchangeRate(12.4));
  }, []);

  const handleMax = () => {
    if (balance) setAmount(balance);
  };

  const handleContinue = () => {
    const amt = parseFloat(amount);

    // Validar monto
    if (!amount || isNaN(amt) || amt <= 0) {
      window.alert("Por favor ingresa un monto válido");
      return;
    }

    // Validar dirección
    if (!recipient || !isAddress(recipient)) {
      window.alert("Por favor ingresa una dirección Ethereum válida");
      return;
    }

    setShowConfirm(true);
  };

  const handleSend = async () => {
    if (!client || !client.account?.address) {
      window.alert("Inicia sesión para continuar");
      return;
    }

    const amt = parseFloat(amount);

    // Validar monto
    if (!amount || isNaN(amt) || amt <= 0) {
      window.alert("Por favor ingresa un monto válido");
      return;
    }

    // Validar dirección
    if (!recipient || !isAddress(recipient)) {
      window.alert("Por favor ingresa una dirección Ethereum válida");
      return;
    }

    // Validar que el monto no exceda el balance
    if (balance && amt > parseFloat(balance)) {
      window.alert("Saldo insuficiente");
      return;
    }

    setLoading(true);
    try {
      // Encode the USDC transfer function call
      // transfer(address to, uint256 amount)
      const transferAmount = parseUnits(amt.toFixed(6), 6);
      const transferData = encodeFunctionData({
        abi: USDC_ABI,
        functionName: "transfer",
        args: [recipient as `0x${string}`, transferAmount],
      });

      console.log(
        `[WITHDRAW USDC] Sending ${amt} USDC to ${recipient} via smart wallet`
      );

      // Send the transaction using smart wallet
      const txHash = await client.sendTransaction({
        to: SEPOLIA_BASE_USDC,
        data: transferData,
        chain: baseSepolia,
      });

      console.log(`[WITHDRAW USDC] Transaction sent: ${txHash}`);

      setShowConfirm(false);
      const amountBs = (amt * exchangeRate).toFixed(2);
      router.replace(
        `/withdraw/success?amountUsd=${encodeURIComponent(
          amt.toFixed(2)
        )}&amountBs=${encodeURIComponent(amountBs)}&txHash=${encodeURIComponent(
          txHash
        )}&recipientAddress=${encodeURIComponent(recipient)}`
      );
    } catch (e) {
      if (e instanceof Error) {
        console.error("Error sending USDC:", e);
        window.alert(e?.message || "Error al enviar USDC");
      } else {
        console.error("Error sending USDC:", e);
        window.alert("Error al enviar USDC");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-dvh bg-[#F3F4F6] text-[#111827] flex flex-col">
      <header className="flex items-center px-4 pt-4 mb-4">
        <button
          onClick={() => router.back()}
          className="px-3 py-2 rounded-lg bg-white shadow-sm"
        >
          ←
        </button>
      </header>
      <section className="px-4 pb-8">
        <h1 className="text-[24px] md:text-[28px] font-bold mb-6">
          Enviar USDC
        </h1>

        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <div className="mb-4">
            <div className="text-[14px] text-[#6B7280] mb-2">
              Dirección destino (EVM)
            </div>
            <input
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className={`w-full bg-[#F3F4F6] border rounded-xl py-3 px-3 text-[16px] ${
                recipient && !isAddress(recipient)
                  ? "border-[#EF4444]"
                  : "border-[#D1D5DB]"
              }`}
              placeholder="0x..."
              autoComplete="off"
            />
            <div className="flex items-center justify-between mt-1">
              <div className="text-[12px] text-[#6B7280]">
                Red: Base Sepolia • Token: USDC
              </div>
              {recipient && (
                <div
                  className={`text-[12px] ${
                    isAddress(recipient) ? "text-[#10B981]" : "text-[#EF4444]"
                  }`}
                >
                  {isAddress(recipient)
                    ? "✓ Dirección válida"
                    : "✗ Dirección inválida"}
                </div>
              )}
            </div>
          </div>

          <div className="mb-2">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[14px] text-[#6B7280]">Monto</div>
              <button
                onClick={handleMax}
                className="text-[14px] text-[#009DA1]"
              >
                Máx
              </button>
            </div>
            <div className="relative">
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/,/g, "."))}
                className="w-full bg-[#F3F4F6] border border-[#D1D5DB] rounded-xl py-3 pl-3 pr-20 text-[16px]"
                placeholder="0.00"
                inputMode="decimal"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280]">
                USDC
              </div>
            </div>
            <div className="text-[12px] text-[#6B7280] mt-1">
              Disponible {balance ?? "--"} USDC
            </div>
          </div>

          <div className="h-px bg-[#E5E7EB] my-3" />
          <div className="flex items-center justify-between text-[14px]">
            <div className="text-[#6B7280]">Comisión de red</div>
            <div>{networkFee.toFixed(2)} USDC</div>
          </div>
          {!adWatched ? (
            <div className="mt-2 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] p-3 flex items-center justify-between">
              <div className="text-[12px] text-[#6B7280]">Mira un anuncio para cubrir la comisión</div>
              <button onClick={() => setAdOpen(true)} className="h-8 px-3 rounded-lg bg-[#009DA1] text-white text-[12px]">Ver anuncio</button>
            </div>
          ) : (
            <div className="mt-2 rounded-xl bg-[#ECFDF5] border border-[#D1FAE5] p-3 text-[12px] text-[#065F46]">Comisión cubierta por anuncio</div>
          )}
          <div className="flex items-center justify-between text-[16px] font-semibold mt-2">
            <div>Total</div>
            <div>
              {(parseFloat(amount || "0") + networkFee).toFixed(2)} USDC
            </div>
          </div>

          <div className="mt-5">
            <button
              onClick={handleContinue}
              disabled={
                !recipient ||
                !amount ||
                !isAddress(recipient) ||
                parseFloat(amount) <= 0 ||
                isNaN(parseFloat(amount))
              }
              className="w-full h-12 rounded-xl bg-[#009DA1] text-white disabled:opacity-50"
            >
              Continuar
            </button>
          </div>
        </div>

        {showConfirm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-5 max-w-sm w-full">
              <div className="text-[18px] font-bold mb-4">Confirmar envío</div>
              <div className="text-[14px] text-[#6B7280] mb-2">
                Vas a enviar
              </div>
              <div className="text-[20px] font-bold mb-4">
                {parseFloat(amount || "0").toFixed(2)} USDC
              </div>
              <div className="text-[14px] mb-1">
                A: <span className="font-mono">{recipient}</span>
              </div>
              <div className="text-[14px] mb-4">
                Comisión de red: {networkFee.toFixed(2)} USDC
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 h-11 rounded-xl border border-[#E5E7EB]"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSend}
                  disabled={loading}
                  className="flex-1 h-11 rounded-xl bg-[#009DA1] text-white disabled:opacity-50"
                >
                  {loading ? "Enviando..." : "Confirmar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
      {adOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
            <div className="text-[18px] font-bold mb-2">Anuncio</div>
            <div className="text-[14px] text-[#6B7280] mb-4">Patrocinado · Mira 5 segundos para cubrir tu comisión</div>
            <div className="h-36 bg-[#F3F4F6] rounded-xl mb-4 flex items-center justify-center">Ad</div>
            <div className="flex gap-2">
              <button onClick={() => setAdOpen(false)} className="flex-1 h-11 rounded-xl border border-[#E5E7EB]">Cerrar</button>
              <button
                onClick={() => {
                  setTimeout(() => {
                    setAdWatched(true);
                    setAdOpen(false);
                  }, 5000);
                }}
                className="flex-1 h-11 rounded-xl bg-[#009DA1] text-white"
              >
                Ver ahora
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function WithdrawNewContent() {
  const router = useRouter();
  const search = useSearchParams();
  const type = search?.get("type") || "bs";

  const [searchText, setSearchText] = useState("");
  const [showAccountSelection, setShowAccountSelection] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(
    null
  );

  const mockAccounts: BankAccount[] = [
    {
      id: "1",
      name: "Leonardo",
      accountNumber: "****1234",
      bank: "Banco Nacional de Bolivia",
      isOwn: true,
    },
    {
      id: "2",
      name: "María González",
      accountNumber: "****5678",
      bank: "Banco Mercantil Santa Cruz",
      isOwn: false,
    },
    {
      id: "3",
      name: "Carlos Mendoza",
      accountNumber: "****9012",
      bank: "Banco Económico",
      isOwn: false,
    },
  ];

  const filtered = useMemo(() => {
    const t = searchText.toLowerCase();
    return mockAccounts.filter(
      (a) =>
        a.name.toLowerCase().includes(t) || a.accountNumber.includes(searchText)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    window.alert(
      `Cuenta seleccionada (demo)\n\n${selectedAccount?.name}\n${
        isOwn ? "Cuenta propia" : "Cuenta de tercero"
      }`
    );
    router.push("/withdraw");
  };

  const handleAddNew = () => {
    window.alert("Agregar nueva cuenta (demo)");
  };

  if (type !== "bs") {
    // USDC withdraw (crypto) UI
    return <WithdrawUsdc />;
  }

  return (
    <main className="min-h-dvh bg-[#F3F4F6] text-[#111827] flex flex-col">
      <header className="flex items-center px-4 pt-4 mb-4">
        <button
          onClick={handleBack}
          className="px-3 py-2 rounded-lg bg-white shadow-sm"
        >
          ←
        </button>
      </header>

      <section className="px-4 pb-8">
        {!showAccountSelection ? (
          <div>
            <h1 className="text-[28px] font-bold leading-tight mb-6">
              ¿A qué cuenta en Bolivia deseas depositar?
            </h1>

            <div className="relative mb-4">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]">
                🔎
              </div>
              <input
                className="w-full bg-white border border-[#E5E7EB] rounded-xl py-3 pl-10 pr-3 text-[16px]"
                placeholder="Buscar por nombre o número de cuenta"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            <button
              onClick={handleAddNew}
              className="flex items-center gap-2 mb-4"
            >
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-[#009DA1] text-white">
                ＋
              </span>
              <span className="text-[#009DA1] font-medium">
                Agregar nueva cuenta bancaria
              </span>
            </button>

            <button
              onClick={() => router.push("/qr-transfer")}
              className="w-full bg-white border border-[#E5E7EB] rounded-xl p-4 flex items-center justify-between mb-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#009DA1]20 flex items-center justify-center">
                  ▦
                </div>
                <div>
                  <div className="text-[16px] font-semibold">
                    Escanear QR para transferir
                  </div>
                  <div className="text-[14px] text-[#6B7280]">
                    Detecta automáticamente el destinatario
                  </div>
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
                    <div className="w-10 h-10 rounded-full bg-[#F3F4F6] flex items-center justify-center">
                      🏦
                    </div>
                    <div className="text-left">
                      <div className="text-[16px] font-semibold">{a.name}</div>
                      <div className="text-[14px] text-[#6B7280]">
                        Cuenta Bs terminada en {a.accountNumber.slice(-4)}
                      </div>
                    </div>
                  </div>
                  <span className="text-[#9CA3AF]">›</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <h1 className="text-[20px] font-bold leading-tight mb-6">
              ¿De quién es la cuenta?
            </h1>

            <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-[#F3F4F6] flex items-center justify-center">
                🏦
              </div>
              <div className="text-left">
                <div className="text-[16px] font-semibold">
                  {selectedAccount?.name}
                </div>
                <div className="text-[14px] text-[#6B7280]">
                  Cuenta Bs terminada en{" "}
                  {selectedAccount?.accountNumber.slice(-4)}
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              <button
                onClick={() => handleAccountTypeSelect(true)}
                className="bg-white border border-[#E5E7EB] rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#009DA1]20 flex items-center justify-center">
                    👤
                  </div>
                  <div className="text-[16px] font-medium">
                    La cuenta es mía
                  </div>
                </div>
                <span className="text-[#9CA3AF]">›</span>
              </button>

              <button
                onClick={() => handleAccountTypeSelect(false)}
                className="bg-white border border-[#E5E7EB] rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#009DA1]20 flex items-center justify-center">
                    👥
                  </div>
                  <div className="text-[16px] font-medium">
                    La cuenta es de un tercero
                  </div>
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

export default function WithdrawNewPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <WithdrawNewContent />
    </Suspense>
  );
}
