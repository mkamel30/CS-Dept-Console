
"use client";

import { useRef, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, Upload, Download, Loader2 } from "lucide-react";
import { collection, getDocs, query, doc } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogTrigger,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, addDocumentNonBlocking, useUser, useCollection, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { MachineParameter } from "@/lib/types";

import { columns, type PosMachineColumn } from "./columns";

interface PosMachineClientProps {
  data: PosMachineColumn[];
  isLoading: boolean;
}

const formSchema = z.object({
  serialNumber: z.string().min(1, "الرقم التسلسلي مطلوب"),
  posId: z.string().optional(),
  customerId: z.string().min(1, "رقم العميل مطلوب"),
  isMain: z.boolean().default(false),
  model: z.string().optional(),
  manufacturer: z.string().optional(),
});

export const PosMachineClient: React.FC<PosMachineClientProps> = ({ data, isLoading }) => {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const [isConfirming, setIsConfirming] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<PosMachineColumn | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingMachineId, setDeletingMachineId] = useState<string | null>(null);

  const parametersQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, "machineParameters")) : null,
    [firestore]
  );
  const { data: machineParameters, isLoading: isLoadingParameters } = useCollection<MachineParameter>(parametersQuery);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const editForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });


  const getMachineDetailsFromSerial = (serial: string) => {
    if (!machineParameters) {
        return { model: 'غير معروف', manufacturer: 'غير معروف' };
    }
    const matchingParam = machineParameters.find(p => serial.startsWith(p.prefix));
    return matchingParam || { model: 'غير معروف', manufacturer: 'غير معروف' };
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const XLSX = await import("xlsx");
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet) as any[];
        
        if (json.length === 0) {
            toast({ variant: "destructive", title: "ملف فارغ", description: "الملف الذي تم رفعه لا يحتوي على أي بيانات."});
            return;
        }

        setImportData(json);
        setIsConfirming(true);
      } catch (error) {
        console.error("Error reading file:", error);
        toast({
          variant: "destructive",
          title: "حدث خطأ",
          description: "فشلت قراءة الملف. يرجى التأكد من أن الملف بالتنسيق الصحيح.",
        });
      } finally {
         if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirmImport = async () => {
    setIsConfirming(false);
    if (!firestore || !user || !importData.length) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "لا يمكن إتمام عملية الاستيراد.",
        });
        return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      toast({
        title: "بدء المعالجة...",
        description: `جاري حفظ ${importData.length} سجل في قاعدة البيانات.`,
      });

      const machinesCollection = collection(firestore, 'posMachines');
      const existingMachinesSnapshot = await getDocs(machinesCollection);
      const existingSerials = new Set(existingMachinesSnapshot.docs.map(doc => doc.data().serialNumber));

      let successCount = 0;
      let duplicateCount = 0;
      let missingRequiredDataCount = 0;
      let withoutPosIdCount = 0;

      for (let i = 0; i < importData.length; i++) {
        const item = importData[i];
        const serial = item.serialNumber || item.POS;

        if (!serial || !item.customerId) {
          missingRequiredDataCount++;
        } else if (existingSerials.has(serial.toString())) {
          duplicateCount++;
        } else {
          const details = getMachineDetailsFromSerial(serial.toString());

          if (!item.posId) {
              withoutPosIdCount++;
          }

          const newMachine = {
            serialNumber: serial.toString(),
            posId: item.posId ? item.posId.toString() : 'N/A',
            customerId: item.customerId.toString(),
            model: details.model,
            manufacturer: details.manufacturer,
            isMain: item.isMain === 'yes' || item.isMain === true,
          };
          
          addDocumentNonBlocking(machinesCollection, newMachine);
          successCount++;
          existingSerials.add(serial.toString());
        }
        
        setProgress(((i + 1) / importData.length) * 100);
      }

      toast({
        title: "اكتمل الرفع بنجاح",
        description: `المجموع: ${importData.length}. | نجح: ${successCount} | مكرر: ${duplicateCount} | ناقص: ${missingRequiredDataCount} | بدون POSID: ${withoutPosIdCount}`,
        duration: 9000,
      });

    } catch (error) {
      console.error("Error processing file:", error);
      toast({
        variant: "destructive",
        title: "حدث خطأ",
        description: "فشلت معالجة الملف.",
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setImportData([]);
    }
  }


  const handleDownloadTemplate = async () => {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet([
      { serialNumber: "", posId: "", customerId: "", isMain: "no" },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Machines");
    XLSX.writeFile(wb, "PosMachines_Template.xlsx");
  };

  const handleExportData = async () => {
     const XLSX = await import("xlsx");
     const ws = XLSX.utils.json_to_sheet(data);
     const wb = XLSX.utils.book_new();
     XLSX.utils.book_append_sheet(wb, ws, "Current Machines");
     XLSX.writeFile(wb, "Current_PosMachines_Data.xlsx");
  };

  const onAddSubmit = (values: z.infer<typeof formSchema>) => {
    if (!firestore) return;
    const details = getMachineDetailsFromSerial(values.serialNumber);
    const machineData = { ...values, ...details };

    addDocumentNonBlocking(collection(firestore, 'posMachines'), machineData);
    toast({ title: "تمت الإضافة بنجاح" });
    setIsAddDialogOpen(false);
    form.reset();
  };

  const onEditSubmit = (values: z.infer<typeof formSchema>) => {
    if (!firestore || !editingMachine) return;
    const details = getMachineDetailsFromSerial(values.serialNumber);
    const machineData = { ...values, ...details };
    
    updateDocumentNonBlocking(doc(firestore, 'posMachines', editingMachine.id), machineData);
    toast({ title: "تم التحديث بنجاح" });
    setIsEditDialogOpen(false);
    setEditingMachine(null);
  };

  const openEditDialog = (machine: PosMachineColumn) => {
    setEditingMachine(machine);
    editForm.reset(machine);
    setIsEditDialogOpen(true);
  };
  
  const openDeleteDialog = (machineId: string) => {
    setDeletingMachineId(machineId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!firestore || !deletingMachineId) return;
    deleteDocumentNonBlocking(doc(firestore, 'posMachines', deletingMachineId));
    toast({ title: "تم الحذف بنجاح" });
    setIsDeleteDialogOpen(false);
    setDeletingMachineId(null);
  };

  return (
    <>
      <Dialog open={isConfirming} onOpenChange={setIsConfirming}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>تأكيد الاستيراد</DialogTitle>
            <DialogDescription>
              تم العثور على {importData.length} سجل. هل تريد تأكيد استيراد هذه البيانات؟
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[50vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الرقم التسلسلي</TableHead>
                  <TableHead>POS ID</TableHead>
                  <TableHead>رقم العميل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {importData.slice(0, 5).map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.serialNumber || item.POS || 'N/A'}</TableCell>
                    <TableCell>{item.posId || 'N/A'}</TableCell>
                    <TableCell>{item.customerId || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" onClick={() => setImportData([])}>إلغاء</Button>
            </DialogClose>
            <Button onClick={handleConfirmImport}>تأكيد الاستيراد</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">ماكينات نقاط البيع ({data.length})</h2>
        <div className="flex items-center space-x-2">
           <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
             <DialogTrigger asChild>
                <Button disabled={isLoading || isProcessing}>
                    <PlusCircle className="ml-2 h-4 w-4" />
                    إضافة ماكينة يدوياً
                </Button>
             </DialogTrigger>
             <DialogContent>
                 <DialogHeader>
                    <DialogTitle>إضافة ماكينة جديدة</DialogTitle>
                 </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onAddSubmit)} className="space-y-4">
                        <FormField control={form.control} name="serialNumber" render={({ field }) => (<FormItem><FormLabel>الرقم التسلسلي *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="posId" render={({ field }) => (<FormItem><FormLabel>POS ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="customerId" render={({ field }) => (<FormItem><FormLabel>رقم العميل *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="isMain" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>تعيين كـ ماكينة رئيسية للعميل</FormLabel></div></FormItem>)} />
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                            <Button type="submit">إضافة</Button>
                        </DialogFooter>
                    </form>
                 </Form>
             </DialogContent>
           </Dialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isLoading || isProcessing}>
                {isProcessing ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Upload className="ml-2 h-4 w-4" />}
                استيراد / تصدير
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>خيارات البيانات</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDownloadTemplate} disabled={isProcessing}>
                <Download className="ml-2 h-4 w-4" />
                تنزيل قالب Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()} disabled={isProcessing || isLoadingParameters}>
                <Upload className="ml-2 h-4 w-4" />
                رفع ملف Excel
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleExportData} disabled={data.length === 0 || isProcessing}>
                <Download className="ml-2 h-4 w-4" />
                تصدير البيانات الحالية
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".xlsx, .xls, .csv"
            disabled={isProcessing}
          />
        </div>
      </div>
      
      {isProcessing && (
          <div className="w-full space-y-2 pt-4">
              <p className="text-sm text-muted-foreground">جاري معالجة الملف... {Math.round(progress)}%</p>
              <Progress value={progress} className="w-full" />
          </div>
      )}

      {isLoading && !isProcessing ? (
          <div className="flex items-center justify-center p-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mr-4 text-muted-foreground">...جاري تحميل البيانات</p>
          </div>
      ) : (
        <DataTable 
          searchKeys={["serialNumber", "posId", "customerId"]} 
          columns={columns({ openEditDialog, openDeleteDialog })} 
          data={data} 
          searchPlaceholder="بحث بالرقم التسلسلي، POSID، أو رقم العميل..." 
        />
      )}

    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>تعديل بيانات الماكينة</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                    <FormField control={editForm.control} name="serialNumber" render={({ field }) => (<FormItem><FormLabel>الرقم التسلسلي *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={editForm.control} name="posId" render={({ field }) => (<FormItem><FormLabel>POS ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={editForm.control} name="customerId" render={({ field }) => (<FormItem><FormLabel>رقم العميل *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={editForm.control} name="isMain" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>تعيين كـ ماكينة رئيسية للعميل</FormLabel></div></FormItem>)} />
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                        <Button type="submit">حفظ التغييرات</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>

    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
          <AlertDialogDescription>
            سيتم حذف هذه الماكينة نهائيًا. لا يمكن التراجع عن هذا الإجراء.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>إلغاء</AlertDialogCancel>
          <AlertDialogAction onClick={confirmDelete}>متابعة</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    </>
  );
};

    