
"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Loader2, Trash2, RefreshCw } from "lucide-react";
import { MachineParameter, PosMachine } from "@/lib/types";
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, useUser } from "@/firebase";
import { collection, query, doc, getDocs, writeBatch } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

interface MachineParametersClientProps {
    parameters: MachineParameter[];
    isLoading: boolean;
}

export function MachineParametersClient({ parameters, isLoading }: MachineParametersClientProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isUpdating, setIsUpdating] = React.useState(false);
  const [newParam, setNewParam] = React.useState({ prefix: "", model: "", manufacturer: "" });

  const handleAddParameter = () => {
    if (!firestore) {
      toast({ variant: "destructive", title: "خطأ", description: "لا يمكن الاتصال بقاعدة البيانات."});
      return;
    }
    if (newParam.prefix && newParam.model && newParam.manufacturer) {
      const parametersCollection = collection(firestore, 'machineParameters');
      addDocumentNonBlocking(parametersCollection, newParam);
      setNewParam({ prefix: "", model: "", manufacturer: "" });
      toast({ title: "تمت الإضافة", description: "تمت إضافة القاعدة الجديدة بنجاح." });
    } else {
      toast({ variant: "destructive", title: "بيانات ناقصة", description: "الرجاء ملء جميع الحقول." });
    }
  };

  const handleDeleteParameter = (id: string) => {
    if (!firestore) {
      toast({ variant: "destructive", title: "خطأ", description: "لا يمكن الاتصال بقاعدة البيانات."});
      return;
    }
    const paramDoc = doc(firestore, 'machineParameters', id);
    deleteDocumentNonBlocking(paramDoc);
    toast({ title: "تم الحذف", description: "تم حذف القاعدة بنجاح." });
  };

  const handleApplyRulesToAllMachines = async () => {
    if (!firestore || !parameters || parameters.length === 0) {
      toast({ variant: "destructive", title: "لا يمكن التحديث", description: "لا توجد قواعد لتعريف الماكينات أو لا يمكن الاتصال بالخدمة."});
      return;
    }

    setIsUpdating(true);
    toast({ title: "بدء التحديث", description: "جاري تحديث بيانات الماكينات... قد تستغرق العملية بعض الوقت."});
    
    try {
      const machinesCollection = collection(firestore, 'posMachines');
      const machinesSnapshot = await getDocs(machinesCollection);
      const batch = writeBatch(firestore);
      let updatedCount = 0;

      machinesSnapshot.forEach((machineDoc) => {
        const machine = machineDoc.data() as PosMachine;
        const serial = machine.serialNumber;
        
        const matchingParam = parameters.find(p => serial.startsWith(p.prefix));
        
        if (matchingParam && (machine.model !== matchingParam.model || machine.manufacturer !== matchingParam.manufacturer)) {
          const machineRef = doc(firestore, 'posMachines', machineDoc.id);
          batch.update(machineRef, { 
            model: matchingParam.model, 
            manufacturer: matchingParam.manufacturer 
          });
          updatedCount++;
        }
      });

      if (updatedCount > 0) {
        await batch.commit();
        toast({ title: "اكتمل التحديث", description: `تم تحديث بيانات ${updatedCount} ماكينة بنجاح.` });
      } else {
        toast({ title: "لا توجد تحديثات", description: "جميع بيانات الماكينات محدثة بالفعل." });
      }

    } catch (error) {
      console.error("Error updating machines:", error);
      toast({ variant: "destructive", title: "خطأ", description: "فشل تحديث بيانات الماكينات." });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>قواعد تعريف الماكينات</CardTitle>
              <CardDescription>
                إدارة قواعد تحديد موديل ومصنع الماكينة تلقائيًا من الرقم التسلسلي.
              </CardDescription>
            </div>
            <Button onClick={handleApplyRulesToAllMachines} disabled={isLoading || isUpdating}>
                {isUpdating ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <RefreshCw className="ml-2 h-4 w-4" />}
                تطبيق القواعد على كل الماكينات
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
             <div className="flex items-center justify-center p-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>بادئة الرقم التسلسلي</TableHead>
                <TableHead>الموديل</TableHead>
                <TableHead>المصنّع</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parameters?.map((param) => (
                <TableRow key={param.id}>
                  <TableCell className="font-medium">{param.prefix}</TableCell>
                  <TableCell>{param.model}</TableCell>
                  <TableCell>{param.manufacturer}</TableCell>
                  <TableCell className="text-left">
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteParameter(param.id)} disabled={isUpdating}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
          
          <div className="flex gap-4 items-end pt-4 border-t">
              <div className="space-y-2 flex-1">
                <Label htmlFor="prefix">البادئة</Label>
                <Input id="prefix" value={newParam.prefix} onChange={(e) => setNewParam({...newParam, prefix: e.target.value})} placeholder="e.g. 3C" disabled={isUpdating} />
              </div>
              <div className="space-y-2 flex-1">
                <Label htmlFor="model">الموديل</Label>
                <Input id="model" value={newParam.model} onChange={(e) => setNewParam({...newParam, model: e.target.value})} placeholder="e.g. S90" disabled={isUpdating} />
              </div>
              <div className="space-y-2 flex-1">
                <Label htmlFor="manufacturer">المصنّع</Label>
                <Input id="manufacturer" value={newParam.manufacturer} onChange={(e) => setNewParam({...newParam, manufacturer: e.target.value})} placeholder="e.g. PAX" disabled={isUpdating} />
              </div>
              <Button onClick={handleAddParameter} disabled={isUpdating}>إضافة</Button>
          </div>
        </CardContent>
      </Card>
  )

}
