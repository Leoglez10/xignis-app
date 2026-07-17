import { WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { Network } from "@capacitor/network";

export function OfflineBanner() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => { let active = true; Network.getStatus().then((status) => { if (active) setOnline(status.connected); }).catch(() => setOnline(navigator.onLine)); const promise = Network.addListener("networkStatusChange", (status) => setOnline(status.connected)); const onBrowser = () => setOnline(navigator.onLine); addEventListener("online", onBrowser); addEventListener("offline", onBrowser); return () => { active = false; void promise.then((handle) => handle.remove()); removeEventListener("online", onBrowser); removeEventListener("offline", onBrowser); }; }, []);
  if (online) return null;
  return <div aria-live="assertive" className="fixed inset-x-0 top-0 z-[100] flex min-h-11 items-center justify-center gap-2 bg-amber-400 px-4 text-center text-sm font-bold text-amber-950" role="status"><WifiOff aria-hidden="true" className="size-4" />Sin conexión. Mostraremos la información guardada.</div>;
}
