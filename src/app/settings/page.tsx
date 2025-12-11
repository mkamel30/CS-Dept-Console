
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
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Loader2, Trash2 } from "lucide-react";
import { MachineParameter } from "@/lib/types";
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, query, doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";


export default function SettingsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const parametersQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, "machineParameters")) : null,
    [firestore]
  );
  
  const { data: parameters, isLoading } = useCollection<MachineParameter>(parametersQuery);

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


  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">الإعدادات</h1>
        <p className="text-muted-foreground">
          إدارة إعدادات النظام وتفضيلات المستخدم.
        </p>
      </div>
      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>تعريف الماكينات</CardTitle>
          <CardDescription>
            إدارة قواعد تحديد موديل ومصنع الماكينة تلقائيًا من الرقم التسلسلي.
          </CardDescription>
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
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteParameter(param.id)}>
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
                <Input id="prefix" value={newParam.prefix} onChange={(e) => setNewParam({...newParam, prefix: e.target.value})} placeholder="e.g. 3C" />
              </div>
              <div className="space-y-2 flex-1">
                <Label htmlFor="model">الموديل</Label>
                <Input id="model" value={newParam.model} onChange={(e) => setNewParam({...newParam, model: e.target.value})} placeholder="e.g. S90" />
              </div>
              <div className="space-y-2 flex-1">
                <Label htmlFor="manufacturer">المصنّع</Label>
                <Input id="manufacturer" value={newParam.manufacturer} onChange={(e) => setNewParam({...newParam, manufacturer: e.target.value})} placeholder="e.g. PAX" />
              </div>
              <Button onClick={handleAddParameter}>إضافة</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>الملف الشخصي</CardTitle>
          <CardDescription>
            تحديث معلومات حسابك الشخصي.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">الاسم</Label>
            <Input id="name" defaultValue="مسؤول النظام" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input id="email" type="email" defaultValue="admin@local.host" />
          </div>
          <Button>حفظ التغييرات</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>الإشعارات</CardTitle>
          <CardDescription>
            إدارة كيفية تلقيك للإشعارات.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="new-request-noti" className="text-base">طلب صيانة جديد</Label>
              <p className="text-sm text-muted-foreground">
                تلقي إشعار عند إنشاء طلب صيانة جديد.
              </p>
            </div>
            <Switch id="new-request-noti" defaultChecked />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="task-assigned-noti" className="text-base">تعيين مهمة</Label>
              <p className="text-sm text-muted-foreground">
                تلقي إشعار عند تعيين مهمة جديدة لك.
              </p>
            </div>
            <Switch id="task-assigned-noti" defaultChecked />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>النسخ الاحتياطي</CardTitle>
          <CardDescription>
            إدارة إعدادات النسخ الاحتياطي لقاعدة البيانات.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="backup-path">مسار النسخ الاحتياطي</Label>
            <Input id="backup-path" defaultValue="\\\\nas-server\\backups\\maintenance_db" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="backup-schedule">جدول النسخ الاحتياطي (Cron)</Label>
            <Input id="backup-schedule" defaultValue="0 2 * * *" />
          </div>
           <Button>حفظ وبدء النسخ الاحتياطي الآن</Button>
        </CardContent>
      </Card>
    </div>
  )
}
