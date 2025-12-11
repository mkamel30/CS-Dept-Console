import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function TechniciansPage() {
  return (
    <div className="flex items-center justify-center h-full">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto bg-primary/10 p-4 rounded-full">
            <Users className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="mt-4">إدارة الفنيين والمهام</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            سيتم بناء هذه الصفحة قريبًا لتوزيع المهام على الفنيين، متابعة الأداء، وتوثيق الإنجازات.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
