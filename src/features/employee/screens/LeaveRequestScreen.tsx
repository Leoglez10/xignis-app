import { CalendarDays, Check, ChevronLeft, Clock, FileText, Info, ListTodo, Tag } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "../../../components/ui/Button";
import { TextInput } from "../../../components/ui/TextInput";
import type { LeaveType, ScheduleType } from "../../../lib/database.types";
import { useAuth } from "../../session/AuthContext";
import { createLeaveRequest } from "../../leave-requests/services/leaveRequestService";

const leaveTypeOptions: Array<{ label: string; value: LeaveType }> = [
  { label: "Vacaciones", value: "vacation" },
  { label: "Enfermedad", value: "sick" },
  { label: "Personal", value: "personal" },
  { label: "Otro", value: "other" },
];

const requestSchema = z
  .object({
    endDate: z.string().min(1, "Selecciona fecha final."),
    endTime: z.string().optional(),
    leaveType: z.enum(["vacation", "sick", "personal", "other"]),
    pendingTasks: z.string().trim().optional(),
    scheduleType: z.enum(["full_day", "time_range"]),
    startDate: z.string().min(1, "Selecciona fecha inicial."),
    startTime: z.string().optional(),
  })
  .superRefine((value, context) => {
    const today = new Date().toISOString().slice(0, 10);

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

export function LeaveRequestScreen() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
    setFocus,
  } = useForm<RequestFormValues>({
    defaultValues: {
      endDate: "",
      endTime: "",
      leaveType: "vacation",
      pendingTasks: "",
      scheduleType: "full_day",
      startDate: "",
      startTime: "",
    },
    mode: "onSubmit",
    reValidateMode: "onBlur",
  });
  const scheduleType = useWatch({ control, name: "scheduleType" });

  async function onSubmit(values: RequestFormValues) {
    const result = requestSchema.safeParse(values);

    if (!result.success) {
      for (const issue of result.error.issues) {
        const fieldName = issue.path[0];
        if (
          fieldName === "startDate" ||
          fieldName === "endDate" ||
          fieldName === "startTime" ||
          fieldName === "endTime"
        ) {
          setError(fieldName, { message: issue.message });
        }
      }
      const firstIssue = result.error.issues[0]?.path[0];
      if (
        firstIssue === "startDate" ||
        firstIssue === "endDate" ||
        firstIssue === "startTime" ||
        firstIssue === "endTime"
      ) {
        setFocus(firstIssue);
      }
      return;
    }

    try {
      const request = await createLeaveRequest(result.data);
      navigate(`/employee/requests/${request.id}`);
    } catch (error) {
      setError("root", {
        message: error instanceof Error ? error.message : "No se pudo crear la solicitud.",
      });
    }
  }

  return (
    <main className="mobile-screen" id="main-content" tabIndex={-1}>
      <form
        className="flex min-h-dvh flex-col px-5 pb-7 pt-[calc(1.25rem+env(safe-area-inset-top))] lg:px-8"
        noValidate
        onSubmit={handleSubmit(onSubmit)}
      >
        <header className="mb-4 grid grid-cols-[44px_1fr_44px] items-center">
          <button
            aria-label="Regresar"
            className="grid size-11 place-items-center rounded-full bg-[var(--color-surface)]"
            type="button"
            onClick={() => navigate("/employee")}
          >
            <ChevronLeft aria-hidden="true" className="size-5" />
          </button>
          <h1 className="text-center text-lg font-black text-[var(--color-text)]">Nuevo permiso</h1>
        </header>

        <section className="mb-4 flex items-center gap-4 rounded-[20px] bg-[var(--color-surface)] p-4">
          <div className="grid size-14 place-items-center rounded-full bg-emerald-100 text-sm font-black text-emerald-700">
            {profile?.full_name
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0])
              .join("")
              .toUpperCase() ?? "X"}
          </div>
          <div>
            <h2 className="font-black text-[var(--color-text)]">{profile?.full_name ?? "Empleado"}</h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">{profile?.job_title ?? "Perfil Xignis"}</p>
          </div>
        </section>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextInput
              error={errors.startDate?.message}
              label="Inicio"
              min={new Date().toISOString().slice(0, 10)}
              type="date"
              {...register("startDate")}
            />
            <TextInput error={errors.endDate?.message} label="Fin" type="date" {...register("endDate")} />
          </div>

          <label className="block space-y-2">
            <span className="flex items-center gap-2 text-sm font-medium text-[var(--color-text)]">
              <Tag aria-hidden="true" className="size-4" />
              Tipo
            </span>
            <select
              className="h-13 w-full rounded-2xl bg-[var(--color-surface)] px-4 text-base font-semibold text-[var(--color-text)] outline-none ring-1 ring-transparent focus:ring-2 focus:ring-[var(--color-focus)]"
              {...register("leaveType")}
            >
              {leaveTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="space-y-3">
            <legend className="flex items-center gap-2 text-sm font-medium text-[var(--color-text)]">
              <Clock aria-hidden="true" className="size-4" />
              Horario
            </legend>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Dia completo", "full_day"],
                ["Por horas", "time_range"],
              ].map(([label, value]) => (
                <label className="flex min-h-12 items-center gap-3 rounded-2xl bg-[var(--color-surface)] px-4" key={value}>
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

          {scheduleType === "time_range" ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TextInput error={errors.startTime?.message} label="Desde" type="time" {...register("startTime")} />
              <TextInput error={errors.endTime?.message} label="Hasta" type="time" {...register("endTime")} />
            </div>
          ) : null}

          <label className="block space-y-2">
            <span className="flex items-center gap-2 text-sm font-medium text-[var(--color-text)]">
              <ListTodo aria-hidden="true" className="size-4" />
              Actividades pendientes
            </span>
            <textarea
              className="min-h-28 w-full resize-none rounded-2xl bg-[var(--color-surface)] p-4 text-base text-[var(--color-text)] outline-none ring-1 ring-transparent placeholder:text-[var(--color-muted)] focus:ring-2 focus:ring-[var(--color-focus)]"
              placeholder="Describe pendientes o cobertura para tu equipo"
              {...register("pendingTasks")}
            />
          </label>
        </div>

        {errors.root?.message ? (
          <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-semibold leading-6 text-red-700" role="alert">
            {errors.root.message}
          </p>
        ) : null}

        <section className="mt-4 flex gap-3 rounded-2xl bg-orange-50 p-4 text-orange-900">
          <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <p className="text-sm leading-6">
            Si tienes jefe asignado, la solicitud ira primero a su revision. Si no, pasara directo a RH.
          </p>
        </section>

        <div className="mt-auto pt-8">
          <Button className="w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? <CalendarDays aria-hidden="true" className="size-5" /> : <Check aria-hidden="true" className="size-5" />}
            {isSubmitting ? "Enviando..." : "Crear solicitud"}
          </Button>
        </div>

        <FileText aria-hidden="true" className="sr-only" />
      </form>
    </main>
  );
}
