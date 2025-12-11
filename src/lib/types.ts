import { Timestamp } from "firebase/firestore";

// Represents a maintenance request for a POS machine.
export type MaintenanceRequest = {
  id: string; // Document ID
  customerId: string; // The unique bkcode of the customer.
  posMachineId: string; // The ID of the POS machine document.
  customerName: string;
  machineModel: string;
  machineManufacturer: string;
  createdAt: Timestamp; // Firestore Timestamp
  status: 'Open' | 'In Progress' | 'Closed' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High';
  technician: string;
  notes?: string;
};

// Represents a customer entity. The document ID will be the bkcode.
export type Customer = {
  id: string; // Document ID (which is the bkcode)
  bkcode: string;
  client_name: string;
  supply_office?: string;
  operating_date?: Timestamp;
  address: string;
  contact_person?: string;
  scanned_id_path?: string;
  national_id: string;
  dept?: string;
  telephone_1?: string;
  telephone_2?: string;
  has_gates?: boolean;
  bk_type?: string;
  notes?: string;
  papers_date?: Timestamp;
};

// Represents a single POS machine owned by a customer.
export type PosMachine = {
  id: string; // Document ID
  serialNumber: string;
  posId: string;
  model?: string;
  manufacturer?: string;
  customerId: string; // The bkcode of the customer
  isMain?: boolean;
};

// Represents a SIM card associated with a customer.
export type SimCard = {
  id: string; // Document ID
  serialNumber: string;
  type: string;
  customerId: string; // The bkcode of the customer
};

// Defines the structure for machine parameter rules used for auto-lookup.
export type MachineParameter = {
  prefix: string;
  model: string;
  manufacturer: string;
};

export type Asset = {
  id: string;
  name: string;
  type: string;
  location: string;
  status: 'Operational' | 'Under Maintenance' | 'Decommissioned';
  lastMaintenance: string;
};

export type InventoryItem = {
  id:string;
  name: string;
  quantity: number;
  minLevel: number;
  location: string;
};

export type Technician = {
  id: string;
  name: string;
  speciality: string;
  status: 'Available' | 'Busy' | 'On Leave';
  tasks: number;
};
