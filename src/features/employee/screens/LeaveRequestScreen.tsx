import { CalendarDays, Check, ChevronLeft, Clock, FileText, Heart, Info, ListTodo, Palmtree, Stethoscope, Tag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "../../../components/ui/Button";
import { StepDots } from "../../../components/ui/StepDots";
import { TextInput } from "../../../components/ui/TextInput";
import { TextArea } from "../../../components/ui/TextArea";
import { Avatar } from "../../../components/ui/Avatar";
import { diffDaysInclusive, formatDateEs, formatDateRangeEs, todayIso } from "../../../lib/date";
import type { LeaveType, ScheduleType } from "../../../lib/database.types";
import { usePageTitle } from "../../../lib/usePageTitle";
import { bumpHaptic, successHaptic, tapHaptic } from "../../../lib/haptics";
import { useAuth } from "../../session/AuthContext";
import { createLeaveRequest } from "../../leave-requests/services/leaveRequestService";
import { useLeaveRequests } from "../../leave-requests/hooks/useLeaveRequests";

const leaveTypeOptions: Array<{ description: string; icon: typeof Tag; label: string; tone: string; value: LeaveType }> = [
  { description: "Dias libres con goce", icon: Palmtree, label: "Vacaciones", tone: "bg-emerald-100 text-emerald-700", value: "vacation" },
  { description: "Reposo medico o consulta", icon: Stethoscope, label: "Enfermedad", tone: "bg-rose-100 text-rose-700", value: "sick" },
  { description: "Asuntos personales", icon: Heart, label: "Personal", tone: "bg-indigo-100 text-indigo-700", value: "personal" },
  { description: "Otro motivo", icon: Tag, label: "Otro", tone: "bg-slate-200 text-slate-700", value: "other" },
];

export const requestSchema = z
  .object({
    coverageContact: z.string().trim().max(120, "Usa máximo 120 caracteres.").optional(),
    endDate: z.string().min(1, "Selecciona fecha final."),
    endTime: z.string().optional(),
    leaveType: z.enum(["vacation", "sick", "personal", "other"]),
    paid: z.boolean(),
    pendingTasks: z.string().trim().optional(),
    scheduleType: z.enum(["full_day", "time_range"]),
    startDate: z.string().min(1, "Selecciona fecha inicial."),
    startTime: z.string().optional(),
  })
  .superRefine((value, context) => {
    const today = todayIso();

    if (value.startDate < today) {
      context.addIssue({
        code: "custom",
        message: "La fecha inicial no puede estar en pasado.",
        path: ["startDate"],
      });
    }

    if (value.endDate < value.startDate) {
      context.addIssue({
        code: "custom",
        message: "La fecha final debe ser igual o posterior a la inicial.",
        path: ["endDate"],
      });
    }

    if (value.scheduleType === "time_range") {
      if (!value.startTime) {
        context.addIssue({ code: "custom", message: "Ingresa hora inicial.", path: ["startTime"] });
      }
      if (!value.endTime) {
        context.addIssue({ code: "custom", message: "Ingresa hora final.", path: ["endTime"] });
      }
      if (value.startTime && value.endTime && value.endTime <= value.startTime) {
        context.addIssue({
          code: "custom",
          message: "La hora final debe ser mayor a la inicial.",
          path: ["endTime"],
        });
      }
    }
  });

type RequestFormValues = z.infer<typeof requestSchema>;

type StepDirection = "next" | "back";

const FIELDS_BY_STEP: Array<Array<keyof RequestFormValues>> = [
  ["startDate", "endDate"],
  ["leaveType", "scheduleType", "startTime", "endTime"],
  [],
  [],
];

const STEP_TITLES = ["Fechas", "Tipo y horario", "Pendientes", "Resumen"] as const;
const TOTAL_STEPS = STEP_TITLES.length;
const DRAFT_KEY = "xignis.draft.request:v1";
const DEFAULT_VALUES: RequestFormValues = { coverageContact: "", endDate: "", endTime: "", leaveType: "vacation", paid: true, pendingTasks: "", scheduleType: "full_day", startDate: "", startTime: "" };
function readDraft(): { step: number; values: RequestFormValues } {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? "null") as { step?: number; values?: Partial<RequestFormValues> } | null;
    return { step: Math.min(Math.max(parsed?.step ?? 0, 0), TOTAL_STEPS - 1), values: { ...DEFAULT_VALUES, ...parsed?.values } };
  } catch { return { step: 0, values: DEFAULT_VALUES }; }
}

