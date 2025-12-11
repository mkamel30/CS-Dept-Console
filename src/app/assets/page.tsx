"use client";

import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query } from "firebase/firestore";
import { PosMachineClient } from "./components/client";
import type { PosMachineColumn } from "./components/columns";
import type { PosMachine } from "@/lib/types";

export default function PosMachinesPage() {
  const firestore = useFirestore();

  const machinesQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, "posMachines")) : null,
    [firestore]
  );
  
  const { data: machinesData, isLoading } = useCollection<PosMachine>(machinesQuery);

  const formattedMachines: PosMachineColumn[] = machinesData ? machinesData.map(item => ({
    id: item.id,
    serialNumber: item.serialNumber,
    posId: item.posId,
    model: item.model || 'N/A',
    manufacturer: item.manufacturer || 'N/A',
    customerId: item.customerId,
  })) : [];

  return (
    <div className="flex-1 space-y-4">
      <PosMachineClient data={formattedMachines} isLoading={isLoading} />
    </div>
  );
}
