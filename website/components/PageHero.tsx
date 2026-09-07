import Link from "next/link";

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  description: string;
};

export function PageHero({ eyebrow, title, description }: PageHeroProps) {
  return (
    <section className="border-b border-cutcare-border/70 bg-white">
      <div className="mx-auto max-w-4xl px-6 pb-9 pt-10 sm:px-10">
        <Link
          href="/"
          className="mb-8 inline-flex items-center text-sm font-semibold text-cutcare-body transition hover:text-cutcare-primary"
        >
          ← Home
        </Link>
        {eyebrow ? (
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-cutcare-primary">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-3xl font-semibold leading-tight tracking-normal text-cutcare-ink sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-cutcare-body">
          {description}
        </p>
      </div>
    </section>
  );
}
