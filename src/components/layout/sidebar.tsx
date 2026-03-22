"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/orders", label: "Orders" },
  { href: "/products", label: "Products" },
  { href: "/settings", label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="fixed left-4 top-4 z-50 rounded-lg bg-amber-500 p-2 text-white shadow-md md:hidden"
        aria-label="Toggle navigation"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          {open ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-amber-900 text-amber-50 transition-transform duration-200 md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-amber-800 px-6 py-5">
          <span className="text-3xl" role="img" aria-label="bread">
            🍞
          </span>
          <span className="text-lg font-bold tracking-tight">Sourdough Orders</span>
        </div>

        {/* Navigation */}
        <nav className="mt-4 flex-1 space-y-1 px-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`block rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-amber-800 text-white"
                  : "text-amber-200 hover:bg-amber-800/50 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
