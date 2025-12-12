
"use client";

import { collection, query, where, getDocs, doc } from "firebase/firestore";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { RequestClient } from "./components/client";
import { format, isValid } from "date-fns";
import type { RequestColumn } from "./components/columns";
import type { MaintenanceRequest, PosMachine, Customer, User } from "@/lib/types";

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
  
  const { data: requestsData, isLoading: isRequestsLoading } = useCollection<MaintenanceRequest>(requestsQuery);
  const { data: techniciansData, isLoading: isTechniciansLoading } = useCollection<User>(techniciansQuery);

  const formattedRequests: RequestColumn[] = requestsData ? requestsData.map(item => {
    const date = item.createdAt?.toDate();
    return {
      id: item.id,
      posMachineId: item.posMachineId,
      customerName: item.customerName,
      machineModel: item.machineModel || 'N/A',
      machineManufacturer: item.machineManufacturer || 'N/A',
      complaint: item.complaint,
      status: item.status,
      priority: item.priority,
      technician: item.technician,
      createdAt: date && isValid(date) ? format(date, "yyyy/MM/dd") : 'N/A',
    };
  }) : [];
  
  const isLoading = isUserLoading || isRequestsLoading || isTechniciansLoading;

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
        findCustomerMachines={findCustomerMachines}
        findCustomer={findCustomer}
        isLoading={isLoading}
      />
    </div>
  );
}

    