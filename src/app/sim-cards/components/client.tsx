
"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, Upload, Download, Loader2 } from "lucide-react";
import { collection, getDocs, query, where, doc } from "firebase/firestore";

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
import { useToast } from "@/hooks/use-toast";
import { useFirestore, addDocumentNonBlocking, useUser, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
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
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { columns, type SimCardColumn } from "./columns";

interface SimCardClientProps {
  data: SimCardColumn[];
  isLoading: boolean;
}

const formSchema = z.object({
  serialNumber: z.string().min(1, { message: "الرقم التسلسلي مطلوب." }),
  type: z.string().min(1, { message: "نوع الشريحة مطلوب." }),
  customerId: z.string().min(1, { message: "رقم العميل مطلوب." }),
});

export const SimCardClient: React.FC<SimCardClientProps> = ({ data, isLoading }) => {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isAddSimOpen, setAddSimOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSim, setEditingSim] = useState<SimCardColumn | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingSimId, setDeletingSimId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serialNumber: "",
      type: "",
      customerId: "",
    },
  });
  
  const editForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

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

      const simCardsCollection = collection(firestore, 'simCards');
      const existingSimCardsSnapshot = await getDocs(simCardsCollection);
      const existingSerials = new Set(existingSimCardsSnapshot.docs.map(doc => doc.data().serialNumber));

      let successCount = 0;
      let duplicateCount = 0;
      let missingRequiredDataCount = 0;

      for (let i = 0; i < importData.length; i++) {
        const item = importData[i];
        const serial = item.serialNumber?.toString();

        if (!serial || !item.type || !item.customerId) {
          missingRequiredDataCount++;
        } else if (existingSerials.has(serial)) {
          duplicateCount++;
        } else {
          const newSimCard = {
            serialNumber: serial,
            type: item.type.toString(),
            customerId: item.customerId.toString(),
          };
          
          addDocumentNonBlocking(simCardsCollection, newSimCard);
          successCount++;
          existingSerials.add(serial);
        }
        
        setProgress(((i + 1) / importData.length) * 100);
      }

      toast({
        title: "اكتمل الرفع بنجاح",
        description: `المجموع: ${importData.length}. | نجح: ${successCount} | مكرر: ${duplicateCount} | ناقص: ${missingRequiredDataCount}`,
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
  };

  const handleDownloadTemplate = async () => {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet([
      { serialNumber: "", type: "", customerId: "" },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SIM Cards");
    XLSX.writeFile(wb, "SimCards_Template.xlsx");
  };

  const handleExportData = async () => {
     const XLSX = await import("xlsx");
     const ws = XLSX.utils.json_to_sheet(data);
     const wb = XLSX.utils.book_new();
     XLSX.utils.book_append_sheet(wb, ws, "Current SIM Cards");
     XLSX.writeFile(wb, "Current_SimCards_Data.xlsx");
  };

  const onAddSimSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore) return;
    try {
      const simCardsCollection = collection(firestore, 'simCards');
      // Check for duplicates
      const existingQuery = await getDocs(query(collection(firestore, "simCards"), where("serialNumber", "==", values.serialNumber)));
      if (!existingQuery.empty) {
        toast({
          variant: "destructive",
          title: "الرقم التسلسلي موجود بالفعل",
          description: "هذا الرقم مسجل لشريحة أخرى. يرجى استخدام رقم فريد.",
        });
        return;
      }
      
      addDocumentNonBlocking(simCardsCollection, values);
      toast({
        title: "تمت إضافة الشريحة بنجاح",
        description: `تم حفظ الشريحة ${values.serialNumber} في قاعدة البيانات.`,
      });
      form.reset();
      setAddSimOpen(false);
    } catch (error) {
      console.error("Error adding SIM card:", error);
      toast({
        variant: "destructive",
        title: "حدث خطأ",
        description: "فشلت عملية إضافة الشريحة. يرجى المحاولة مرة أخرى.",
      });
    }
  };
  
  const onEditSimSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore || !editingSim) return;
    try {
      const simDoc = doc(firestore, 'simCards', editingSim.id);
      updateDocumentNonBlocking(simDoc, values);
      toast({
        title: "تم تحديث الشريحة بنجاح",
      });
      setEditingSim(null);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating SIM card:", error);
      toast({
        variant: "destructive",
        title: "حدث خطأ",
        description: "فشلت عملية تحديث الشريحة.",
      });
    }
  };

  const openEditDialog = (sim: SimCardColumn) => {
    setEditingSim(sim);
    editForm.reset(sim);
    setIsEditDialogOpen(true);
  };
  
  const openDeleteDialog = (simId: string) => {
    setDeletingSimId(simId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!firestore || !deletingSimId) return;
    const simDoc = doc(firestore, 'simCards', deletingSimId);
    deleteDocumentNonBlocking(simDoc);
    toast({
      title: "تم الحذف بنجاح",
    });
    setDeletingSimId(null);
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      <Dialog open={isConfirming} onOpenChange={setIsConfirming}>
        <DialogContent className="sm:max-w-xl">
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
                  <TableHead>النوع</TableHead>
                  <TableHead>رقم العميل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {importData.slice(0, 5).map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.serialNumber || 'N/A'}</TableCell>
                    <TableCell>{item.type || 'N/A'}</TableCell>
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
        <h2 className="text-3xl font-bold tracking-tight">شرائح SIM ({data.length})</h2>
        <div className="flex items-center space-x-2">
           <Dialog open={isAddSimOpen} onOpenChange={setAddSimOpen}>
            <DialogTrigger asChild>
              <Button disabled={isLoading || isProcessing}>
                <PlusCircle className="ml-2 h-4 w-4" />
                إضافة شريحة يدوياً
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>إضافة شريحة SIM جديدة</DialogTitle>
                <DialogDescription>
                  املأ الحقول التالية لحفظ بيانات شريحة جديدة.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onAddSimSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="serialNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الرقم التسلسلي *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 8920..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نوع الشريحة *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Vodafone, Orange" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رقم العميل (BKCODE) *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 12345" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter className="pt-4">
                    <DialogClose asChild>
                      <Button type="button" variant="outline">إلغاء</Button>
                    </DialogClose>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                      إضافة الشريحة
                    </Button>
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
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()} disabled={isProcessing}>
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
          searchKeys={["serialNumber", "type", "customerId"]} 
          columns={columns({ openEditDialog, openDeleteDialog })} 
          data={data} 
          searchPlaceholder="بحث بالرقم التسلسلي، النوع، أو رقم العميل..." 
        />
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
            <DialogTitle>تعديل شريحة SIM</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSimSubmit)} className="space-y-4">
                <FormField control={editForm.control} name="serialNumber" render={({ field }) => (<FormItem><FormLabel>الرقم التسلسلي *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={editForm.control} name="type" render={({ field }) => (<FormItem><FormLabel>نوع الشريحة *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={editForm.control} name="customerId" render={({ field }) => (<FormItem><FormLabel>رقم العميل *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <DialogFooter className="pt-4">
                <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                <Button type="submit" disabled={editForm.formState.isSubmitting}>
                    {editForm.formState.isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    حفظ التعديلات
                </Button>
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
            سيتم حذف هذه الشريحة نهائيًا. لا يمكن التراجع عن هذا الإجراء.
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

    