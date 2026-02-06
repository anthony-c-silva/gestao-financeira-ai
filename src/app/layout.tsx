import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import PwaRegister from "@/components/PwaRegister";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Smart Fin",
  description: "Sistema de gestão financeira",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <PwaRegister /> {/* <--- 2. Adicione o componente aqui */}
        {children}
      </body>
    </html>
  );
}