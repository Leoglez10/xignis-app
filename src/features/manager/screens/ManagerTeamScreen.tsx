import { ArrowLeft, ChevronRight, ExternalLink, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomSheet } from "../../../components/ui/BottomSheet";
import { todayIso } from "../../../lib/date";
import type { LeaveRequest, Profile } from "../../../lib/database.types";
import {
  formatDateRange,
  leaveTypeLabel,
  listEmployeeLeaveRequests,
  listTeamAbsencesInRange,
  statusLabel,
} from "../../leave-requests/services/leaveRequestService";
import { listMyTeam } from "../../profiles/services/profileService";
import { statusTone } from "../../leave-requests/config";
import { ManagerBottomNav } from "../components/ManagerBottomNav";

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "X";
}

type StatusFilter = "all" | "absent" | "available";
type SortKey = "name" | "dept";

export function ManagerTeamScreen() {
  const navigate = useNavigate();
  const [team, setTeam] = useState<Profile[]>([]);
  const [absentIds, setAbsentIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<Profile | null>(null);
  const [history, setHistory] = useState<LeaveRequest[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [query, setQuery] = useState("");
  const [dept, setDept] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("name");

  useEffect(() => {
    const today = todayIso();
    Promise.all([listMyTeam(), listTeamAbsencesInRange(today, today)])
      .then(([members, absences]) => {
        setTeam(members);
        setAbsentIds(new Set(absences.map((a) => a.employee_id).filter(Boolean) as string[]));
      })
      .catch((e) => setError(e instanceof Error ? e.message : "No se pudo cargar el equipo."))
      .finally(() => setIsLoading(false));
  }, []);

  const departments = useMemo(
    () => [...new Set(team.map((m) => m.job_title).filter((t): t is string => Boolean(t)))].sort(),
    [team],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return team
      .filter((m) => (q ? m.full_name.toLowerCase().includes(q) : true))
      .filter((m) => (dept === "all" ? true : m.job_title === dept))
      .filter((m) =>
        status === "all" ? true : status === "absent" ? absentIds.has(m.id) : !absentIds.has(m.id),
      )
      .sort((a, b) =>
        sort === "dept"
          ? (a.job_title ?? "").localeCompare(b.job_title ?? "") || a.full_name.localeCompare(b.full_name)
          : a.full_name.localeCompare(b.full_name),
      );
  }, [team, query, dept, status, sort, absentIds]);

  async function openMember(member: Profile) {
    setSelected(member);
    setHistoryLoading(true);
    try {
      setHistory(await listEmployeeLeaveRequests(member.id));
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  const selectCls =
    "min-w-0 flex-1 rounded-full border-0 bg-white px-3 py-2 text-xs font-black text-[var(--color-text)] ring-1 ring-slate-200";

  return (
    <main className="min-h-dvh bg-slate-50 text-[var(--color-text)]" id="main-content" tabIndex={-1}>
      <div className="mx-auto w-full max-w-3xl px-4 pb-24 pt-[calc(1.25rem+env(safe-area-inset-top))] md:px-8">
        <header className="animate-fade-up mb-5 flex items-center gap-3">
          <button
            aria-label="Regresar al panel"
            className="press grid size-11 place-items-center rounded-full bg-white ring-1 ring-slate-200"
            type="button"
            onClick={() => navigate("/manager")}
          >
            <ArrowLeft aria-hidden="true" className="size-5" />
          </button>
          <div>
            <p className="text-sm font-black text-[var(--color-muted)]">Jefe</p>
            <h1 className="text-2xl font-black md:text-3xl">Mi equipo</h1>
          </div>
        </header>

        <div className="mb-4 space-y-2">
          <label className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 ring-1 ring-slate-200">
            <Search aria-hidden="true" className="size-4 shrink-0 text-[var(--color-muted)]" />
            <input
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-[var(--color-muted)]"
              placeholder="Buscar por nombre…"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="flex gap-2">
            <select aria-label="Departamento" className={selectCls} value={dept} onChange={(e) => setDept(e.target.value)}>
              <option value="all">Depto: todos</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <select
              aria-label="Estado"
              className={selectCls}
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
            >
              <option value="all">Estado: todos</option>
              <option value="absent">Ausente hoy</option>
              <option value="available">Disponible</option>
            </select>
            <select aria-label="Ordenar" className={selectCls} value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
              <option value="name">Orden: nombre</option>
              <option value="dept">Orden: depto</option>
            </select>
          </div>
        </div>

        {error ? (
          <p className="mb-4 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        {isLoading ? (
          <p className="text-sm font-semibold text-[var(--color-muted)]">Cargando equipo…</p>
        ) : (
          <ul className="stagger space-y-3">
            {visible.length === 0 ? (
              <li className="rounded-2xl bg-white p-6 text-center text-sm font-semibold text-[var(--color-muted)] ring-1 ring-slate-200">
                {team.length === 0 ? "Aún no tienes empleados asignados." : "Sin resultados para tu búsqueda."}
              </li>
            ) : null}
            {visible.map((member) => {
              const absent = absentIds.has(member.id);
              return (
                <li key={member.id}>
                  <button
                    className="press flex w-full items-center gap-4 rounded-[20px] bg-white p-4 text-left shadow-sm ring-1 ring-slate-200"
                    type="button"
                    onClick={() => openMember(member)}
                  >
                    {member.avatar_url ? (
                      <img
                        alt=""
                        className="size-12 shrink-0 rounded-full object-cover"
                        src={member.avatar_url}
                      />
                    ) : (
                      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-emerald-100 text-sm font-black text-emerald-700">
                        {initials(member.full_name)}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-black">{member.full_name}</span>
                      <span className="block truncate text-xs text-[var(--color-muted)]">
                        {member.job_title ?? "Sin puesto"}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ${
                        absent ? "bg-rose-100 text-rose-800" : "bg-emerald-50 text-emerald-800"
                      }`}
                    >
                      {absent ? "Ausente" : "Disponible"}
                    </span>
                    <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-[var(--color-muted)]" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <BottomSheet
        isOpen={Boolean(selected)}
        title={selected ? selected.full_name : "Historial"}
        onClose={() => setSelected(null)}
      >
        {historyLoading ? (
          <p className="py-6 text-center text-sm font-semibold text-[var(--color-muted)]">Cargando historial…</p>
        ) : (
          <ul className="stagger space-y-2">
            {history.length === 0 ? (
              <li className="rounded-2xl bg-[var(--color-surface)] p-5 text-center text-sm font-semibold text-[var(--color-muted)]">
                Sin solicitudes registradas.
              </li>
            ) : null}
            {history.slice(0, 4).map((req) => (
              <li className="rounded-2xl bg-[var(--color-surface)] p-4" key={req.id}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-black">{leaveTypeLabel[req.leave_type]}</span>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${statusTone[req.status]}`}>
                    {statusLabel[req.status]}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[var(--color-muted)]">{formatDateRange(req)}</p>
              </li>
            ))}
          </ul>
        )}

        {selected ? (
          <button
            className="press mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-sm font-black text-white"
            type="button"
            onClick={() => selected && navigate(`/manager/member/${selected.id}`)}
          >
            <ExternalLink aria-hidden="true" className="size-4" />
            Ver historial completo
          </button>
        ) : null}
      </BottomSheet>

      <ManagerBottomNav />
    </main>
  );
}
