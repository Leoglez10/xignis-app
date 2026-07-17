import { App as CapacitorApp } from "@capacitor/app";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const allowed = new Set(["/login", "/set-password", "/forgot-password", "/employee", "/manager", "/admin"]);
export function DeepLinkHandler() {
  const navigate = useNavigate();
  useEffect(() => {
    const handle = (raw: string) => {
      try {
        const url = new URL(raw);
        const path = url.pathname === "/" && url.host ? `/${url.host}` : url.pathname;
        if (allowed.has(path) || path.startsWith("/employee/requests/")) navigate(`${path}${url.search}${url.hash}`);
      } catch { /* Ignora enlaces externos o malformados. */ }
    };
    const listener = CapacitorApp.addListener("appUrlOpen", ({ url }) => handle(url));
    void CapacitorApp.getLaunchUrl().then((result) => { if (result?.url) handle(result.url); });
    return () => { void listener.then((handle) => handle.remove()); };
  }, [navigate]);
  return null;
}
