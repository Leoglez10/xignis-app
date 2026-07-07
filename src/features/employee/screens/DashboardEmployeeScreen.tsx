import { CalendarPlus, ChevronRight, LogOut, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import type { LeaveRequest } from "../../../lib/database.types";
import { logout } from "../../auth/services/authService";
import { NotificationBell } from "../../notifications/NotificationBell";
import { useAuth } from "../../session/AuthContext";
import {
  formatDateRange,
  leaveTypeLabel,
  listMyLeaveRequests,
  statusLabel,
} from "../../leave-requests/services/leaveRequestService";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function DashboardEmployeeScreen() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pendingCount = useMemo(
    () => requests.filter((request) => request.status === "pending_manager" || request.status === "pending_hr").length,
    [requests],
  );
  const approvedCount = useMemo(
    () => requests.filter((request) => request.status === "approved").length,
    [requests],
  );
  const recentRequests = requests.slice(0, 4);

  useEffect(() => {
    listMyLeaveRequests()
      .then((data) => {
        setRequests(data);
        setError(null);
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar tus solicitudes.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <main className="mobile-screen" id="main-content" tabIndex={-1}>
      <section className="flex min-h-dvh flex-col px-5 pb-7 pt-[calc(1.5rem+env(safe-area-inset-top))] lg:px-8">
        <header className="animate-fade-up mb-6 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-3xl font-black text-[var(--color-text)]">
              Hola, {profile?.full_name.split(" ")[0] ?? "equipo"}
            </h1>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {isLoading ? "Cargando solicitudes" : `${pendingCount} solicitudes pendientes`}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <NotificationBell />
            <button
              aria-label="Mi perfil"
              className="press grid size-12 place-items-center rounded-full bg-[var(--color-surface)] text-sm font-black text-[var(--color-text)]"
              type="button"
              onClick={() => navigate("/profile")}
            >
              {profile ? getInitials(profile.full_name) : <LogOut aria-hidden="true" className="size-5" />}
            </button>
          </div>
        </header>

        <button
          className="press animate-fade-up rounded-[24px] bg-slate-950 p-5 text-left text-white shadow-xl shadow-slate-200 lg:p-7"
          type="button"
          onClick={() => navigate("/employee/request")}
        >
          <div className="mb-4 flex items-center justify-between">
            <span className="grid size-11 place-items-center rounded-2xl bg-[var(--color-primary)]">
              <CalendarPlus aria-hidden="true" className="size-6" />
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black">2 min</span>
          </div>
          <h2 className="text-2xl font-black">Nuevo permiso</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Selecciona fechas, tipo y pendientes sin hablar con RH antes.
          </p>
        </button>

        <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-2xl bg-[var(--color-surface)] p-4">
            <p className="text-sm text-[var(--color-muted)]">Pendientes</p>
            <p className="mt-1 text-3xl font-black text-[var(--color-text)]">{pendingCount}</p>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-4">
            <p className="text-sm text-[var(--color-muted)]">Aprobadas</p>
            <p className="mt-1 text-3xl font-black text-[var(--color-text)]">{approvedCount}</p>
          </div>
        </section>

        {error ? (
          <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-semibold leading-6 text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        <section className="mt-7">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black text-[var(--color-text)]">Actividad reciente</h2>
            <button className="text-sm font-black text-[var(--color-muted)]" type="button">
              Ver todo
            </button>
          </div>
          <div className="stagger space-y-3">
            {recentRequests.length === 0 && !isLoading ? (
              <div className="rounded-2xl bg-[var(--color-surface)] p-4 text-sm font-semibold leading-6 text-[var(--color-muted)]">
                Aun no tienes solicitudes registradas.
              </div>
            ) : null}
            {recentRequests.map((request) => (
              <button
                className="press flex min-h-[72px] w-full items-center justify-between rounded-2xl bg-[var(--color-surface)] p-4 text-left"
                key={request.id}
                type="button"
                onClick={() => navigate(`/employee/requests/${request.id}`)}
              >
                <div>
                  <h3 className="font-bold text-[var(--color-text)]">{leaveTypeLabel[request.leave_type]}</h3>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">{formatDateRange(request)}</p>
                </div>
                <span className="flex items-center gap-2">
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[var(--color-text)]">
                    {statusLabel[request.status]}
                  </span>
                  <ChevronRight aria-hidden="true" className="size-4 text-[var(--color-muted)]" />
                </span>
              </button>
            ))}
          </div>
        </section>

        <div className="mt-auto pt-8">
          <Button className="w-full" onClick={() => navigate("/employee/request")}>
            <Plus aria-hidden="true" className="size-5" />
            Nueva solicitud
          </Button>
        </div>
      </section>
    </main>
  );
}
