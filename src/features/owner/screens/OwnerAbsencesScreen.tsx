import { CalendarDays } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DateInput } from "../../../components/ui/DateInput";
import { AdminShell } from "../../admin/components/adminNav";
import { listTeamAbsencesInRange } from "../../leave-requests/services/leaveRequestService";
import { startOfMonthISO, endOfMonthISO, todayIso, formatDateEs } from "../../../lib/date";
import { OwnerReadOnlyBanner } from "../components/OwnerReadOnlyBanner";
import { EmployeeAvatar } from "../../leave-requests/components/EmployeeAvatar";

function overlapsDate(start: string, end: string, date: string): boolean {
  return start <= date && end >= date;
}

export function OwnerAbsencesScreen() {
  const [date, setDate] = useState(todayIso());
  const year = useMemo(() => Number(date.slice(0, 4)), [date]);
  const month = useMemo(() => Number(date.slice(5, 7)) - 1, [date]);

  const { data: absences, error, isLoading, refetch } = useQuery({
    queryKey: ["owner", "absences", year, month],
    queryFn: () => listTeamAbsencesInRange(startOfMonthISO(year, month), endOfMonthISO(year, month)),
  });

  useEffect(() => {
    void refetch();
  }, [date, refetch]);

  const filtered = useMemo(
    () => (absences ?? []).filter((a) => overlapsDate(a.start_date, a.end_date, date)),
    [absences, date],
  );

  return (
    <AdminShell>
      <div className="page-wrap pb-24 pt-5 md:pt-6">
        <header className="animate-fade-up mb-5">
          <p className="text-sm font-bold text-[var(--color-muted)]">Suite del dueño</p>
          <h2 className="mt-1 text-2xl font-bold md:text-3xl">Ausentes</h2>
        </header>

        <OwnerReadOnlyBanner />

        <section className="animate-fade-up mt-5 rounded-[20px] bg-white p-4 ring-1 ring-slate-200">
          <DateInput label="Fecha" value={date} onChange={(e) => setDate(e.target.value)} />
        </section>

        {error ? (
          <p className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
            {error instanceof Error ? error.message : "No se pudieron cargar las ausencias."}
          </p>
        ) : null}

        <section className="mt-5">
          <h3 className="mb-3 text-base font-bold">
            <CalendarDays aria-hidden="true" className="mr-2 inline size-5 text-[var(--color-muted)]" />
            Ausentes el {formatDateEs(date)}
          </h3>

          {isLoading ? (
            <p className="text-sm font-semibold text-[var(--color-muted)]">Cargando ausencias…</p>
          ) : filtered.length === 0 ? (
            <p className="rounded-2xl bg-white p-6 text-center text-sm font-semibold text-[var(--color-muted)] ring-1 ring-slate-200">
              No hay ausencias aprobadas para esta fecha.
            </p>
          ) : (
            <ul className="stagger space-y-3">
              {filtered.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center gap-3 rounded-[20px] bg-white p-4 ring-1 ring-slate-200"
                >
                  <EmployeeAvatar
                    avatarUrl={a.employee?.avatar_url}
                    fullName={a.employee?.full_name ?? "Empleado"}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[var(--color-text)]">
                      {a.employee?.full_name ?? "Empleado"}
                    </p>
                    <p className="truncate text-xs text-[var(--color-muted)]">
                      {a.employee?.job_title ?? "Sin puesto"} · {a.start_date === a.end_date
                        ? a.start_date
                        : `${a.start_date} – ${a.end_date}`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
