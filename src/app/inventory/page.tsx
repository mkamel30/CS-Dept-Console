"use client";

import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, query } from "firebase/firestore";
import { SparePartClient } from "./components/client";
import type { SparePartColumn } from "./components/columns";
import type { SparePart, MachineParameter } from "@/lib/types";

export default function SparePartsPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const sparePartsQuery = useMemoFirebase(
    () => (firestore && user) ? query(collection(firestore, "spareParts")) : null,
    [firestore, user]
  );
   const parametersQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, "machineParameters")) : null,
    [firestore]
  );
  
  const { data: sparePartsData, isLoading: isSparePartsLoading } = useCollection<SparePart>(sparePartsQuery);
  const { data: machineParameters, isLoading: isLoadingParameters } = useCollection<MachineParameter>(parametersQuery);


  const formattedSpareParts: SparePartColumn[] = sparePartsData ? sparePartsData.map(item => ({
    id: item.id,
    name: item.name,
    partNumber: item.partNumber || 'N/A',
    compatibleModels: item.compatibleModels,
    defaultCost: item.defaultCost,
  })) : [];
  
  const isLoading = isUserLoading || isSparePartsLoading || isLoadingParameters;

  const availableModels = machineParameters ? [...new Set(machineParameters.map(p => p.model))] : [];

  return (
    <div className="flex-1 space-y-4">
      <SparePartClient 
        data={formattedSpareParts} 
        isLoading={isLoading}
        availableModels={availableModels}
      />
    </div>
  );
}
