import Link from "next/link";

import { BrandMark } from "@/components/BrandMark";
import { navItems } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-cutcare-border/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
        <BrandMark compact />
        <nav aria-label="Main navigation" className="flex flex-wrap justify-end gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-2 text-sm font-semibold text-cutcare-body transition hover:bg-cutcare-mist hover:text-cutcare-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
