import { CalendarDays, LayoutGrid, List, Plus, Search } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { Avatar } from "../../../components/ui/Avatar";
import type { Department, EmploymentStatus, SeparationType, UserRole } from "../../../lib/database.types";
import { useIsDesktop } from "../../../lib/useIsDesktop";
import { roleLabel, type ProfileWithManager } from "../../profiles/services/profileService";
import { areaColor } from "../areaColor";

/** Bucket key for employees with no department assigned. */
export const NO_AREA = "__no_area__";

/** How many people a collapsed area group previews before "Ver más". */
export const GROUP_PREVIEW = 3;

/**
 * Area groups collapse to a preview so the grouped list stops being one endless
 * scroll on a phone. Three cases bypass the cap:
 * - desktop, where the grid is already 3 columns wide and there is no scroll
 *   problem to solve;
 * - drilling into a single area, which is an explicit "show me this one";
 * - searching, since capping would hide matches behind the button and make the
 *   search look broken.
 */
export function groupPreview<T>(
  members: T[],
  areaFilter: string | null,
  query: string,
  isDesktop: boolean,
): { visible: T[]; hidden: number } {
  const expanded = isDesktop || areaFilter !== null || query.trim() !== "";
  const visible = expanded ? members : members.slice(0, GROUP_PREVIEW);
  return { visible, hidden: members.length - visible.length };
}

/**
 * Runs `update` inside a View Transition so the tapped area card morphs into
 * the drilled-in list header (shared `view-transition-name`). Falls back to a
 * plain synchronous update where the API is missing (older Safari/Firefox).
 */
function withViewTransition(update: () => void) {
  const start = (document as Document & {
    startViewTransition?: (cb: () => void) => void;
  }).startViewTransition;
  if (!start) {
    update();
    return;
  }
  start.call(document, () => flushSync(update));
}

export const separationLabel: Record<SeparationType, string> = {
  voluntary: "Renuncia voluntaria",
  involuntary: "Baja involuntaria",
  end_contract: "Fin de contrato",
  relocation: "Reubicación",
  retirement: "Jubilación",
  other: "Otro",
};

type StatusFilter = "active" | "terminated" | "all";
type ViewMode = "list" | "areas";

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "active", label: "Activos" },
  { key: "terminated", label: "Bajas" },
  { key: "all", label: "Todos" },
];

function matchesStatus(status: EmploymentStatus, filter: StatusFilter): boolean {
  if (filter === "all") return true;
  if (filter === "terminated") return status === "terminated" || status === "archived";
  return status === "active" || status === "on_leave";
}

const roleBadge: Record<UserRole, string> = {
  admin: "bg-slate-900 text-white",
  hr_admin: "bg-indigo-100 text-indigo-800",
  manager: "bg-blue-100 text-blue-800",
  employee: "bg-emerald-100 text-emerald-800",
  owner: "bg-amber-100 text-amber-900",
};

type EmployeeDirectoryProps = {
  employees: ProfileWithManager[];
  /** Areas with their HR-picked color; missing ones derive a tone from the id. */
  departments: Pick<Department, "id" | "color">[];
  error: string | null;
  isLoading: boolean;
  onOpen: (employee: ProfileWithManager) => void;
  /** Per-card trailing actions (HR edit/terminate). Omit for read-only views. */
  renderActions?: (employee: ProfileWithManager) => ReactNode;
  searchPlaceholder?: string;
};

/**
 * Employee directory shared by HR and the owner suite: search, list/areas
 * toggle, status and area filters, and area-grouped employee cards. Pure
 * presentation over the given employees; actions come from the caller.
 */
