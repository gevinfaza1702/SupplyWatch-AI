import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SupplyWatch AI — Radar Harga Komoditas & Biaya untuk UMKM",
    template: "%s · SupplyWatch AI",
  },
  description:
    "Pantau harga komoditas global, kurs USD/IDR, dan risiko biaya bahan baku dengan insight AI yang praktis untuk UMKM Indonesia.",
  keywords: [
    "komoditas",
    "UMKM",
    "harga bahan baku",
    "AI",
    "kurs USD IDR",
    "coffee shop",
    "bakery",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>{children}</body>
    </html>
  );
}
