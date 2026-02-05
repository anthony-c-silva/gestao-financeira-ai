"use client";
import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registrado com sucesso:", registration);
        })
        .catch((error) => {
          console.error("Falha ao registrar SW:", error);
        });
    }
  }, []);

  return null; // Este componente não renderiza nada visual
}