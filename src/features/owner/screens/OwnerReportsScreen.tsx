import { AdminReportsScreen } from "../../admin/screens/AdminReportsScreen";
import { OwnerReadOnlyBanner } from "../components/OwnerReadOnlyBanner";

export function OwnerReportsScreen() {
  return <AdminReportsScreen banner={<OwnerReadOnlyBanner />} />;
}
