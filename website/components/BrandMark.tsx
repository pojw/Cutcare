import Image from "next/image";
import Link from "next/link";

type BrandMarkProps = {
  compact?: boolean;
};

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="CutCare home">
      <Image
        src="/icon.png"
        alt=""
        width={compact ? 36 : 44}
        height={compact ? 36 : 44}
        className="rounded-xl"
        priority={!compact}
      />
      <span
        className={`font-black tracking-normal text-cutcare-ink ${
          compact ? "text-xl" : "text-2xl"
        }`}
      >
        Cut<span className="text-cutcare-primary">Care</span>
      </span>
    </Link>
  );
}
