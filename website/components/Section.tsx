import type { ReactNode } from "react";

type SectionProps = {
  id?: string;
  title: string;
  description?: string;
  children: ReactNode;
};

export function Section({ id, title, description, children }: SectionProps) {
  return (
    <section id={id} className="mx-auto max-w-6xl scroll-mt-24 px-6 py-12 sm:px-10">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl font-semibold leading-tight tracking-normal text-cutcare-ink sm:text-3xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-3 text-base leading-7 text-cutcare-body">{description}</p>
        ) : null}
      </div>
      <div className="mt-8">{children}</div>
    </section>
  );
}
