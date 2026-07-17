import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import type { UserRole } from "../lib/database.types";
import { routeForRole } from "../features/auth/services/authService";
import { useAuth } from "../features/session/AuthContext";

export function RequireAuth({ allowedRoles, children }: { allowedRoles: UserRole[]; children: ReactNode }) {
  const { isConfigured, isLoading, profile, session } = useAuth();
  const location = useLocation();

  if (!isConfigured) return children;

  if (isLoading) {
    return (
      <main
        className="mobile-screen grid min-h-dvh place-items-center px-6 text-center text-sm font-bold text-[var(--color-muted)]"
        id="main-content"
        tabIndex={-1}
      >
        <section>
          Cargando sesion...
        </section>
      </main>
    );
  }

  if (!session) return <Navigate replace state={{ from: location }} to="/login" />;
  if (!profile) return <Navigate replace state={{ from: location }} to="/login" />;
  if (!allowedRoles.includes(profile.role)) return <Navigate replace to={routeForRole(profile.role)} />;

  return <>{children}</>;
}
