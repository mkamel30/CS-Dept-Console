
"use client";

import * as React from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { MachineParameter, SparePart } from "@/lib/types";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, query } from "firebase/firestore";
import { MachineParametersClient } from "./components/machine-parameters-client";
import { SparePartsClient } from "./components/spare-parts-client";


export default function SettingsPage() {
  const firestore = useFirestore();
  const { user } = useUser();

  const parametersQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, "machineParameters")) : null,
    [firestore]
  );
  const sparePartsQuery = useMemoFirebase(
    () => (firestore && user) ? query(collection(firestore, "spareParts")) : null,
    [firestore, user]
  );
  
  const { data: parameters, isLoading: isLoadingParameters } = useCollection<MachineParameter>(parametersQuery);
  const { data: sparePartsData, isLoading: isSparePartsLoading } = useCollection<SparePart>(sparePartsQuery);

  const formattedSpareParts = sparePartsData ? sparePartsData.map(item => ({
    id: item.id,
    name: item.name,
    partNumber: item.partNumber || 'N/A',
    compatibleModels: item.compatibleModels,
    defaultCost: item.defaultCost,
  })) : [];
  
  const availableModels = parameters ? [...new Set(parameters.map(p => p.model))] : [];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">الإعدادات</h1>
        <p className="text-muted-foreground">
          إدارة قواعد النظام والباراميترز الأساسية.
        </p>
      </div>

      <Tabs defaultValue="machines" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="machines">تعريف الماكينات</TabsTrigger>
          <TabsTrigger value="spare-parts">تعريف قطع الغيار</TabsTrigger>
        </TabsList>
        <TabsContent value="machines">
            <MachineParametersClient 
              parameters={parameters || []}
              isLoading={isLoadingParameters}
            />
        </TabsContent>
        <TabsContent value="spare-parts">
            <SparePartsClient 
              data={formattedSpareParts}
              isLoading={isSparePartsLoading || isLoadingParameters}
              availableModels={availableModels}
            />
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>الملف الشخصي</CardTitle>
          <CardDescription>
            سيتم بناء هذه الجزئية قريبًا لإدارة معلومات حسابك الشخصي.
          </CardDescription>
        </CardHeader>
      </Card>
      
    </div>
  )
}
