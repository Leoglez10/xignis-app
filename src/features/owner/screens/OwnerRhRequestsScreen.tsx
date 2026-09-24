import { useQuery } from "@tanstack/react-query";
import { Crown, Send } from "lucide-react";
import { useState } from "react";
import { Button } from "../../../components/ui/Button";
import { TextArea } from "../../../components/ui/TextArea";
import { AdminShell } from "../../admin/components/adminNav";
import { createOwnerRequest, listMyOwnerRequests } from "../services/ownerService";
import { useToast } from "../../../components/ui/Toast";

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "ahora";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `hace ${days}d`;
  const months = Math.floor(days / 30);
  return `hace ${months}m`;
}

export function OwnerRhRequestsScreen() {
  const toast = useToast();
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: requests, error: listError, isLoading, refetch } = useQuery({
    queryKey: ["owner", "rh-requests"],
    queryFn: listMyOwnerRequests,
  });

  async function handleSubmit() {
    setError(null);
    if (!message.trim()) {
      setError("Escribí tu pedido antes de enviar.");
      return;
    }
    try {
      setSaving(true);
      await createOwnerRequest({ message: message.trim() });
      setMessage("");
      toast({ message: "Pedido enviado a RH.", tone: "success" });
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el pedido.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell>
      <div className="page-wrap pb-24 pt-5 md:pt-6">
        <header className="animate-fade-up mb-5">
          <p className="text-sm font-bold text-[var(--color-muted)]">Suite del dueño</p>
          <h2 className="mt-1 text-2xl font-bold md:text-3xl">Pedidos a RH</h2>
        </header>

        <section className="animate-fade-up mb-5 rounded-[24px] bg-white p-5 ring-1 ring-slate-200">
          <div className="mb-3 flex items-center gap-2 text-amber-600">
            <Crown aria-hidden="true" className="size-5" />
            <h3 className="text-sm font-bold uppercase tracking-wide">Nuevo pedido</h3>
          </div>
          <TextArea
            label="¿Qué necesitas que revise RH?"
            placeholder="Ej. Quiero entender el saldo de vacaciones de un empleado..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          {error ? (
            <p className="mt-3 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700" role="alert">
              {error}
            </p>
          ) : null}
          <Button
            className="mt-4 w-full bg-amber-500 text-amber-950 hover:bg-amber-400"
            disabled={saving}
            onClick={handleSubmit}
          >
            <Send aria-hidden="true" className="size-4" />
            {saving ? "Enviando…" : "Enviar pedido a RH"}
          </Button>
        </section>

        {listError ? (
          <p className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
            {listError instanceof Error ? listError.message : "No se pudieron cargar los pedidos."}
          </p>
        ) : null}

        <section aria-labelledby="rh-list-title">
          <h3 className="mb-3 text-base font-bold" id="rh-list-title">Tus pedidos</h3>
          {isLoading ? (
            <p className="text-sm font-semibold text-[var(--color-muted)]">Cargando…</p>
          ) : (requests ?? []).length === 0 ? (
            <p className="rounded-2xl bg-white p-6 text-center text-sm font-semibold text-[var(--color-muted)] ring-1 ring-slate-200">
              Aún no hiciste ningún pedido a RH.
            </p>
          ) : (
            <ul className="stagger space-y-3">
              {(requests ?? []).map((req) => (
                <li
                  key={req.id}
                  className="rounded-[20px] bg-white p-5 ring-1 ring-slate-200"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        req.status === "open"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {req.status === "open" ? "Abierta" : "Resuelta"}
                    </span>
                    <span className="text-xs text-[var(--color-muted)]">{timeAgo(req.created_at)}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--color-text)]">
                    {req.message}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
