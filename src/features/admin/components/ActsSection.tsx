import { Plus, TriangleAlert } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "../../../components/ui/Button";
import { Select } from "../../../components/ui/Select";
import { TextInput } from "../../../components/ui/TextInput";
import { TextArea } from "../../../components/ui/TextArea";
import { formatDateEs, todayIso } from "../../../lib/date";
import {
  ADMINISTRATIVE_ACT_TYPE_LABELS,
  type AdministrativeActType,
} from "../../../lib/database.types";
import { createAct, listActsFor } from "../../profiles/services/actsService";

const ACT_TYPE_OPTIONS: { value: AdministrativeActType; label: string }[] = [
  { value: "amonestacion_verbal", label: ADMINISTRATIVE_ACT_TYPE_LABELS.amonestacion_verbal },
  { value: "amonestacion_escrita", label: ADMINISTRATIVE_ACT_TYPE_LABELS.amonestacion_escrita },
  { value: "suspension", label: ADMINISTRATIVE_ACT_TYPE_LABELS.suspension },
  { value: "otro", label: ADMINISTRATIVE_ACT_TYPE_LABELS.otro },
];

type ActsSectionProps = {
  employeeId: string;
};

export function ActsSection({ employeeId }: ActsSectionProps) {
  const queryClient = useQueryClient();
  const actsQuery = useQuery({
    queryKey: ["administrative-acts", employeeId],
    queryFn: () => listActsFor(employeeId),
  });

  const [showForm, setShowForm] = useState(false);
  const [actType, setActType] = useState<AdministrativeActType>("amonestacion_verbal");
  const [actDate, setActDate] = useState(todayIso());
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setActType("amonestacion_verbal");
    setActDate(todayIso());
    setReason("");
    setNotes("");
    setError(null);
  }

  function handleCancel() {
    setShowForm(false);
    resetForm();
  }

  async function handleSubmit() {
    setError(null);
    if (!actDate) {
      setError("Seleccioná una fecha.");
      return;
    }
    if (!reason.trim()) {
      setError("El motivo es obligatorio.");
      return;
    }

    try {
      setSaving(true);
      await createAct({
        employeeId,
        actType,
        reason: reason.trim(),
        actDate,
        notes: notes.trim(),
      });
      resetForm();
      setShowForm(false);
      await queryClient.invalidateQueries({ queryKey: ["administrative-acts", employeeId] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar el acta.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      aria-labelledby="administrative-acts-title"
      className="rounded-[20px] bg-white p-5 ring-1 ring-slate-200"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-xl bg-amber-100 text-amber-700">
            <TriangleAlert aria-hidden="true" className="size-5" />
          </span>
          <h2 className="text-base font-bold" id="administrative-acts-title">
            Actas administrativas
          </h2>
        </div>
        {!showForm ? (
          <Button
            className="gap-1.5 rounded-xl px-3 text-xs"
            type="button"
            variant="secondary"
            onClick={() => setShowForm(true)}
          >
            <Plus aria-hidden="true" className="size-4" />
            Nueva acta
          </Button>
        ) : null}
      </div>

      {showForm ? (
        <div className="mb-5 space-y-4 rounded-2xl bg-[var(--color-surface)] p-4">
          <Select
            label="Tipo de acta"
            value={actType}
            onChange={(e) => setActType(e.target.value as AdministrativeActType)}
          >
            {ACT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <TextInput
            label="Fecha"
            required
            type="date"
            value={actDate}
            onChange={(e) => setActDate(e.target.value)}
          />

          <TextArea
            label="Motivo"
            placeholder="Describí el motivo del acta…"
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />

          <TextArea
            label="Notas (opcional)"
            placeholder="Detalles adicionales…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          {error ? (
            <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex gap-3">
            <Button className="flex-1" disabled={saving} type="button" onClick={handleSubmit}>
              {saving ? "Guardando…" : "Guardar acta"}
            </Button>
            <Button
              className="flex-1"
              disabled={saving}
              type="button"
              variant="secondary"
              onClick={handleCancel}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : null}

      {actsQuery.isLoading ? (
        <p className="text-sm font-semibold text-[var(--color-muted)]">Cargando actas…</p>
      ) : actsQuery.isError ? (
        <p className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
          No se pudieron cargar las actas.
        </p>
      ) : (actsQuery.data ?? []).length === 0 ? (
        <p className="rounded-2xl bg-[var(--color-surface)] p-4 text-center text-sm font-semibold text-[var(--color-muted)]">
          Sin actas registradas.
        </p>
      ) : (
        <ul className="space-y-2">
          {(actsQuery.data ?? []).map((act) => (
            <li
              key={act.id}
              className="rounded-2xl bg-[var(--color-surface)] p-4 ring-1 ring-slate-100"
            >
              <div className="mb-1 flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-[var(--color-text)]">
                  {ADMINISTRATIVE_ACT_TYPE_LABELS[act.act_type]}
                </span>
                <span className="shrink-0 text-xs text-[var(--color-muted)]">
                  {formatDateEs(act.act_date)}
                </span>
              </div>
              <p className="text-sm text-[var(--color-text)]">{act.reason}</p>
              {act.notes ? (
                <p className="mt-2 text-sm text-[var(--color-muted)]">{act.notes}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
