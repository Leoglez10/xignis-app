import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BottomSheet } from "../../../components/ui/BottomSheet";
import { Button } from "../../../components/ui/Button";
import { TextInput } from "../../../components/ui/TextInput";
import { TextArea } from "../../../components/ui/TextArea";
import { createReport } from "../../hr-reports/services/hrReportsService";

type ReportToRhSheetProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function ReportToRhSheet({ isOpen, onClose }: ReportToRhSheetProps) {
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [requestAnonymity, setRequestAnonymity] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setSubject("");
    setMessage("");
    setRequestAnonymity(false);
    setSubmitting(false);
    setSuccess(false);
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();
    if (!trimmedSubject || !trimmedMessage) {
      setError("Completá el asunto y el mensaje.");
      return;
    }

    try {
      setSubmitting(true);
      await createReport({
        subject: trimmedSubject,
        message: trimmedMessage,
        requestAnonymity,
      });
      setSuccess(true);
      await queryClient.invalidateQueries({ queryKey: ["my-hr-reports"] });
      setTimeout(handleClose, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el reporte.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} title="Reportar a RH">
      {success ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-700">
            <svg
              aria-hidden="true"
              className="size-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <p className="text-lg font-bold text-[var(--color-text)]">Reporte enviado a RH.</p>
          <p className="text-sm text-[var(--color-muted)]">
            Podés seguir el estado desde tu dashboard.
          </p>
        </div>
      ) : (
        <form className="space-y-5" onSubmit={handleSubmit}>
          <TextInput
            label="Asunto"
            maxLength={120}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Ej: Inconveniente con horarios"
            required
            value={subject}
          />

          <TextArea
            label="Mensaje"
            maxLength={2000}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Contanos qué pasó..."
            required
            value={message}
          />

          <div className="space-y-2">
            <label className="flex items-start gap-3">
              <input
                checked={requestAnonymity}
                className="mt-0.5 size-5 shrink-0 rounded-md border-[var(--color-border)] text-[var(--color-primary)] accent-[var(--color-primary)]"
                onChange={(e) => setRequestAnonymity(e.target.checked)}
                type="checkbox"
              />
              <span className="text-sm font-bold text-[var(--color-text)]">
                Solicitar anonimato
              </span>
            </label>
            <p className="pl-8 text-xs text-[var(--color-muted)]">
              RH verá tu nombre, pero no lo compartirá con terceros.
            </p>
          </div>

          {error ? (
            <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700" role="alert">
              {error}
            </p>
          ) : null}

          <Button className="w-full" loading={submitting} type="submit">
            Enviar reporte
          </Button>
        </form>
      )}
    </BottomSheet>
  );
}
