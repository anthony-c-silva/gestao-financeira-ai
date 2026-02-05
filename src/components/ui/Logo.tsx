"use client";

import React from "react";
import Image from "next/image";

export const Logo = () => {
  return (
    <div className="flex flex-col items-center justify-center mb-8">
      {/* Container do Logo (Imagem SVG) */}
      <div className="relative w-64 h-auto mb-2 transition-transform hover:scale-105">
        <Image
          src="/logo-full.svg" // Certifique-se que o ficheiro está na pasta public
          alt="Gestão.ai Logo"
          width={0}
          height={0}
          sizes="100vw"
          className="w-full h-auto"
          priority
        />
      </div>

      <p className="text-xs sm:text-sm font-medium text-slate-500 tracking-widest uppercase text-center">
    Inteligência que antecipa</p>
    </div>
  );
};