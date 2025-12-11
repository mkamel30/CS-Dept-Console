import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Package } from "lucide-react";

export default function InventoryPage() {
  return (
    <div className="flex items-center justify-center h-full">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto bg-primary/10 p-4 rounded-full">
            <Package className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="mt-4">إدارة المخزون وقطع الغيار</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            سيتم بناء هذه الصفحة قريبًا لتتبع كميات قطع الغيار، إدارة التنبيهات، وربطها بطلبات الصيانة.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
