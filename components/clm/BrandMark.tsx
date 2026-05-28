import Link from "next/link";

interface BrandMarkProps {
  size?: "sm" | "lg";
  href?: string;
}

export function BrandMark({ size = "sm", href = "/" }: BrandMarkProps) {
  const markSize = size === "lg" ? "h-12 w-12 rounded-2xl" : "h-8 w-8 rounded-xl";
  const titleSize = size === "lg" ? "text-2xl" : "text-sm";
  const letterSize = size === "lg" ? "text-2xl" : "text-base";
  const subtitleVisible = size === "lg";

  const content = (
    <span className="inline-flex items-center gap-3">
      <span
        className={`${markSize} relative grid shrink-0 place-items-center overflow-hidden border border-cyan-200/45 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 shadow-[0_0_34px_rgba(34,211,238,0.26)]`}
      >
        <span className="absolute inset-px rounded-[inherit] bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,0.35),transparent_42%)]" />
        <span className="absolute left-1/2 top-2 h-[2px] w-5 -translate-x-1/2 rounded-full bg-cyan-200/70" />
        <span className="absolute bottom-2 left-1/2 h-[2px] w-6 -translate-x-1/2 rounded-full bg-teal-200/60" />
        <span className="absolute left-[11px] top-[9px] h-[18px] w-[2px] rounded-full bg-cyan-100/35" />
        <span className="absolute right-[11px] top-[9px] h-[18px] w-[2px] rounded-full bg-cyan-100/25" />
        <span
          className={`relative -mt-0.5 font-serif ${letterSize} font-black tracking-tight text-white drop-shadow-sm`}
        >
          L
        </span>
      </span>
      <span className="leading-none">
        <span className={`block font-semibold tracking-tight text-white ${titleSize}`}>
          Vertia Legal
        </span>
        {subtitleVisible && (
          <span className="mt-1 block text-xs font-medium uppercase tracking-[0.22em] text-cyan-200">
            Legal Intelligence
          </span>
        )}
      </span>
    </span>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="inline-flex items-center">
      {content}
    </Link>
  );
}
