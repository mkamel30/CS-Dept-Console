"use client";

import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, query } from "firebase/firestore";
import { PosMachineClient } from "./components/client";
import type { PosMachineColumn } from "./components/columns";
import type { PosMachine } from "@/lib/types";

export default function PosMachinesPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const machinesQuery = useMemoFirebase(
    () => (firestore && user) ? query(collection(firestore, "posMachines")) : null,
    [firestore, user]
  );
  
  const { data: machinesData, isLoading: isMachinesLoading } = useCollection<PosMachine>(machinesQuery);

  const formattedMachines: PosMachineColumn[] = machinesData ? machinesData.map(item => ({
    id: item.id,
    serialNumber: item.serialNumber,
    posId: item.posId,
    model: item.model || 'N/A',
    manufacturer: item.manufacturer || 'N/A',
    customerId: item.customerId,
  })) : [];
  
  const isLoading = isUserLoading || isMachinesLoading;

  return (
    <div className="flex-1 space-y-4">
      <PosMachineClient data={formattedMachines} isLoading={isLoading} />
    </div>
  );
}
