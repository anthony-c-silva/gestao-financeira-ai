"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

type UnauthorizedHandler = () => void;

/**
 * Hook para centralizar o tratamento de erros 401 (sessão expirada).
 *
 * - Remove o usuário do localStorage
 * - Opcionalmente dispara um callback (ex: toast)
 * - Redireciona para /login
 */
export function useAuthFetch(onUnauthorized?: UnauthorizedHandler) {
  const router = useRouter();

  const handleUnauthorized = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("user");
      } catch {
        // se o localStorage falhar, apenas segue com o redirect
      }
    }

    if (onUnauthorized) {
      onUnauthorized();
    }

    router.push("/login");
  }, [router, onUnauthorized]);

  const authFetch = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const res = await fetch(input, init);

      if (res.status === 401) {
        handleUnauthorized();
      }

      return res;
    },
    [handleUnauthorized],
  );

  return authFetch;
}

