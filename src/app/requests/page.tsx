
"use client";

import { collection, query, where, getDocs, doc, Timestamp } from "firebase/firestore";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { RequestClient } from "./components/client";
import { format, isValid } from "date-fns";
import type { RequestColumn } from "./components/columns";
import type { MaintenanceRequest, PosMachine, Customer, User, SparePart, InventoryItem } from "@/lib/types";

export default function RequestsPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const requestsQuery = useMemoFirebase(
    () => (firestore && user) ? query(collection(firestore, "maintenanceRequests")) : null,
    [firestore, user]
  );
  const techniciansQuery = useMemoFirebase(
    () => (firestore && user) ? query(collection(firestore, "users")) : null,
    [firestore, user]
  );
  const sparePartsQuery = useMemoFirebase(
    () => (firestore && user) ? query(collection(firestore, "spareParts")) : null,
    [firestore, user]
  );
  const inventoryQuery = useMemoFirebase(
    () => (firestore && user) ? query(collection(firestore, "inventory")) : null,
    [firestore, user]
  );
  
  const { data: requestsData, isLoading: isRequestsLoading } = useCollection<MaintenanceRequest>(requestsQuery);
  const { data: techniciansData, isLoading: isTechniciansLoading } = useCollection<User>(techniciansQuery);
  const { data: sparePartsData, isLoading: isSparePartsLoading } = useCollection<SparePart>(sparePartsQuery);
  const { data: inventoryData, isLoading: isInventoryLoading } = useCollection<InventoryItem>(inventoryQuery);


  const formattedRequests: RequestColumn[] = requestsData ? requestsData.map(item => {
    const createdAtDate = item.createdAt?.toDate();
    const closingDate = item.closingTimestamp?.toDate();
    return {
      id: item.id,
      customerId: item.customerId,
      posMachineId: item.posMachineId,
      customerName: item.customerName,
      machineModel: item.machineModel || 'N/A',
      machineManufacturer: item.machineManufacturer || 'N/A',
      serialNumber: item.serialNumber || 'N/A',
      complaint: item.complaint,
      status: item.status,
      priority: item.priority,
      technician: item.technician,
      createdAt: createdAtDate && isValid(createdAtDate) ? format(createdAtDate, "yyyy/MM/dd hh:mm a") : 'N/A',
      actionTaken: item.actionTaken,
      closingTimestamp: closingDate && isValid(closingDate) ? format(closingDate, "yyyy/MM/dd hh:mm a") : undefined,
      usedParts: item.usedParts,
      receiptNumber: item.receiptNumber,
    };
  }) : [];
  
  const isLoading = isUserLoading || isRequestsLoading || isTechniciansLoading || isSparePartsLoading || isInventoryLoading;

  const findCustomerMachines = async (customerId: string): Promise<PosMachine[]> => {
    if (!firestore) return [];
    const machines: PosMachine[] = [];
    const q = query(collection(firestore, "posMachines"), where("customerId", "==", customerId));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      machines.push({ id: doc.id, ...doc.data() } as PosMachine);
    });
    return machines;
  };

  const findCustomer = async (customerId: string): Promise<Customer | null> => {
      if (!firestore) return null;
      try {
          const docSnap = await getDocs(query(collection(firestore, "customers"), where("bkcode", "==", customerId)));
          
          if (!docSnap.empty) {
              const customerDoc = docSnap.docs[0];
              return { id: customerDoc.id, ...customerDoc.data() } as Customer;
          }
      } catch (e) {
          console.error("Error fetching customer:", e);
      }
      return null;
  }

  return (
    <div className="flex-1 space-y-4">
      <RequestClient 
        data={formattedRequests} 
        technicians={techniciansData || []}
        spareParts={sparePartsData || []}
        inventory={inventoryData || []}
        findCustomerMachines={findCustomerMachines}
        findCustomer={findCustomer}
        isLoading={isLoading}
      />
    </div>
  );
}

    