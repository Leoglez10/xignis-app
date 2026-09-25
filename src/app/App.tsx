import { lazy, Suspense, type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "./ErrorBoundary";
import { RequireAuth } from "./RequireAuth";
import { NotFoundScreen } from "../features/system/screens/NotFoundScreen";
import { PageTransition } from "./PageTransition";
import { USER_ROLES } from "../lib/database.types";
import { TopBar } from "../components/TopBar";
import { Sidebar } from "../components/Sidebar";
import { PageSkeleton } from "../components/ui/Skeleton";
import { useAuth } from "../features/session/AuthContext";
import { useOwnerNavOptions } from "../features/owner/hooks/useOwnerNavOptions";
import { ACCOUNT_BASE, accountPath, legacyAccountRedirects } from "../features/account/accountSections";

// Code-splitting por ruta: cada pantalla en su chunk → menor parse en cold start (WKWebView).
// Named exports → mapear a default para React.lazy.
const AdminDashboardScreen = lazy(() => import("../features/admin/screens/AdminDashboardScreen").then((m) => ({ default: m.AdminDashboardScreen })));
const AdminReportsScreen = lazy(() => import("../features/admin/screens/AdminReportsScreen").then((m) => ({ default: m.AdminReportsScreen })));
const AdminRulesScreen = lazy(() => import("../features/admin/screens/AdminRulesScreen").then((m) => ({ default: m.AdminRulesScreen })));
const AdminRequestsScreen = lazy(() => import("../features/admin/screens/AdminRequestsScreen").then((m) => ({ default: m.AdminRequestsScreen })));
const AdminAbsencesScreen = lazy(() => import("../features/admin/screens/AdminAbsencesScreen").then((m) => ({ default: m.AdminAbsencesScreen })));
const AdminOwnerRequestsScreen = lazy(() => import("../features/admin/screens/AdminOwnerRequestsScreen").then((m) => ({ default: m.AdminOwnerRequestsScreen })));
const AdminReportsCenterScreen = lazy(() => import("../features/admin/screens/AdminReportsCenterScreen").then((m) => ({ default: m.AdminReportsCenterScreen })));
const EmployeesScreen = lazy(() => import("../features/admin/screens/EmployeesScreen").then((m) => ({ default: m.EmployeesScreen })));
const EmployeeDetailScreen = lazy(() => import("../features/admin/screens/EmployeeDetailScreen").then((m) => ({ default: m.EmployeeDetailScreen })));
const FieldDefsScreen = lazy(() => import("../features/admin/screens/FieldDefsScreen").then((m) => ({ default: m.FieldDefsScreen })));
const DepartmentsScreen = lazy(() => import("../features/admin/screens/DepartmentsScreen").then((m) => ({ default: m.DepartmentsScreen })));
const ForgotPasswordScreen = lazy(() => import("../features/auth/screens/ForgotPasswordScreen").then((m) => ({ default: m.ForgotPasswordScreen })));
const LoginScreen = lazy(() => import("../features/auth/screens/LoginScreen").then((m) => ({ default: m.LoginScreen })));
const SetPasswordScreen = lazy(() => import("../features/auth/screens/SetPasswordScreen").then((m) => ({ default: m.SetPasswordScreen })));
const DashboardEmployeeScreen = lazy(() => import("../features/employee/screens/DashboardEmployeeScreen").then((m) => ({ default: m.DashboardEmployeeScreen })));
const EmployeeRequestsListScreen = lazy(() => import("../features/employee/screens/EmployeeRequestsListScreen").then((m) => ({ default: m.EmployeeRequestsListScreen })));
const LeaveRequestDetailScreen = lazy(() => import("../features/employee/screens/LeaveRequestDetailScreen").then((m) => ({ default: m.LeaveRequestDetailScreen })));
const LeaveRequestScreen = lazy(() => import("../features/employee/screens/LeaveRequestScreen").then((m) => ({ default: m.LeaveRequestScreen })));
const ManagerDashboardScreen = lazy(() => import("../features/manager/screens/ManagerDashboardScreen").then((m) => ({ default: m.ManagerDashboardScreen })));
const ManagerRequestsScreen = lazy(() => import("../features/manager/screens/ManagerRequestsScreen").then((m) => ({ default: m.ManagerRequestsScreen })));
const ManagerRequestDetailScreen = lazy(() => import("../features/manager/screens/ManagerRequestDetailScreen").then((m) => ({ default: m.ManagerRequestDetailScreen })));
const ManagerCalendarScreen = lazy(() => import("../features/manager/screens/ManagerCalendarScreen").then((m) => ({ default: m.ManagerCalendarScreen })));
const ManagerMemberDetailScreen = lazy(() => import("../features/manager/screens/ManagerMemberDetailScreen").then((m) => ({ default: m.ManagerMemberDetailScreen })));
const ManagerTeamScreen = lazy(() => import("../features/manager/screens/ManagerTeamScreen").then((m) => ({ default: m.ManagerTeamScreen })));
const AdminRequestDetailScreen = lazy(() => import("../features/admin/screens/AdminRequestDetailScreen").then((m) => ({ default: m.AdminRequestDetailScreen })));
const OwnerDashboardScreen = lazy(() => import("../features/owner/screens/OwnerDashboardScreen").then((m) => ({ default: m.OwnerDashboardScreen })));
const OwnerEmployeesScreen = lazy(() => import("../features/owner/screens/OwnerEmployeesScreen").then((m) => ({ default: m.OwnerEmployeesScreen })));
const OwnerEmployeeDetailScreen = lazy(() => import("../features/owner/screens/OwnerEmployeeDetailScreen").then((m) => ({ default: m.OwnerEmployeeDetailScreen })));
const OwnerRequestsScreen = lazy(() => import("../features/owner/screens/OwnerRequestsScreen").then((m) => ({ default: m.OwnerRequestsScreen })));
const OwnerRequestDetailScreen = lazy(() => import("../features/owner/screens/OwnerRequestDetailScreen").then((m) => ({ default: m.OwnerRequestDetailScreen })));
const OwnerAbsencesScreen = lazy(() => import("../features/owner/screens/OwnerAbsencesScreen").then((m) => ({ default: m.OwnerAbsencesScreen })));
const OwnerReportsScreen = lazy(() => import("../features/owner/screens/OwnerReportsScreen").then((m) => ({ default: m.OwnerReportsScreen })));
const OwnerRhRequestsScreen = lazy(() => import("../features/owner/screens/OwnerRhRequestsScreen").then((m) => ({ default: m.OwnerRhRequestsScreen })));
const AccountScreen = lazy(() => import("../features/account/screens/AccountScreen").then((m) => ({ default: m.AccountScreen })));
const ComingSoonScreen = lazy(() => import("../features/system/screens/ComingSoonScreen").then((m) => ({ default: m.ComingSoonScreen })));
const SearchScreen = lazy(() => import("../features/search/screens/SearchScreen").then((m) => ({ default: m.SearchScreen })));

/** Chrome persistente: se monta una sola vez y queda fijo fuera de la transición
 *  de página, para que al cambiar de pestaña se sienta la misma pantalla. Solo
 *  visible con sesión (en login/signup no aparece). La Sidebar manda en
 *  escritorio y la TopBar en móvil; el breakpoint es CSS, no JS, así que no hay
 *  parpadeo al hidratar. */
function AppChrome() {
  const { session, profile } = useAuth();
  if (!session || !profile) return null;
  return (
    <>
      <Sidebar />
      <TopBar />
    </>
  );
}

/** Inicio de jefe. En la vista "Dueño + Jefe" el dueño no tiene un "Inicio" de
 *  jefe propio (su inicio es /owner): /manager lo lleva a sus aprobaciones. En
 *  la vista "solo equipo" /manager es su inicio de equipo. */
function ManagerHome() {
  const { profile } = useAuth();
  const { teamView } = useOwnerNavOptions();
  if (profile?.role === "owner" && !teamView) return <Navigate replace to="/manager/requests" />;
  return <ManagerDashboardScreen />;
}

/** Páginas de toda la empresa del dueño. En la vista "solo equipo" quedan
 *  ocultas: si se abren directo (deep link, login), van a sus aprobaciones. */
function OwnerCompanyPage({ children }: { children: ReactNode }) {
  const { teamView } = useOwnerNavOptions();
  if (teamView) return <Navigate replace to="/manager/requests" />;
  return <>{children}</>;
}

export function App() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>
      <AppChrome />
      <ErrorBoundary>
      <Suspense fallback={<PageSkeleton />}>
        <PageTransition>
        {(location) => (
        <Routes location={location}>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/signup" element={<Navigate to="/login" replace />} />
          <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
          <Route path="/set-password" element={<SetPasswordScreen />} />
          <Route path={ACCOUNT_BASE} element={<Navigate replace to={accountPath()} />} />
          <Route path={`${ACCOUNT_BASE}/:section`} element={<RequireAuth allowedRoles={[...USER_ROLES]}><AccountScreen /></RequireAuth>} />
          {/* Rutas anteriores de perfil/ajustes: redirigen a su sección en Cuenta. */}
          {Object.entries(legacyAccountRedirects).map(([from, to]) => (
            <Route key={from} path={from} element={<Navigate replace to={to} />} />
          ))}
          <Route path="/buscar" element={<RequireAuth allowedRoles={[...USER_ROLES]}><SearchScreen /></RequireAuth>} />
          <Route
            path="/employee"
            element={
              <RequireAuth allowedRoles={["employee"]}>
                <DashboardEmployeeScreen />
              </RequireAuth>
            }
          />
          <Route
            path="/employee/request"
            element={
              <RequireAuth allowedRoles={["employee"]}>
                <LeaveRequestScreen />
              </RequireAuth>
            }
          />
          <Route
            path="/employee/requests"
            element={
              <RequireAuth allowedRoles={["employee"]}>
                <EmployeeRequestsListScreen />
              </RequireAuth>
            }
          />
          <Route
            path="/employee/requests/:requestId"
            element={
              <RequireAuth allowedRoles={["employee"]}>
                <LeaveRequestDetailScreen />
              </RequireAuth>
            }
          />
          <Route
            path="/manager"
            element={
              <RequireAuth allowedRoles={["manager", "owner"]}>
                <ManagerHome />
              </RequireAuth>
            }
          />
          <Route
            path="/manager/requests"
            element={
              <RequireAuth allowedRoles={["manager", "owner"]}>
                <ManagerRequestsScreen />
              </RequireAuth>
            }
          />
          <Route
            path="/manager/team"
            element={
              <RequireAuth allowedRoles={["manager", "owner"]}>
                <ManagerTeamScreen />
              </RequireAuth>
            }
          />
          <Route
            path="/manager/calendar"
            element={
              <RequireAuth allowedRoles={["manager", "owner"]}>
                <ManagerCalendarScreen />
              </RequireAuth>
            }
          />
          <Route
            path="/manager/member/:memberId"
            element={
              <RequireAuth allowedRoles={["manager", "owner"]}>
                <ManagerMemberDetailScreen />
              </RequireAuth>
            }
          />
          <Route
            path="/manager/requests/:requestId"
            element={
              <RequireAuth allowedRoles={["manager", "owner"]}>
                <ManagerRequestDetailScreen />
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAuth allowedRoles={["hr_admin", "admin"]}>
                <AdminDashboardScreen />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/requests"
            element={
              <RequireAuth allowedRoles={["hr_admin", "admin"]}>
                <AdminRequestsScreen />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/absences"
            element={
              <RequireAuth allowedRoles={["hr_admin", "admin"]}>
                <AdminAbsencesScreen />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/employees"
            element={
              <RequireAuth allowedRoles={["hr_admin", "admin"]}>
                <EmployeesScreen />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/employees/:id"
            element={
              <RequireAuth allowedRoles={["hr_admin", "admin"]}>
                <EmployeeDetailScreen />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/fields"
            element={
              <RequireAuth allowedRoles={["hr_admin", "admin"]}>
                <FieldDefsScreen />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/departments"
            element={
              <RequireAuth allowedRoles={["hr_admin", "admin"]}>
                <DepartmentsScreen />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <RequireAuth allowedRoles={["hr_admin", "admin"]}>
                <AdminReportsScreen />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/requests/:requestId"
            element={
              <RequireAuth allowedRoles={["hr_admin", "admin"]}>
                <AdminRequestDetailScreen />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/rules"
            element={
              <RequireAuth allowedRoles={["hr_admin", "admin"]}>
                <AdminRulesScreen />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/owner-requests"
            element={
              <RequireAuth allowedRoles={["hr_admin", "admin"]}>
                <AdminOwnerRequestsScreen />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/hr-reports"
            element={
              <RequireAuth allowedRoles={["hr_admin", "admin"]}>
                <AdminReportsCenterScreen />
              </RequireAuth>
            }
          />
          <Route
            path="/owner"
            element={
              <RequireAuth allowedRoles={["owner"]}>
                <OwnerCompanyPage><OwnerDashboardScreen /></OwnerCompanyPage>
              </RequireAuth>
            }
          />
          <Route
            path="/owner/employees"
            element={
              <RequireAuth allowedRoles={["owner"]}>
                <OwnerCompanyPage><OwnerEmployeesScreen /></OwnerCompanyPage>
              </RequireAuth>
            }
          />
          <Route
            path="/owner/employees/:id"
            element={
              <RequireAuth allowedRoles={["owner"]}>
                <OwnerCompanyPage><OwnerEmployeeDetailScreen /></OwnerCompanyPage>
              </RequireAuth>
            }
          />
          <Route
            path="/owner/requests"
            element={
              <RequireAuth allowedRoles={["owner"]}>
                <OwnerCompanyPage><OwnerRequestsScreen /></OwnerCompanyPage>
              </RequireAuth>
            }
          />
          <Route
            path="/owner/requests/:requestId"
            element={
              <RequireAuth allowedRoles={["owner"]}>
                <OwnerCompanyPage><OwnerRequestDetailScreen /></OwnerCompanyPage>
              </RequireAuth>
            }
          />
          <Route
            path="/owner/absences"
            element={
              <RequireAuth allowedRoles={["owner"]}>
                <OwnerCompanyPage><OwnerAbsencesScreen /></OwnerCompanyPage>
              </RequireAuth>
            }
          />
          <Route
            path="/owner/reports"
            element={
              <RequireAuth allowedRoles={["owner"]}>
                <OwnerCompanyPage><OwnerReportsScreen /></OwnerCompanyPage>
              </RequireAuth>
            }
          />
          <Route
            path="/owner/rh-requests"
            element={
              <RequireAuth allowedRoles={["owner"]}>
                <OwnerCompanyPage><OwnerRhRequestsScreen /></OwnerCompanyPage>
              </RequireAuth>
            }
          />
          {/* Módulos futuros de la plataforma Xignis (coming soon) */}
          {["gastos", "reportes", "nomina", "documentos", "organizacion"].map((id) => (
            <Route
              key={id}
              path={`/${id}`}
              element={
                <RequireAuth allowedRoles={[...USER_ROLES]}>
                  <ComingSoonScreen moduleId={id} />
                </RequireAuth>
              }
            />
          ))}
          <Route path="*" element={<NotFoundScreen />} />
        </Routes>
        )}
        </PageTransition>
      </Suspense>
      </ErrorBoundary>
    </>
  );
}
