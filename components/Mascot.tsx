export function Mascot({ size = "md", variant = "logo" }: { size?: "sm" | "md" | "lg"; variant?: "logo" | "banner" }) {
  const className = size === "sm" ? "h-16 w-16" : size === "lg" ? "h-36 w-36" : "h-24 w-24";
  const src = variant === "banner" ? "/img/mingu02.PNG" : "/img/mingu01.PNG";

  return (
    <img
      src={src}
      alt="mingle character"
      className={`${className} shrink-0 object-contain object-center`}
    />
  );
}
