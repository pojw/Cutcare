import Link from "next/link";

import { navItems, site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-cutcare-border bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-5 py-8 text-center md:flex-row md:justify-between md:text-left">
        <div className="max-w-xl">
          <p className="text-xl font-black text-cutcare-ink">
            Cut<span className="text-cutcare-primary">Care</span>
          </p>
          <p className="mt-2 text-sm leading-6 text-cutcare-body">
            Personal project case study covering the problem, process, build
            progress, and technical lessons behind the app.
          </p>
          <p className="mt-3 text-xs font-semibold text-cutcare-muted">
            © {new Date().getFullYear()} {site.name}. All rights reserved.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-4 text-sm font-semibold text-cutcare-body md:justify-end">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-cutcare-primary">
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
