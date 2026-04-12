/** Base URL of the Go API (no trailing slash). */
export function apiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!raw) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not set (e.g. http://localhost:8080)");
  }
  return raw.replace(/\/$/, "");
}
