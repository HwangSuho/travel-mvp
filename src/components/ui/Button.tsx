"use client";

import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-orange-500 text-white shadow-sm hover:bg-orange-600 focus-visible:ring-orange-200",
  secondary:
    "border border-slate-200 text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-200",
  ghost:
    "text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-100 border border-transparent",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center rounded-full font-semibold transition focus-visible:outline-none focus-visible:ring-2",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? "w-full justify-center" : "",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
