import Link from "next/link";

const leftNavItems = [
  { href: "#description", label: "Description" },
  { href: "#problem-statement", label: "Problem Statement" },
];

const rightNavItems = [
  { href: "#process", label: "Process" },
  { href: "#full-results", label: "Full Results" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-cutcare-border/80 bg-white/90 backdrop-blur">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-3 px-5 py-5 text-center md:grid-cols-[1fr_auto_1fr] md:gap-10">
        <nav
          aria-label="Project description navigation"
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 md:justify-end"
        >
          {leftNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-bold text-cutcare-body transition hover:text-cutcare-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/"
          aria-label="CutCare home"
          className="text-3xl font-black tracking-normal text-cutcare-ink md:text-4xl"
        >
          Cut<span className="text-cutcare-primary">Care</span>
        </Link>
        <nav
          aria-label="Project results navigation"
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 md:justify-start"
        >
          {rightNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-bold text-cutcare-body transition hover:text-cutcare-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
