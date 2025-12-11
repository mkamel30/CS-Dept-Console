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

export default function SettingsPage() {
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
