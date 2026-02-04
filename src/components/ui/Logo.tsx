import React from "react";

export const Logo = () => (
  <div className="flex flex-col items-center justify-center mb-8">
    <div className="w-20 h-20 bg-brand-900 rounded-3xl mb-4 flex items-center justify-center shadow-xl shadow-brand-200">
      <svg
        className="w-10 h-10 text-white"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </div>
    <h1 className="text-3xl font-black text-slate-800 tracking-tight">
      Finanças Simples
    </h1>
    <p className="text-slate-500 mt-2 font-medium">
      Gestão descomplicada para você
    </p>
  </div>
);
