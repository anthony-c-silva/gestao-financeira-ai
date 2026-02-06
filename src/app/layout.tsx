import React from "react"; // 1. Evita erros de TypeScript
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import PwaRegister from "@/components/PwaRegister";

const inter = Inter({ subsets: ["latin"] });

// 2. Configuração Visual Mobile (Cor da barra e Zoom)
export const viewport: Viewport = {
  themeColor: "#ffffff", // Cor da barra do navegador no celular
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Impede zoom pinça (comportamento de app)
};

export const metadata: Metadata = {
  title: "Smart Fin",
  description: "Sistema de gestão financeira",
  manifest: "/manifest.json",
  // 3. Garante ícones em todos os dispositivos (especialmente iPhone)
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Smart Fin",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}