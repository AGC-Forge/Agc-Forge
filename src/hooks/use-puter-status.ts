"use client";

/**
 * usePuterStatus
 *
 * Hook untuk handle error PUTER_AUTH_REQUIRED dari AI API.
 * Saat AI route mengembalikan 401 + code: "PUTER_AUTH_REQUIRED",
 * hook ini memunculkan notifikasi + prompt connect Puter.
 */

import { useCallback } from "react";
import { toast } from "sonner";
import { usePuterAuth } from "@/components/puter/puter-auth-provider";

const AUTO_MODE = process.env.NEXT_PUBLIC_PUTER_AUTO_TOKEN === "true";

export function usePuterStatus() {
  const { isConnected, connect } = usePuterAuth();

  /**
   * Wrapper untuk fetch ke AI routes.
   * Jika response 401 + PUTER_AUTH_REQUIRED, tampilkan toast dengan tombol connect.
   */
  const fetchWithPuterAuth = useCallback(
    async (input: RequestInfo, init?: RequestInit): Promise<Response> => {
      const res = await fetch(input, init);

      // Tangkap error Puter auth
      if (res.status === 401 && AUTO_MODE) {
        const cloned = res.clone();
        try {
          const body = await cloned.json();
          if (body.code === "PUTER_AUTH_REQUIRED") {
            toast.error("A Puter connection required. Please login to Puter to use AI features.", {
              description: body.error ?? "Login to Puter to use the AI features.",
              duration: 8000,
              action: {
                label: "Connect Puter",
                onClick: () => connect(),
              },
            });
          }
        } catch { }
      }

      return res;
    },
    [connect]
  );

  /**
   * Cek apakah siap untuk melakukan AI request.
   * Return false + tampilkan toast jika belum connect.
   */
  const assertPuterReady = useCallback((): boolean => {
    if (!AUTO_MODE) return true; // mode static, selalu ready
    if (isConnected) return true;

    toast.error("Connect Puter first.", {
      description: "Login to Puter to use the AI features.",
      duration: 6000,
      action: {
        label: "Connect",
        onClick: () => connect(),
      },
    });

    return false;
  }, [isConnected, connect]);

  return {
    isConnected: AUTO_MODE ? isConnected : true,
    autoMode: AUTO_MODE,
    fetchWithPuterAuth,
    assertPuterReady,
  };
}
