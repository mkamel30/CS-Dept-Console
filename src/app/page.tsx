import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  BarChart,
  Bar,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Activity, Package, AlertCircle, Wrench } from "lucide-react"

const kpiData = [
  { title: "طلبات مفتوحة", value: "78", icon: Wrench, change: "+5.2% عن الشهر الماضي" },
  { title: "مهام متأخرة", value: "12", icon: AlertCircle, change: "-1.8% عن الشهر الماضي" },
  { title: "أصول تحت الصيانة", value: "34", icon: Activity, change: "+3 منذ الأمس" },
  { title: "مخزون منخفض", value: "8", icon: Package, change: "2 صنف حرج" },
]

const requestStatusData = [
  { status: "مفتوحة", count: 78 },
  { status: "قيد التنفيذ", count: 45 },
  { status: "مغلقة", count: 210 },
  { status: "ملغاة", count: 15 },
]

const maintenanceCostData = [
  { month: "يناير", cost: 4000 },
  { month: "فبراير", cost: 3000 },
  { month: "مارس", cost: 5000 },
  { month: "أبريل", cost: 4500 },
  { month: "مايو", cost: 6000 },
  { month: "يونيو", cost: 5500 },
]

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground">{kpi.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>طلبات الصيانة حسب الحالة</CardTitle>
            <CardDescription>نظرة عامة على جميع طلبات الصيانة.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={requestStatusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" tickFormatter={(value) => value.length > 10 ? `${value.substring(0, 10)}...` : value} />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    borderColor: "hsl(var(--border))",
                  }}
                />
                <Legend />
                <Bar dataKey="count" fill="hsl(var(--primary))" name="العدد" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>تكاليف الصيانة الشهرية</CardTitle>
            <CardDescription>عرض التكاليف على مدار الأشهر الستة الماضية.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={maintenanceCostData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    borderColor: "hsl(var(--border))",
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="cost" stroke="hsl(var(--primary))" name="التكلفة" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
