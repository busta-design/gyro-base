"use client";

import { usePrivy, useSendTransaction } from "@privy-io/react-auth";
import { parseEther, createPublicClient, http, formatEther } from "viem";
import { baseSepolia } from "viem/chains";
import { useSmartWallets } from "@privy-io/react-auth/smart-wallets";
import { useState, useEffect } from "react";

export default function Home() {
  const { ready, authenticated, user, login, logout } = usePrivy();

  // normal transaction
  const { sendTransaction } = useSendTransaction();

  const { client } = useSmartWallets();

  const [balance, setBalance] = useState<string | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  // base sepolia normal transaction
  const handleSendTransaction = async () => {
    const tx = await sendTransaction({
      to: "0x0000000000000000000000000000000000000000",
      value: parseEther("0.001"),
    });

    console.log(tx);
  };

  // get smart wallet balance
  const getSmartWalletBalance = async () => {
    if (!client?.account) {
      console.log("Smart wallet no disponible");
      return;
    }

    setLoadingBalance(true);
    try {
      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http(),
      });

      const balanceWei = await publicClient.getBalance({
        address: client.account.address,
      });

      const balanceEth = formatEther(balanceWei);
      setBalance(balanceEth);
      console.log(`Balance: ${balanceEth} ETH`);
    } catch (error) {
      console.error("Error al obtener balance:", error);
    } finally {
      setLoadingBalance(false);
    }
  };

  // Cargar balance automáticamente cuando el cliente está disponible
  useEffect(() => {
    if (authenticated && client?.account) {
      getSmartWalletBalance();
    }
  }, [client, authenticated]);

  // sponsored functions
  const sendSmartTx = async () => {
    if (!client) return;
    try {
      const txHash = await client.sendTransaction({
        chain: baseSepolia,
        to: "0xd72F92902D1b40a7F047D9A3E8278dcBfE26a9E3",
        value: parseEther("0.001"),
      });
      console.log("Transaction hash:", txHash);
      // Refrescar balance después de enviar
      setTimeout(() => getSmartWalletBalance(), 2000);
    } catch (error) {
      console.error("Error sending transaction:", error);
    }
  };

  if (!ready) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Hello World!</h1>

      {authenticated ? (
        <>
          <button onClick={logout}>Logout</button>
          <button onClick={handleSendTransaction}>Send Transaction</button>
          <br />
          <br />
          <button className="bg-amber-400 p-2" onClick={sendSmartTx}>
            Send Smart Tx (0.001 ETH)
          </button>
          <hr />
          <h2>Smart Wallet Balance</h2>
          {balance ? (
            <p style={{ fontSize: "18px", fontWeight: "bold" }}>
              Balance: {balance} ETH
            </p>
          ) : (
            <p>Cargando balance...</p>
          )}
          <button onClick={getSmartWalletBalance} disabled={loadingBalance}>
            {loadingBalance ? "Cargando..." : "Refrescar Balance"}
          </button>
        </>
      ) : (
        <button onClick={login}>Login</button>
      )}

      <pre>data: {JSON.stringify(user?.smartWallet, null, 2)}</pre>
    </div>
  );
}
