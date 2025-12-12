"use client";

import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, query } from "firebase/firestore";
import { TechniciansClient } from "./components/client";
import type { User as UserType } from "@/lib/types";
import type { TechnicianColumn } from "./components/columns";

export default function TechniciansPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  // For now, we will assume technicians are just users.
  // We might need to add roles later.
  const usersQuery = useMemoFirebase(
    () => (firestore && user) ? query(collection(firestore, "users")) : null,
    [firestore, user]
  );
  
  const { data: usersData, isLoading: isUsersLoading } = useCollection<UserType>(usersQuery);

  const formattedTechnicians: TechnicianColumn[] = usersData ? usersData.map(item => ({
    id: item.uid,
    displayName: item.displayName || 'N/A',
    email: item.email,
    role: item.role || 'فني',
  })) : [];
  
  const isLoading = isUserLoading || isUsersLoading;

  return (
    <div className="flex-1 space-y-4">
      <TechniciansClient data={formattedTechnicians} isLoading={isLoading} />
    </div>
  );
}
