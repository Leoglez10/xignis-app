import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "./ErrorBoundary";
import { RequireAuth } from "./RequireAuth";
import { NotFoundScreen } from "../features/system/screens/NotFoundScreen";
import { PageTransition } from "./PageTransition";
import { USER_ROLES } from "../lib/database.types";
import { TopBar } from "../components/TopBar";
import { useAuth } from "../features/session/AuthContext";

// Code-splitting por ruta: cada pantalla en su chunk → menor parse en cold start (WKWebView).
// Named exports → mapear a default para React.lazy.
const AdminDashboardScreen = lazy(() => import("../features/admin/screens/AdminDashboardScreen").then((m) => ({ default: m.AdminDashboardScreen })));
const AdminReportsScreen = lazy(() => import("../features/admin/screens/AdminReportsScreen").then((m) => ({ default: m.AdminReportsScreen })));
const AdminRulesScreen = lazy(() => import("../features/admin/screens/AdminRulesScreen").then((m) => ({ default: m.AdminRulesScreen })));
const AdminRequestsScreen = lazy(() => import("../features/admin/screens/AdminRequestsScreen").then((m) => ({ default: m.AdminRequestsScreen })));
const AdminAbsencesScreen = lazy(() => import("../features/admin/screens/AdminAbsencesScreen").then((m) => ({ default: m.AdminAbsencesScreen })));
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
const ProfileScreen = lazy(() => import("../features/profiles/screens/ProfileScreen").then((m) => ({ default: m.ProfileScreen })));
const ComingSoonScreen = lazy(() => import("../features/system/screens/ComingSoonScreen").then((m) => ({ default: m.ComingSoonScreen })));
const SettingsScreen = lazy(() => import("../features/settings/screens/SettingsScreen").then((m) => ({ default: m.SettingsScreen })));
const SearchScreen = lazy(() => import("../features/search/screens/SearchScreen").then((m) => ({ default: m.SearchScreen })));

/** Header persistente: se monta una sola vez y queda fijo fuera de la transición
 *  de página, para que al cambiar de pestaña se sienta la misma pantalla. Solo
 *  visible con sesión (en login/signup no aparece). */
function AppChrome() {
  const { session, profile } = useAuth();
  return session && profile ? <TopBar /> : null;
}

export function App() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>
      <AppChrome />
      <ErrorBoundary>
      <Suspense fallback={<div className="min-h-dvh" />}>
        <PageTransition>
        {(location) => (
        <Routes location={location}>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/signup" element={<Navigate to="/login" replace />} />
          <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
          <Route path="/set-password" element={<SetPasswordScreen />} />
          <Route
            path="/profile"
            element={
              <RequireAuth allowedRoles={[...USER_ROLES]}>
                <ProfileScreen />
              </RequireAuth>
            }
          />
          <Route path="/settings" element={<RequireAuth allowedRoles={[...USER_ROLES]}><SettingsScreen /></RequireAuth>} />
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
              <RequireAuth allowedRoles={["manager"]}>
                <ManagerDashboardScreen />
              </RequireAuth>
            }
          />
          <Route
            path="/manager/requests"
            element={
              <RequireAuth allowedRoles={["manager"]}>
                <ManagerRequestsScreen />
              </RequireAuth>
            }
          />
          <Route
            path="/manager/team"
            element={
              <RequireAuth allowedRoles={["manager"]}>
                <ManagerTeamScreen />
              </RequireAuth>
            }
          />
          <Route
            path="/manager/calendar"
            element={
              <RequireAuth allowedRoles={["manager"]}>
                <ManagerCalendarScreen />
              </RequireAuth>
            }
          />
          <Route
            path="/manager/member/:memberId"
            element={
              <RequireAuth allowedRoles={["manager"]}>
                <ManagerMemberDetailScreen />
              </RequireAuth>
            }
          />
          <Route
            path="/manager/requests/:requestId"
            element={
              <RequireAuth allowedRoles={["manager"]}>
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
