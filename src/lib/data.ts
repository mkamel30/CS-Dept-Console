import { MaintenanceRequest, Asset, InventoryItem, Technician } from './types';
import { subDays, subHours } from 'date-fns';

export const maintenanceRequests: MaintenanceRequest[] = [
  { id: 'REQ-001', asset: 'مضخة مياه رئيسية', issue: 'تسريب مياه', status: 'Open', priority: 'High', technician: 'علي حسن', createdDate: subDays(new Date(), 1).toISOString() },
  { id: 'REQ-002', asset: 'مكيف الهواء المركزي', issue: 'ضعف التبريد', status: 'In Progress', priority: 'Medium', technician: 'فاطمة الزهراء', createdDate: subDays(new Date(), 2).toISOString() },
  { id: 'REQ-003', asset: 'مولد كهرباء احتياطي', issue: 'فشل في البدء', status: 'Closed', priority: 'High', technician: 'علي حسن', createdDate: subDays(new Date(), 10).toISOString() },
  { id: 'REQ-004', asset: 'نظام الإضاءة', issue: 'عطل في اللوحة الرئيسية', status: 'Open', priority: 'Low', technician: 'غير معين', createdDate: subHours(new Date(), 4).toISOString() },
  { id: 'REQ-005', asset: 'رافعة شوكية #3', issue: 'صوت غير طبيعي في المحرك', status: 'Cancelled', priority: 'Medium', technician: 'سالم الأحمدي', createdDate: subDays(new Date(), 5).toISOString() },
  { id: 'REQ-006', asset: 'نظام إنذار الحريق', issue: 'فحص دوري', status: 'In Progress', priority: 'Low', technician: 'فاطمة الزهراء', createdDate: subDays(new Date(), 3).toISOString() },
];

export const assets: Asset[] = [
  { id: 'ASSET-101', name: 'مضخة مياه رئيسية', type: 'ميكانيكي', location: 'غرفة المضخات', status: 'Under Maintenance', lastMaintenance: subDays(new Date(), 30).toISOString() },
  { id: 'ASSET-102', name: 'مكيف الهواء المركزي', type: 'كهربائي', location: 'السطح', status: 'Operational', lastMaintenance: subDays(new Date(), 90).toISOString() },
  { id: 'ASSET-103', name: 'مولد كهرباء احتياطي', type: 'كهربائي', location: 'الغرفة الكهربائية', status: 'Operational', lastMaintenance: subDays(new Date(), 15).toISOString() },
  { id: 'ASSET-201', name: 'رافعة شوكية #3', type: 'مركبة', location: 'المستودع الرئيسي', status: 'Decommissioned', lastMaintenance: subDays(new Date(), 200).toISOString() },
];

export const inventory: InventoryItem[] = [
  { id: 'PART-001', name: 'فلتر زيت', quantity: 5, minLevel: 10, location: 'رف A-3' },
  { id: 'PART-002', name: 'حزام ناقل V-Belt', quantity: 22, minLevel: 20, location: 'رف B-1' },
  { id: 'PART-003', name: 'مصباح LED 100W', quantity: 150, minLevel: 50, location: 'رف C-5' },
  { id: 'PART-004', name: 'زيت محرك 5L', quantity: 8, minLevel: 5, location: 'رف A-4' },
];

export const technicians: Technician[] = [
  { id: 'TECH-01', name: 'علي حسن', speciality: 'ميكانيكا', status: 'Available', tasks: 3 },
  { id: 'TECH-02', name: 'فاطمة الزهراء', speciality: 'كهرباء', status: 'Busy', tasks: 1 },
  { id: 'TECH-03', name: 'سالم الأحمدي', speciality: 'مركبات', status: 'Available', tasks: 0 },
  { id: 'TECH-04', name: 'خالد الصالح', speciality: 'عام', status: 'On Leave', tasks: 0 },
];
