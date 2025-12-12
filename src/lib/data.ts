import { MachineParameter } from './types';

// Note: The static data below is now deprecated and will be fully replaced by Firestore. 
// It's kept here temporarily for reference during the transition but is no longer used by the application logic.
// All data will be read from and written to Firestore.

// This data is managed from the Settings page in the UI.
export const machineParameters: Omit<MachineParameter, 'id'>[] = [
    { prefix: "3C", model: "S90", manufacturer: "PAX" },
    { prefix: "VX", model: "VX520", manufacturer: "Verifone" },
    { prefix: "IC", model: "ICT220", manufacturer: "Ingenico" },
];

// Deprecated mock data. No longer used.
export const assets: any[] = [];
export const inventory: any[] = [];
export const technicians: any[] = [];
