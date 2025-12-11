
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
import { Trash2 } from "lucide-react";

type MachineParameter = {
  prefix: string;
  model: string;
  manufacturer: string;
};

export default function SettingsPage() {
  const [parameters, setParameters] = React.useState<MachineParameter[]>([
    { prefix: "3C", model: "S90", manufacturer: "PAX" },
    { prefix: "VX", model: "VX520", manufacturer: "Verifone" },
    { prefix: "IC", model: "ICT220", manufacturer: "Ingenico" },
  ]);
  const [newParam, setNewParam] = React.useState({ prefix: "", model: "", manufacturer: "" });

  const handleAddParameter = () => {
    if (newParam.prefix && newParam.model && newParam.manufacturer) {
      setParameters([...parameters, newParam]);
      setNewParam({ prefix: "", model: "", manufacturer: "" });
    }
  };

  const handleDeleteParameter = (prefix: string) => {
    setParameters(parameters.filter(p => p.prefix !== prefix));
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>بادئة الرقم التسلسلي</TableHead>
                <TableHead>الموديل</TableHead>
                <TableHead>المصنّع</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parameters.map((param) => (
                <TableRow key={param.prefix}>
                  <TableCell className="font-medium">{param.prefix}</TableCell>
                  <TableCell>{param.model}</TableCell>
                  <TableCell>{param.manufacturer}</TableCell>
                  <TableCell className="text-left">
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteParameter(param.prefix)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
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
