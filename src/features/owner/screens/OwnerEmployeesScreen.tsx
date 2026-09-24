import { Search, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Avatar } from "../../../components/ui/Avatar";
import { AdminShell } from "../../admin/components/adminNav";
import { listEmployees, roleLabel } from "../../profiles/services/profileService";
import { OwnerReadOnlyBanner } from "../components/OwnerReadOnlyBanner";

export function OwnerEmployeesScreen() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const { data: employees, error, isLoading } = useQuery({
    queryKey: ["owner", "employees"],
    queryFn: listEmployees,
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return employees ?? [];
    return (employees ?? []).filter(
      (e) =>
        e.full_name.toLowerCase().includes(q) ||
        (e.job_title ?? "").toLowerCase().includes(q) ||
        (e.department?.name ?? "").toLowerCase().includes(q),
    );
  }, [employees, query]);

  return (
    <AdminShell>
      <div className="page-wrap pb-24 pt-5 md:pt-6">
        <header className="animate-fade-up mb-5">
          <p className="text-sm font-bold text-[var(--color-muted)]">Suite del dueño</p>
          <h2 className="mt-1 text-2xl font-bold md:text-3xl">Empleados</h2>
        </header>

        <div className="mb-5">
          <OwnerReadOnlyBanner />
        </div>

        <section className="mb-5 animate-fade-up rounded-[20px] bg-white p-4 ring-1 ring-slate-200">
          <div className="relative">
            <span className="sr-only">Buscar empleados</span>
            <Search aria-hidden="true" className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-muted)]" />
            <input
              className="h-11 w-full rounded-full bg-slate-50 pl-11 pr-4 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-[var(--color-focus)]"
              placeholder="Buscar por nombre, puesto o área"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </section>

        {error ? (
          <p className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
            {error instanceof Error ? error.message : "No se pudieron cargar los empleados."}
          </p>
        ) : null}

        {isLoading ? (
          <p className="text-sm font-semibold text-[var(--color-muted)]">Cargando empleados…</p>
        ) : (
          <ul className="stagger space-y-3">
            {filtered.length === 0 ? (
              <li className="rounded-2xl bg-white p-6 text-center text-sm font-semibold text-[var(--color-muted)] ring-1 ring-slate-200">
                No hay empleados que coincidan.
              </li>
            ) : null}
            {filtered.map((emp) => (
              <li key={emp.id}>
                <button
                  className="press flex w-full items-center gap-4 rounded-[20px] bg-white p-4 text-left ring-1 ring-slate-200"
                  type="button"
                  onClick={() => navigate(`/owner/employees/${emp.id}`)}
                >
                  <Avatar name={emp.full_name} size="size-12" src={emp.avatar_url} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-[var(--color-text)]">
                      {emp.full_name}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-[var(--color-muted)]">
                      {emp.job_title ?? "Sin puesto"}
                      {emp.department?.name ? ` · ${emp.department.name}` : null}
                    </span>
                    <span className="mt-2 inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                      {roleLabel[emp.role]}
                    </span>
                  </span>
                  <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-[var(--color-muted)]" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}