export function LeaveRequestScreen() {
  const navigate = useNavigate();
  usePageTitle("Nuevo permiso");
  const { profile } = useAuth();
  const [draft] = useState(readDraft);
  const [step, setStep] = useState(draft.step);
  const [direction, setDirection] = useState<StepDirection>("next");
  const [submitted, setSubmitted] = useState<{ id: string; values: RequestFormValues } | null>(null);
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
    setFocus,
    trigger,
  } = useForm<RequestFormValues>({
    defaultValues: draft.values,
    mode: "onChange",
    reValidateMode: "onChange",
  });
  const values = useWatch({ control });
  const scheduleType: ScheduleType = values.scheduleType ?? "full_day";
  const startDate = values.startDate ?? "";
  const endDate = values.endDate ?? "";
  const leaveType: LeaveType = values.leaveType ?? "vacation";
  const paid = values.paid ?? true;
  const startTime = values.startTime ?? "";
  const endTime = values.endTime ?? "";
  const pendingTasks = values.pendingTasks ?? "";
  const coverageContact = values.coverageContact ?? "";
  const myRequests = useLeaveRequests("mine", profile?.id);
  const overlap = useMemo(() => {
    if (!startDate || !endDate || endDate < startDate) return null;
    return (myRequests.data ?? []).find((request) =>
      !["cancelled", "rejected", "rejected_by_manager"].includes(request.status) &&
      request.start_date <= endDate && request.end_date >= startDate,
    ) ?? null;
  }, [endDate, myRequests.data, startDate]);

  useEffect(() => {
    if (submitted) return;
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ step, values }));
  }, [step, submitted, values]);

  async function goNext() {
    const valid = await trigger(FIELDS_BY_STEP[step]);
    if (!valid) {
      const firstError = FIELDS_BY_STEP[step].find((f) => errors[f]?.message);
      if (firstError) setFocus(firstError);
      bumpHaptic();
      return;
    }
    await tapHaptic();
    setDirection("next");
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }

  function goBack() {
    void bumpHaptic();
    if (step === 0) {
      navigate("/employee");
      return;
    }
    setDirection("back");
    setStep((s) => Math.max(s - 1, 0));
  }

  async function onSubmit(formValues: RequestFormValues) {
    const result = requestSchema.safeParse(formValues);
    if (!result.success) {
      for (const issue of result.error.issues) {
        const fieldName = issue.path[0];
        if (typeof fieldName === "string") {
          setError(fieldName as keyof RequestFormValues, { message: issue.message });
        }
      }
      return;
    }
    try {
      const request = await createLeaveRequest(result.data);
      await successHaptic();
      sessionStorage.removeItem(DRAFT_KEY);
      setSubmitted({ id: request.id, values: result.data });
    } catch (error) {
      setError("root", {
        message: error instanceof Error ? error.message : "No se pudo crear la solicitud.",
      });
    }
  }

  const isLast = step === TOTAL_STEPS - 1;
  const animationClass = direction === "next" ? "animate-step-next" : "animate-step-back";
  const days = startDate && endDate && endDate >= startDate ? diffDaysInclusive(startDate, endDate) : 0;
  const leaveTypeMeta = leaveTypeOptions.find((opt) => opt.value === leaveType);

  if (submitted) {
    const sentDays = diffDaysInclusive(submitted.values.startDate, submitted.values.endDate);
    return <main className="mobile-screen grid min-h-dvh place-items-center px-5" id="main-content" tabIndex={-1}><section className="w-full max-w-md rounded-[28px] bg-[var(--card-bg)] p-7 text-center shadow-xl ring-1 ring-[var(--card-border)]"><span className="mx-auto grid size-20 place-items-center rounded-full bg-emerald-100 text-emerald-800"><Check aria-hidden="true" className="size-10" /></span><h2 className="mt-5 text-3xl font-black">Solicitud enviada</h2><p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">La enviamos al flujo de aprobación y te notificaremos cada cambio.</p><dl className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-[var(--color-surface)] p-4 text-left text-sm"><div><dt className="text-[var(--color-muted)]">Fechas</dt><dd className="mt-1 font-black">{formatDateRangeEs(submitted.values.startDate, submitted.values.endDate)}</dd></div><div><dt className="text-[var(--color-muted)]">Duración</dt><dd className="mt-1 font-black">{sentDays} {sentDays === 1 ? "día" : "días"}</dd></div></dl><Button className="mt-6 w-full" onClick={() => navigate(`/employee/requests/${submitted.id}`)}>Ver detalle</Button></section></main>;
  }

  return (
    <main className="mobile-screen" id="main-content" tabIndex={-1}>
      <form
        className="flex min-h-dvh flex-col px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1.25rem+env(safe-area-inset-top))] lg:px-8"
        noValidate
        onSubmit={handleSubmit(onSubmit)}
      >
        <header className="mb-3 grid grid-cols-[44px_1fr_44px] items-center">
          <button
            aria-label="Regresar"
            className="grid size-11 place-items-center rounded-full bg-[var(--color-surface)]"
            type="button"
            onClick={goBack}
          >
            <ChevronLeft aria-hidden="true" className="size-5" />
          </button>
          <h2 className="text-center text-lg font-black text-[var(--color-text)]">{STEP_TITLES[step]}</h2>
          <span className="text-center text-xs font-semibold text-[var(--color-muted)]">
            {step + 1}/{TOTAL_STEPS}
          </span>
        </header>

        <div className="mb-4">
          <StepDots current={step} total={TOTAL_STEPS} />
        </div>

        <section
          className="mb-4 flex items-center gap-4 rounded-[20px] bg-[var(--color-surface)] p-4"
          aria-hidden="true"
        >
          <Avatar className="size-14" name={profile?.full_name ?? "Empleado"} src={profile?.avatar_url} />
          <div>
            <h2 className="font-black text-[var(--color-text)]">{profile?.full_name ?? "Empleado"}</h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">{profile?.job_title ?? "Perfil Xignis"}</p>
          </div>
        </section>

        <div key={step}>
          <div className={animationClass}>
            {step === 0 ? <StepDates endDate={endDate} errors={errors} overlap={overlap ? formatDateRangeEs(overlap.start_date, overlap.end_date) : null} register={register} startDate={startDate} /> : null}
            {step === 1 ? (
              <StepType
                endTime={endTime}
                errors={errors}
                leaveType={leaveType}
                paid={paid}
                register={register}
                scheduleType={scheduleType}
                startTime={startTime}
              />
            ) : null}
            {step === 2 ? <StepTasks coverageContact={coverageContact} errors={errors} pendingTasks={pendingTasks} register={register} /> : null}
            {step === 3 ? (
              <StepSummary
                endDate={endDate}
                endTime={endTime}
                coverageContact={coverageContact}
                leaveTypeLabel={leaveTypeMeta?.label ?? ""}
                leaveTypeTone={leaveTypeMeta?.tone ?? ""}
                paid={paid}
                pendingTasks={pendingTasks}
                scheduleType={scheduleType}
                startDate={startDate}
                startTime={startTime}
              />
            ) : null}
          </div>
        </div>

        {errors.root?.message ? (
          <p className="mt-3 rounded-2xl bg-red-50 p-4 text-sm font-semibold leading-6 text-red-700" role="alert">
            {errors.root.message}
          </p>
        ) : null}

        <div className="mt-6">
          {isLast ? (
            <Button className="w-full" disabled={isSubmitting} type="submit">
              {isSubmitting ? <CalendarDays aria-hidden="true" className="size-5" /> : <Check aria-hidden="true" className="size-5" />}
              {isSubmitting ? "Enviando..." : "Crear solicitud"}
            </Button>
          ) : (
            <Button className="w-full" type="button" onClick={goNext}>
              Siguiente
            </Button>
          )}
        </div>

        <FileText aria-hidden="true" className="sr-only" />
      </form>
    </main>
  );
}

