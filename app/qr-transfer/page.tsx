"use client";

import { USDC_ABI } from "@/lib/constants/abi/usdcAbi";
import { SEPOLIA_BASE_USDC } from "@/lib/constants/contractAddresses";
import { useSmartWallets } from "@privy-io/react-auth/smart-wallets";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  createPublicClient,
  encodeFunctionData,
  formatUnits,
  http,
  parseUnits,
} from "viem";
import { baseSepolia } from "viem/chains";

const recipientAddress = process.env.NEXT_PUBLIC_QR_RECIPIENT_ADDRESS as
  | `0x${string}`
  | undefined;

export default function QRTransferPage() {
  const qrData = {
    recipientName: "María López",
    bankAccount: "GCEXAMPLE1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ123456",
    memo: "987654",
  };

  const router = useRouter();
  const { client } = useSmartWallets();

  const [usdAmount, setUsdAmount] = useState("");
  const [bsAmount, setBsAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  // Configuración
  const [exchangeRate, setExchangeRate] = useState<number>(12.4); // 1 USD = 12.40 Bs (withdrawal rate)
  const baseFeeUsd = 0.5; // fee estático en USD

  // Estado de fee/anuncio
  const [feeWaived, setFeeWaived] = useState(false);
  const [watchingAd, setWatchingAd] = useState(false);
  const [adCountdown, setAdCountdown] = useState<number | null>(null);

  // Balance USDC on-chain
  const [balanceUsdc, setBalanceUsdc] = useState<number | null>(null);
  const [loadingBal, setLoadingBal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: baseSepolia,
        transport: http(),
      }),
    []
  );

  const loadBalance = async () => {
    if (!client?.account?.address) return;
    setLoadingBal(true);
    setErrorMsg(null);
    try {
      const bal = (await publicClient.readContract({
        address: SEPOLIA_BASE_USDC,
        abi: USDC_ABI,
        functionName: "balanceOf",
        args: [client.account.address],
      })) as bigint;
      setBalanceUsdc(parseFloat(formatUnits(bal, 6)));
    } catch (e) {
      console.error("Error cargando balance USDC:", e);
      setErrorMsg("No se pudo cargar el balance USDC");
    } finally {
      setLoadingBal(false);
    }
  };

  useEffect(() => {
    if (client?.account?.address) {
      loadBalance();
    }
    // Load withdrawal exchange rate
    fetch("/api/rates")
      .then((res) => res.json())
      .then((data) => {
        if (data.withdrawalRate) {
          setExchangeRate(parseFloat(data.withdrawalRate));
        }
      })
      .catch(() => {
        // Fallback to default
        setExchangeRate(12.4);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client?.account?.address]);

  const handleUsdChange = (value: string) => {
    // Normalizar coma -> punto
    const norm = value.replace(/,/g, ".");
    setUsdAmount(norm);
    const usd = parseFloat(norm);
    if (!isNaN(usd) && usd > 0) {
      setBsAmount((usd * exchangeRate).toFixed(2));
    } else {
      setBsAmount("");
    }
  };

  const effectiveFeeUsd = useMemo(
    () => (feeWaived ? 0 : baseFeeUsd),
    [feeWaived, baseFeeUsd]
  );
  const totalUsd = useMemo(() => {
    const u = parseFloat(usdAmount || "0");
    if (!u || u <= 0) return "0.00";
    return (u + effectiveFeeUsd).toFixed(2);
  }, [usdAmount, effectiveFeeUsd]);

  const startWatchAd = () => {
    if (watchingAd) return;
    setWatchingAd(true);
    let t = 5; // segundos de demo
    setAdCountdown(t);
    const int = setInterval(() => {
      t -= 1;
      setAdCountdown(t);
      if (t <= 0) {
        clearInterval(int);
        setWatchingAd(false);
        setFeeWaived(true);
        setAdCountdown(null);
      }
    }, 1000);
  };

  const handleTransfer = async () => {
    const u = parseFloat(usdAmount);
    if (!u || u <= 0) {
      window.alert("Por favor ingresa un monto válido");
      return;
    }
    const total = parseFloat(totalUsd);
    if (balanceUsdc !== null && total > balanceUsdc) {
      window.alert("Saldo insuficiente");
      return;
    }

    const confirmed = window.confirm(
      `¿Confirmar transferencia a ${qrData.recipientName}?\n\n` +
        `Monto: $${u.toFixed(2)} USDC\n` +
        `Equivalente: ${bsAmount || "0.00"} Bs\n` +
        `${
          feeWaived
            ? "Fee: $0 (quitado por anuncio)"
            : `Fee: $${baseFeeUsd.toFixed(2)}`
        }\n` +
        `${description ? `Descripción: ${description}` : ""}`
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      if (!client || !client.account?.address) {
        throw new Error("Wallet no disponible. Inicia sesión para continuar.");
      }

      if (!recipientAddress) {
        throw new Error(
          "Dirección de retiro no configurada. Verifica las variables de entorno."
        );
      }

      const amount = parseUnits(total.toString(), 6); // USDC has 6 decimals
      const data = encodeFunctionData({
        abi: USDC_ABI,
        functionName: "transfer",
        args: [recipientAddress, amount],
      });

      const txHash = await client.sendTransaction({
        to: SEPOLIA_BASE_USDC,
        data: data,
        chain: baseSepolia,
      });

      const response = await fetch("/api/webhook/bank/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountUsdc: u.toFixed(6),
          senderAddress: client.account.address,
          recipientBankAccount: qrData.bankAccount,
          recipientName: qrData.recipientName,
          txHash: txHash,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Error al procesar el retiro");
      }

      const result = await response.json();

      router.replace(
        `/withdraw/success?amountUsd=${encodeURIComponent(
          u.toFixed(2)
        )}&amountBs=${encodeURIComponent(bsAmount || "0.00")}&withdrawalId=${
          result.data.withdrawalId
        }&transactionId=${result.data.transactionId}&txHash=${txHash}`
      );
    } catch (err: any) {
      console.error("Error al procesar retiro:", err);
      window.alert(err?.message || "Error al procesar retiro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-dvh bg-[#F3F4F6] text-[#111827] flex flex-col">
      {/* Header */}
      <header className="flex items-center px-4 pt-4 mb-4 gap-3">
        <button
          onClick={() => router.back()}
          className="px-3 py-2 rounded-lg bg-white shadow-sm"
        >
          ←
        </button>
        <h1 className="text-[18px] font-bold">Transferir con QR</h1>
      </header>

      <section className="px-4 pb-24">
        {/* QR Success */}
        <div className="bg-white rounded-2xl p-5 flex flex-col items-center mb-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-[#009DA1]20 flex items-center justify-center mb-3">
            ▦
          </div>
          <div className="text-[18px] font-bold">QR Escaneado Exitosamente</div>
          <div className="text-[14px] text-[#6B7280]">
            Datos del destinatario detectados
          </div>
        </div>

        {/* Recipient Card */}
        <div className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#009DA1]20 flex items-center justify-center">
              👤
            </div>
            <div className="flex-1">
              <div className="text-[18px] font-bold">
                {qrData.recipientName}
              </div>
              <div className="text-[12px] text-[#6B7280] font-mono">
                {qrData.bankAccount.slice(0, 8)}...
                {qrData.bankAccount.slice(-4)}
              </div>
              {qrData.memo && (
                <div className="text-[12px] text-[#009DA1] font-medium">
                  MEMO: {qrData.memo}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Amount Card */}
        <div className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
          <div className="text-[16px] font-bold mb-3">
            ¿Cuánto quieres enviar?
          </div>

          <div className="flex items-center gap-2 text-sm text-[#111827] mb-4">
            <span>1 USD = {exchangeRate.toFixed(2)} Bs</span>
            <span className="ml-auto text-[#6B7280]">
              USDC: {loadingBal ? "Cargando..." : balanceUsdc ?? "--"}
            </span>
          </div>

          {/* Enviando (USDC) */}
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-[14px] text-[#6B7280] mb-1">Enviando</div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#009DA1] text-white text-[12px] font-bold flex items-center justify-center">
                  $
                </div>
                <div className="text-[16px] font-medium">USDC</div>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <input
                className="text-right text-[24px] font-bold outline-none border-b border-[#E5E7EB] w-28"
                placeholder="0.00"
                value={usdAmount}
                onChange={(e) => handleUsdChange(e.target.value)}
                inputMode="decimal"
              />
              <span className="text-[16px] text-[#6B7280]">USDC</span>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center my-2">
            <div className="w-8 h-8 rounded-full bg-[#009DA1] text-white flex items-center justify-center">
              ↓
            </div>
          </div>

          {/* Equivalente Bs */}
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-[14px] text-[#6B7280] mb-1">Equivalente</div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#f0f0f0] flex items-center justify-center">
                  🇧🇴
                </div>
                <div className="text-[16px] font-medium">Bs</div>
              </div>
            </div>
            <div className="text-[20px] font-bold">{bsAmount || "0.00"} Bs</div>
          </div>

          {/* Fee */}
          <div className="mt-4 p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
            <div className="flex items-center justify-between">
              <div className="text-[14px] text-[#6B7280]">Fee</div>
              <div className="text-[14px] font-semibold">
                ${effectiveFeeUsd.toFixed(2)} USDC
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={startWatchAd}
                disabled={watchingAd || feeWaived}
                className={`px-3 py-2 rounded-lg border ${
                  watchingAd || feeWaived
                    ? "bg-white text-[#9CA3AF] border-[#E5E7EB]"
                    : "border-[#009DA1] text-[#009DA1] bg-white"
                }`}
              >
                {feeWaived
                  ? "Fee quitado"
                  : watchingAd
                  ? `Viendo anuncio (${adCountdown}s)`
                  : "Ver anuncio para quitar fee"}
              </button>
              {!feeWaived && (
                <span className="text-[12px] text-[#6B7280]">
                  O paga el fee para continuar
                </span>
              )}
            </div>
          </div>

          {/* Resumen */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-[14px] text-[#6B7280]">Total a descontar</div>
            <div className="text-[16px] font-bold">${totalUsd} USDC</div>
          </div>
        </div>

        {/* Descripción */}
        <div className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
          <div className="text-[16px] font-bold mb-2">
            Descripción (opcional)
          </div>
          <textarea
            className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-3 text-[14px] outline-none"
            placeholder="Agrega una descripción para esta transferencia"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        {/* Info */}
        <div className="px-1 text-[14px] text-[#111827] space-y-2">
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>Transferencia segura vía QR</span>
          </div>
          <div className="flex items-center gap-2">
            <span>⚡</span>
            <span>Procesamiento instantáneo</span>
          </div>
          {errorMsg && (
            <div className="text-[12px] text-[#EF4444]">{errorMsg}</div>
          )}
        </div>
      </section>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E7EB] p-4">
        <button
          onClick={handleTransfer}
          disabled={
            !usdAmount || parseFloat(usdAmount) <= 0 || loading || !client
          }
          className={`w-full rounded-full py-4 font-bold ${
            !usdAmount || parseFloat(usdAmount) <= 0 || loading || !client
              ? "bg-[#D1D5DB] text-[#9CA3AF]"
              : "bg-[#009DA1] text-white"
          }`}
        >
          {loading
            ? "Procesando..."
            : !client
            ? "Conéctate para continuar"
            : feeWaived
            ? "Continuar (sin fee)"
            : `Pagar fee y continuar ($${baseFeeUsd.toFixed(2)})`}
        </button>
      </div>
    </main>
  );
}
