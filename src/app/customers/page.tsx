
"use client";

import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, query } from "firebase/firestore";
import { CustomerClient } from "./components/client";
import type { CustomerColumn } from "./components/columns";
import type { Customer } from "@/lib/types";

export default function CustomersPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const customersQuery = useMemoFirebase(
    () => (firestore && user) ? query(collection(firestore, "customers")) : null,
    [firestore, user]
  );
  
  const { data: customersData, isLoading: isCustomersLoading } = useCollection<Customer>(customersQuery);

  const formattedCustomers: CustomerColumn[] = customersData ? customersData.map(item => ({
    id: item.id,
    bkcode: item.bkcode,
    client_name: item.client_name,
    address: item.address,
    telephone_1: item.telephone_1 || 'N/A',
  })) : [];
  
  const isLoading = isUserLoading || isCustomersLoading;

  return (
    <div className="flex-1 space-y-4">
      <CustomerClient data={formattedCustomers} isLoading={isLoading} />
    </div>
  );
}
