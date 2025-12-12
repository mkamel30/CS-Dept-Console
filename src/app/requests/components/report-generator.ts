
'use client';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { MaintenanceRequest } from '@/lib/types';
import { format, differenceInMinutes } from 'date-fns';
import { ar } from 'date-fns/locale';


// Extend the jsPDF type definitions to include the autoTable method.
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export function generateMaintenanceReport(request: MaintenanceRequest) {
  const doc = new jsPDF();

  // Use the built-in Amiri font which supports Arabic
  doc.setFont('Amiri', 'normal');

  // Helper function to handle RTL text
  const rtlText = (text: string, x: number, y: number, options?: any) => {
    // jspdf has limited RTL support, this function helps align text to the right
    doc.text(text, x, y, { ...options, align: 'right' });
  };

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  // Header
  doc.text('تقرير صيانة', pageWidth / 2, 20, { align: 'center' });
  rtlText(`رقم الطلب: ${request.id.substring(0, 8)}`, pageWidth - margin, 30);
  doc.text(`Date: ${format(new Date(), 'yyyy-MM-dd')}`, margin, 30);
  doc.line(margin, 35, pageWidth - margin, 35);

  // Customer & Machine Info
  let y = 45;
  rtlText('بيانات العميل والماكينة', pageWidth - margin, y);
  y += 10;
  
  rtlText(`:العميل`, pageWidth - margin, y);
  rtlText(request.customerName, pageWidth - margin - 20, y);
  
  doc.text(`Customer ID: ${request.customerId}`, margin, y);
  y += 8;

  rtlText(`:الماكينة`, pageWidth - margin, y);
  rtlText(`${request.machineManufacturer || ''} ${request.machineModel || ''}`, pageWidth - margin - 20, y);
  
  doc.text(`S/N: ${request.serialNumber || 'N/A'}`, margin, y);
  y += 10;

  // Timestamps
  const createdAt = request.createdAt.toDate();
  const closedAt = request.closingTimestamp?.toDate();
  let durationString = 'الطلب لم يغلق بعد';

  if (closedAt) {
      const duration = differenceInMinutes(closedAt, createdAt);
      const days = Math.floor(duration / (60 * 24));
      const hours = Math.floor((duration % (60 * 24)) / 60);
      const minutes = duration % 60;
      durationString = [
          days > 0 ? `${days} يوم` : '',
          hours > 0 ? `${hours} ساعة` : '',
          minutes > 0 ? `${minutes} دقيقة` : ''
      ].filter(Boolean).join(' و ') || 'أقل من دقيقة';
  }


  rtlText('التوقيتات', pageWidth - margin, y);
  y += 8;
  rtlText(`تاريخ الإنشاء: ${format(createdAt, 'yyyy/MM/dd hh:mm a')}`, pageWidth - margin, y);
  y += 8;
  if(closedAt){
    rtlText(`تاريخ الإغلاق: ${format(closedAt, 'yyyy/MM/dd hh:mm a')}`, pageWidth - margin, y);
    y+= 8;
    rtlText(`المدة المستغرقة: ${durationString}`, pageWidth - margin, y);
  }


  y += 10;
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;


  // Complaint and Action
  rtlText('الشكوى والإجراء المتخذ', pageWidth - margin, y);
  y += 8;
  rtlText(':الشكوى', pageWidth - margin, y);
  y += 8;
  // Use splitTextToSize for long text blocks
  const complaintLines = doc.splitTextToSize(request.complaint || '', pageWidth - margin * 2);
  complaintLines.forEach((line: string) => {
      rtlText(line, pageWidth - margin, y);
      y += 7;
  });

  if (request.actionTaken) {
    y += 5;
    rtlText(':الإجراء المتخذ', pageWidth - margin, y);
    y += 8;
    const actionLines = doc.splitTextToSize(request.actionTaken, pageWidth - margin * 2);
    actionLines.forEach((line: string) => {
        rtlText(line, pageWidth - margin, y);
        y += 7;
    });
  }
  
  
  // Used Parts Table
  if (request.usedParts && request.usedParts.length > 0) {
    y += 10;
    rtlText('قطع الغيار المستخدمة', pageWidth - margin, y);
    y += 5;

    const head = [['الحالة', 'السعر', 'اسم القطعة']];
    // Reverse the text for RTL rendering in autoTable
    const body = request.usedParts.map(part => [
      (part.withCost ? 'بمقابل' : 'بدون مقابل').split('').reverse().join(''),
      part.withCost ? `${part.cost.toFixed(2)}` : '0.00',
      part.partName.split('').reverse().join(''),
    ]);

    doc.autoTable({
      startY: y,
      head: head,
      body: body,
      theme: 'grid',
      styles: {
        font: 'Amiri',
        halign: 'right',
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        halign: 'center'
      },
      didParseCell: function (data) {
        if (data.section === 'head') {
             data.cell.text = data.cell.text.map(t => t.split('').reverse().join(''));
        }
      }
    });

    y = (doc as any).lastAutoTable.finalY + 10;
  }
  
  // Footer
  const totalCost = request.usedParts?.filter(p => p.withCost).reduce((acc, part) => acc + part.cost, 0) || 0;
  
  if (request.receiptNumber) {
    rtlText(`رقم الإيصال: ${request.receiptNumber}`, pageWidth - margin, y);
  }

  rtlText(`التكلفة الإجمالية: ${totalCost.toFixed(2)} جنيه`, pageWidth - margin, y + 8);
  doc.text(`الفني: ${request.technician}`, margin, y + 8);
  

  doc.line(margin, doc.internal.pageSize.getHeight() - 30, pageWidth - margin, doc.internal.pageSize.getHeight() - 30);
  doc.text('شكرًا لتعاملكم معنا', pageWidth / 2, doc.internal.pageSize.getHeight() - 20, { align: 'center' });


  // Open in new tab
  doc.output('dataurlnewwindow');
}
