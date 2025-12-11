import { maintenanceRequests } from "@/lib/data";
import { RequestClient } from "./components/client";
import { format } from "date-fns";

export default function RequestsPage() {
  const formattedRequests = maintenanceRequests.map(item => ({
    id: item.id,
    issue: item.issue,
    asset: item.asset,
    status: item.status,
    priority: item.priority,
    technician: item.technician,
    createdDate: format(new Date(item.createdDate), "yyyy/MM/dd"),
  }));

  return (
    <div className="flex-1 space-y-4">
      <RequestClient data={formattedRequests} />
    </div>
  );
}
