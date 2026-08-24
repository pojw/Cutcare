import type { ReactNode } from "react";

type SectionProps = {
  id?: string;
  title: string;
  description?: string;
  children: ReactNode;
};

export function Section({ id, title, description, children }: SectionProps) {
  return (
    <section id={id} className="mx-auto max-w-6xl scroll-mt-24 px-5 py-12">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl font-black tracking-normal text-cutcare-ink md:text-3xl">
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
