import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-ink px-4 text-center">
      <p className="font-mono text-sm text-brand-bright">404</p>
      <h1 className="text-2xl font-semibold text-paper">Page not found</h1>
      <Link href="/" className="text-sm font-medium text-brand-bright hover:text-paper">
        ← Back home
      </Link>
    </div>
  );
}
