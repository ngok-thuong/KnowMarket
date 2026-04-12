import Image from "next/image";
import Link from "next/link";

import { AppKitHeaderActions } from "@/components/wallet/appkit-header-actions";

const nav = [
  { href: "/questions", label: "Bounty Q&A" },
  { href: "/posts", label: "Posts" },
  { href: "/contribute", label: "Contribute" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-ink/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-mono text-sm font-semibold tracking-tight text-paper transition hover:text-brand-bright"
        >
          <Image
            src="/logo.svg"
            alt=""
            width={32}
            height={32}
            className="shrink-0"
            priority
          />
          <span>KnowMarket</span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-paper/70 transition hover:text-paper"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <AppKitHeaderActions />
          <Link
            href="/questions"
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-paper transition hover:bg-brand-dim"
          >
            Explore
          </Link>
        </div>
      </div>
    </header>
  );
}
