import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "./RequireAuth";
import { NotFoundScreen } from "../features/system/screens/NotFoundScreen";

// Code-splitting por ruta: cada pantalla en su chunk → menor parse en cold start (WKWebView).
// Named exports → mapear a default para React.lazy.
const AdminDashboardScreen = lazy(() => import("../features/admin/screens/AdminDashboardScreen").then((m) => ({ default: m.AdminDashboardScreen })));
const AdminReportsScreen = lazy(() => import("../features/admin/screens/AdminReportsScreen").then((m) => ({ default: m.AdminReportsScreen })));
const AdminRulesScreen = lazy(() => import("../features/admin/screens/AdminRulesScreen").then((m) => ({ default: m.AdminRulesScreen })));
const EmployeesScreen = lazy(() => import("../features/admin/screens/EmployeesScreen").then((m) => ({ default: m.EmployeesScreen })));
const ForgotPasswordScreen = lazy(() => import("../features/auth/screens/ForgotPasswordScreen").then((m) => ({ default: m.ForgotPasswordScreen })));
const LoginScreen = lazy(() => import("../features/auth/screens/LoginScreen").then((m) => ({ default: m.LoginScreen })));
const SetPasswordScreen = lazy(() => import("../features/auth/screens/SetPasswordScreen").then((m) => ({ default: m.SetPasswordScreen })));
const DashboardEmployeeScreen = lazy(() => import("../features/employee/screens/DashboardEmployeeScreen").then((m) => ({ default: m.DashboardEmployeeScreen })));
const EmployeeRequestsListScreen = lazy(() => import("../features/employee/screens/EmployeeRequestsListScreen").then((m) => ({ default: m.EmployeeRequestsListScreen })));
const LeaveRequestDetailScreen = lazy(() => import("../features/employee/screens/LeaveRequestDetailScreen").then((m) => ({ default: m.LeaveRequestDetailScreen })));
const LeaveRequestScreen = lazy(() => import("../features/employee/screens/LeaveRequestScreen").then((m) => ({ default: m.LeaveRequestScreen })));
const ManagerDashboardScreen = lazy(() => import("../features/manager/screens/ManagerDashboardScreen").then((m) => ({ default: m.ManagerDashboardScreen })));
const ManagerRequestDetailScreen = lazy(() => import("../features/manager/screens/ManagerRequestDetailScreen").then((m) => ({ default: m.ManagerRequestDetailScreen })));
const ManagerCalendarScreen = lazy(() => import("../features/manager/screens/ManagerCalendarScreen").then((m) => ({ default: m.ManagerCalendarScreen })));
const ManagerMemberDetailScreen = lazy(() => import("../features/manager/screens/ManagerMemberDetailScreen").then((m) => ({ default: m.ManagerMemberDetailScreen })));
const ManagerTeamScreen = lazy(() => import("../features/manager/screens/ManagerTeamScreen").then((m) => ({ default: m.ManagerTeamScreen })));
const AdminRequestDetailScreen = lazy(() => import("../features/admin/screens/AdminRequestDetailScreen").then((m) => ({ default: m.AdminRequestDetailScreen })));
const ProfileScreen = lazy(() => import("../features/profiles/screens/ProfileScreen").then((m) => ({ default: m.ProfileScreen })));

const ALL_ROLES = ["employee", "manager", "hr_admin", "admin"] as const;

export function App() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>
      <Suspense fallback={<div className="min-h-dvh" />}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/signup" element={<Navigate to="/login" replace />} />
          <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
          <Route path="/set-password" element={<SetPasswordScreen />} />
          <Route
            path="/profile"
            element={
              <RequireAuth allowedRoles={[...ALL_ROLES]}>
                <ProfileScreen />
              </RequireAuth>
            }
          />
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
            path="/admin/employees"
            element={
              <RequireAuth allowedRoles={["hr_admin", "admin"]}>
                <EmployeesScreen />
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
          <Route path="*" element={<NotFoundScreen />} />
        </Routes>
      </Suspense>
    </>
  );
}
