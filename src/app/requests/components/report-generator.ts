'use client';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { MaintenanceRequest } from '@/lib/types';
import { format, differenceInMinutes } from 'date-fns';

// Extend the jsPDF type definitions to include the autoTable method.
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export function generateMaintenanceReport(request: MaintenanceRequest) {
  const doc = new jsPDF();

  // Set the font to Amiri for Arabic support
  doc.setFont('Amiri', 'normal');

  // Helper function to handle RTL text correctly
  const rtlText = (text: string, x: number, y: number, options?: any) => {
    // Ensure the font is set before each text call for safety
    doc.text(text, x, y, { ...options, align: 'right', lang: 'ar', font: 'Amiri' });
  };

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  // Header
  doc.setFontSize(20);
  rtlText('تقرير صيانة', pageWidth / 2, 20, { align: 'center' });
  doc.setFontSize(12);
  rtlText(`رقم الطلب: ${request.id.substring(0, 8)}`, pageWidth - margin, 30);
  doc.text(`Date: ${format(new Date(), 'yyyy-MM-dd')}`, margin, 30);
  doc.line(margin, 35, pageWidth - margin, 35);

  // Customer & Machine Info
  let y = 45;
  rtlText('بيانات العميل والماكينة', pageWidth - margin, y);
  y += 10;
  
  rtlText(`العميل: ${request.customerName}`, pageWidth - margin, y);
  doc.text(`Customer ID: ${request.customerId}`, margin, y);
  y += 8;

  rtlText(`الماكينة: ${request.machineManufacturer || ''} ${request.machineModel || ''}`, pageWidth - margin, y);
  doc.text(`S/N: ${request.serialNumber || 'N/A'}`, margin, y);
  y += 10;

  // Timestamps
  const createdAt = request.createdAt ? new Date(request.createdAt) : null;
  const closedAt = request.closingTimestamp ? new Date(request.closingTimestamp) : null;
  let durationString = 'الطلب لم يغلق بعد';

  if (createdAt && closedAt) {
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
  if(createdAt){
    rtlText(`تاريخ الإنشاء: ${format(createdAt, 'yyyy/MM/dd hh:mm a')}`, pageWidth - margin, y);
    y += 8;
  }
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
  rtlText('الشكوى:', pageWidth - margin, y);
  y += 8;
  const complaintLines = doc.splitTextToSize(request.complaint || '', pageWidth - margin * 2);
  rtlText(complaintLines, pageWidth - margin, y);
  y += complaintLines.length * 7;
  

  if (request.actionTaken) {
    y += 5;
    rtlText('الإجراء المتخذ:', pageWidth - margin, y);
    y += 8;
    const actionLines = doc.splitTextToSize(request.actionTaken, pageWidth - margin * 2);
    rtlText(actionLines, pageWidth - margin, y);
    y += actionLines.length * 7;
  }
  
  
  // Used Parts Table
  if (request.usedParts && request.usedParts.length > 0) {
    y = Math.max(y, (doc as any).lastAutoTable?.finalY || 0) + 10;
    rtlText('قطع الغيار المستخدمة', pageWidth - margin, y);
    y += 5;

    const head = [['الحالة', 'السعر', 'اسم القطعة']];
    const body = request.usedParts.map(part => [
      part.withCost ? 'بمقابل' : 'بدون مقابل',
      part.withCost ? new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(part.cost) : '0.00',
      part.partName,
    ]);

    doc.autoTable({
      startY: y,
      head: head,
      body: body,
      theme: 'grid',
      styles: {
        font: 'Amiri',
        halign: 'right',
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        halign: 'center'
      },
    });

    y = (doc as any).lastAutoTable.finalY + 10;
  }
  
  // Footer
  const totalCost = request.usedParts?.filter(p => p.withCost).reduce((acc, part) => acc + part.cost, 0) || 0;
  
  if (request.receiptNumber) {
    rtlText(`رقم الإيصال: ${request.receiptNumber}`, pageWidth - margin, y);
  }

  const formattedTotalCost = new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(totalCost);
  rtlText(`التكلفة الإجمالية: ${formattedTotalCost}`, pageWidth - margin, y + 8);
  doc.text(`الفني: ${request.technician}`, margin, y + 8);
  

  doc.line(margin, doc.internal.pageSize.getHeight() - 30, pageWidth - margin, doc.internal.pageSize.getHeight() - 30);
  rtlText('شكرًا لتعاملكم معنا', pageWidth / 2, doc.internal.pageSize.getHeight() - 20, { align: 'center' });


  // Open in new tab
  doc.output('dataurlnewwindow');
}
