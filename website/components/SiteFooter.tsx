import Link from "next/link";

import { BrandMark } from "@/components/BrandMark";
import { navItems, site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-cutcare-border bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-8 md:flex-row md:items-center md:justify-between">
        <div>
          <BrandMark compact />
          <p className="mt-3 max-w-xl text-sm leading-6 text-cutcare-body">
            Public information for CutCare users, barbers, and app reviewers.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm font-semibold text-cutcare-body">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-cutcare-primary">
              {item.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="border-t border-cutcare-border/70 px-5 py-4 text-center text-xs text-cutcare-muted">
        © {new Date().getFullYear()} {site.name}. All rights reserved.
      </div>
    </footer>
  );
}
