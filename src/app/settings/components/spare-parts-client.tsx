
"use client";

import { useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, Upload, Download, Loader2, X } from "lucide-react";
import { collection, doc } from "firebase/firestore";

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
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

import { columns, type SparePartColumn } from "./spare-parts-columns";
import { SparePart } from "@/lib/types";

interface SparePartClientProps {
  data: SparePartColumn[];
  isLoading: boolean;
  availableModels: string[];
}

const formSchema = z.object({
  name: z.string().min(1, { message: "اسم القطعة مطلوب." }),
  partNumber: z.string().optional(),
  defaultCost: z.coerce.number().min(0, { message: "السعر يجب أن يكون رقمًا موجبًا."}),
  compatibleModels: z.array(z.string()).min(1, { message: "يجب اختيار موديل واحد على الأقل."}),
});

export const SparePartsClient: React.FC<SparePartClientProps> = ({ data, isLoading, availableModels }) => {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isAddPartOpen, setAddPartOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<SparePartColumn | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingPartId, setDeletingPartId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      partNumber: "",
      defaultCost: 0,
      compatibleModels: [],
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
        toast({ variant: "destructive", title: "خطأ", description: "لا يمكن إتمام عملية الاستيراد." });
        return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      toast({
        title: "بدء المعالجة...",
        description: `جاري حفظ ${importData.length} سجل في قاعدة البيانات.`,
      });

      const sparePartsCollection = collection(firestore, 'spareParts');

      for (let i = 0; i < importData.length; i++) {
        const item = importData[i];
        
        const models = item.model?.toString().split(';').map((m:string) => m.trim()).filter((m:string) => m) || [];
        
        const newPart = {
          name: item.type?.toString() || 'N/A',
          partNumber: item.partNumber?.toString() || '',
          defaultCost: parseFloat(item.price) || 0,
          compatibleModels: models,
        };
          
        addDocumentNonBlocking(sparePartsCollection, newPart);
        setProgress(((i + 1) / importData.length) * 100);
      }

      toast({
        title: "اكتمل الرفع بنجاح",
        description: `تمت جدولة إضافة ${importData.length} قطعة غيار.`,
        duration: 9000,
      });

    } catch (error) {
      console.error("Error processing file:", error);
      toast({ variant: "destructive", title: "حدث خطأ", description: "فشلت معالجة الملف." });
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setImportData([]);
    }
  };

  const handleDownloadTemplate = async () => {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet([
      { type: "Battery", partNumber: "BAT-S90", model: "S90;D210", price: 150.00 },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Spare Parts");
    XLSX.writeFile(wb, "SpareParts_Template.xlsx");
  };

  const handleExportData = async () => {
     const XLSX = await import("xlsx");
     const exportData = data.map(d => ({
        name: d.name,
        partNumber: d.partNumber,
        compatibleModels: d.compatibleModels.join(';'),
        defaultCost: d.defaultCost
     }))
     const ws = XLSX.utils.json_to_sheet(exportData);
     const wb = XLSX.utils.book_new();
     XLSX.utils.book_append_sheet(wb, ws, "Current Spare Parts");
     XLSX.writeFile(wb, "Current_SpareParts_Data.xlsx");
  };

  const onAddPartSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore) return;
    try {
      const sparePartsCollection = collection(firestore, 'spareParts');
      
      addDocumentNonBlocking(sparePartsCollection, values);
      toast({
        title: "تمت إضافة قطعة الغيار بنجاح",
        description: `تم حفظ ${values.name} في قاعدة البيانات.`,
      });
      form.reset();
      setAddPartOpen(false);
    } catch (error) {
      console.error("Error adding spare part:", error);
      toast({
        variant: "destructive",
        title: "حدث خطأ",
        description: "فشلت عملية إضافة قطعة الغيار.",
      });
    }
  };

  const onEditPartSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore || !editingPart) return;
    try {
      const partDoc = doc(firestore, 'spareParts', editingPart.id);
      updateDocumentNonBlocking(partDoc, values);
      toast({
        title: "تم تحديث قطعة الغيار بنجاح",
      });
      setEditingPart(null);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating spare part:", error);
      toast({
        variant: "destructive",
        title: "حدث خطأ",
        description: "فشلت عملية تحديث قطعة الغيار.",
      });
    }
  };

  const openEditDialog = (part: SparePartColumn) => {
    setEditingPart(part);
    editForm.reset({
      name: part.name,
      partNumber: part.partNumber || '',
      defaultCost: part.defaultCost,
      compatibleModels: part.compatibleModels,
    });
    setIsEditDialogOpen(true);
  };
  
  const openDeleteDialog = (partId: string) => {
    setDeletingPartId(partId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!firestore || !deletingPartId) return;
    const partDoc = doc(firestore, 'spareParts', deletingPartId);
    deleteDocumentNonBlocking(partDoc);
    toast({
      title: "تم الحذف بنجاح",
    });
    setDeletingPartId(null);
    setIsDeleteDialogOpen(false);
  };


  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>قواعد قطع الغيار</CardTitle>
        <CardDescription>
          إدارة تعريفات قطع الغيار، أسعارها، والموديلات المتوافقة معها.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
                  <TableHead>اسم القطعة</TableHead>
                  <TableHead>الموديل</TableHead>
                  <TableHead>السعر</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {importData.slice(0, 5).map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.type || 'N/A'}</TableCell>
                    <TableCell>{item.model || 'N/A'}</TableCell>
                    <TableCell>{item.price || 'N/A'}</TableCell>
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

      <div className="flex items-center justify-end space-x-2 pb-4">
           <Dialog open={isAddPartOpen} onOpenChange={(isOpen) => {
              setAddPartOpen(isOpen);
              if (!isOpen) {
                form.reset();
              }
           }}>
            <DialogTrigger asChild>
              <Button disabled={isLoading || isProcessing}>
                <PlusCircle className="ml-2 h-4 w-4" />
                إضافة قطعة غيار
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>إضافة قطعة غيار جديدة</DialogTitle>
                <DialogDescription>
                  املأ الحقول لتعريف قطعة غيار جديدة.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onAddPartSubmit)}>
                <div className="max-h-[60vh] overflow-y-auto p-1 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>اسم القطعة *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. بطارية S90" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="partNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>رقم القطعة (SKU)</FormLabel>
                          <FormControl>
                            <Input placeholder="اختياري" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="defaultCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>السعر *</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                   <FormField
                    control={form.control}
                    name="compatibleModels"
                    render={() => (
                      <FormItem>
                        <div className="mb-4">
                          <FormLabel>الموديلات المتوافقة *</FormLabel>
                        </div>
                          <ScrollArea className="h-40 w-full rounded-md border p-4">
                            {availableModels.map((model) => (
                                <FormField
                                key={model}
                                control={form.control}
                                name="compatibleModels"
                                render={({ field }) => {
                                    return (
                                    <FormItem
                                        key={model}
                                        className="flex flex-row items-start space-x-3 space-y-0 mb-4"
                                    >
                                        <FormControl>
                                        <Checkbox
                                            checked={field.value?.includes(model)}
                                            onCheckedChange={(checked) => {
                                            return checked
                                                ? field.onChange([...field.value, model])
                                                : field.onChange(
                                                    field.value?.filter(
                                                    (value) => value !== model
                                                    )
                                                )
                                            }}
                                        />
                                        </FormControl>
                                        <FormLabel className="font-normal">
                                        {model}
                                        </FormLabel>
                                    </FormItem>
                                    )
                                }}
                                />
                            ))}
                        </ScrollArea>
                        <FormMessage />
                        <Controller
                            control={form.control}
                            name="compatibleModels"
                            render={({ field }) => (
                                <div className="pt-2">
                                  {field.value.map((model) => (
                                    <Badge key={model} variant="secondary" className="mr-1 mb-1">
                                      {model}
                                      <button
                                        type="button"
                                        className="mr-1 h-4 w-4 text-primary hover:text-destructive"
                                        onClick={() => field.onChange(field.value.filter((m) => m !== model))}
                                      >
                                        <X size={14} />
                                      </button>
                                    </Badge>
                                  ))}
                                </div>
                            )}
                        />
                      </FormItem>
                    )}
                  />
                  </div>
                  <DialogFooter className="pt-4">
                    <DialogClose asChild>
                      <Button type="button" variant="outline">إلغاء</Button>
                    </DialogClose>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                      إضافة القطعة
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
            accept=".xlsx, .xls"
            disabled={isProcessing}
          />
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
          searchKeys={["name", "partNumber", "compatibleModels"]} 
          columns={columns({ openEditDialog, openDeleteDialog })} 
          data={data} 
          searchPlaceholder="بحث بالاسم، رقم القطعة، أو الموديل..." 
        />
      )}
      </CardContent>
    </Card>
    
    {/* Edit Dialog */}
    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>تعديل قطعة غيار</DialogTitle>
            <DialogDescription>
              تحديث بيانات قطعة الغيار.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditPartSubmit)}>
            <div className="max-h-[60vh] overflow-y-auto p-1 space-y-4">
                {/* Form fields are identical to add form, but using editForm */}
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={editForm.control} name="name" render={({ field }) => (<FormItem className="col-span-2"><FormLabel>اسم القطعة *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={editForm.control} name="partNumber" render={({ field }) => (<FormItem><FormLabel>رقم القطعة (SKU)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={editForm.control} name="defaultCost" render={({ field }) => (<FormItem><FormLabel>السعر *</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <FormField
                    control={editForm.control}
                    name="compatibleModels"
                    render={() => (
                        <FormItem>
                            <div className="mb-4"><FormLabel>الموديلات المتوافقة *</FormLabel></div>
                            <ScrollArea className="h-40 w-full rounded-md border p-4">
                                {availableModels.map((model) => (<FormField key={model} control={editForm.control} name="compatibleModels" render={({ field }) => (<FormItem key={model} className="flex flex-row items-start space-x-3 space-y-0 mb-4"><FormControl><Checkbox checked={field.value?.includes(model)} onCheckedChange={(checked) => {return checked ? field.onChange([...field.value, model]) : field.onChange(field.value?.filter((value) => value !== model))}} /></FormControl><FormLabel className="font-normal">{model}</FormLabel></FormItem>)} />))}
                            </ScrollArea>
                            <FormMessage />
                            <Controller
                                control={editForm.control}
                                name="compatibleModels"
                                render={({ field }) => (
                                    <div className="pt-2">
                                      {field.value.map((model) => (
                                        <Badge key={model} variant="secondary" className="mr-1 mb-1">{model}<button type="button" className="mr-1 h-4 w-4 text-primary hover:text-destructive" onClick={() => field.onChange(field.value.filter((m) => m !== model))}><X size={14} /></button></Badge>
                                      ))}
                                    </div>
                                )}
                            />
                        </FormItem>
                    )}
                />
            </div>
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

    {/* Delete Confirmation Dialog */}
    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
          <AlertDialogDescription>
            سيتم حذف قطعة الغيار هذه نهائيًا. لا يمكن التراجع عن هذا الإجراء.
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
  
    

    
```
  </change>
  <change>
    <file>src/app/settings/components/spare-parts-columns.tsx</file>
    <content><![CDATA[
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export type SparePartColumn = {
  id: string;
  partNumber?: string;
  name: string;
  compatibleModels: string[];
  defaultCost: number;
};

interface ColumnsProps {
  openEditDialog: (part: SparePartColumn) => void;
  openDeleteDialog: (partId: string) => void;
}

export const columns = ({ openEditDialog, openDeleteDialog }: ColumnsProps): ColumnDef<SparePartColumn>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="تحديد الكل"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="تحديد الصف"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "اسم القطعة",
  },
  {
    accessorKey: "partNumber",
    header: "رقم القطعة (SKU)",
  },
  {
    accessorKey: "compatibleModels",
    header: "الموديلات المتوافقة",
    cell: ({ row }) => {
      const models = row.original.compatibleModels;
      return (
        <div className="flex flex-wrap gap-1">
          {models.map((model) => (
            <Badge key={model} variant="secondary">
              {model}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "defaultCost",
    header: "التكلفة (السعر)",
    cell: ({ row }) => {
        const amount = parseFloat(row.getValue("defaultCost"))
        const formatted = new Intl.NumberFormat("ar-EG", {
            style: "currency",
            currency: "EGP"
        }).format(amount);

        return <div className="font-medium">{formatted}</div>
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const part = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">فتح القائمة</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>إجراءات</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(part.id)}
            >
              نسخ معرف القطعة
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openEditDialog(part)}>تعديل</DropdownMenuItem>
            <DropdownMenuItem onClick={() => openDeleteDialog(part.id)} className="text-destructive">حذف</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

    