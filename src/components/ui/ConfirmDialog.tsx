import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Button } from "./Button";
import { Modal } from "./Modal";

type ConfirmOptions = { confirmLabel?: string; description: string; destructive?: boolean; title: string };
const ConfirmContext = createContext<((options: ConfirmOptions) => Promise<boolean>) | null>(null);
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);
  const confirm = useCallback((next: ConfirmOptions) => new Promise<boolean>((resolve) => { resolver.current = resolve; setOptions(next); }), []);
  const finish = useCallback((value: boolean) => { resolver.current?.(value); resolver.current = null; setOptions(null); }, []);
  return <ConfirmContext.Provider value={confirm}>{children}<Modal description={options?.description} isOpen={Boolean(options)} title={options?.title ?? "Confirmar"} onClose={() => finish(false)}>{options ? <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button variant="secondary" onClick={() => finish(false)}>Cancelar</Button><Button variant={options.destructive ? "danger" : "primary"} onClick={() => finish(true)}>{options.confirmLabel ?? "Confirmar"}</Button></div> : null}</Modal></ConfirmContext.Provider>;
}
export function useConfirm() { const value = useContext(ConfirmContext); if (!value) throw new Error("useConfirm debe usarse dentro de ConfirmProvider."); return value; }
