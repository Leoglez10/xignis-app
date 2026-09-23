import { Clock, History, Minus, Plus } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "../../../components/ui/Button";
import { TextInput } from "../../../components/ui/TextInput";
import { TextArea } from "../../../components/ui/TextArea";
import {
  getTimeBankFor,
  listTimeBankFor,
  adjustTimeBank,
  type TimeBankBalance,
} from "../services/timeBankService";
import type { TimeBankTransaction } from "../../../lib/database.types";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatHours(hours: number): string {
  const sign = hours > 0 ? "+" : "";
  return `${sign}${hours.toFixed(2)}h`;
}

type TimeBankSectionProps = {
  employeeId: string;
};

export function TimeBankSection({ employeeId }: TimeBankSectionProps) {
  const queryClient = useQueryClient();
  const balanceQuery = useQuery<TimeBankBalance>({
    queryKey: ["time-bank", employeeId],
    queryFn: () => getTimeBankFor(employeeId),
  });
  const transactionsQuery = useQuery<TimeBankTransaction[]>({
    queryKey: ["time-bank-transactions", employeeId],
    queryFn: () => listTimeBankFor(employeeId, { limit: 10 }),
  });

  const [mode, setMode] = useState<"add" | "subtract">("add");
  const [hours, setHours] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    const parsed = Number.parseFloat(hours.replace(",", "."));
    if (Number.isNaN(parsed) || parsed <= 0) {
      setError("Ingresa una cantidad positiva de horas.");
      return;
    }
    if (!reason.trim()) {
      setError("Agrega un motivo para el movimiento.");
      return;
    }
    try {
      setSaving(true);
      const signedHours = mode === "add" ? parsed : -parsed;
      await adjustTimeBank(employeeId, signedHours, reason.trim());
      setHours("");
      setReason("");
      await queryClient.invalidateQueries({ queryKey: ["time-bank", employeeId] });
      await queryClient.invalidateQueries({ queryKey: ["time-bank-transactions", employeeId] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el movimiento.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      aria-labelledby="time-bank-title"
      className="rounded-[20px] bg-white p-5 ring-1 ring-slate-200"
    >
      <div className="mb-4 flex items-center gap-2">
        <Clock aria-hidden="true" className="size-5 text-[var(--color-muted)]" />
        <h2 className="text-base font-bold" id="time-bank-title">Banco de horas</h2>
      </div>

      {balanceQuery.isLoading ? (
        <p className="text-sm font-semibold text-[var(--color-muted)]">Cargando saldo…</p>
      ) : balanceQuery.isError ? (
        <p className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
          No se pudo cargar el saldo.
        </p>
      ) : (
        <div className="mb-5 flex items-center justify-between rounded-2xl bg-[var(--color-surface)] p-4">
          <div>
            <p className="text-sm text-[var(--color-muted)]">Saldo disponible</p>
            <p className="text-2xl font-bold text-[var(--color-text)]">
              {(balanceQuery.data?.availableHours ?? 0).toFixed(1)}h
            </p>
          </div>
          <span className="grid size-10 place-items-center rounded-2xl bg-indigo-100 text-indigo-700">
            <Clock aria-hidden="true" className="size-5" />
          </span>
        </div>
      )}

      <div className="space-y-4 rounded-2xl bg-[var(--color-surface)] p-4">
        <p className="text-sm font-bold text-[var(--color-text)]">Ajustar saldo</p>

        <div className="grid grid-cols-2 gap-3">
          <label
            className={`flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 px-3 py-2 text-sm font-bold transition ${
              mode === "add"
                ? "border-[var(--color-primary)] bg-emerald-50 text-emerald-900"
                : "border-transparent bg-white text-[var(--color-muted)]"
            }`}
          >
            <Plus aria-hidden="true" className="size-4" />
            <input
              className="sr-only"
              name="time-bank-mode"
              type="radio"
              value="add"
              checked={mode === "add"}
              onChange={() => setMode("add")}
            />
            Abonar
          </label>
          <label
            className={`flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 px-3 py-2 text-sm font-bold transition ${
              mode === "subtract"
                ? "border-[var(--color-primary)] bg-emerald-50 text-emerald-900"
                : "border-transparent bg-white text-[var(--color-muted)]"
            }`}
          >
            <Minus aria-hidden="true" className="size-4" />
            <input
              className="sr-only"
              name="time-bank-mode"
              type="radio"
              value="subtract"
              checked={mode === "subtract"}
              onChange={() => setMode("subtract")}
            />
            Descontar
          </label>
        </div>

        <TextInput
          label="Horas"
          type="number"
          step="0.5"
          min="0.5"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
        />

        <TextArea
          label="Motivo"
          placeholder="Ej. Ajuste por horas extras de marzo"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        {error ? (
          <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        <Button className="w-full" disabled={saving} type="button" onClick={handleSubmit}>
          {saving ? "Guardando…" : mode === "add" ? "Abonar horas" : "Descontar horas"}
        </Button>
      </div>

      <div className="mt-5">
        <div className="mb-3 flex items-center gap-2">
          <History aria-hidden="true" className="size-4 text-[var(--color-muted)]" />
          <h3 className="text-sm font-bold text-[var(--color-text)]">Movimientos recientes</h3>
        </div>

        {transactionsQuery.isLoading ? (
          <p className="text-sm font-semibold text-[var(--color-muted)]">Cargando movimientos…</p>
        ) : transactionsQuery.isError ? (
          <p className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
            No se pudo cargar el historial.
          </p>
        ) : (transactionsQuery.data ?? []).length === 0 ? (
          <p className="rounded-2xl bg-[var(--color-surface)] p-4 text-center text-sm font-semibold text-[var(--color-muted)]">
            Sin movimientos registrados.
          </p>
        ) : (
          <ul className="space-y-2">
            {(transactionsQuery.data ?? []).map((tx) => (
              <li
                key={tx.id}
                className="flex items-center justify-between rounded-2xl bg-[var(--color-surface)] p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[var(--color-text)]">{tx.reason}</p>
                  <p className="text-xs text-[var(--color-muted)]">{formatDateTime(tx.created_at)}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                    tx.hours >= 0 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {formatHours(tx.hours)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
