import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mavi Vadi · Simülasyon",
  description: "Rol temelli GRC simülasyonu ve atölye yönetimi.",
  icons: {
    icon: "/brand.svg",
    shortcut: "/brand.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
