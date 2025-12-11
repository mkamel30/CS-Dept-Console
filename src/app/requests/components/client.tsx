
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, Search } from "lucide-react";
import { collection, serverTimestamp } from "firebase/firestore";
import { useFirestore, addDocumentNonBlocking } from "@/firebase";


import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { PosMachine, Customer } from "@/lib/types";

import { columns, type RequestColumn } from "./columns";

interface RequestClientProps {
  data: RequestColumn[];
  findCustomerMachines: (customerId: string) => Promise<PosMachine[]>;
  findCustomer: (customerId: string) => Promise<Customer | null>;
  isLoading: boolean;
}

const formSchema = z.object({
  customerId: z.string().min(1, { message: "رقم العميل مطلوب." }),
});

export const RequestClient: React.FC<RequestClientProps> = ({ data, findCustomerMachines, findCustomer, isLoading }) => {
  const firestore = useFirestore();
  const [open, setOpen] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerMachines, setCustomerMachines] = useState<PosMachine[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<PosMachine | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: "",
    },
  });

  async function onSearchCustomer(values: z.infer<typeof formSchema>) {
    const foundCustomer = await findCustomer(values.customerId);
    if (foundCustomer) {
        setCustomer(foundCustomer);
        const machines = await findCustomerMachines(values.customerId);
        if (machines.length > 0) {
            setCustomerMachines(machines);
        } else {
            setCustomerMachines([]);
            toast({
                variant: "destructive",
                title: "لا توجد ماكينات",
                description: "لم يتم العثور على ماكينات مسجلة لهذا العميل.",
            });
        }
    } else {
      setCustomer(null);
      setCustomerMachines([]);
      toast({
        variant: "destructive",
        title: "لم يتم العثور على العميل",
        description: "الرجاء التأكد من رقم العميل.",
      });
    }
  }

  function handleCreateRequest() {
    if (!selectedMachine || !customer || !firestore) {
        toast({
            variant: "destructive",
            title: "خطأ",
            description: "الرجاء اختيار عميل وماكينة لإنشاء الطلب.",
          });
      return;
    }

    const newRequest = {
      customerId: customer.bkcode,
      posMachineId: selectedMachine.id,
      machineModel: selectedMachine.model,
      machineManufacturer: selectedMachine.manufacturer,
      customerName: customer.client_name,
      status: 'Open',
      priority: 'Medium',
      technician: 'غير معين',
      createdAt: serverTimestamp(),
    };

    const requestsCollection = collection(firestore, 'maintenanceRequests');
    addDocumentNonBlocking(requestsCollection, newRequest);

    toast({
      title: "تم إنشاء الطلب بنجاح",
      description: `تم إنشاء طلب صيانة جديد للماكينة ${selectedMachine.serialNumber}`,
    });

    // Reset state
    setOpen(false);
    form.reset();
    setCustomerMachines([]);
    setSelectedMachine(null);
    setCustomer(null);
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">
          طلبات الصيانة ({data.length})
        </h2>
        <div className="flex items-center space-x-2">
          <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) {
                form.reset();
                setCustomer(null);
                setCustomerMachines([]);
                setSelectedMachine(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="ml-2 h-4 w-4" />
                طلب صيانة جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>إنشاء طلب صيانة جديد</DialogTitle>
                  <DialogDescription>
                    أدخل رقم العميل للبحث عن الماكينات الخاصة به.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSearchCustomer)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="customerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>رقم العميل (BKCODE)</FormLabel>
                          <div className="flex items-center space-x-2">
                            <FormControl>
                              <Input
                                placeholder="e.g. 12345"
                                {...field}
                              />
                            </FormControl>
                             <Button type="submit" size="icon">
                                <Search className="h-4 w-4" />
                             </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>

                {customerMachines.length > 0 && customer && (
                    <div className="space-y-4">
                        <h4 className="font-medium">ماكينات العميل: {customer.client_name}</h4>
                        <Select onValueChange={(value) => setSelectedMachine(customerMachines.find(m => m.id === value) || null)}>
                            <SelectTrigger>
                                <SelectValue placeholder="اختر الماكينة المطلوبة" />
                            </SelectTrigger>
                            <SelectContent>
                                {customerMachines.map(machine => (
                                    <SelectItem key={machine.id} value={machine.id}>
                                        {machine.model} ({machine.serialNumber}) - {machine.manufacturer}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <DialogFooter>
                  <Button onClick={handleCreateRequest} disabled={!selectedMachine}>إنشاء الطلب</Button>
                </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <DataTable
        searchKey="customerName"
        columns={columns}
        data={data}
        searchPlaceholder="بحث عن عميل..."
      />
    </>
  );
};
