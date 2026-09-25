import { ManagerShell, TeamRoleLabel } from "../components/managerNav";
import { useAuth } from "../../session/AuthContext";
import { useDashboardPrefs } from "../useDashboardPrefs";
import { BirthdayHero } from "../../../components/BirthdayHero";
import { BirthdayStrip } from "../../../components/BirthdayStrip";
import { PendingSummary } from "../components/PendingSummary";
import { usePreferences } from "../../settings/PreferencesContext";
import { CoverageHeatmap } from "../components/CoverageHeatmap";
import { DashboardSkeleton } from "../components/DashboardSkeleton";
import { RefreshBoundary } from "../components/RefreshBoundary";
import {
  TeamAlerts,
  TeamMembersCard,
  TeamShortcuts,
  UpcomingAbsencesCard,
  UrgentRequestsSection,
  useTeamOverview,
} from "../components/TeamOverview";

export function ManagerDashboardScreen() {
  const { preferences } = usePreferences();
  const { profile } = useAuth();
  const { prefs } = useDashboardPrefs();

  const { absences, absentEmployeeIds, agedCount, error, isLoading, overlapAlert, pending, refetch, reviewRequest, team, topUrgent } =
    useTeamOverview();

  const managerFirstName = profile?.full_name.split(" ")[0] ?? "Jefe";

  return (
    <ManagerShell>
      <RefreshBoundary onRefresh={refetch}>
        <section className="page-wrap grid min-h-dvh gap-5 pb-24 pt-4 md:pt-6 lg:grid-cols-[minmax(0,1fr)_var(--aside-width)]">
          <div className="min-w-0 bg-[var(--card-bg)] p-5 ring-1 ring-[var(--card-border)] rounded-2xl md:rounded-[20px] md:p-6">
            <header className="animate-fade-up mb-6">
              {/* Rol de equipo: "Jefe", o "Dueño · Jefe" para el dueño con reportes directos. */}
              <p className="text-sm font-bold text-[var(--color-muted)]">
                <TeamRoleLabel />
              </p>
              <h2 className="mt-1 text-2xl font-bold md:text-3xl">{managerFirstName}</h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {isLoading
                  ? "Cargando…"
                  : agedCount > 0
                    ? `${pending.length} pendientes · ${agedCount} con más de 48 h`
                    : `${pending.length} solicitudes pendientes`}
              </p>
            </header>

            <BirthdayHero />

            {isLoading ? (
              <DashboardSkeleton />
            ) : (
              <>
                <TeamShortcuts absentToday={absentEmployeeIds.size} pendingCount={pending.length} teamCount={team.length} />
                <TeamAlerts agedCount={agedCount} overlapAlert={overlapAlert} />

                {error ? (
                  <p className="mb-3 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
                    {error}
                  </p>
                ) : null}

                <PendingSummary pending={pending} />
                <UrgentRequestsSection onReview={reviewRequest} pendingCount={pending.length} topUrgent={topUrgent} />
              </>
            )}
          </div>

          {!isLoading && prefs.showAgenda ? (
            <aside className="flex flex-col gap-5">
              <UpcomingAbsencesCard absences={absences} />
              <CoverageHeatmap absences={absences} members={team} />
              {prefs.showTeamWidget ? <TeamMembersCard absentEmployeeIds={absentEmployeeIds} team={team} /> : null}
              {preferences.birthdayVisibility ? <BirthdayStrip members={team} /> : null}
            </aside>
          ) : null}
        </section>
      </RefreshBoundary>
    </ManagerShell>
  );
}
