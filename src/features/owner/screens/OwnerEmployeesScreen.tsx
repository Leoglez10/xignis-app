import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import type { Department } from "../../../lib/database.types";
import { AdminShell } from "../../admin/components/adminNav";
import { EmployeeDirectory } from "../../admin/components/EmployeeDirectory";
import { listActiveDepartments } from "../../admin/services/departmentService";
import { listEmployees } from "../../profiles/services/profileService";
import { OwnerReadOnlyNotice } from "../components/OwnerReadOnlyNotice";

/** Directorio del dueño: el mismo que ve RH, sin acciones (solo lectura). */
export function OwnerEmployeesScreen() {
  const navigate = useNavigate();
  const { data: employees, error, isLoading } = useQuery({
    queryKey: ["owner", "employees"],
    queryFn: listEmployees,
  });
  // Solo para los colores de área; sin ellos cada área deriva su tono del id.
  const { data: departments } = useQuery({
    queryKey: ["owner", "departments"],
    queryFn: () => listActiveDepartments().catch(() => [] as Department[]),
  });

  return (
    <AdminShell>
      <div className="page-wrap pb-24 pt-5 md:pt-6">
        <header className="animate-fade-up mb-5">
          <p className="text-sm font-bold text-[var(--color-muted)]">Suite del dueño</p>
          <h2 className="mt-1 text-2xl font-bold md:text-3xl">Empleados</h2>
        </header>

        <div className="mb-5">
          <OwnerReadOnlyNotice>Directorio de solo lectura. Los cambios los hace RH.</OwnerReadOnlyNotice>
        </div>

        <EmployeeDirectory
          departments={departments ?? []}
          employees={employees ?? []}
          error={error ? (error instanceof Error ? error.message : "No se pudieron cargar los empleados.") : null}
          isLoading={isLoading}
          onOpen={(emp) => navigate(`/owner/employees/${emp.id}`)}
        />
      </div>
    </AdminShell>
  );
}
