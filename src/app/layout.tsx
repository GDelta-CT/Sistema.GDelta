import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GDelta — Sistema",
  description: "A inteligência que faz a sua oficina dar lucro.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-bg text-fg">{children}</body>
    </html>
  );
}
