import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type TagVariant = "default" | "accent" | "muted";

type TagProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: TagVariant;
};

const variantClasses: Record<TagVariant, string> = {
  default: "bg-slate-100 text-slate-700",
  accent: "bg-orange-100 text-orange-600",
  muted: "bg-slate-900 text-white",
};

export default function Tag({
  variant = "default",
  className,
  ...props
}: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}

