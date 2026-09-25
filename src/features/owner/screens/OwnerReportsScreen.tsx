import { AdminReportsScreen } from "../../admin/screens/AdminReportsScreen";
import { OwnerReadOnlyNotice } from "../components/OwnerReadOnlyNotice";

export function OwnerReportsScreen() {
  return <AdminReportsScreen banner={<OwnerReadOnlyNotice>Reportes de toda la empresa, en modo lectura.</OwnerReadOnlyNotice>} />;
}
