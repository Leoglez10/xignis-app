import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type ToastTone = "error" | "info" | "success";
type ToastInput = { message: string; title?: string; tone?: ToastTone };
type ToastItem = ToastInput & { id: number };
const ToastContext = createContext<((toast: ToastInput | string) => void) | null>(null);
const icons = { error: TriangleAlert, info: Info, success: CheckCircle2 };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);
  const dismiss = useCallback((id: number) => setItems((current) => current.filter((item) => item.id !== id)), []);
  const show = useCallback((input: ToastInput | string) => {
    const item = typeof input === "string" ? { message: input, tone: "info" as const } : input;
    const id = ++idRef.current;
    setItems((current) => [...current.slice(-2), { ...item, id }]);
    window.setTimeout(() => dismiss(id), item.tone === "error" ? 7000 : 4500);
  }, [dismiss]);
  return <ToastContext.Provider value={show}>{children}{createPortal(<div aria-atomic="false" aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-[90] mx-auto flex max-w-md flex-col gap-2">{items.map((item) => { const tone = item.tone ?? "info"; const Icon = icons[tone]; return <div className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 text-[var(--color-text)] shadow-xl" key={item.id} role={tone === "error" ? "alert" : "status"}><Icon aria-hidden="true" className={`mt-0.5 size-5 shrink-0 ${tone === "success" ? "text-emerald-700" : tone === "error" ? "text-red-700" : "text-blue-700"}`} /><div className="min-w-0 flex-1">{item.title ? <p className="font-bold">{item.title}</p> : null}<p className="text-sm leading-6 text-[var(--color-muted)]">{item.message}</p></div><button aria-label="Cerrar aviso" className="grid size-8 min-h-8 place-items-center rounded-full" type="button" onClick={() => dismiss(item.id)}><X aria-hidden="true" className="size-4" /></button></div>; })}</div>, document.body)}</ToastContext.Provider>;
}
export function useToast() { const value = useContext(ToastContext); if (!value) throw new Error("useToast debe usarse dentro de ToastProvider."); return value; }
