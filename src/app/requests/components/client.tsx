
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, Search, Loader2 } from "lucide-react";
import { collection, serverTimestamp, doc } from "firebase/firestore";
import { useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking, useUser } from "@/firebase";


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
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { PosMachine, Customer, User } from "@/lib/types";
import { Label } from "@/components/ui/label";

import { columns, type RequestColumn } from "./columns";

interface RequestClientProps {
  data: RequestColumn[];
  technicians: User[];
  findCustomerMachines: (customerId: string) => Promise<PosMachine[]>;
  findCustomer: (customerId: string) => Promise<Customer | null>;
  isLoading: boolean;
}

const searchSchema = z.object({
  customerId: z.string().min(1, { message: "رقم العميل مطلوب." }),
});

export const RequestClient: React.FC<RequestClientProps> = ({ data, technicians, findCustomerMachines, findCustomer, isLoading }) => {
  const firestore = useFirestore();
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerMachines, setCustomerMachines] = useState<PosMachine[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<PosMachine | null>(null);
  const [complaint, setComplaint] = useState("");

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isCloseOpen, setIsCloseOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RequestColumn | null>(null);
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [closingNotes, setClosingNotes] = useState('');

  const searchForm = useForm<z.infer<typeof searchSchema>>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      customerId: "",
    },
  });

  async function onSearchCustomer(values: z.infer<typeof searchSchema>) {
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
    if (!selectedMachine || !customer || !firestore || !complaint) {
        toast({
            variant: "destructive",
            title: "بيانات ناقصة",
            description: "الرجاء اختيار عميل وماكينة وإدخال وصف للعطل.",
          });
      return;
    }

    const newRequest = {
      customerId: customer.bkcode,
      posMachineId: selectedMachine.id,
      customerName: customer.client_name,
      machineModel: selectedMachine.model || 'N/A',
      machineManufacturer: selectedMachine.manufacturer || 'N/A',
      status: 'Open',
      priority: 'Medium',
      technician: 'غير معين',
      createdAt: serverTimestamp(),
      complaint: complaint,
    };

    const requestsCollection = collection(firestore, 'maintenanceRequests');
    addDocumentNonBlocking(requestsCollection, newRequest);

    toast({
      title: "تم إنشاء الطلب بنجاح",
      description: `تم إنشاء طلب صيانة جديد للماكينة ${selectedMachine.serialNumber}`,
    });

    // Reset state
    setOpen(false);
    searchForm.reset();
    setCustomerMachines([]);
    setSelectedMachine(null);
    setCustomer(null);
    setComplaint("");
  }

  const openDetailsDialog = (request: RequestColumn) => {
    setSelectedRequest(request);
    setIsDetailsOpen(true);
  }
  const openAssignDialog = (request: RequestColumn) => {
    setSelectedRequest(request);
    setIsAssignOpen(true);
  }
  const openCloseDialog = (request: RequestColumn) => {
      setSelectedRequest(request);
      setIsCloseOpen(true);
  }
  const openCancelDialog = (requestId: string) => {
    const request = data.find(r => r.id === requestId);
    setSelectedRequest(request || null);
    setIsCancelOpen(true);
  }

  const confirmAssign = () => {
    if (!firestore || !selectedRequest || !selectedTechnician) return;
    const requestDoc = doc(firestore, 'maintenanceRequests', selectedRequest.id);
    const tech = technicians.find(t => t.id === selectedTechnician);
    updateDocumentNonBlocking(requestDoc, {
      technician: tech?.displayName,
      status: 'In Progress'
    });
    toast({ title: "تم تعيين الفني بنجاح" });
    setIsAssignOpen(false);
    setSelectedTechnician('');
  };

  const confirmClose = () => {
      if (!firestore || !selectedRequest || !user) return;
      const requestDoc = doc(firestore, 'maintenanceRequests', selectedRequest.id);
      updateDocumentNonBlocking(requestDoc, {
          status: 'Closed',
          actionTaken: closingNotes,
          closingUserId: user.uid,
          closingUserName: user.displayName || user.email,
          closingTimestamp: serverTimestamp()
      });
      toast({ title: "تم إغلاق الطلب بنجاح" });
      setIsCloseOpen(false);
      setClosingNotes('');
  };

  const confirmCancel = () => {
    if (!firestore || !selectedRequest) return;
    const requestDoc = doc(firestore, 'maintenanceRequests', selectedRequest.id);
    updateDocumentNonBlocking(requestDoc, { status: 'Cancelled' });
    toast({ title: "تم إلغاء الطلب" });
    setIsCancelOpen(false);
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
                searchForm.reset();
                setCustomer(null);
                setCustomerMachines([]);
                setSelectedMachine(null);
                setComplaint("");
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="ml-2 h-4 w-4" />
                طلب صيانة جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>إنشاء طلب صيانة جديد</DialogTitle>
                  <DialogDescription>
                    أدخل رقم العميل للبحث عن الماكينات الخاصة به، ثم أدخل وصف العطل.
                  </DialogDescription>
                </DialogHeader>
                <Form {...searchForm}>
                  <form onSubmit={searchForm.handleSubmit(onSearchCustomer)} className="space-y-4">
                    <FormField
                      control={searchForm.control}
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
                    <div className="space-y-4 pt-4">
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
                        
                        <div className="space-y-2">
                            <Label htmlFor="complaint">وصف العطل (الشكوى)</Label>
                            <Textarea 
                                id="complaint"
                                placeholder="صف العطل الذي أبلغ عنه العميل..."
                                value={complaint}
                                onChange={(e) => setComplaint(e.target.value)}
                            />
                        </div>
                    </div>
                )}

                <DialogFooter>
                  <Button onClick={handleCreateRequest} disabled={!selectedMachine || !complaint}>إنشاء الطلب</Button>
                </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      {isLoading ? (
          <div className="flex items-center justify-center p-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mr-4 text-muted-foreground">...جاري تحميل البيانات</p>
          </div>
      ) : (
      <DataTable
        searchKeys={["customerName", "id", "machineModel"]}
        columns={columns({ openDetailsDialog, openAssignDialog, openCloseDialog, openCancelDialog })}
        data={data}
        searchPlaceholder="بحث باسم العميل، رقم الطلب، أو موديل الماكينة..."
      />
      )}

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تفاصيل طلب #{selectedRequest?.id.substring(0, 6)}</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 text-sm">
                <p><strong>العميل:</strong> {selectedRequest.customerName}</p>
                <p><strong>الماكينة:</strong> {selectedRequest.machineModel} ({selectedRequest.machineManufacturer})</p>
                <p><strong>الفني:</strong> {selectedRequest.technician}</p>
                <p><strong>الحالة:</strong> {selectedRequest.status}</p>
                <p><strong>تاريخ الإنشاء:</strong> {selectedRequest.createdAt}</p>
                <p><strong>الشكوى:</strong></p>
                <p className="p-2 bg-muted rounded-md">{selectedRequest.complaint}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Assign Technician Dialog */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>تعيين فني للطلب #{selectedRequest?.id.substring(0, 6)}</DialogTitle></DialogHeader>
            <div className="space-y-4">
                <p>اختر فنيًا من القائمة لتعيينه لهذا الطلب.</p>
                <Select onValueChange={setSelectedTechnician}>
                    <SelectTrigger><SelectValue placeholder="اختر فني..." /></SelectTrigger>
                    <SelectContent>
                        {technicians.map(tech => (
                            <SelectItem key={tech.id} value={tech.id}>{tech.displayName}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                <Button onClick={confirmAssign} disabled={!selectedTechnician}>تعيين</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Close Request Dialog */}
      <Dialog open={isCloseOpen} onOpenChange={setIsCloseOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>إغلاق الطلب #{selectedRequest?.id.substring(0, 6)}</DialogTitle></DialogHeader>
            <div className="space-y-4">
                <p>الرجاء كتابة الإجراء الذي تم اتخاذه لحل المشكلة.</p>
                <Textarea placeholder="اكتب الإجراء المتخذ هنا..." value={closingNotes} onChange={(e) => setClosingNotes(e.target.value)} />
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                <Button onClick={confirmClose} disabled={!closingNotes}>إغلاق الطلب</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من الإلغاء؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم تغيير حالة الطلب إلى "ملغى". لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>تراجع</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel}>تأكيد الإلغاء</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

    