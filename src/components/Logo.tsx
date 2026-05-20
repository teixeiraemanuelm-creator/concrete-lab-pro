export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dims = size === "lg" ? "h-12 w-12 text-xl" : size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm";
  const text = size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-lg";
  return (
    <div className="flex items-center gap-2">
      <div className={`${dims} rounded-md bg-primary text-primary-foreground font-bold flex items-center justify-center`}>
        CL
      </div>
      <div className={`${text} font-semibold tracking-tight`}>
        Concret<span className="text-primary">Lab</span>
      </div>
    </div>
  );
}
