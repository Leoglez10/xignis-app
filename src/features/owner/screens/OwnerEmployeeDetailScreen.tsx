import { ArrowLeft, Crown } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { BottomSheet } from "../../../components/ui/BottomSheet";
import { TextArea } from "../../../components/ui/TextArea";
import { ZoomableAvatar } from "../../../components/ui/ZoomableAvatar";
import { useToast } from "../../../components/ui/Toast";
import { AdminShell } from "../../admin/components/adminNav";
import { ProfileSheet } from "../../profiles/components/ProfileSheet";
import { useProfileSheet } from "../../profiles/hooks/useProfileSheet";
import { roleLabel } from "../../profiles/services/profileService";
import {
  getTimeBankFor,
  getVacationBalanceFor,
} from "../../leave-requests/services/leaveRequestService";
import { createOwnerRequest } from "../services/ownerService";
import { OwnerReadOnlyBanner } from "../components/OwnerReadOnlyBanner";

export function OwnerEmployeeDetailScreen() {
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();
  const sheetQuery = useProfileSheet(id);
  const [sheetOpen, setSheetOpen] = useState(false);

  const balanceQuery = useQuery({
    enabled: Boolean(id),
    queryKey: ["owner", "vacation-balance", id],
    queryFn: () => getVacationBalanceFor(id!),
  });
  const timeBankQuery = useQuery({
    enabled: Boolean(id),
    queryKey: ["owner", "time-bank", id],
    queryFn: () => getTimeBankFor(id!),
  });

  const sheet = sheetQuery.data?.sheet ?? null;
  const defs = sheetQuery.data?.defs ?? [];

  return (
    <AdminShell>
      <div className="mx-auto w-full max-w-3xl px-4 pb-10 pt-5 md:px-8 lg:max-w-5xl">
        <header className="animate-fade-up mb-6 flex items-center gap-3">
          <button
            aria-label="Regresar a Empleados"
            className="press grid size-11 place-items-center rounded-full bg-white ring-1 ring-slate-200"
            type="button"
            onClick={() => navigate("/owner/employees")}
          >
            <ArrowLeft aria-hidden="true" className="size-5" />
          </button>
          {sheet ? (
            <div className="flex flex-1 items-center gap-3">
              <ZoomableAvatar className="text-base text-emerald-700" name={sheet.full_name} size="size-16" src={sheet.avatar_url} />
              <div className="min-w-0">
                <h2 className="truncate text-2xl font-bold md:text-3xl">{sheet.full_name}</h2>
                <p className="truncate text-sm text-[var(--color-muted)]">{sheet.job_title ?? "Sin puesto"}</p>
                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                  <Crown aria-hidden="true" className="size-3" />
                  {roleLabel[sheet.role]}
                </span>
              </div>
            </div>
          ) : null}
        </header>

        <div className="mb-5">
          <OwnerReadOnlyBanner />
        </div>

        {sheetQuery.isError ? (
          <p className="mb-4 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
            No se pudo cargar la ficha del empleado.
          </p>
        ) : null}

        <div className="lg:grid lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:items-start lg:gap-6">
          <div className="space-y-4 lg:sticky lg:top-8">
            {sheet ? <ProfileSheet defs={defs} sheet={sheet} /> : null}
            {sheet ? (
              <Button
                className="w-full bg-amber-500 text-amber-950 hover:bg-amber-400"
                type="button"
                onClick={() => setSheetOpen(true)}
              >
                <Crown aria-hidden="true" className="size-4" />
                Solicitar ajuste a RH
              </Button>
            ) : null}
          </div>

          <div className="mt-4 space-y-4 lg:mt-0">
            <section className="rounded-[20px] bg-white p-5 ring-1 ring-slate-200">
              <h2 className="mb-3 text-base font-bold">Saldo de vacaciones</h2>
              {balanceQuery.isLoading ? (
                <p className="text-sm font-semibold text-[var(--color-muted)]">Cargando…</p>
              ) : balanceQuery.isError ? (
                <p className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
                  No se pudo cargar el saldo.
                </p>
              ) : (
                <div className="flex items-center justify-between rounded-2xl bg-[var(--color-surface)] p-4">
                  <div>
                    <p className="text-sm text-[var(--color-muted)]">Disponibles {balanceQuery.data?.year}</p>
                    <p className="text-2xl font-bold text-[var(--color-text)]">
                      {balanceQuery.data?.available ?? 0} días
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                    {balanceQuery.data?.taken ?? 0} tomados
                  </span>
                </div>
              )}
            </section>

            <section className="rounded-[20px] bg-white p-5 ring-1 ring-slate-200">
              <h2 className="mb-3 text-base font-bold">Banco de horas</h2>
              {timeBankQuery.isLoading ? (
                <p className="text-sm font-semibold text-[var(--color-muted)]">Cargando…</p>
              ) : timeBankQuery.isError ? (
                <p className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
                  No se pudo cargar el banco de horas.
                </p>
              ) : (
                <div className="flex items-center justify-between rounded-2xl bg-[var(--color-surface)] p-4">
                  <div>
                    <p className="text-sm text-[var(--color-muted)]">Saldo disponible</p>
                    <p className="text-2xl font-bold text-[var(--color-text)]">
                      {(timeBankQuery.data?.availableHours ?? 0).toFixed(1)}h
                    </p>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {sheet ? (
        <AdjustmentSheet
          context={`employee:${sheet.id}`}
          employeeName={sheet.full_name}
          jobTitle={sheet.job_title}
          isOpen={sheetOpen}
          onClose={() => setSheetOpen(false)}
        />
      ) : null}
    </AdminShell>
  );
}

function AdjustmentSheet({
  context,
  employeeName,
  isOpen,
  jobTitle,
  onClose,
}: {
  context: string;
  employeeName: string;
  isOpen: boolean;
  jobTitle: string | null;
  onClose: () => void;
}) {
  const toast = useToast();
  const [message, setMessage] = useState(
    `Ajustar los datos de ${employeeName}${jobTitle ? ` (${jobTitle})` : ""}: `,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    if (!message.trim()) {
      setError("Escribí un mensaje para RH.");
      return;
    }
    try {
      setSaving(true);
      await createOwnerRequest({ message: message.trim(), context });
      toast({ message: "Pedido enviado a RH.", tone: "success" });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el pedido.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet isOpen={isOpen} title="Solicitar ajuste a RH" onClose={onClose}>
      <div className="min-w-0 space-y-4">
        <p className="text-sm text-[var(--color-muted)]">
          Este pedido llega al equipo de RH. No puedes editar datos directamente desde la vista de dueño.
        </p>
        <TextArea
          label="Mensaje"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        {error ? (
          <p className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
            {error}
          </p>
        ) : null}
        <Button className="w-full bg-amber-500 text-amber-950 hover:bg-amber-400" disabled={saving} onClick={handleSubmit}>
          {saving ? "Enviando…" : "Enviar pedido a RH"}
        </Button>
      </div>
    </BottomSheet>
  );
}