type StepProps = {
  coverageContact: string;
  endDate: string;
  endTime: string;
  errors: ReturnType<typeof useForm<RequestFormValues>>["formState"]["errors"];
  leaveType: LeaveType;
  paid: boolean;
  pendingTasks: string;
  register: ReturnType<typeof useForm<RequestFormValues>>["register"];
  scheduleType: ScheduleType;
  startDate: string;
  startTime: string;
};

function StepDates({
  endDate,
  errors,
  overlap,
  register,
  startDate,
}: Pick<StepProps, "endDate" | "errors" | "register" | "startDate"> & { overlap: string | null }) {
  const days = startDate && endDate && endDate >= startDate ? diffDaysInclusive(startDate, endDate) : 0;
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-[var(--color-surface)] p-4">
        <p className="flex items-center gap-2 text-sm font-medium text-[var(--color-text)]">
          <CalendarDays aria-hidden="true" className="size-4" />
          Selecciona el rango
        </p>
        <p className="mt-1 text-xs text-[var(--color-muted)]">Desde que dia hasta que dia necesitas ausentarte.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextInput
          error={errors.startDate?.message}
          label="Inicio"
          min={todayIso()}
          type="date"
          {...register("startDate")}
        />
        <TextInput error={errors.endDate?.message} label="Fin" type="date" {...register("endDate")} />
      </div>

      {days > 0 ? (
        <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-900">
          <p className="text-sm leading-6">
            <span className="font-black">{days}</span> {days === 1 ? "dia solicitado" : "dias solicitados"}
            <span className="block text-xs text-emerald-800/80">
              {formatDateRangeEs(startDate, endDate)}
            </span>
          </p>
        </div>
      ) : null}
      {overlap ? <p className="rounded-2xl bg-amber-100 p-4 text-sm font-semibold leading-6 text-amber-950" role="status">Ya tienes una solicitud activa que se cruza con estas fechas: {overlap}.</p> : null}
    </div>
  );
}

