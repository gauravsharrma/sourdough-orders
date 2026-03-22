import { type ReactNode } from "react";

interface HeaderProps {
  title: string;
  children?: ReactNode;
}

export function Header({ title, children }: HeaderProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
}
