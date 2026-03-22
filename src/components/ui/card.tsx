import { type ReactNode } from "react";

interface CardProps {
  title?: string;
  className?: string;
  children: ReactNode;
}

export function Card({ title, className = "", children }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-6 shadow-sm ${className}`}
    >
      {title && (
        <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>
      )}
      {children}
    </div>
  );
}
