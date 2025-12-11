
"use client";

import { useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { RequestClient } from "./components/client";
import { format } from "date-fns";
import type { RequestColumn } from "./components/columns";
import type { MaintenanceRequest, PosMachine, Customer } from "@/lib/types";

export default function RequestsPage() {
  const firestore = useFirestore();

  const requestsQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, "maintenanceRequests")) : null,
    [firestore]
  );
  
  const { data: requestsData, isLoading } = useCollection<MaintenanceRequest>(requestsQuery);

  const formattedRequests: RequestColumn[] = requestsData ? requestsData.map(item => ({
    ...item,
    id: item.id,
    createdDate: item.createdAt ? format(new Date(item.createdAt), "yyyy/MM/dd") : 'N/A',
  })) : [];
  

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
      const q = query(collection(firestore, "customers"), where("id", "==", customerId));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          return { id: doc.id, ...doc.data() } as Customer;
      }
      return null;
  }

  return (
    <div className="flex-1 space-y-4">
      <RequestClient 
        data={formattedRequests} 
        findCustomerMachines={findCustomerMachines}
        findCustomer={findCustomer}
        isLoading={isLoading}
      />
    </div>
  );
}
