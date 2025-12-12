'use client';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc, updateDoc } from 'firebase/firestore';

import { Customer, PosMachine, SimCard } from '@/lib/types';
import { useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Pencil } from 'lucide-react';


interface CustomerPortalDisplayProps {
  customer: Customer;
  machines: PosMachine[];
  simCards: SimCard[];
  onCustomerUpdate: (updatedCustomer: Customer) => void;
}

const formSchema = z.object({
  client_name: z.string().min(1, { message: "اسم العميل مطلوب." }),
  address: z.string().min(1, { message: "العنوان مطلوب." }),
  national_id: z.string().optional(),
  supply_office: z.string().optional(),
  dept: z.string().optional(),
  contact_person: z.string().optional(),
  telephone_1: z.string().optional(),
  telephone_2: z.string().optional(),
  notes: z.string().optional(),
  isSpecial: z.boolean().optional(),
});


export const CustomerPortalDisplay: React.FC<CustomerPortalDisplayProps> = ({
  customer,
  machines,
  simCards,
  onCustomerUpdate,
}) => {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      client_name: customer.client_name,
      address: customer.address,
      national_id: customer.national_id || '',
      supply_office: customer.supply_office || '',
      dept: customer.dept || '',
      contact_person: customer.contact_person || '',
      telephone_1: customer.telephone_1 || '',
      telephone_2: customer.telephone_2 || '',
      notes: customer.notes || '',
      isSpecial: customer.isSpecial || false,
    },
  });

  const {
    handleSubmit,
    register,
    control,
    formState: { isSubmitting, errors },
  } = form;


  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore) return;
    try {
      const customerRef = doc(firestore, 'customers', customer.id);
      await updateDoc(customerRef, values);

      onCustomerUpdate({ ...customer, ...values });
      
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث بيانات العميل.",
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating customer:", error);
      toast({
        variant: "destructive",
        title: "حدث خطأ",
        description: "فشلت عملية تحديث بيانات العميل.",
      });
    }
  };


  return (
    <Tabs defaultValue="devices" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="devices">الأجهزة والشرائح</TabsTrigger>
        <TabsTrigger value="details">بيانات العميل الأخرى</TabsTrigger>
      </TabsList>
      <TabsContent value="devices">
        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader className="text-right">
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
                <CardHeader className="text-right">
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
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between text-right">
              <CardTitle>تفاصيل العميل</CardTitle>
              {!isEditing && (
                 <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">تعديل</span>
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4 text-right">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                  <div className="space-y-1">
                      <Label className="font-medium text-muted-foreground">رقم العميل</Label>
                      <Input value={customer.bkcode} disabled className="font-semibold" />
                  </div>
                  <div className="space-y-1">
                      <Label htmlFor="client_name" className="font-medium text-muted-foreground">اسم العميل</Label>
                      <Input id="client_name" {...register('client_name')} readOnly={!isEditing} />
                      {errors.client_name && <p className="text-xs text-destructive">{errors.client_name.message}</p>}
                  </div>
                  <div className="space-y-1 col-span-2 md:col-span-1">
                      <Label htmlFor="address" className="font-medium text-muted-foreground">العنوان</Label>
                      <Textarea id="address" {...register('address')} readOnly={!isEditing} />
                       {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
                  </div>
                  <div className="space-y-1">
                      <Label htmlFor="telephone_1" className="font-medium text-muted-foreground">رقم الهاتف الأساسي</Label>
                      <Input id="telephone_1" {...register('telephone_1')} readOnly={!isEditing} />
                  </div>
                  <div className="space-y-1">
                      <Label htmlFor="telephone_2" className="font-medium text-muted-foreground">رقم الهاتف الإضافي</Label>
                      <Input id="telephone_2" {...register('telephone_2')} readOnly={!isEditing} />
                  </div>
                  <div className="space-y-1">
                      <Label htmlFor="contact_person" className="font-medium text-muted-foreground">الشخص المسؤول</Label>
                      <Input id="contact_person" {...register('contact_person')} readOnly={!isEditing} />
                  </div>
                  <div className="space-y-1">
                      <Label htmlFor="national_id" className="font-medium text-muted-foreground">الرقم القومي</Label>
                      <Input id="national_id" {...register('national_id')} readOnly={!isEditing} />
                  </div>
                  <div className="space-y-1">
                      <Label htmlFor="supply_office" className="font-medium text-muted-foreground">مكتب التموين</Label>
                      <Input id="supply_office" {...register('supply_office')} readOnly={!isEditing} />
                  </div>
                  <div className="space-y-1">
                      <Label htmlFor="dept" className="font-medium text-muted-foreground">إدارة التموين</Label>
                      <Input id="dept" {...register('dept')} readOnly={!isEditing} />
                  </div>
                  <div className="space-y-1 col-span-2 md:col-span-3">
                      <Label htmlFor="notes" className="font-medium text-muted-foreground">ملاحظات</Label>
                      <Textarea id="notes" {...register('notes')} readOnly={!isEditing} />
                  </div>
                   <div className="flex items-center space-x-2 space-y-1">
                        <Controller
                            name="isSpecial"
                            control={control}
                            render={({ field }) => (
                                <Switch
                                    id="isSpecial"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    disabled={!isEditing}
                                />
                            )}
                        />
                        <Label htmlFor="isSpecial" className="font-medium text-muted-foreground">عميل مميز</Label>
                    </div>
              </div>
            </CardContent>
            {isEditing && (
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => {
                  setIsEditing(false);
                  form.reset();
                }}>
                  إلغاء
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                   {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                  حفظ التغييرات
                </Button>
              </CardFooter>
            )}
          </Card>
        </form>
      </TabsContent>
    </Tabs>
  );
};
