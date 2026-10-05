"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Download, RefreshCw, WifiOff, X } from "lucide-react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function subscribeToConnection(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function connectionSnapshot() {
  return navigator.onLine;
}

function serverConnectionSnapshot() {
  return true;
}

export function PwaManager() {
  const online = useSyncExternalStore(
    subscribeToConnection,
    connectionSnapshot,
    serverConnectionSnapshot,
  );
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [installDismissed, setInstallDismissed] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const reloadingRef = useRef(false);

  const watchRegistration = useCallback((registration: ServiceWorkerRegistration) => {
    registrationRef.current = registration;
    if (registration.waiting && navigator.serviceWorker.controller) setUpdateReady(true);

    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      if (!worker) return;
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) {
          setUpdateReady(true);
        }
      });
    });
  }, []);

  useEffect(() => {
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
      setInstallDismissed(false);
    };
    const handleInstalled = () => setInstallPrompt(null);
    const handleControllerChange = () => {
      if (reloadingRef.current) return;
      reloadingRef.current = true;
      window.location.reload();
    };

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    if (!("serviceWorker" in navigator)) {
      return () => {
        window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
        window.removeEventListener("appinstalled", handleInstalled);
      };
    }

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        watchRegistration(registration);
      } catch {
        // The app remains fully usable when service workers are unavailable.
      }
    };

    if (document.readyState === "complete") void register();
    else window.addEventListener("load", register, { once: true });

    const updateInterval = window.setInterval(() => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        void registrationRef.current?.update();
      }
    }, 60 * 60 * 1000);

    return () => {
      window.clearInterval(updateInterval);
      window.removeEventListener("load", register);
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, [watchRegistration]);

  async function install() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  function applyUpdate() {
    const waiting = registrationRef.current?.waiting;
    if (!waiting) return window.location.reload();
    waiting.postMessage({ type: "SKIP_WAITING" });
  }

  return (
    <>
      {!online && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-0 top-0 z-[200] flex items-center justify-center gap-2 bg-amber-950 px-4 py-2 text-center text-xs font-bold text-white shadow-lg"
        >
          <WifiOff size={15} /> You are offline. Live verification and updates will resume when the connection returns.
        </div>
      )}

      {(updateReady || (installPrompt && !installDismissed)) && (
        <aside
          aria-live="polite"
          className="fixed bottom-4 left-4 right-4 z-[190] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-white/20 bg-[#1a1c1c] p-3 text-sm text-white shadow-2xl"
        >
          {updateReady ? <RefreshCw size={20} /> : <Download size={20} />}
          <p className="min-w-0 flex-1 font-bold">
            {updateReady ? "A safer, newer version is ready." : "Install Shaurya Operations on this device."}
          </p>
          <button
            type="button"
            className="rounded-full bg-[var(--color-primary-container)] px-3 py-2 text-xs font-black"
            onClick={updateReady ? applyUpdate : install}
          >
            {updateReady ? "Update" : "Install"}
          </button>
          {!updateReady && (
            <button
              type="button"
              aria-label="Dismiss install suggestion"
              className="rounded-full p-1 text-white/70 hover:text-white"
              onClick={() => setInstallDismissed(true)}
            >
              <X size={17} />
            </button>
          )}
        </aside>
      )}
    </>
  );
}
