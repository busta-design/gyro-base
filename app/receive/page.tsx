"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSmartWallets } from "@privy-io/react-auth/smart-wallets";
import { createPublicClient, formatUnits, http } from "viem";
import { baseSepolia } from "viem/chains";
import { USDC_ABI } from "@/lib/constants/abi/usdcAbi";
import { SEPOLIA_BASE_USDC } from "@/lib/constants/contractAddresses";
import { QRCodeSVG } from "qrcode.react";
import Image from "next/image";
import { toPng } from "html-to-image";

export default function ReceiveUsdcPage() {
  const router = useRouter();
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

  const [usdcBalance, setUsdcBalance] = useState<string | null>(null);
  const [loadingBal, setLoadingBal] = useState(false);

  useEffect(() => {
    const loadUsdcBalance = async () => {
      if (!address) return;
      setLoadingBal(true);
      try {
        const result = (await publicClient.readContract({
          address: SEPOLIA_BASE_USDC,
          abi: USDC_ABI,
          functionName: "balanceOf",
          args: [address],
        })) as bigint;
        setUsdcBalance(formatUnits(result, 6));
      } catch (e) {
        console.error("Error reading USDC balance:", e);
      } finally {
        setLoadingBal(false);
      }
    };
    if (address) loadUsdcBalance();
  }, [address, publicClient]);

  const handleShare = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        backgroundColor: "#ffffff",
      });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], "GYRO-QR-Recibir-USDC.png", { type: "image/png" });

      if ((navigator as any).canShare && (navigator as any).canShare({ files: [file] })) {
        await (navigator as any).share({ files: [file], title: "Código QR GYRO - Recibir USDC" });
      } else {
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = "GYRO-QR-Recibir-USDC.png";
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
        <button onClick={() => router.back()} className="px-3 py-2 rounded-lg bg-white shadow-sm">←</button>
        <div className="text-[18px] font-bold">Recibir USDC</div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg bg-white shadow-sm">?</button>
          <button className="p-2 rounded-lg bg-white shadow-sm">▦</button>
        </div>
      </header>
      <section className="px-4 pb-8">
        <h1 className="text-[24px] md:text-[28px] font-bold mb-2">Escanea para recibir USDC</h1>
        <p className="text-[#6B7280] mb-6">Usa la red Base para enviar USDC directamente a tu dirección. No requiere MEMO.</p>

        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <div className="text-[14px] text-[#6B7280] mb-2">Tu dirección</div>
          <div className="font-mono text-[13px] break-all mb-4">
            {address ?? "(inicia sesión para obtener tu dirección)"}
          </div>

          <div className="mb-4" ref={cardRef}>
            <div className="text-[14px] text-[#6B7280] mb-2">Código QR</div>
            <div className="bg-white rounded-xl p-4 flex flex-col gap-3 items-center border border-[#E5E7EB]">
              <div className="mb-2">
                <Image src="/Gyro$.svg" alt="GYRO" width={100} height={28} />
              </div>
              <QRCodeSVG
                value={JSON.stringify({
                  chain: "base-sepolia",
                  token: SEPOLIA_BASE_USDC,
                  address: address ?? "",
                  type: "evm_usdc_deposit",
                })}
                size={200}
                fgColor="#000000"
                bgColor="#FFFFFF"
                includeMargin={false}
              />
              <div className="w-full text-left text-sm">
                <div>Red: <span className="font-semibold">Base Sepolia</span></div>
                <div>Contrato USDC: <span className="font-mono">{SEPOLIA_BASE_USDC}</span></div>
                <div>Dirección: <span className="font-mono">{address ? address.slice(0, 8) + "..." + address.slice(-6) : "--"}</span></div>
              </div>
              <div className="w-full mt-3 pt-3 border-t border-[#E5E7EB] text-center text-xs text-[#6B7280]">
                Envía USDC a esta dirección en la red Base. No requiere MEMO.
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigator.clipboard.writeText(address || "")}
              className="px-4 py-2 rounded-lg bg-white border border-[#E5E7EB]"
            >
              Copiar dirección
            </button>
            <button
              onClick={handleShare}
              className="px-4 py-2 rounded-lg bg-[#009DA1] text-white"
            >
              Compartir
            </button>
          </div>
          <div className="mt-4 text-[12px] text-[#6B7280]">
            {loadingBal ? "Leyendo balance..." : usdcBalance !== null ? `Balance: ${usdcBalance} USDC` : ""}
          </div>
        </div>
      </section>
    </main>
  );
}
