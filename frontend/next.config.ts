import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080",
    NEXT_PUBLIC_SIWE_CHAIN_ID: process.env.NEXT_PUBLIC_SIWE_CHAIN_ID ?? "8453",
    NEXT_PUBLIC_APP_ORIGIN: process.env.NEXT_PUBLIC_APP_ORIGIN ?? "http://localhost:3000",
    NEXT_PUBLIC_REOWN_PROJECT_ID: process.env.NEXT_PUBLIC_REOWN_PROJECT_ID ?? "",
  },
  transpilePackages: ["@reown/appkit", "@reown/appkit-adapter-wagmi", "@reown/appkit-siwe"],
  webpack: (config) => {
    // Alias optional native modules that are not available in a browser/Next.js build.
    // @metamask/sdk pulls in @react-native-async-storage/async-storage (React Native only).
    // @walletconnect/logger pulls in pino-pretty (Node CLI dev tool).
    config.resolve.alias = {
      ...config.resolve.alias,
      "@react-native-async-storage/async-storage": false,
      "pino-pretty": false,
    };
    return config;
  },
};

export default nextConfig;
