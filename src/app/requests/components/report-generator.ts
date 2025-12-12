
'use client';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { MaintenanceRequest } from '@/lib/types';
import { format, differenceInMinutes } from 'date-fns';
import { ar } from 'date-fns/locale';

// This is a Base64 encoded version of a font that supports Arabic.
// You can generate this from a .ttf file. For this example, I'm using a placeholder.
// To generate a real one:
// 1. Get a .ttf font file (e.g., from Google Fonts).
// 2. Use a tool or script to convert it to a Base64 string.
// 3. Create a .js file like: export const arabicFont = 'BASE64_STRING';
import { arabicFont } from './arabic-font.js';


// Extend the jsPDF type definitions to include the autoTable method.
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export function generateMaintenanceReport(request: MaintenanceRequest) {
  const doc = new jsPDF();

  // Add the custom Arabic font
  doc.addFileToVFS('Cairo-Regular-normal.ttf', arabicFont);
  doc.addFont('Cairo-Regular-normal.ttf', 'Cairo-Regular', 'normal');
  doc.setFont('Cairo-Regular');

  // Helper function to handle RTL text
  const rtlText = (text: string, x: number, y: number, options?: any) => {
    // jspdf doesn't have great RTL support out of the box. 
    // This reverses the string for basic display. For complex scripts, a more robust solution is needed.
    const reversedText = text.split('').reverse().join('');
    doc.text(reversedText, x, y, options);
  };

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  // Header
  rtlText('تقرير صيانة', pageWidth / 2, 20, { align: 'center' });
  rtlText(`رقم الطلب: ${request.id.substring(0, 8)}`, pageWidth - margin, 30, { align: 'right' });
  doc.text(`Date: ${format(new Date(), 'yyyy-MM-dd')}`, margin, 30);
  doc.line(margin, 35, pageWidth - margin, 35);

  // Customer & Machine Info
  let y = 45;
  rtlText('بيانات العميل والماكينة', pageWidth - margin, y, { align: 'right' });
  y += 10;
  
  rtlText(`:العميل`, pageWidth - margin, y, { align: 'right' });
  rtlText(request.customerName, pageWidth - margin - 20, y, { align: 'right' });
  
  doc.text(`Customer ID: ${request.customerId}`, margin, y);
  y += 8;

  rtlText(`:الماكينة`, pageWidth - margin, y, { align: 'right' });
  rtlText(`${request.machineManufacturer || ''} ${request.machineModel || ''}`, pageWidth - margin - 20, y, { align: 'right' });
  
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


  rtlText('التوقيتات', pageWidth - margin, y, { align: 'right' });
  y += 8;
  rtlText(`تاريخ الإنشاء: ${format(createdAt, 'yyyy/MM/dd hh:mm a')}`, pageWidth - margin, y, { align: 'right' });
  y += 8;
  if(closedAt){
    rtlText(`تاريخ الإغلاق: ${format(closedAt, 'yyyy/MM/dd hh:mm a')}`, pageWidth - margin, y, { align: 'right' });
    y+= 8;
    rtlText(`المدة المستغرقة: ${durationString}`, pageWidth - margin, y, { align: 'right' });
  }


  y += 10;
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;


  // Complaint and Action
  rtlText('الشكوى والإجراء المتخذ', pageWidth - margin, y, { align: 'right' });
  y += 8;
  rtlText(':الشكوى', pageWidth - margin, y, { align: 'right' });
  y += 8;
  // Use splitTextToSize for long text blocks
  const complaintLines = doc.splitTextToSize(request.complaint || '', pageWidth - margin * 2);
  complaintLines.forEach((line: string) => {
      rtlText(line, pageWidth - margin, y, { align: 'right'});
      y += 7;
  });

  if (request.actionTaken) {
    y += 5;
    rtlText(':الإجراء المتخذ', pageWidth - margin, y, { align: 'right' });
    y += 8;
    const actionLines = doc.splitTextToSize(request.actionTaken, pageWidth - margin * 2);
    actionLines.forEach((line: string) => {
        rtlText(line, pageWidth - margin, y, { align: 'right'});
        y += 7;
    });
  }
  
  
  // Used Parts Table
  if (request.usedParts && request.usedParts.length > 0) {
    y += 10;
    rtlText('قطع الغيار المستخدمة', pageWidth - margin, y, { align: 'right' });
    y += 5;

    const head = [['الحالة', 'السعر', 'اسم القطعة']];
    const body = request.usedParts.map(part => [
      part.withCost ? 'بمقابل' : 'بدون مقابل',
      part.withCost ? `${part.cost.toFixed(2)}` : '0.00',
      part.partName,
    ].map(text => text.split('').reverse().join('')));

    doc.autoTable({
      startY: y,
      head: head,
      body: body,
      theme: 'grid',
      styles: {
        font: 'Cairo-Regular',
        halign: 'right',
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
      }
    });

    y = (doc as any).lastAutoTable.finalY + 10;
  }
  
  // Footer
  const totalCost = request.usedParts?.filter(p => p.withCost).reduce((acc, part) => acc + part.cost, 0) || 0;
  
  if (request.receiptNumber) {
    rtlText(`رقم الإيصال: ${request.receiptNumber}`, pageWidth - margin, y, { align: 'right' });
  }

  rtlText(`التكلفة الإجمالية: ${totalCost.toFixed(2)} جنيه`, pageWidth - margin, y + 8, { align: 'right' });
  rtlText(`الفني: ${request.technician}`, margin, y + 8);
  

  doc.line(margin, doc.internal.pageSize.getHeight() - 30, pageWidth - margin, doc.internal.pageSize.getHeight() - 30);
  rtlText('شكرًا لتعاملكم معنا', pageWidth / 2, doc.internal.pageSize.getHeight() - 20, { align: 'center' });


  // Open in new tab
  doc.output('dataurlnewwindow');
}

    