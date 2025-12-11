import { MachineParameter } from './types';
import { subDays } from 'date-fns';

export const machineParameters: MachineParameter[] = [
    { prefix: "3C", model: "S90", manufacturer: "PAX" },
    { prefix: "VX", model: "VX520", manufacturer: "Verifone" },
    { prefix: "IC", model: "ICT220", manufacturer: "Ingenico" },
];

// Note: The static data below (posMachines, maintenanceRequests, etc.) is now deprecated
// and will be fully replaced by Firestore. It's kept here temporarily for reference
// during the transition but is no longer used by the application logic.
// All data will be read from and written to Firestore.

export const assets: any[] = [
  { id: 'ASSET-101', name: 'مضخة مياه رئيسية', type: 'ميكانيكي', location: 'غرفة المضخات', status: 'Under Maintenance', lastMaintenance: subDays(new Date(), 30).toISOString() },
  { id: 'ASSET-102', name: 'مكيف الهواء المركزي', type: 'كهربائي', location: 'السطح', status: 'Operational', lastMaintenance: subDays(new Date(), 90).toISOString() },
];

export const inventory: any[] = [
  { id: 'PART-001', name: 'فلتر زيت', quantity: 5, minLevel: 10, location: 'رف A-3' },
  { id: 'PART-002', name: 'حزام ناقل V-Belt', quantity: 22, minLevel: 20, location: 'رف B-1' },
];

export const technicians: any[] = [
  { id: 'TECH-01', name: 'علي حسن', speciality: 'ميكانيكا', status: 'Available', tasks: 3 },
  { id: 'TECH-02', name: 'فاطمة الزهراء', speciality: 'كهرباء', status: 'Busy', tasks: 1 },
];
