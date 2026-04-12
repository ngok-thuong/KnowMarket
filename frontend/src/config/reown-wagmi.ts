import type { AppKitNetwork } from "@reown/appkit/networks";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { base, hardhat } from "@reown/appkit/networks";
import { cookieStorage, createStorage } from "wagmi";

const chainId = Number(process.env.NEXT_PUBLIC_SIWE_CHAIN_ID || 8453);

export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID ?? "";


export const appKitNetworks = (
  chainId === 31337 ? [hardhat] : [base]
) as [AppKitNetwork, ...AppKitNetwork[]];

export const wagmiAdapter = new WagmiAdapter({
  projectId: projectId || "00000000000000000000000000000000",
  networks: appKitNetworks,
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
});
