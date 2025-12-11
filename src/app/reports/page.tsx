import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="flex items-center justify-center h-full">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto bg-primary/10 p-4 rounded-full">
            <FileText className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="mt-4">التقارير والتحليلات</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            سيتم بناء هذه الصفحة قريبًا لاستخراج تقارير دورية حول الأداء، التكاليف، وتكرار الأعطال، مع دعم تصدير البيانات.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
