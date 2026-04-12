"use client";

import { AppKitAccountButton, AppKitConnectButton, useAppKitAccount } from "@reown/appkit/react";

export function AppKitHeaderActions() {
  const { isConnected } = useAppKitAccount();

  return (
    <div className="flex items-center gap-2">
      {!isConnected ? <AppKitConnectButton /> : null}
      <AppKitAccountButton />
    </div>
  );
}
