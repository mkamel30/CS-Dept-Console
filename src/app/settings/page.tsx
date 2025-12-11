
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
import { Loader2, Trash2, RefreshCw } from "lucide-react";
import { MachineParameter, PosMachine } from "@/lib/types";
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, useUser, useAuth } from "@/firebase";
import { collection, query, doc, getDocs, writeBatch } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { updateProfile, updateEmail } from "firebase/auth";


export default function SettingsPage() {
  const firestore = useFirestore();
  const auth = useAuth();
  const { user } = useUser();
  const { toast } = useToast();

  const [isUpdating, setIsUpdating] = React.useState(false);
  const [isProfileUpdating, setIsProfileUpdating] = React.useState(false);
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');

  const parametersQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, "machineParameters")) : null,
    [firestore]
  );
  
  const { data: parameters, isLoading } = useCollection<MachineParameter>(parametersQuery);

  const [newParam, setNewParam] = React.useState({ prefix: "", model: "", manufacturer: "" });

  React.useEffect(() => {
    if (user) {
      setName(user.displayName || '');
      setEmail(user.email || '');
    }
  }, [user]);

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

  const handleProfileUpdate = async () => {
    if (!user) {
        toast({ variant: 'destructive', title: 'خطأ', description: 'يجب تسجيل الدخول أولاً.' });
        return;
    }

    setIsProfileUpdating(true);

    try {
        if (user.displayName !== name) {
            await updateProfile(user, { displayName: name });
        }
        if (user.email !== email) {
            await updateEmail(user, email);
        }
        toast({ title: 'تم التحديث بنجاح', description: 'تم تحديث بيانات ملفك الشخصي.' });
    } catch (error: any) {
        console.error('Error updating profile:', error);
        toast({ variant: 'destructive', title: 'خطأ في التحديث', description: error.message });
    } finally {
        setIsProfileUpdating(false);
    }
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>تعريف الماكينات</CardTitle>
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
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={isProfileUpdating || !user} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isProfileUpdating || !user} />
          </div>
          <Button onClick={handleProfileUpdate} disabled={isProfileUpdating || !user}>
            {isProfileUpdating && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            حفظ التغييرات
          </Button>
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

    