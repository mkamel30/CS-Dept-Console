
"use client";

import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, query } from "firebase/firestore";
import { WarehouseClient } from "./components/client";
import type { InventoryColumn } from "./components/columns";
import type { InventoryItem, SparePart } from "@/lib/types";
import { Loader2 } from "lucide-react";

export default function WarehousePage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const inventoryQuery = useMemoFirebase(
    () => (firestore && user) ? query(collection(firestore, "inventory")) : null,
    [firestore, user]
  );
   const sparePartsQuery = useMemoFirebase(
    () => (firestore && user) ? query(collection(firestore, "spareParts")) : null,
    [firestore, user]
  );
  
  const { data: inventoryData, isLoading: isInventoryLoading } = useCollection<InventoryItem>(inventoryQuery);
  const { data: sparePartsData, isLoading: isSparePartsLoading } = useCollection<SparePart>(sparePartsQuery);

  const isLoading = isUserLoading || isInventoryLoading || isSparePartsLoading;
  
  const sparePartsMap = useMemoFirebase(() => {
    if (!sparePartsData) return new Map<string, SparePart>();
    return new Map(sparePartsData.map(part => [part.id, part]));
  }, [sparePartsData]);

  const formattedInventory: InventoryColumn[] = inventoryData ? inventoryData.map(item => {
    const partInfo = sparePartsMap.get(item.partId);
    return {
        id: item.id,
        partId: item.partId,
        partName: partInfo?.name || 'قطعة غير معرفة',
        partNumber: partInfo?.partNumber || 'N/A',
        quantity: item.quantity,
        minLevel: item.minLevel,
        location: item.location,
    }
  }) : [];
  
  if (isLoading) {
    return (
        <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mr-4 text-muted-foreground">...جاري تحميل بيانات المخزن</p>
        </div>
    );
  }

  return (
    <div className="flex-1 space-y-4">
        <WarehouseClient
            data={formattedInventory}
            spareParts={sparePartsData || []}
            isLoading={isLoading}
        />
    </div>
  );
}
