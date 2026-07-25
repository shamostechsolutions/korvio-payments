import { cn } from "@/lib/utils/cn";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading = false,
  children,
  disabled,
  ...props
}: Props) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)] disabled:opacity-50",
        size === "sm" && "px-3 py-2 text-sm",
        size === "md" && "px-4 py-2.5 text-sm",
        size === "lg" && "px-5 py-3 text-base",
        variant === "primary" &&
          "bg-[var(--brand)] text-[#042f2e] shadow-sm hover:opacity-90",
        variant === "secondary" &&
          "border border-[var(--line)] bg-[var(--bg-elevated)] text-[var(--ink)] hover:bg-[var(--bg)]",
        variant === "ghost" &&
          "bg-transparent text-[var(--brand-soft)] hover:bg-[var(--bg-elevated)]",
        variant === "danger" && "bg-[var(--danger)] text-white hover:opacity-90",
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}
