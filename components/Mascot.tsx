export function Mascot({ size = "md", variant = "logo" }: { size?: "sm" | "md" | "lg"; variant?: "logo" | "banner" }) {
  const className = size === "sm" ? "h-16 w-16" : size === "lg" ? "h-36 w-36" : "h-24 w-24";
  const densityClass = variant === "banner" ? "retro-mark-banner" : "retro-mark-logo";

  return (
    <div className={`${className} ${densityClass} retro-mark relative shrink-0 overflow-hidden rounded-full`} role="img" aria-label="mingle motion mark">
      <span className="retro-mark__grid" />
      <span className="retro-mark__sun" />
      <span className="retro-mark__orbit retro-mark__orbit--outer" />
      <span className="retro-mark__orbit retro-mark__orbit--inner" />
      <span className="retro-mark__shape retro-mark__shape--square" />
      <span className="retro-mark__shape retro-mark__shape--triangle" />
      <span className="retro-mark__shape retro-mark__shape--dot" />
      <span className="retro-mark__bar retro-mark__bar--one" />
      <span className="retro-mark__bar retro-mark__bar--two" />
    </div>
  );
}
