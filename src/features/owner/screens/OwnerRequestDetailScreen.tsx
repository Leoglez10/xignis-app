import { useNavigate, useParams } from "react-router-dom";
import { RequestDetailLayout } from "../../leave-requests/components/RequestDetailLayout";
import { usePageTitle } from "../../../lib/usePageTitle";
import { OwnerReadOnlyBanner } from "../components/OwnerReadOnlyBanner";

export function OwnerRequestDetailScreen() {
  const navigate = useNavigate();
  const { requestId } = useParams();
  usePageTitle("Detalle de solicitud");

  return (
    <>
      <div className="page-wrap pb-4 pt-4 md:pt-6">
        <OwnerReadOnlyBanner />
      </div>
      <RequestDetailLayout
        onBack={() => navigate("/owner/requests")}
        requestId={requestId ?? ""}
        showEmployee
        title="Detalle de solicitud"
      />
    </>
  );
}
