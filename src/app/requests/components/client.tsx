
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, Search, Loader2 } from "lucide-react";
import { collection, serverTimestamp, doc, writeBatch, query, where, getDocs, Timestamp } from "firebase/firestore";
import { useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking, useUser } from "@/firebase";
import { differenceInMinutes } from 'date-fns';

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { PosMachine, Customer, User, SparePart, InventoryItem, MaintenanceRequest } from "@/lib/types";
import { Label } from "@/components/ui/label";
import { generateMaintenanceReport } from "./report-generator";

import { columns, type RequestColumn } from "./columns";

interface RequestClientProps {
  data: RequestColumn[];
  technicians: User[];
  spareParts: SparePart[];
  inventory: InventoryItem[];
  findCustomerMachines: (customerId: string) => Promise<PosMachine[]>;
  findCustomer: (customerId: string) => Promise<Customer | null>;
  isLoading: boolean;
}

type SelectedPart = {
  partId: string;
  partName: string;
  cost: number;
  withCost: boolean;
};

const searchSchema = z.object({
  customerId: z.string().min(1, { message: "رقم العميل مطلوب." }),
});

export const RequestClient: React.FC<RequestClientProps> = ({ data, technicians, spareParts, inventory, findCustomerMachines, findCustomer, isLoading }) => {
  const firestore = useFirestore();
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerMachines, setCustomerMachines] = useState<PosMachine[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<PosMachine | null>(null);
  const [complaint, setComplaint] = useState("");

  // Dialog states
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isCloseOpen, setIsCloseOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  
  // State for closing dialog
  const [selectedRequest, setSelectedRequest] = useState<RequestColumn | null>(null);
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [repairType, setRepairType] = useState<"no_parts" | "with_parts">("no_parts");
  const [selectedParts, setSelectedParts] = useState<SelectedPart[]>([]);
  const [receiptNumber, setReceiptNumber] = useState('');


  const searchForm = useForm<z.infer<typeof searchSchema>>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      customerId: "",
    },
  });
  
  useEffect(() => {
    // Reset parts when repair type changes
    if(isCloseOpen) {
      setSelectedParts([]);
    }
  }, [repairType, isCloseOpen]);

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
      serialNumber: selectedMachine.serialNumber,
      status: 'Open',
      priority: 'Medium',
      technician: 'غير معين',
      createdAt: serverTimestamp(),
      complaint: complaint,
    } as Omit<MaintenanceRequest, 'id'>;

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

  const handlePrintReport = (request: RequestColumn) => {
    // Reconstruct the full request object for the report generator
     const fullRequestData: MaintenanceRequest = {
        ...request,
        id: request.id,
        // Ensure createdAt and closingTimestamp are converted to Timestamps if they are not already
        createdAt: request.createdAt ? Timestamp.fromDate(new Date(request.createdAt)) : Timestamp.now(),
        closingTimestamp: request.closingTimestamp ? Timestamp.fromDate(new Date(request.closingTimestamp)) : undefined,
        // Ensure usedParts is in the correct format or an empty array
        usedParts: request.usedParts || [],
        status: request.status,
        priority: request.priority,
     };
     generateMaintenanceReport(fullRequestData);
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

  const confirmClose = async () => {
    if (!firestore || !selectedRequest || !user) return;
    
    const requestDocRef = doc(firestore, 'maintenanceRequests', selectedRequest.id);
    const batch = writeBatch(firestore);

    const closingTimestamp = serverTimestamp();
    const finalUsedParts = repairType === 'with_parts' ? selectedParts : [];

    // 1. Update the maintenance request
    batch.update(requestDocRef, {
        status: 'Closed',
        actionTaken: closingNotes,
        closingUserId: user.uid,
        closingUserName: user.displayName || user.email,
        closingTimestamp: closingTimestamp,
        usedParts: finalUsedParts,
        receiptNumber: receiptNumber,
    });

    // 2. Deduct from inventory if parts were used
    if (repairType === 'with_parts' && selectedParts.length > 0) {
        const inventoryUpdates: Promise<void>[] = selectedParts.map(async (part) => {
            const inventoryItemQuery = query(collection(firestore, 'inventory'), where('partId', '==', part.partId));
            const inventorySnapshot = await getDocs(inventoryItemQuery);

            if (!inventorySnapshot.empty) {
                const inventoryDoc = inventorySnapshot.docs[0];
                const currentQuantity = inventoryDoc.data().quantity;
                const newQuantity = currentQuantity - 1; // Assuming 1 part used per selection
                
                if (newQuantity < 0) {
                    toast({
                        variant: 'destructive',
                        title: `كمية غير كافية من ${part.partName}`,
                        description: `الكمية المتاحة: ${currentQuantity}, المطلوب: 1`
                    });
                    throw new Error("Insufficient stock"); // Abort batch
                }
                batch.update(inventoryDoc.ref, { quantity: newQuantity });
            } else {
                toast({
                    variant: 'destructive',
                    title: `قطعة غير موجودة في المخزن`,
                    description: `لم يتم العثور على ${part.partName} في المخزن.`
                });
                throw new Error("Part not in inventory"); // Abort batch
            }
        });
        
        try {
            await Promise.all(inventoryUpdates);
        } catch (error: any) {
            console.error("Error preparing inventory updates:", error);
            return; // Stop if there's an issue with inventory checks
        }

        // 3. Create a log entry for used parts
        const logRef = doc(collection(firestore, 'usedPartLogs'));
        batch.set(logRef, {
            requestId: selectedRequest.id,
            customerId: data.find(r => r.id === selectedRequest.id)?.customerId,
            customerName: selectedRequest.customerName,
            posMachineId: selectedRequest.posMachineId,
            technician: selectedRequest.technician,
            closedByUserId: user.uid,
            closedAt: closingTimestamp,
            parts: selectedParts.map(p => ({
                partId: p.partId,
                partName: p.partName,
                quantityUsed: 1, // Assuming 1 for now
                withCost: p.withCost
            })),
            receiptNumber: receiptNumber,
        });
    }

    try {
        await batch.commit();
        toast({ title: "تم إغلاق الطلب وتحديث المخزن بنجاح" });

        // Generate and open PDF
        const fullRequestData: MaintenanceRequest = {
            ...selectedRequest,
            id: selectedRequest.id,
            customerId: data.find(r => r.id === selectedRequest.id)?.customerId || '',
            createdAt: Timestamp.fromDate(new Date(selectedRequest.createdAt)), // Convert back to Timestamp
            closingTimestamp: Timestamp.now(), // Approximate for PDF
            actionTaken: closingNotes,
            usedParts: finalUsedParts,
            receiptNumber: receiptNumber,
            status: 'Closed', // Correct type
            priority: selectedRequest.priority, // Correct type
        };

        generateMaintenanceReport(fullRequestData);

    } catch (error) {
        console.error("Error closing request:", error);
        toast({ variant: 'destructive', title: "خطأ", description: "فشل إغلاق الطلب. قد تكون هناك مشكلة في كميات المخزن." });
    } finally {
        // Reset state
        setIsCloseOpen(false);
        setClosingNotes('');
        setRepairType('no_parts');
        setSelectedParts([]);
        setReceiptNumber('');
    }
};


  const confirmCancel = () => {
    if (!firestore || !selectedRequest) return;
    const requestDoc = doc(firestore, 'maintenanceRequests', selectedRequest.id);
    updateDocumentNonBlocking(requestDoc, { status: 'Cancelled' });
    toast({ title: "تم إلغاء الطلب" });
    setIsCancelOpen(false);
  }
  
  const handlePartSelection = (part: SparePart, checked: boolean | string) => {
    setSelectedParts(prev => {
      if (checked) {
        // Add part with default 'withCost' = true
        return [...prev, { partId: part.id, partName: part.name, cost: part.defaultCost, withCost: true }];
      } else {
        // Remove part
        return prev.filter(p => p.partId !== part.id);
      }
    });
  };

  const handlePartCostChange = (partId: string, withCost: boolean) => {
    setSelectedParts(prev => prev.map(p => p.partId === partId ? { ...p, withCost } : p));
  };
  
  const compatibleParts = selectedRequest?.machineModel ? spareParts.filter(p => p.compatibleModels.includes(selectedRequest.machineModel!)) : [];
  const partsWithCostCount = selectedParts.filter(p => p.withCost).length;
  const partsWithoutCostCount = selectedParts.filter(p => !p.withCost).length;

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
        columns={columns({ openDetailsDialog, openAssignDialog, openCloseDialog, openCancelDialog, handlePrintReport })}
        data={data}
        searchPlaceholder="بحث باسم العميل، رقم الطلب، أو موديل الماكينة..."
      />
      )}

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تفاصيل طلب #{selectedRequest?.id.substring(0, 6)}</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 text-sm max-h-[70vh] overflow-y-auto p-1">
                <div className="grid grid-cols-2 gap-4">
                  <p><strong>العميل:</strong> {selectedRequest.customerName}</p>
                  <p><strong>الفني:</strong> {selectedRequest.technician}</p>
                  <p><strong>الماكينة:</strong> {selectedRequest.machineModel} ({selectedRequest.machineManufacturer})</p>
                  <p><strong>رقم الماكينة:</strong> {selectedRequest.serialNumber}</p>
                  <p><strong>الحالة:</strong> <Badge variant={
                    selectedRequest.status === 'Open' ? 'default' :
                    selectedRequest.status === 'In Progress' ? 'secondary' :
                    selectedRequest.status === 'Cancelled' ? 'destructive' : 'outline'
                  }>{selectedRequest.status}</Badge></p>
                  <p><strong>الأولوية:</strong> <Badge variant={
                      selectedRequest.priority === 'High' ? 'destructive' :
                      selectedRequest.priority === 'Medium' ? 'default' : 'secondary'
                  }>{selectedRequest.priority}</Badge></p>
                </div>
                
                <p><strong>تاريخ الإنشاء:</strong> {selectedRequest.createdAt}</p>
                
                <div>
                  <p><strong>الشكوى:</strong></p>
                  <p className="p-2 bg-muted rounded-md mt-1">{selectedRequest.complaint}</p>
                </div>

                {selectedRequest.status === 'Closed' && (
                  <>
                    <hr/>
                    <div>
                      <p><strong>الإجراء المتخذ:</strong></p>
                      <p className="p-2 bg-muted rounded-md mt-1">{selectedRequest.actionTaken || 'لم يتم تسجيل إجراء.'}</p>
                    </div>
                     <p><strong>تاريخ الإغلاق:</strong> {selectedRequest.closingTimestamp || 'غير متاح'}</p>
                     <p><strong>مدة الطلب:</strong> {
                        (() => {
                           if (!selectedRequest.createdAt || !selectedRequest.closingTimestamp) return 'غير متاحة';
                           try {
                             const created = new Date(selectedRequest.createdAt);
                             const closed = new Date(selectedRequest.closingTimestamp);
                             const duration = differenceInMinutes(closed, created);
                             if (isNaN(duration)) return 'تاريخ غير صالح';
                             const days = Math.floor(duration / (60 * 24));
                             const hours = Math.floor((duration % (60*24)) / 60);
                             const minutes = duration % 60;
                             let result = '';
                             if(days > 0) result += `${days} يوم `;
                             if(hours > 0) result += `${hours} ساعة `;
                             if(minutes > 0) result += `${minutes} دقيقة`;
                             return result.trim() || 'أقل من دقيقة';
                           } catch(e) { return "خطأ في حساب المدة"}
                        })()
                      }</p>
                  </>
                )}
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
        <Dialog open={isCloseOpen} onOpenChange={(isOpen) => {
            setIsCloseOpen(isOpen);
            if (!isOpen) {
                setClosingNotes('');
                setRepairType('no_parts');
                setSelectedParts([]);
                setReceiptNumber('');
            }
        }}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader><DialogTitle>إغلاق الطلب #{selectedRequest?.id.substring(0, 6)}</DialogTitle></DialogHeader>
                <div className="space-y-6 max-h-[70vh] overflow-y-auto p-1">
                    <div>
                        <Label className="font-semibold">الشكوى الأصلية</Label>
                        <p className="p-2 bg-muted rounded-md text-sm mt-1">{selectedRequest?.complaint}</p>
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="closingNotes" className="font-semibold">الإجراء المتخذ والحل</Label>
                        <Textarea id="closingNotes" placeholder="اكتب الإجراء المتخذ هنا..." value={closingNotes} onChange={(e) => setClosingNotes(e.target.value)} />
                    </div>

                    <RadioGroup value={repairType} onValueChange={(value: "no_parts" | "with_parts") => setRepairType(value)}>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no_parts" id="r1" />
                            <Label htmlFor="r1">إصلاح بدون تغيير قطع غيار</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="with_parts" id="r2" />
                            <Label htmlFor="r2">إصلاح مع تغيير قطع غيار</Label>
                        </div>
                    </RadioGroup>

                    {repairType === 'with_parts' && (
                        <div className="border-t pt-4 space-y-4">
                            <h4 className="font-semibold">اختر قطع الغيار المستخدمة</h4>
                            {compatibleParts.length > 0 ? (
                                <ScrollArea className="h-48 w-full rounded-md border p-4">
                                    {compatibleParts.map(part => (
                                        <div key={part.id} className="flex items-center justify-between mb-2 p-2 rounded-md hover:bg-muted">
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    id={`part-${part.id}`}
                                                    checked={selectedParts.some(p => p.partId === part.id)}
                                                    onCheckedChange={(checked) => handlePartSelection(part, checked)}
                                                />
                                                <Label htmlFor={`part-${part.id}`}>{part.name}</Label>
                                            </div>
                                            {selectedParts.some(p => p.partId === part.id) && (
                                                <RadioGroup
                                                    defaultValue="with"
                                                    onValueChange={(val) => handlePartCostChange(part.id, val === "with")}
                                                    className="flex"
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="with" id={`cost-${part.id}-with`} />
                                                        <Label htmlFor={`cost-${part.id}-with`}>بمقابل</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="without" id={`cost-${part.id}-without`} />
                                                        <Label htmlFor={`cost-${part.id}-without`}>بدون مقابل</Label>
                                                    </div>
                                                </RadioGroup>
                                            )}
                                        </div>
                                    ))}
                                </ScrollArea>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center">لا توجد قطع غيار معرفة متوافقة مع هذا الموديل.</p>
                            )}
                             <div className="flex justify-between items-center pt-2">
                                <div>
                                    <Badge>بمقابل: {partsWithCostCount}</Badge>
                                    <Badge variant="secondary" className="mr-2">بدون مقابل: {partsWithoutCostCount}</Badge>
                                </div>
                                <div className="space-y-2 w-1/3">
                                    <Label htmlFor="receiptNumber" className="text-xs">رقم إيصال السداد</Label>
                                    <Input id="receiptNumber" placeholder="اختياري" value={receiptNumber} onChange={(e) => setReceiptNumber(e.target.value)} />
                                </div>
                            </div>
                        </div>
                    )}
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

    