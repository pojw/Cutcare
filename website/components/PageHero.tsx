type PageHeroProps = {
  eyebrow?: string;
  title: string;
  description: string;
};

export function PageHero({ eyebrow, title, description }: PageHeroProps) {
  return (
    <section className="border-b border-cutcare-border/70 bg-cutcare-soft">
      <div className="mx-auto max-w-4xl px-5 py-14">
        {eyebrow ? (
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-cutcare-primary">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-4xl font-black tracking-normal text-cutcare-ink md:text-5xl">
          {title}
        </h1>
        <p className="mt-4 text-lg leading-8 text-cutcare-body">{description}</p>
      </div>
    </section>
  );
}
