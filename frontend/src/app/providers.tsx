"use client";

import { createAppKit } from "@reown/appkit/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { cookieToInitialState, WagmiProvider, type Config } from "wagmi";

import { reownSiweConfig } from "@/config/reown-siwe";
import { appKitNetworks, projectId, wagmiAdapter } from "@/config/reown-wagmi";

const appOrigin = process.env.NEXT_PUBLIC_APP_ORIGIN ?? "http://localhost:3000";

// "use client" modules are still evaluated on the server during SSR in Next.js
// App Router. Guard createAppKit() so it only runs in the browser: the function
// attempts to access window, WebSocket, and localStorage which do not exist in
// Node.js, causing double-initialization errors and broken modal state.
if (typeof window !== "undefined") {
  createAppKit({
    adapters: [wagmiAdapter],
    projectId: projectId || "00000000000000000000000000000000",
    networks: appKitNetworks,
    defaultNetwork: appKitNetworks[0],
    metadata: {
      name: "KnowMarket",
      description: "Web3 knowledge marketplace",
      url: appOrigin,
      icons: [`${appOrigin}/logo.svg`],
    },
    siweConfig: reownSiweConfig,
    features: {
      analytics: false,
    },
  });
}

export function Providers({
  children,
  cookies,
}: {
  children: ReactNode;
  cookies: string | null;
}) {
  const [queryClient] = useState(() => new QueryClient());
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies ?? undefined);

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
