'use client';

import { Customer, PosMachine, SimCard } from '@/lib/types';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface CustomerPortalDisplayProps {
  customer: Customer;
  machines: PosMachine[];
  simCards: SimCard[];
}

export const CustomerPortalDisplay: React.FC<CustomerPortalDisplayProps> = ({
  customer,
  machines,
  simCards,
}) => {
  return (
    <Tabs defaultValue="devices" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="devices">الأجهزة والشرائح</TabsTrigger>
        <TabsTrigger value="details">بيانات العميل الأخرى</TabsTrigger>
      </TabsList>
      <TabsContent value="devices">
        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>ماكينات نقاط البيع ({machines.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-right">الرقم التسلسلي</TableHead>
                                <TableHead className="text-right">الموديل</TableHead>
                                <TableHead className="text-right">POS ID</TableHead>
                                <TableHead className="text-right">رئيسية</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {machines.length > 0 ? machines.map(machine => (
                                <TableRow key={machine.id}>
                                    <TableCell>{machine.serialNumber}</TableCell>
                                    <TableCell>{machine.model || 'N/A'}</TableCell>
                                    <TableCell>{machine.posId}</TableCell>
                                    <TableCell>{machine.isMain ? <Badge>نعم</Badge> : <Badge variant="outline">لا</Badge>}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center">لا توجد ماكينات مسجلة.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>شرائح SIM ({simCards.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-right">الرقم التسلسلي للشريحة</TableHead>
                                <TableHead className="text-right">النوع</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                             {simCards.length > 0 ? simCards.map(sim => (
                                <TableRow key={sim.id}>
                                    <TableCell>{sim.serialNumber}</TableCell>
                                    <TableCell>{sim.type}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center">لا توجد شرائح مسجلة.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
      </TabsContent>
      <TabsContent value="details">
        <Card>
          <CardHeader>
            <CardTitle>تفاصيل العميل</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-right">
                <div>
                    <p className="font-medium text-muted-foreground">رقم العميل</p>
                    <p className="font-semibold">{customer.bkcode}</p>
                </div>
                 <div>
                    <p className="font-medium text-muted-foreground">اسم العميل</p>
                    <p className="font-semibold">{customer.client_name}</p>
                </div>
                 <div>
                    <p className="font-medium text-muted-foreground">العنوان</p>
                    <p>{customer.address}</p>
                </div>
                <div>
                    <p className="font-medium text-muted-foreground">رقم الهاتف الأساسي</p>
                    <p>{customer.telephone_1 || 'N/A'}</p>
                </div>
                 <div>
                    <p className="font-medium text-muted-foreground">رقم الهاتف الإضافي</p>
                    <p>{customer.telephone_2 || 'N/A'}</p>
                </div>
                 <div>
                    <p className="font-medium text-muted-foreground">الشخص المسؤول</p>
                    <p>{customer.contact_person || 'N/A'}</p>
                </div>
                 <div>
                    <p className="font-medium text-muted-foreground">الرقم القومي</p>
                    <p>{customer.national_id || 'N/A'}</p>
                </div>
                <div>
                    <p className="font-medium text-muted-foreground">مكتب التموين</p>
                    <p>{customer.supply_office || 'N/A'}</p>
                </div>
                <div>
                    <p className="font-medium text-muted-foreground">إدارة التموين</p>
                    <p>{customer.dept || 'N/A'}</p>
                </div>
                <div>
                    <p className="font-medium text-muted-foreground">ملاحظات</p>
                    <p>{customer.notes || 'لا يوجد'}</p>
                </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};
