"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, Upload, Download } from "lucide-react";

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

import { columns, type RequestColumn } from "./columns";

interface RequestClientProps {
  data: RequestColumn[];
  setData: React.Dispatch<React.SetStateAction<RequestColumn[]>>;
}

const formSchema = z.object({
  issue: z.string().min(1, { message: "وصف المشكلة مطلوب." }),
  asset: z.string().min(1, { message: "اسم الأصل مطلوب." }),
  priority: z.enum(["Low", "Medium", "High"], {
    required_error: "يجب اختيار الأولوية.",
  }),
});

export const RequestClient: React.FC<RequestClientProps> = ({ data, setData }) => {
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      issue: "",
      asset: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const newRequest: RequestColumn = {
      id: `REQ-${Math.floor(Math.random() * 1000)}`,
      issue: values.issue,
      asset: values.asset,
      priority: values.priority,
      status: 'Open',
      technician: 'غير معين',
      createdDate: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD format
    };
    setData((currentData) => [newRequest, ...currentData]);
    toast({
      title: "تم إنشاء الطلب بنجاح",
      description: `تمت إضافة طلب الصيانة للمشكلة: ${values.issue}`,
    });
    setOpen(false);
    form.reset();
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
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <DialogHeader>
                    <DialogTitle>إنشاء طلب صيانة جديد</DialogTitle>
                    <DialogDescription>
                      املأ الحقول أدناه لإنشاء طلب جديد. انقر على "حفظ" عند
                      الانتهاء.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <FormField
                      control={form.control}
                      name="issue"
                      render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4">
                          <FormLabel className="text-right">المشكلة</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. تسريب مياه"
                              className="col-span-3"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="col-span-4" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="asset"
                      render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4">
                          <FormLabel className="text-right">الأصل</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. مضخة مياه رئيسية"
                              className="col-span-3"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="col-span-4" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4">
                          <FormLabel className="text-right">الأولوية</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="اختر الأولوية" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="High">عالية</SelectItem>
                              <SelectItem value="Medium">متوسطة</SelectItem>
                              <SelectItem value="Low">منخفضة</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage className="col-span-4" />
                        </FormItem>
                      )}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit">حفظ الطلب</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Upload className="ml-2 h-4 w-4" />
                استيراد / تصدير
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>خيارات البيانات</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Download className="ml-2 h-4 w-4" />
                تنزيل قالب Excel
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Upload className="ml-2 h-4 w-4" />
                رفع ملف Excel
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Download className="ml-2 h-4 w-4" />
                تصدير البيانات الحالية
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <DataTable
        searchKey="issue"
        columns={columns}
        data={data}
        searchPlaceholder="بحث عن مشكلة..."
      />
    </>
  );
};
