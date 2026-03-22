import { type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-300 disabled:bg-amber-300",
  secondary:
    "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-300 disabled:bg-gray-100 disabled:text-gray-400",
  danger:
    "bg-red-600 text-white hover:bg-red-700 focus:ring-red-300 disabled:bg-red-300",
  ghost:
    "bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-200 disabled:text-gray-400",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
