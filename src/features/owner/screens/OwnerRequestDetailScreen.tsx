import { useNavigate, useParams } from "react-router-dom";
import { RequestDetailLayout } from "../../leave-requests/components/RequestDetailLayout";
import { usePageTitle } from "../../../lib/usePageTitle";
import { OwnerReadOnlyNotice } from "../components/OwnerReadOnlyNotice";

export function OwnerRequestDetailScreen() {
  const navigate = useNavigate();
  const { requestId } = useParams();
  usePageTitle("Detalle de solicitud");

  return (
    <RequestDetailLayout
      banner={<OwnerReadOnlyNotice>Solicitud en modo lectura. La deciden su jefe directo y RH.</OwnerReadOnlyNotice>}
      onBack={() => navigate("/owner/requests")}
      requestId={requestId ?? ""}
      showEmployee
      title="Detalle de solicitud"
    />
  );
}
