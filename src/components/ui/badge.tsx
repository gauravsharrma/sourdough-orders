import { type ReactNode } from "react";

interface BadgeProps {
  className?: string;
  children: ReactNode;
}

export function Badge({ className = "", children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {children}
    </span>
  );
}
