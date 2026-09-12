import Link from "next/link";

const leftNavItems = [
  { href: "#process", label: "Process" },
  { href: "#description", label: "Description" },
];

const rightNavItems = [
  { href: "#problem-statement", label: "Problem Statement" },
  { href: "#full-results", label: "Full Results" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur">
      <div className="mx-auto w-full max-w-6xl px-6 py-5 sm:px-10">
        <div className="grid items-center gap-4 border-b border-cutcare-border/80 pb-4 text-center lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <nav
            aria-label="Project description navigation"
            className="order-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-base font-semibold text-cutcare-body lg:order-1 lg:justify-end lg:gap-x-8"
          >
            {leftNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition hover:text-cutcare-primary"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/"
            aria-label="CutCare home"
            className="order-1 text-3xl font-black leading-tight tracking-normal text-cutcare-ink sm:text-4xl lg:order-2 lg:px-5"
          >
            Cut<span className="text-cutcare-primary">Care</span>
          </Link>
          <nav
            aria-label="Project results navigation"
            className="order-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-base font-semibold text-cutcare-body lg:justify-start lg:gap-x-8"
          >
            {rightNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition hover:text-cutcare-primary"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
