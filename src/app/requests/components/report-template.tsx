'use client';
import { MaintenanceRequest } from '@/lib/types';
import { format, differenceInMinutes, isValid } from 'date-fns';

interface ReportTemplateProps {
  request: MaintenanceRequest;
}

export const ReportTemplate: React.FC<ReportTemplateProps> = ({ request }) => {
    const createdAtDate = request.createdAt ? new Date(request.createdAt) : null;
    const closedAtDate = request.closingTimestamp ? new Date(request.closingTimestamp) : null;

    let durationString = 'N/A';
    if (createdAtDate && isValid(createdAtDate) && closedAtDate && isValid(closedAtDate)) {
        const duration = differenceInMinutes(closedAtDate, createdAtDate);
        if (!isNaN(duration)) {
            const days = Math.floor(duration / (60 * 24));
            const hours = Math.floor((duration % (60 * 24)) / 60);
            const minutes = duration % 60;
            durationString = [
                days > 0 ? `${days} يوم` : '',
                hours > 0 ? `${hours} ساعة` : '',
                minutes > 0 ? `${minutes} دقيقة` : ''
            ].filter(Boolean).join(' و ') || 'أقل من دقيقة';
        }
    }
    
    const totalCost = request.usedParts?.filter(p => p.withCost).reduce((acc, part) => acc + part.cost, 0) || 0;
    const formattedTotalCost = new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(totalCost);

    return (
        <html lang="ar" dir="rtl">
            <head>
                <title>تقرير صيانة - {request.id.substring(0,8)}</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    {`
                        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
                        body {
                            font-family: 'Cairo', sans-serif;
                            -webkit-print-color-adjust: exact;
                        }
                        @page {
                            size: A4;
                            margin: 1in;
                        }
                        @media print {
                            body {
                                margin: 0;
                                padding: 0;
                            }
                            .no-print {
                                display: none;
                            }
                        }
                    `}
                </style>
            </head>
            <body className="bg-white text-black p-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <header className="flex justify-between items-center pb-4 border-b-2 border-gray-300">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">تقرير صيانة</h1>
                            <p className="text-sm text-gray-500">رقم الطلب: {request.id.substring(0,8)}</p>
                        </div>
                        <div className="text-left">
                            <p className="text-sm">تاريخ الطباعة:</p>
                            <p className="text-sm font-semibold">{format(new Date(), 'yyyy-MM-dd')}</p>
                        </div>
                    </header>

                    {/* Customer & Machine Info */}
                    <section className="mt-8 grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h2 className="font-bold text-base mb-2 border-b pb-1">بيانات العميل</h2>
                            <p><span className="font-semibold text-gray-600">العميل:</span> {request.customerName}</p>
                            <p><span className="font-semibold text-gray-600">رقم العميل:</span> {request.customerId}</p>
                        </div>
                         <div className="bg-gray-50 p-4 rounded-lg">
                            <h2 className="font-bold text-base mb-2 border-b pb-1">بيانات الماكينة</h2>
                            <p><span className="font-semibold text-gray-600">الموديل:</span> {request.machineManufacturer || ''} {request.machineModel || ''}</p>
                            <p><span className="font-semibold text-gray-600">الرقم التسلسلي:</span> {request.serialNumber || 'N/A'}</p>
                        </div>
                    </section>
                    
                    {/* Timestamps */}
                    <section className="mt-6 text-sm">
                        <div className="flex justify-around bg-gray-100 p-3 rounded-lg">
                            <div className="text-center">
                               <p className="font-semibold">تاريخ الإنشاء</p>
                               <p>{createdAtDate && isValid(createdAtDate) ? format(createdAtDate, 'yyyy/MM/dd - hh:mm a') : 'غير متاح'}</p>
                            </div>
                             <div className="text-center">
                               <p className="font-semibold">تاريخ الإغلاق</p>
                               <p>{closedAtDate && isValid(closedAtDate) ? format(closedAtDate, 'yyyy/MM/dd - hh:mm a') : 'لم يغلق بعد'}</p>
                            </div>
                            <div className="text-center">
                               <p className="font-semibold">المدة المستغرقة</p>
                               <p>{durationString}</p>
                            </div>
                        </div>
                    </section>


                    {/* Complaint and Action */}
                    <section className="mt-8 space-y-6">
                        <div>
                            <h2 className="font-bold text-lg mb-2">الشكوى المبلغ عنها</h2>
                            <p className="text-sm border-r-4 border-gray-300 pr-4 bg-gray-50 p-3 rounded-md">{request.complaint || 'لا يوجد وصف'}</p>
                        </div>
                        {request.actionTaken && (
                             <div>
                                <h2 className="font-bold text-lg mb-2">الإجراء المتخذ والحل</h2>
                                <p className="text-sm border-r-4 border-blue-300 pr-4 bg-blue-50 p-3 rounded-md">{request.actionTaken}</p>
                            </div>
                        )}
                    </section>

                    {/* Used Parts */}
                    {request.usedParts && request.usedParts.length > 0 && (
                        <section className="mt-8">
                             <h2 className="font-bold text-lg mb-2">قطع الغيار المستخدمة</h2>
                             <table className="w-full text-sm text-right border-collapse">
                                <thead className="bg-gray-200">
                                    <tr>
                                        <th className="p-2 border">اسم القطعة</th>
                                        <th className="p-2 border">الحالة</th>
                                        <th className="p-2 border">السعر</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {request.usedParts.map((part, index) => (
                                        <tr key={index} className="border-b">
                                            <td className="p-2 border">{part.partName}</td>
                                            <td className="p-2 border">{part.withCost ? 'بمقابل' : 'بدون مقابل'}</td>
                                            <td className="p-2 border">{part.withCost ? new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(part.cost) : '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                             </table>
                        </section>
                    )}

                     {/* Footer */}
                     <footer className="mt-12 pt-6 border-t-2 border-gray-300 text-sm">
                        <div className="flex justify-between items-center">
                            <div>
                                <p><span className="font-bold">الفني المسؤول:</span> {request.technician}</p>
                                {request.receiptNumber && <p><span className="font-bold">رقم إيصال السداد:</span> {request.receiptNumber}</p>}
                            </div>
                             <div className="text-left">
                                <p className="font-bold">التكلفة الإجمالية لقطع الغيار</p>
                                <p className="text-xl font-bold">{formattedTotalCost}</p>
                            </div>
                        </div>
                        <div className="text-center text-xs text-gray-500 mt-8">
                            <p>شكرًا لتعاملكم معنا.</p>
                        </div>
                     </footer>
                </div>
            </body>
        </html>
    );
};
