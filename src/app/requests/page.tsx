"use client";

import { useState } from "react";
import { maintenanceRequests } from "@/lib/data";
import { RequestClient } from "./components/client";
import { format } from "date-fns";
import type { RequestColumn } from "./components/columns";

export default function RequestsPage() {
  const [requests, setRequests] = useState<RequestColumn[]>(() => {
    return maintenanceRequests.map(item => ({
      id: item.id,
      issue: item.issue,
      asset: item.asset,
      status: item.status,
      priority: item.priority,
      technician: item.technician,
      createdDate: format(new Date(item.createdDate), "yyyy/MM/dd"),
    }));
  });

  return (
    <div className="flex-1 space-y-4">
      <RequestClient data={requests} setData={setRequests} />
    </div>
  );
}
