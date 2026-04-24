"use client";

import { createSIWEConfig, type SIWECreateMessageArgs, type SIWEMessageArgs } from "@reown/appkit-siwe";
import { SiweMessage } from "siwe";

import {
  getMe,
  postAuthNonce,
  postAuthVerify,
  postLogout,
  type NonceResponse,
} from "@/lib/auth-api";

const SIWE_SESSION_KEY = "km_siwe_appkit_session";

// lastNonce is owned exclusively by the sign-in flow:
//   getNonce  → sets it
//   createMessage → reads it
//   verifyMessage → clears it (success or failure)
//   signOut   → clears it (explicit logout)
//
// It must NOT be cleared by getSession or clearClientAuth because those
// run concurrently with the sign-in flow and would race with createMessage.
let lastNonce: NonceResponse | null = null;

/** SIWX / mapToSIWX calls this before getNonce; it must return a truthy object or signing fails. */
function getStaticSiweMessageParams(): SIWEMessageArgs {
  const origin = (process.env.NEXT_PUBLIC_APP_ORIGIN ?? "http://localhost:3000").replace(/\/$/, "");
  const host = new URL(origin).host;
  const chainId = Number(process.env.NEXT_PUBLIC_SIWE_CHAIN_ID || 8453);
  return {
    domain: host,
    uri: origin,
    chains: [chainId],
  };
}

/** AppKit passes `did:pkh:eip155:…:0x…` into createMessage; SiweMessage needs a bare 0x address. */
function parseEvmAddressFromSiwxAddress(address: string): `0x${string}` {
  const m = address.match(/0x[a-fA-F0-9]{40}/i);
  if (!m) {
    throw new Error("Invalid wallet address in sign-in message.");
  }
  return m[0] as `0x${string}`;
}

function readSession(): { address: string; chainId: number } | null {
  try {
    const raw = sessionStorage.getItem(SIWE_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { address: string; chainId: number };
  } catch {
    return null;
  }
}

function writeSession(s: { address: string; chainId: number }) {
  sessionStorage.setItem(SIWE_SESSION_KEY, JSON.stringify(s));
}

// Clears only the persisted auth credentials (sessionStorage session cache).
// Does NOT touch lastNonce — that state
// belongs to the sign-in flow and clearing it here would race with the
// getNonce → createMessage → verifyMessage sequence.
function clearClientAuth() {
  sessionStorage.removeItem(SIWE_SESSION_KEY);
}

export const reownSiweConfig = createSIWEConfig({
  getMessageParams: async () => getStaticSiweMessageParams(),

  getNonce: async (address?: string) => {
    if (!address) {
      throw new Error("Connect a wallet before signing in.");
    }
    const raw = await postAuthNonce(address);
    // EIP-4361 requires nonce to match [a-zA-Z0-9]{8,}.
    // The backend issues UUID nonces that contain hyphens, which siwe v2
    // rejects with INVALID_NONCE in the SiweMessage constructor.
    // Stripping hyphens produces a 32-char hex string that passes validation.
    // The backend's uuid.Parse handles both hyphenated and bare-hex formats,
    // so nonce lookup in Postgres is unaffected.
    lastNonce = { ...raw, nonce: raw.nonce.replace(/-/g, "") };
    return lastNonce.nonce;
  },

  createMessage: (args: SIWECreateMessageArgs) => {
    const ctx = lastNonce;
    if (!ctx || ctx.nonce !== args.nonce) {
      throw new Error("Sign-in session expired. Close the modal and try again.");
    }
    const address = parseEvmAddressFromSiwxAddress(args.address);
    return new SiweMessage({
      domain: ctx.siwe.domain,
      address,
      statement: ctx.siwe.statement || undefined,
      uri: ctx.siwe.uri,
      version: "1",
      chainId: ctx.siwe.chainId,
      nonce: args.nonce,
    }).prepareMessage();
  },

  verifyMessage: async ({ message, signature }) => {
    try {
      const res = await postAuthVerify(message, signature);
      const chainId =
        lastNonce?.siwe.chainId ?? Number(process.env.NEXT_PUBLIC_SIWE_CHAIN_ID || 8453);
      writeSession({ address: res.user.wallet_address, chainId });
      lastNonce = null;
      return true;
    } catch {
      lastNonce = null;
      return false;
    }
  },

  getSession: async () => {
    try {
      const cached = readSession();
      if (cached) return cached;
      // Guard: default fetch timeout is 60-120 s. If the backend is unreachable,
      // AppKit waits for getSession before rendering the connect button, freezing
      // the header. Abort after 5 s so the UI recovers quickly.
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5_000);
      try {
        const me = await getMe(controller.signal);
        const chainId = Number(process.env.NEXT_PUBLIC_SIWE_CHAIN_ID || 8453);
        const s = { address: me.wallet_address, chainId };
        writeSession(s);
        return s;
      } finally {
        clearTimeout(timer);
      }
    } catch {
      // Cookie is expired/invalid or backend unreachable — clear credentials so
      // the user is prompted to sign in again. lastNonce is intentionally left
      // untouched (see note at top of file).
      clearClientAuth();
      return null;
    }
  },

  signOut: async () => {
    try {
      await postLogout();
    } catch {
      /* still clear client */
    }
    clearClientAuth();
    lastNonce = null; // explicit sign-out: also discard any pending sign-in nonce
    return true;
  },

  signOutOnDisconnect: true,
  signOutOnAccountChange: true,
  signOutOnNetworkChange: false,
});
