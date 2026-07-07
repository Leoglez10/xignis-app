import { ArrowLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomSheet } from "../../../components/ui/BottomSheet";
import type { LeaveRequest, Profile } from "../../../lib/database.types";
import {
  formatDateRange,
  leaveTypeLabel,
  listEmployeeLeaveRequests,
  statusLabel,
} from "../../leave-requests/services/leaveRequestService";
import { listMyTeam } from "../../profiles/services/profileService";

const statusTone: Record<string, string> = {
  approved: "bg-emerald-100 text-emerald-800",
  approved_by_manager: "bg-indigo-100 text-indigo-800",
  pending_manager: "bg-orange-100 text-orange-800",
  pending_hr: "bg-amber-100 text-amber-800",
  rejected: "bg-red-100 text-red-800",
  rejected_by_manager: "bg-red-100 text-red-800",
  cancelled: "bg-slate-200 text-slate-700",
};

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "X";
}

export function ManagerTeamScreen() {
  const navigate = useNavigate();
  const [team, setTeam] = useState<Profile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<Profile | null>(null);
  const [history, setHistory] = useState<LeaveRequest[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    listMyTeam()
      .then(setTeam)
      .catch((e) => setError(e instanceof Error ? e.message : "No se pudo cargar el equipo."))
      .finally(() => setIsLoading(false));
  }, []);

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

  return (
    <main className="min-h-dvh bg-slate-50 text-[var(--color-text)]" id="main-content" tabIndex={-1}>
      <div className="mx-auto w-full max-w-3xl px-4 pb-10 pt-[calc(1.25rem+env(safe-area-inset-top))] md:px-8">
        <header className="animate-fade-up mb-6 flex items-center gap-3">
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

        {error ? (
          <p className="mb-4 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        {isLoading ? (
          <p className="text-sm font-semibold text-[var(--color-muted)]">Cargando equipo…</p>
        ) : (
          <ul className="stagger space-y-3">
            {team.length === 0 ? (
              <li className="rounded-2xl bg-white p-6 text-center text-sm font-semibold text-[var(--color-muted)] ring-1 ring-slate-200">
                Aún no tienes empleados asignados.
              </li>
            ) : null}
            {team.map((member) => (
              <li key={member.id}>
                <button
                  className="press flex w-full items-center gap-4 rounded-[20px] bg-white p-4 text-left shadow-sm ring-1 ring-slate-200"
                  type="button"
                  onClick={() => openMember(member)}
                >
                  <span className="grid size-12 shrink-0 place-items-center rounded-full bg-emerald-100 text-sm font-black text-emerald-700">
                    {initials(member.full_name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-black">{member.full_name}</span>
                    <span className="block truncate text-xs text-[var(--color-muted)]">
                      {member.job_title ?? "Sin puesto"}
                    </span>
                  </span>
                  <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-[var(--color-muted)]" />
                </button>
              </li>
            ))}
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
            {history.map((req) => (
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
      </BottomSheet>
    </main>
  );
}
