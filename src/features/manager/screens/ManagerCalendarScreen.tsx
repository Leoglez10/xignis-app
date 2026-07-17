import { ManagerShell } from "../components/managerNav";
import { AbsencesCalendar } from "../../leave-requests/components/AbsencesCalendar";

export function ManagerCalendarScreen() {
  return (
    <ManagerShell>
      <AbsencesCalendar />
    </ManagerShell>
  );
}
