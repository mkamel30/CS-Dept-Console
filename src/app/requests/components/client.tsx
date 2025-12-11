
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, Search } from "lucide-react";
import { format } from "date-fns";

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
import { posMachines } from "@/lib/data";
import { PosMachine } from "@/lib/types";

import { columns, type RequestColumn } from "./columns";

interface RequestClientProps {
  data: RequestColumn[];
  setData: React.Dispatch<React.SetStateAction<RequestColumn[]>>;
}

const formSchema = z.object({
  customerId: z.string().min(1, { message: "رقم العميل مطلوب." }),
});

export const RequestClient: React.FC<RequestClientProps> = ({ data, setData }) => {
  const [open, setOpen] = useState(false);
  const [customerMachines, setCustomerMachines] = useState<PosMachine[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<PosMachine | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: "",
    },
  });

  function onSearchCustomer(values: z.infer<typeof formSchema>) {
    const machines = posMachines.filter(
      (machine) => machine.customer.id === values.customerId
    );
    if (machines.length > 0) {
      setCustomerMachines(machines);
    } else {
      setCustomerMachines([]);
      toast({
        variant: "destructive",
        title: "لم يتم العثور على العميل",
        description: "الرجاء التأكد من رقم العميل.",
      });
    }
  }

  function handleCreateRequest() {
    if (!selectedMachine) {
        toast({
            variant: "destructive",
            title: "خطأ",
            description: "الرجاء اختيار ماكينة لإنشاء الطلب.",
          });
      return;
    }

    const newRequest: RequestColumn = {
      id: `REQ-${Math.floor(Math.random() * 1000)}`,
      machineId: selectedMachine.id,
      machineModel: selectedMachine.model,
      machineManufacturer: selectedMachine.manufacturer,
      customerName: selectedMachine.customer.name,
      status: 'Open',
      priority: 'Medium', // Default priority
      technician: 'غير معين',
      createdDate: format(new Date(), "yyyy/MM/dd"),
    };

    setData((currentData) => [newRequest, ...currentData]);
    toast({
      title: "تم إنشاء الطلب بنجاح",
      description: `تم إنشاء طلب صيانة جديد للماكينة ${selectedMachine.serialNumber}`,
    });

    // Reset state
    setOpen(false);
    form.reset();
    setCustomerMachines([]);
    setSelectedMachine(null);
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">
          طلبات الصيانة ({data.length})
        </h2>
        <div className="flex items-center space-x-2">
          <Dialog open={open} onOpenChange={setOpen}>
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
                          <FormLabel>رقم العميل</FormLabel>
                          <div className="flex items-center space-x-2">
                            <FormControl>
                              <Input
                                placeholder="e.g. CUST-1001"
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

                {customerMachines.length > 0 && (
                    <div className="space-y-4">
                        <h4 className="font-medium">ماكينات العميل: {customerMachines[0].customer.name}</h4>
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
