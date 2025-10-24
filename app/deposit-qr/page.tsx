"use client";

import { USDC_ABI } from "@/lib/constants/abi/usdcAbi";
import { SEPOLIA_BASE_USDC } from "@/lib/constants/contractAddresses";
import { useSmartWallets } from "@privy-io/react-auth/smart-wallets";
import { toPng } from "html-to-image";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";

export default function DepositQrPage() {
  const router = useRouter();
  const search = useSearchParams();
  const { client } = useSmartWallets();
  const address = client?.account?.address;
  const cardRef = useRef<HTMLDivElement | null>(null);

  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: baseSepolia,
        transport: http(),
      }),
    []
  );

  const initialAmount = search?.get("amount") ?? "";
  const amountBob = initialAmount;
  const expiryDays = search?.get("expiryDays") ?? "1";
  const usdAmountParam = search?.get("usdAmount") ?? "";
  const [txHash, setTxHash] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  // const [error, setError] = useState<string | null>(null);
  // const [usdcBalance, setUsdcBalance] = useState<string | null>(null);
  // const [loadingBal, setLoadingBal] = useState(false);

  const loadUsdcBalance = useCallback(async () => {
    if (!address) return;
    // setLoadingBal(true);
    try {
      // const result = (await publicClient.readContract({
      (await publicClient.readContract({
        address: SEPOLIA_BASE_USDC,
        abi: USDC_ABI,
        functionName: "balanceOf",
        args: [address],
      })) as bigint;
      // setUsdcBalance(formatUnits(result, 6));
    } catch (e) {
      console.error("Error reading USDC balance:", e);
    } finally {
      // setLoadingBal(false);
    }
  }, [address, publicClient]);

  useEffect(() => {
    if (address) loadUsdcBalance();
  }, [address, loadUsdcBalance]);

  const sendMockDeposit = async () => {
    if (!address) return;
    setSending(true);
    // setError(null);
    setTxHash(null);
    try {
      const resp = await fetch("/api/mock/bank-deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amountBob || 0),
          recipientAddress: address,
        }),
      });
      const data = await resp.json();
      if (!resp.ok || !data?.success) {
        throw new Error(data?.error || `HTTP ${resp.status}`);
      }
      setTxHash(data?.data?.transactionHash ?? null);
    } catch (e) {
      console.log(e);
      // setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSending(false);
    }
  };

  const explorerUrl = txHash
    ? `https://sepolia.basescan.org/tx/${txHash}`
    : null;

  const canSimulate = !!amountBob && Number(amountBob) > 0;

  const handleShare = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        backgroundColor: "#ffffff",
      });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], "GYRO-QR-Deposito.png", {
        type: "image/png",
      });

      if (
        (navigator as any).canShare &&
        (navigator as any).canShare({ files: [file] })
      ) {
        await (navigator as any).share({
          files: [file],
          title: "Código QR GYRO - Depósito",
        });
      } else {
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = "GYRO-QR-Deposito.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (e) {
      console.error("Error al compartir la imagen del QR:", e);
    }
  };

  return (
    <main className="min-h-dvh bg-[#F3F4F6] text-[#111827] flex flex-col">
      <header className="flex items-center justify-between px-4 pt-4 mb-4">
        <button
          onClick={() => router.push("/dashboard")}
          className="px-3 py-2 rounded-lg bg-white shadow-sm"
        >
          ←
        </button>
      </header>
      <section className="px-4 pb-8">
        <h1 className="text-[24px] md:text-[28px] font-bold mb-2">
          Depositar en Bolivianos (QR)
        </h1>
        <p className="text-[#6B7280] mb-6">
          Escanea este QR para transferir. Monto{" "}
          {canSimulate ? "fijado" : "libre"}.
        </p>

        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <div className="text-[14px] text-[#6B7280] mb-2">Tu dirección</div>
          <div className="font-mono text-[13px] break-all mb-4">
            {address ?? "(inicia sesión para obtener tu dirección)"}
          </div>

          <div className="mb-4" ref={cardRef}>
            <div className="text-[14px] text-[#6B7280] mb-2">Código QR</div>
            <div className="bg-white rounded-xl p-4 flex flex-col gap-3 items-center border border-[#E5E7EB]">
              <div className="mb-2">
                {/* Logo GYRO encima del QR. Coloca tu SVG en /public/gyro.svg */}
                <Image src="/Gyro$.svg" alt="GYRO" width={100} height={28} />
              </div>
              <QRCodeSVG
                value={JSON.stringify({
                  publicKey: address ?? "",
                  amount: amountBob ? Number(amountBob) : 0,
                  currency: "BOB",
                  type: "deposit",
                  memo: "Depósito GYRO",
                  expiryDays: Number(expiryDays || "1"),
                })}
                size={200}
                fgColor="#000000"
                bgColor="#FFFFFF"
                includeMargin={false}
              />
              <div className="w-full text-left text-sm">
                <div>
                  Destino:{" "}
                  <span className="font-mono">
                    {address
                      ? address.slice(0, 8) + "..." + address.slice(-6)
                      : "--"}
                  </span>
                </div>
                <div>
                  Monto (BOB):{" "}
                  <span className="font-semibold">
                    {amountBob || "Monto libre"}
                  </span>
                </div>
                {usdAmountParam && (
                  <div>
                    Equivalente:{" "}
                    <span className="font-semibold">{usdAmountParam} USDC</span>
                  </div>
                )}
              </div>
              <div className="w-full mt-3 pt-3 border-t border-[#E5E7EB] text-center text-xs text-[#6B7280]">
                Escanea con tu app de banco para transferir
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            {canSimulate && (
              <button
                disabled={!address || sending}
                onClick={sendMockDeposit}
                className="px-4 py-2 rounded-lg bg-[#009DA1] text-white disabled:opacity-50"
              >
                {sending ? "Enviando..." : "Simular pago (mock)"}
              </button>
            )}
            <button
              onClick={() =>
                router.push(
                  `/fund?currentAmount=${encodeURIComponent(
                    amountBob || ""
                  )}&currentExpiry=${encodeURIComponent(expiryDays)}`
                )
              }
              className="px-4 py-2 rounded-lg bg-white border border-[#E5E7EB]"
            >
              Editar
            </button>
            <button
              onClick={handleShare}
              className="px-4 py-2 rounded-lg bg-[#009DA1] text-white"
            >
              Compartir
            </button>
          </div>
          {txHash && (
            <div className="mt-3 text-sm">
              Transacción enviada: <span className="font-mono">{txHash}</span>
              {explorerUrl && (
                <a
                  className="ml-2 text-[#009DA1] underline"
                  href={explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Ver en BaseScan
                </a>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
