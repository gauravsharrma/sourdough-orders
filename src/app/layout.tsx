import type { Metadata } from "next";
import { Sidebar } from "@/components/layout/sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sourdough Orders",
  description: "Order management dashboard for your sourdough bakery",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-stone-50 text-stone-900" suppressHydrationWarning>
        <div className="flex h-screen">
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-6 lg:p-8 md:ml-64">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
