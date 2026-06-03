import type { Metadata } from "next";
import { Space_Grotesk, Plus_Jakarta_Sans, IBM_Plex_Mono } from "next/font/google";
import { IconProvider } from "@/components/icon-provider";
import "./globals.css";

// Fontes self-hosted (sem @import render-blocking). Variáveis consumidas pelos tokens.
const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const body = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-numeric", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://sistema-g-delta.vercel.app"),
  title: "GDelta — Sistema",
  description: "A inteligência que faz a sua oficina dar lucro. Gestão para oficinas de funilaria e pintura.",
  openGraph: {
    title: "GDelta — Sistema",
    description: "Monte o orçamento e veja lucro e margem ao vivo. Gestão para oficinas de funilaria e pintura.",
    url: "/",
    siteName: "GDelta",
    locale: "pt_BR",
    type: "website",
    images: ["/brand/gdelta-logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "GDelta — Sistema",
    description: "Monte o orçamento e veja lucro e margem ao vivo.",
    images: ["/brand/gdelta-logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`h-full antialiased ${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="min-h-full flex flex-col bg-bg text-fg">
        <IconProvider>{children}</IconProvider>
      </body>
    </html>
  );
}