function StepType({
  endTime,
  errors,
  leaveType,
  paid,
  register,
  scheduleType,
  startTime,
}: Pick<StepProps, "endTime" | "errors" | "leaveType" | "paid" | "register" | "scheduleType" | "startTime">) {
  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--color-text)]">
          <Tag aria-hidden="true" className="size-4" />
          Tipo de permiso
        </p>
        <div className="grid grid-cols-2 gap-3">
          {leaveTypeOptions.map((option) => {
            const Icon = option.icon;
            const selected = leaveType === option.value;
            return (
              <label
                className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border-2 p-3 transition ${
                  selected
                    ? "border-[var(--color-primary)] bg-emerald-50"
                    : "border-transparent bg-[var(--color-surface)]"
                }`}
                key={option.value}
              >
                <input
                  aria-label={option.label}
                  className="sr-only"
                  type="radio"
                  value={option.value}
                  {...register("leaveType")}
                />
                <span
                  className={`grid size-10 shrink-0 place-items-center rounded-full ${option.tone}`}
                  aria-hidden="true"
                >
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-black text-[var(--color-text)]">{option.label}</span>
                  <span className="block truncate text-xs text-[var(--color-muted)]">{option.description}</span>
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="flex items-center gap-2 text-sm font-medium text-[var(--color-text)]">
          <Clock aria-hidden="true" className="size-4" />
          Horario
        </legend>
        <div className="grid grid-cols-2 gap-3">
          {[
            ["Dia completo", "full_day"],
            ["Por horas", "time_range"],
          ].map(([label, value]) => (
            <label
              className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 transition ${
                scheduleType === value
                  ? "border-[var(--color-primary)] bg-emerald-50"
                  : "border-transparent bg-[var(--color-surface)]"
              }`}
              key={value}
            >
              <input
                className="size-4 accent-[var(--color-primary)]"
                type="radio"
                value={value}
                {...register("scheduleType")}
              />
              <span className="text-sm font-black text-[var(--color-text)]">{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label
        className={`flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-2xl border-2 p-4 transition ${
          paid ? "border-[var(--color-primary)] bg-emerald-50" : "border-transparent bg-[var(--color-surface)]"
        }`}
      >
        <span className="min-w-0">
          <span className="block text-sm font-black text-[var(--color-text)]">Con goce de sueldo</span>
          <span className="block text-xs text-[var(--color-muted)]">
            {paid ? "El permiso se paga con normalidad." : "Sin goce: los días no se pagan."}
          </span>
        </span>
        <input className="size-5 accent-[var(--color-primary)]" type="checkbox" {...register("paid")} />
      </label>

      {scheduleType === "time_range" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextInput error={errors.startTime?.message} label="Desde" type="time" {...register("startTime")} />
          <TextInput error={errors.endTime?.message} label="Hasta" type="time" {...register("endTime")} />
        </div>
      ) : null}
    </div>
  );
}

function StepTasks({
  coverageContact,
  errors,
  pendingTasks,
  register,
}: Pick<StepProps, "coverageContact" | "errors" | "pendingTasks" | "register">) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-[var(--color-surface)] p-4">
        <p className="flex items-center gap-2 text-sm font-medium text-[var(--color-text)]">
          <ListTodo aria-hidden="true" className="size-4" />
          Actividades pendientes
        </p>
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          Opcional. Indica tareas o como cubriras tu ausencia mientras estes fuera.
        </p>
      </div>

      <TextInput error={errors.coverageContact?.message} hint="Nombre o contacto de quien dará seguimiento." label="Responsable suplente" maxLength={120} value={coverageContact} {...register("coverageContact")} />

      <TextArea error={errors.pendingTasks?.message} label="Actividades pendientes" maxLength={1000} placeholder="Describe pendientes o cobertura para tu equipo" value={pendingTasks} {...register("pendingTasks")} />

      {pendingTasks.trim().length > 0 ? (
        <p className="text-xs text-[var(--color-muted)]">{pendingTasks.trim().length} caracteres</p>
      ) : (
        <p className="text-xs text-[var(--color-muted)]">Puedes continuar sin agregar pendientes.</p>
      )}
    </div>
  );
}

