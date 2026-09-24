import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CalendarOff, ClipboardList, Building2, Plane, type LucideIcon } from "lucide-react";
import { AdminShell } from "../../admin/components/adminNav";
import { listEmployees } from "../../profiles/services/profileService";
import { listActiveDepartments } from "../../admin/services/departmentService";
import {
  listAbsencesForEmployeesToday,
  listHrLeaveRequests,
} from "../../leave-requests/services/leaveRequestService";
import { diffDaysInclusive, todayIso } from "../../../lib/date";
import { OwnerReadOnlyBanner } from "../components/OwnerReadOnlyBanner";

function useEmployees() {
  return useQuery({
    queryKey: ["owner", "employees"],
    queryFn: listEmployees,
  });
}

function useDepartments() {
  return useQuery({
    queryKey: ["owner", "departments"],
    queryFn: listActiveDepartments,
  });
}

function useTodayAbsences(employeeIds: string[]) {
  return useQuery({
    enabled: employeeIds.length > 0,
    queryKey: ["owner", "absences", "today", employeeIds],
    queryFn: () => listAbsencesForEmployeesToday(employeeIds),
  });
}

const today = todayIso();

function createdToday(createdAt: string): boolean {
  return new Date(createdAt).toISOString().slice(0, 10) === today;
}

export function OwnerDashboardScreen() {
  const employeesQuery = useEmployees();
  const departmentsQuery = useDepartments();
  const requestsQuery = useQuery({
    queryKey: ["owner", "requests"],
    queryFn: () => listHrLeaveRequests(),
  });

  const employeeIds = useMemo(
    () => (employeesQuery.data ?? []).map((e) => e.id),
    [employeesQuery.data],
  );
  const absencesQuery = useTodayAbsences(employeeIds);

  const requests = requestsQuery.data ?? [];
  const departments = departmentsQuery.data ?? [];
  const absences = absencesQuery.data ?? [];

  const todayRequestsCount = useMemo(
    () => requests.filter((r) => createdToday(r.created_at)).length,
    [requests],
  );

  const pendingByDepartment = useMemo(() => {
    const pending = requests.filter((r) =>
      ["pending_manager", "approved_by_manager", "pending_hr"].includes(r.status),
    );
    const map = new Map<string, { id: string | null; name: string; count: number }>();
    for (const r of pending) {
      const deptId = r.employee?.department_id ?? null;
      const dept = departments.find((d) => d.id === deptId);
      const key = deptId ?? "__none__";
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(key, { id: deptId, name: dept?.name ?? "Sin área", count: 1 });
      }
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [requests, departments]);

  const vacationDaysThisMonth = useMemo(() => {
    const month = today.slice(0, 7);
    return requests
      .filter(
        (r) =>
          r.leave_type === "vacation" &&
          r.status === "approved" &&
          r.start_date.slice(0, 7) === month,
      )
      .reduce((sum, r) => sum + diffDaysInclusive(r.start_date, r.end_date), 0);
  }, [requests]);

  return (
    <AdminShell>
      <div className="page-wrap pb-24 pt-5 md:pt-6">
        <header className="animate-fade-up mb-5">
          <p className="text-sm font-bold text-[var(--color-muted)]">Suite del dueño</p>
          <h2 className="mt-1 text-2xl font-bold md:text-3xl">Inicio</h2>
        </header>

        <div className="mb-5">
          <OwnerReadOnlyBanner />
        </div>

        <section className="grid gap-4 md:grid-cols-2">
          <MetricCard
            icon={CalendarOff}
            label="Ausentes hoy"
            loading={employeesQuery.isLoading || absencesQuery.isLoading}
            value={absences.length}
          />
          <MetricCard
            icon={ClipboardList}
            label="Solicitudes del día"
            loading={requestsQuery.isLoading}
            value={todayRequestsCount}
          />
          <PendingByDepartmentCard loading={requestsQuery.isLoading || departmentsQuery.isLoading} rows={pendingByDepartment} />
          <MetricCard
            icon={Plane}
            label="Vacaciones consumidas este mes"
            loading={requestsQuery.isLoading}
            suffix=" días"
            value={vacationDaysThisMonth}
          />
        </section>

        {employeesQuery.error || absencesQuery.error || requestsQuery.error || departmentsQuery.error ? (
          <p className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
            Algunos indicadores no pudieron cargarse. Los números disponibles se muestran arriba.
          </p>
        ) : null}
      </div>
    </AdminShell>
  );
}

function MetricCard({
  icon: Icon,
  label,
  loading,
  suffix,
  value,
}: {
  icon: LucideIcon;
  label: string;
  loading: boolean;
  suffix?: string;
  value: number;
}) {
  return (
    <motion.article
      className="rounded-[24px] bg-white p-5 ring-1 ring-slate-200"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="mb-3 flex items-center gap-2 text-amber-600">
        <Icon aria-hidden="true" className="size-5" />
        <h3 className="text-xs font-bold uppercase tracking-wide">{label}</h3>
      </div>
      <p className="text-4xl font-extrabold text-[var(--color-text)]">
        {loading ? "—" : `${value}${suffix ?? ""}`}
      </p>
    </motion.article>
  );
}

function PendingByDepartmentCard({
  loading,
  rows,
}: {
  loading: boolean;
  rows: { id: string | null; name: string; count: number }[];
}) {
  return (
    <motion.article
      className="rounded-[24px] bg-white p-5 ring-1 ring-slate-200"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.1 }}
    >
      <div className="mb-3 flex items-center gap-2 text-amber-600">
        <Building2 aria-hidden="true" className="size-5" />
        <h3 className="text-xs font-bold uppercase tracking-wide">Pendientes por área</h3>
      </div>
      {loading ? (
        <p className="text-4xl font-extrabold text-[var(--color-text)]">—</p>
      ) : rows.length === 0 ? (
        <p className="text-sm font-semibold text-[var(--color-muted)]">Sin solicitudes pendientes.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.id ?? "__none__"} className="flex items-center justify-between text-sm">
              <span className="font-semibold text-[var(--color-text)]">{row.name}</span>
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                {row.count}
              </span>
            </li>
          ))}
        </ul>
      )}
    </motion.article>
  );
}
