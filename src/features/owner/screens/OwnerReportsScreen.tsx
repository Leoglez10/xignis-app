import { AdminReportsScreen } from "../../admin/screens/AdminReportsScreen";
import { OwnerReadOnlyBanner } from "../components/OwnerReadOnlyBanner";

export function OwnerReportsScreen() {
  return (
    <>
      <div className="page-wrap pb-4 pt-4 md:pt-6">
        <OwnerReadOnlyBanner />
      </div>
      <AdminReportsScreen />
    </>
  );
}
