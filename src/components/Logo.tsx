import { siteConfig } from "~/site.config";

/** Wordmark echoing the facade sign: "MHD" + red "AUTO" tag. */
export default function Logo({ className = "" }: { className?: string }) {
  const [first, ...rest] = siteConfig.name.split(" ");
  return (
    <span dir="ltr" className={`inline-flex items-center gap-2 font-display text-[28px] font-black leading-none tracking-wide ${className}`}>
      {first}
      {rest.length > 0 && <b className="bg-signal px-[7px] pb-[3px] pt-[4px] text-[11px] font-extrabold tracking-[0.28em] text-white">{rest.join(" ")}</b>}
    </span>
  );
}