export function EmployeeDirectory({
  departments,
  employees,
  error,
  isLoading,
  onOpen,
  renderActions,
  searchPlaceholder = "Buscar por nombre o puesto",
}: EmployeeDirectoryProps) {
  const isDesktop = useIsDesktop();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [areaFilter, setAreaFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("areas");
  const [query, setQuery] = useState("");

  const byStatus = useMemo(
    () => employees.filter((e) => matchesStatus(e.employment_status, statusFilter)),
    [employees, statusFilter],
  );

  const bySearch = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return byStatus;
    return byStatus.filter(
      (e) => e.full_name.toLowerCase().includes(q) || (e.job_title ?? "").toLowerCase().includes(q),
    );
  }, [byStatus, query]);

  // Chips come from byStatus so the rail stays stable while typing; counts come
  // from bySearch so they reflect what is actually on screen.
  const areas = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number }>();
    for (const e of byStatus) {
      const id = e.department_id ?? NO_AREA;
      if (!map.has(id)) map.set(id, { id, name: e.department?.name ?? "Sin área", count: 0 });
    }
    for (const e of bySearch) {
      const area = map.get(e.department_id ?? NO_AREA);
      if (area) area.count += 1;
    }
    return [...map.values()].sort((a, b) => {
      if (a.id === NO_AREA) return 1;
      if (b.id === NO_AREA) return -1;
      return a.name.localeCompare(b.name);
    });
  }, [byStatus, bySearch]);

  const filtered = useMemo(
    () => (areaFilter ? bySearch.filter((e) => (e.department_id ?? NO_AREA) === areaFilter) : bySearch),
    [bySearch, areaFilter],
  );

  // Colors picked by HR win over the derived tone, so the rail matches Áreas.
  const colorByArea = useMemo(() => new Map(departments.map((d) => [d.id, d.color])), [departments]);

  // Group the visible employees under their area so the list reads as
  // "Sistemas → gente → Sin área → gente" instead of one flat wall of cards.
  const groups = useMemo(() => {
    const map = new Map<string, { id: string; name: string; members: ProfileWithManager[] }>();
    for (const e of filtered) {
      const id = e.department_id ?? NO_AREA;
      if (!map.has(id)) map.set(id, { id, name: e.department?.name ?? "Sin área", members: [] });
      map.get(id)!.members.push(e);
    }
    return [...map.values()].sort((a, b) => {
      if (a.id === NO_AREA) return 1;
      if (b.id === NO_AREA) return -1;
      return a.name.localeCompare(b.name);
    });
  }, [filtered]);

  // Area overview cards: one card per area with an avatar cluster. Built from
  // bySearch (not filtered) so the grid always shows every area, and tapping a
  // card drills into that area's list.
  const areaCards = useMemo(() => {
    const map = new Map<string, { id: string; name: string; members: ProfileWithManager[] }>();
    for (const e of bySearch) {
      const id = e.department_id ?? NO_AREA;
      if (!map.has(id)) map.set(id, { id, name: e.department?.name ?? "Sin área", members: [] });
      map.get(id)!.members.push(e);
    }
    return [...map.values()].sort((a, b) => {
      if (a.id === NO_AREA) return 1;
      if (b.id === NO_AREA) return -1;
      return a.name.localeCompare(b.name);
    });
  }, [bySearch]);
  return (
    <>
      <div className="animate-fade-up mb-5 flex items-center gap-2">
        <label className="relative min-w-0 flex-1 md:max-w-md">
          <span className="sr-only">Buscar empleado</span>
          <Search aria-hidden="true" className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-muted)]" />
          <input
            className="h-12 w-full rounded-full bg-white pl-11 pr-4 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-[var(--color-focus)]"
            placeholder={searchPlaceholder}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <div aria-label="Modo de vista" className="flex shrink-0 gap-1 rounded-full bg-white p-1 ring-1 ring-slate-200" role="group">
          {([
            { key: "list", label: "Lista", Icon: List },
            { key: "areas", label: "Áreas", Icon: LayoutGrid },
          ] as const).map(({ key, label, Icon }) => (
            <button
              aria-label={label}
              aria-pressed={viewMode === key}
              className={`press grid size-9 place-items-center rounded-full transition ${
                viewMode === key ? "bg-slate-950 text-white" : "text-[var(--color-muted)]"
              }`}
              key={key}
              type="button"
              onClick={() => setViewMode(key)}
            >
              <Icon aria-hidden="true" className="size-4" />
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="mb-4 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <div aria-label="Filtro por estado de empleo" className="mb-4 flex flex-wrap gap-2 px-2" role="group">
        {STATUS_FILTERS.map((f) => (
          <button
            aria-pressed={statusFilter === f.key}
            className={`press rounded-full px-4 py-2 text-xs font-bold transition ${
              statusFilter === f.key ? "bg-slate-950 text-white" : "bg-white text-[var(--color-muted)] ring-1 ring-slate-200"
            }`}
            key={f.key}
            type="button"
            onClick={() => {
              setStatusFilter(f.key);
              setAreaFilter(null);
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {viewMode === "list" && areas.length > 1 ? (
        <div
          aria-label="Filtro por área"
          className="-mx-4 mb-5 flex snap-x scroll-px-6 gap-2 overflow-x-auto px-6 pb-1 pt-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-2"
          role="group"
        >
          {areas.map((area) => {
            const color = areaColor(area.id === NO_AREA ? null : area.id, colorByArea.get(area.id));
            const isActive = areaFilter === area.id;
            return (
              <button
                aria-pressed={isActive}
                className={`press flex min-h-11 shrink-0 snap-start items-center gap-2 rounded-full px-4 text-xs font-bold ring-1 transition-colors ${
                  isActive ? color.active : "bg-white text-[var(--color-text)] ring-slate-200"
                } ${area.count === 0 && !isActive ? "opacity-40" : ""}`}
                key={area.id}
                type="button"
                onClick={() => setAreaFilter(isActive ? null : area.id)}
              >
                <span aria-hidden="true" className={`size-2 rounded-full ${color.dot}`} />
                {area.name}
                <span className="tabular-nums opacity-60">{area.count}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      {isLoading ? (
        <p className="text-sm font-semibold text-[var(--color-muted)]">Cargando directorio…</p>
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-sm font-semibold text-[var(--color-muted)] ring-1 ring-slate-200">
          Sin empleados que coincidan.
        </p>
      ) : viewMode === "areas" ? (
        <ul className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {areaCards.map((area) => {
            const color = areaColor(area.id === NO_AREA ? null : area.id, colorByArea.get(area.id));
            const shown = area.members.slice(0, 8);
            const extra = area.members.length - shown.length;
            return (
              <li data-mount="true" key={area.id}>
                <button
                  className={`press flex w-full flex-col gap-3 rounded-[20px] p-4 text-left ring-1 ${color.active}`}
                  style={{ viewTransitionName: `area-${area.id}` }}
                  type="button"
                  onClick={() =>
                    withViewTransition(() => {
                      setAreaFilter(area.id);
                      setViewMode("list");
                    })
                  }
                >
                  <span className="flex items-center gap-2">
                    <span aria-hidden="true" className={`size-2.5 rounded-full ${color.dot}`} />
                    <span className="font-bold">{area.name}</span>
                    <span className="tabular-nums text-sm opacity-60">({area.members.length})</span>
                  </span>
                  <span className="flex flex-wrap items-center gap-y-1">
                    {shown.map((emp) => (
                      <Avatar
                        className="-ml-2 ring-2 ring-white first:ml-0"
                        key={emp.id}
                        name={emp.full_name}
                        size="size-10"
                        src={emp.avatar_url}
                      />
                    ))}
                    {extra > 0 ? (
                      <span className="-ml-2 grid size-10 place-items-center rounded-full bg-white text-xs font-bold text-[var(--color-muted)] ring-2 ring-white">
                        +{extra}
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => {
            const color = areaColor(group.id === NO_AREA ? null : group.id, colorByArea.get(group.id));
            const { visible, hidden } = groupPreview(group.members, areaFilter, query, isDesktop);
            return (
              <section key={group.id}>
                <div
                  className="mb-3 flex items-center gap-2"
                  style={areaFilter === group.id ? { viewTransitionName: `area-${group.id}` } : undefined}
                >
                  <span aria-hidden="true" className={`size-2.5 rounded-full ${color.dot}`} />
                  <h3 className="text-sm font-bold">{group.name}</h3>
                  <span className="tabular-nums text-xs text-[var(--color-muted)]">{group.members.length}</span>
                </div>
                <ul className="stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {visible.map((emp) => (
                    <li
                      className={`relative flex items-center gap-4 overflow-hidden rounded-[20px] bg-white p-4 shadow-sm ring-1 ${
                        areaColor(emp.department_id, emp.department_id ? colorByArea.get(emp.department_id) : null).ring
                      }`}
                      data-mount="true"
                      key={emp.id}
                    >
                      <Avatar className="text-sm text-emerald-700" name={emp.full_name} size="size-12" src={emp.avatar_url} />
                      <button
                        className="press min-w-0 flex-1 text-left"
                        type="button"
                        onClick={() => onOpen(emp)}
                      >
                        <p className="truncate font-bold">{emp.full_name}</p>
                        <p className="truncate text-xs text-[var(--color-muted)]">{emp.job_title ?? "Sin puesto"}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${roleBadge[emp.role]}`}>
                            {roleLabel[emp.role]}
                          </span>
                          {emp.employment_status === "terminated" || emp.employment_status === "archived" ? (
                            <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700">
                              Baja{emp.separation_type ? ` · ${separationLabel[emp.separation_type]}` : ""}
                            </span>
                          ) : null}
                          {emp.manager?.full_name ? (
                            <span className="text-[11px] text-[var(--color-muted)]">Jefe: {emp.manager.full_name}</span>
                          ) : null}
                          <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${
                            emp.annual_vacation_days === null ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                          }`}>
                            <CalendarDays aria-hidden="true" className="size-3" />
                            {emp.annual_vacation_days === null ? "Vacaciones no configuradas" : `${emp.annual_vacation_days} días/año`}
                          </span>
                        </div>
                      </button>
                      {renderActions?.(emp)}
                    </li>
                  ))}
                </ul>
                {hidden > 0 ? (
                  <button
                    className="press mt-3 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-2xl bg-white text-xs font-bold text-[var(--color-muted)] ring-1 ring-slate-200"
                    type="button"
                    onClick={() => withViewTransition(() => setAreaFilter(group.id))}
                  >
                    Ver {hidden} más en {group.name}
                    <Plus aria-hidden="true" className="size-3.5" />
                  </button>
                ) : null}
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
