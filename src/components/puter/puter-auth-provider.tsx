"use client";

/**
 * PuterAuthProvider
 *
 * Client component yang harus dibungkus di sekitar app layout.
 * Tugasnya:
 *   1. Load puter.js script di browser
 *   2. Cek apakah user sudah login ke Puter
 *   3. Jika sudah login: sync token ke server (DB)
 *   4. Saat halaman focus (tab switch): re-validate token
 *   5. Saat app logout: panggil puter signOut
 *
 * Hanya aktif jika NEXT_PUBLIC_PUTER_AUTO_TOKEN=true
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";
import { toast } from "sonner";

interface PuterAuthState {
  isLoaded: boolean; // puter.js script sudah load
  isConnected: boolean; // user sudah login ke Puter
  puterUsername: string | null;
  puterUid: string | null;
  isConnecting: boolean; // sedang dalam proses login popup
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const PuterAuthContext = createContext<PuterAuthState>({
  isLoaded: false,
  isConnected: false,
  puterUsername: null,
  puterUid: null,
  isConnecting: false,
  connect: async () => {},
  disconnect: async () => {},
});

export function usePuterAuth() {
  return useContext(PuterAuthContext);
}

const AUTO_MODE = process.env.NEXT_PUBLIC_PUTER_AUTO_TOKEN === "true";

function loadPuterScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return resolve();
    if ((window as any).puter) return resolve(); // sudah load

    const existing = document.querySelector(
      'script[src="https://js.puter.com/v2/"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://js.puter.com/v2/";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export function PuterAuthProvider({ children }: { children: React.ReactNode }) {
  // Jika bukan auto mode, render children langsung tanpa logika Puter
  if (!AUTO_MODE) {
    return <>{children}</>;
  }

  return <PuterAuthProviderInner>{children}</PuterAuthProviderInner>;
}

function PuterAuthProviderInner({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [puterUsername, setPuterUsername] = useState<string | null>(null);
  const [puterUid, setPuterUid] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const initDone = useRef(false);

  // ── Sync token ke server ────────────────────────────────────────────────────

  const syncTokenToServer = useCallback(
    async (
      token: string,
      username?: string,
      uuid?: string,
      app_uid?: string,
    ) => {
      try {
        const res = await fetch("/api/puter-auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, username, uuid, app_uid }),
        });

        if (res.ok) {
          const { data } = await res.json();
          setIsConnected(true);
          setPuterUsername(data.puter_username ?? username ?? null);
          setPuterUid(data.puter_uid ?? uuid ?? null);
        } else {
          setIsConnected(false);
        }
      } catch (err) {
        console.error("[PuterAuth] sync error:", err);
      }
    },
    [],
  );

  // ── Check status dari server ──────────────────────────────────────────────────

  const checkServerStatus = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch("/api/puter-auth");
      if (!res.ok) return;
      const { data } = await res.json();
      setIsConnected(data.connected ?? false);
      setPuterUsername(data.puter_username ?? null);
      setPuterUid(data.puter_uid ?? null);
    } catch {}
  }, [session?.user?.id]);

  // ── Init: load puter.js + auto-sync ──────────────────────────────────────────

  useEffect(() => {
    if (status !== "authenticated" || initDone.current) return;
    initDone.current = true;

    const init = async () => {
      try {
        await loadPuterScript();
        setIsLoaded(true);

        const puter = (window as any).puter;
        if (!puter) return;

        // Cek apakah sudah login di browser
        const signedIn = puter.auth.isSignedIn();

        if (signedIn) {
          // Ambil token yang ada di localStorage puter
          const token = puter.authToken ?? puter.auth?.authToken;

          if (token) {
            await syncTokenToServer(token);
          } else {
            // Fallback: ambil via getUser (kalau token tidak langsung accessible)
            await checkServerStatus();
          }
        } else {
          // Cek DB: mungkin ada token tersimpan dari sebelumnya
          await checkServerStatus();
        }
      } catch (err) {
        console.error("[PuterAuth] init error:", err);
        setIsLoaded(true);
      }
    };

    init();
  }, [status, syncTokenToServer, checkServerStatus]);

  // ── Re-validate saat window focus ───────────────────────────────────────────

  useEffect(() => {
    if (!isLoaded || !session?.user?.id) return;

    const handleFocus = async () => {
      const puter = (window as any).puter;
      if (!puter) return;

      const signedIn = puter.auth.isSignedIn();

      if (signedIn) {
        const token = puter.authToken ?? puter.auth?.authToken;
        if (token) {
          // Re-sync jika token berubah
          await syncTokenToServer(token);
        }
      } else if (isConnected) {
        // User logout dari Puter di tab lain
        await fetch("/api/puter-auth", { method: "DELETE" });
        setIsConnected(false);
        setPuterUsername(null);
        toast.warning("Puter session expired. Please connect again.");
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [isLoaded, isConnected, session?.user?.id, syncTokenToServer]);

  // ── Connect: buka popup login Puter ─────────────────────────────────────────

  const connect = useCallback(async () => {
    const puter = (window as any).puter;
    if (!puter) {
      toast.error("Puter.js not ready. Refresh the page to try again.");
      return;
    }

    setIsConnecting(true);
    try {
      const result = await puter.auth.signIn();
      // result: { success, token, app_uid, username }

      if (result?.token) {
        await syncTokenToServer(
          result.token,
          result.username,
          undefined,
          result.app_uid,
        );
        toast.success(`Connected to Puter as ${result.username ?? "user"}!`);
      } else {
        toast.error("Login Puter gagal.");
      }
    } catch (err: any) {
      if (
        err?.message?.includes("cancelled") ||
        err?.message?.includes("closed")
      ) {
        toast.info("Puter login cancelled.");
      } else {
        toast.error("Failed to login to Puter.");
        console.error("[PuterAuth] connect error:", err);
      }
    } finally {
      setIsConnecting(false);
    }
  }, [syncTokenToServer]);

  // ── Disconnect: logout dari Puter + invalidasi DB ────────────────────────────

  const disconnect = useCallback(async () => {
    const puter = (window as any).puter;

    // Logout dari Puter browser (kalau puter API tersedia)
    try {
      if (puter && puter.auth.isSignedIn()) {
        await puter.auth.signOut();
      }
    } catch {}

    // Invalidasi di server
    await fetch("/api/puter-auth", { method: "DELETE" });

    setIsConnected(false);
    setPuterUsername(null);
    setPuterUid(null);
    toast.success("Puter disconnected.");
  }, []);

  // ── Cascade logout: jika user logout dari app, logout juga dari Puter ────────

  useEffect(() => {
    if (status === "unauthenticated" && isConnected) {
      const timeoutId = window.setTimeout(() => {
        void disconnect().catch(() => {});
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }
  }, [status, isConnected, disconnect]);

  return (
    <PuterAuthContext.Provider
      value={{
        isLoaded,
        isConnected,
        puterUsername,
        puterUid,
        isConnecting,
        connect,
        disconnect,
      }}
    >
      {children}
    </PuterAuthContext.Provider>
  );
}
