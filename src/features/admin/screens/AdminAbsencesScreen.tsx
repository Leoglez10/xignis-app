import { AdminShell } from "../components/adminNav";
import { AbsencesCalendar } from "../../leave-requests/components/AbsencesCalendar";

export function AdminAbsencesScreen() {
  return (
    <AdminShell>
      <AbsencesCalendar />
    </AdminShell>
  );
}
