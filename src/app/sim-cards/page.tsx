
"use client";

import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, query } from "firebase/firestore";
import { SimCardClient } from "./components/client";
import type { SimCardColumn } from "./components/columns";
import type { SimCard } from "@/lib/types";

export default function SimCardsPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const simCardsQuery = useMemoFirebase(
    () => (firestore && user) ? query(collection(firestore, "simCards")) : null,
    [firestore, user]
  );
  
  const { data: simCardsData, isLoading: isSimCardsLoading } = useCollection<SimCard>(simCardsQuery);

  const formattedSimCards: SimCardColumn[] = simCardsData ? simCardsData.map(item => ({
    id: item.id,
    serialNumber: item.serialNumber,
    type: item.type,
    customerId: item.customerId,
  })) : [];
  
  const isLoading = isUserLoading || isSimCardsLoading;

  return (
    <div className="flex-1 space-y-4">
      <SimCardClient data={formattedSimCards} isLoading={isLoading} />
    </div>
  );
}
