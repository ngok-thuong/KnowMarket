import { apiBaseUrl } from "@/lib/api-base";

export type NonceResponse = {
  nonce: string;
  expires_at: string;
  siwe: {
    domain: string;
    uri: string;
    chainId: number;
    statement?: string;
  };
};

export type VerifyResponse = {
  access_token: string;
  expires_at: string;
  user: {
    id: string;
    wallet_address: string;
  };
};

export type MeResponse = {
  id: string;
  wallet_address: string;
};

export async function postAuthNonce(walletAddress: string): Promise<NonceResponse> {
  const res = await fetch(`${apiBaseUrl()}/v1/auth/nonce`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet_address: walletAddress }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `nonce failed: ${res.status}`);
  }
  return res.json() as Promise<NonceResponse>;
}

export async function postAuthVerify(message: string, signature: string): Promise<VerifyResponse> {
  const res = await fetch(`${apiBaseUrl()}/v1/auth/verify`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, signature }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `verify failed: ${res.status}`);
  }
  return res.json() as Promise<VerifyResponse>;
}

export async function getMe(signal?: AbortSignal): Promise<MeResponse> {
  const res = await fetch(`${apiBaseUrl()}/v1/me`, {
    credentials: "include",
    signal,
  });
  if (!res.ok) {
    throw new Error(`me failed: ${res.status}`);
  }
  return res.json() as Promise<MeResponse>;
}

export async function postLogout(): Promise<void> {
  const res = await fetch(`${apiBaseUrl()}/v1/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(`logout failed: ${res.status}`);
  }
}
