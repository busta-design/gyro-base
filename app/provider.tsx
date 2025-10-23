"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { baseSepolia } from "viem/chains";
import { SmartWalletsProvider } from "@privy-io/react-auth/smart-wallets";

const validateEnv = () => {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const clientId = process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID;

  if (!appId || !clientId) {
    throw new Error(
      "Missing Privy environment variables. Please check your '.env.example' file. Required: NEXT_PUBLIC_PRIVY_APP_ID, NEXT_PUBLIC_PRIVY_CLIENT_ID"
    );
  }

  return { appId, clientId };
};

export default function Providers({ children }: { children: React.ReactNode }) {
  const { appId, clientId } = validateEnv();

  return (
    <PrivyProvider
      appId={appId}
      clientId={clientId}
      config={{
        // Create embedded wallets for users who don't have a wallet
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        defaultChain: baseSepolia,
        supportedChains: [baseSepolia],
      }}
    >
      <SmartWalletsProvider>{children}</SmartWalletsProvider>
    </PrivyProvider>
  );
}