function StepSummary({
  coverageContact,
  endDate,
  endTime,
  leaveTypeLabel,
  leaveTypeTone,
  paid,
  pendingTasks,
  scheduleType,
  startDate,
  startTime,
}: {
  coverageContact: string;
  endDate: string;
  endTime: string;
  leaveTypeLabel: string;
  leaveTypeTone: string;
  paid: boolean;
  pendingTasks: string;
  scheduleType: ScheduleType;
  startDate: string;
  startTime: string;
}) {
  const days = startDate && endDate && endDate >= startDate ? diffDaysInclusive(startDate, endDate) : 0;
  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-[var(--color-surface)] p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Resumen</p>
        <p className="mt-1 text-sm text-[var(--color-text)]">Revisa los datos antes de enviar.</p>
      </div>

      <SummaryRow icon={CalendarDays} label="Fechas" value={startDate && endDate ? formatDateRangeEs(startDate, endDate) : "—"} sub={days > 0 ? `${days} ${days === 1 ? "dia" : "dias"}` : undefined} />

      <SummaryRow
        icon={Tag}
        label="Tipo"
        value={leaveTypeLabel ? `${leaveTypeLabel} · ${paid ? "Con goce" : "Sin goce"}` : "—"}
        tone={leaveTypeTone || undefined}
      />

      <SummaryRow icon={ListTodo} label="Responsable suplente" value={coverageContact.trim() || "Sin asignar"} />

      <SummaryRow
        icon={Clock}
        label="Horario"
        value={scheduleType === "full_day" ? "Dia completo" : startTime && endTime ? `${startTime} – ${endTime}` : "—"}
      />

      <SummaryRow
        icon={ListTodo}
        label="Pendientes"
        value={pendingTasks.trim() ? pendingTasks.trim() : "Sin pendientes"}
      />

      <section className="flex gap-3 rounded-2xl bg-orange-50 p-4 text-orange-900">
        <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <p className="text-sm leading-6">
          Si tienes jefe asignado, la solicitud ira primero a su revision. Si no, pasara directo a RH.
        </p>
      </section>

      {startDate ? (
        <p className="text-xs text-[var(--color-muted)]">
          Inicio: <span className="font-semibold text-[var(--color-text)]">{formatDateEs(startDate)}</span>
          {endDate ? <> · Fin: <span className="font-semibold text-[var(--color-text)]">{formatDateEs(endDate)}</span></> : null}
        </p>
      ) : null}
    </div>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  sub,
  tone,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  sub?: string;
  tone?: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-[var(--color-surface)] p-4">
      <span
        className={`grid size-10 shrink-0 place-items-center rounded-full ${tone ?? "bg-white text-[var(--color-text)]"}`}
        aria-hidden="true"
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">{label}</p>
        <p className="mt-0.5 break-words text-sm font-semibold text-[var(--color-text)]">{value}</p>
        {sub ? <p className="mt-0.5 text-xs text-[var(--color-muted)]">{sub}</p> : null}
      </div>
    </div>
  );
}
