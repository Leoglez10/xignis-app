import { initials } from "../../../lib/avatar";
import { ArrowLeft, ChevronRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { todayIso } from "../../../lib/date";
import { listTeamAbsencesInRange } from "../../leave-requests/services/leaveRequestService";
import { listMyTeam } from "../../profiles/services/profileService";
import { ManagerShell } from "../components/managerNav";

type StatusFilter = "all" | "absent" | "available";
type SortKey = "name" | "dept";

export function ManagerTeamScreen() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [dept, setDept] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("name");

  const teamQuery = useQuery({ queryKey: ["team", "manager", todayIso()], queryFn: async () => {
    const today = todayIso();
    const [members, absences] = await Promise.all([listMyTeam(), listTeamAbsencesInRange(today, today)]);
    return { absentIds: new Set(absences.map((a) => a.employee_id).filter(Boolean) as string[]), members };
  } });
  const team = teamQuery.data?.members ?? [];
  const absentIds = teamQuery.data?.absentIds ?? new Set<string>();
  const error = teamQuery.error instanceof Error ? teamQuery.error.message : null;
  const isLoading = teamQuery.isLoading;

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

  const selectCls =
    "min-w-0 flex-1 rounded-full border-0 bg-white px-3 py-2 text-xs font-bold text-[var(--color-text)] ring-1 ring-slate-200";

  return (
    <ManagerShell>
      <div className="page-wrap pb-24 pt-5">
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
            <p className="text-sm font-bold text-[var(--color-muted)]">Jefe</p>
            <h2 className="text-2xl font-bold md:text-3xl">Mi equipo</h2>
          </div>
        </header>

        <div className="mb-4 space-y-2 md:flex md:items-center md:gap-3 md:space-y-0">
          <label className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 ring-1 ring-slate-200 md:min-w-0 md:flex-1">
            <Search aria-hidden="true" className="size-4 shrink-0 text-[var(--color-muted)]" />
            <input
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-[var(--color-muted)]"
              placeholder="Buscar por nombre…"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="flex gap-2 md:shrink-0 md:basis-auto">
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
          <ul className="stagger grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {visible.length === 0 ? (
              <li className="col-span-full rounded-2xl bg-white p-6 text-center text-sm font-semibold text-[var(--color-muted)] ring-1 ring-slate-200">
                {team.length === 0 ? "Aún no tienes empleados asignados." : "Sin resultados para tu búsqueda."}
              </li>
            ) : null}
            {visible.map((member) => {
              const absent = absentIds.has(member.id);
              return (
                <li key={member.id}>
                  <button
                    className="press flex h-full w-full items-center gap-4 rounded-[20px] bg-white p-4 text-left shadow-sm ring-1 ring-slate-200"
                    type="button"
                    onClick={() => navigate(`/manager/member/${member.id}`)}
                  >
                    {member.avatar_url ? (
                      <img
                        alt=""
                        className="size-12 shrink-0 rounded-full object-cover"
                        src={member.avatar_url}
                      />
                    ) : (
                      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                        {initials(member.full_name)}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold">{member.full_name}</span>
                      <span className="block truncate text-xs text-[var(--color-muted)]">
                        {member.job_title ?? "Sin puesto"}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
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
    </ManagerShell>
  );
}
