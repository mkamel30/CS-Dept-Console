
import { Timestamp } from "firebase/firestore";

// Represents a maintenance request for a POS machine.
export type MaintenanceRequest = {
  id: string; // Document ID
  customerId: string; // The unique bkcode of the customer.
  posMachineId: string; // The ID of the POS machine document.
  customerName: string;
  machineModel?: string;
  machineManufacturer?: string;
  createdAt: Timestamp; // Firestore Timestamp
  status: 'Open' | 'In Progress' | 'Closed' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High';
  technician: string;
  notes?: string;
  complaint: string; // The initial complaint reported by the customer.
  actionTaken?: string; // The procedure performed by the technician.
  closingUserId?: string; // UID of the user who closed the request.
  closingUserName?: string; // Name of the user who closed the request.
  closingTimestamp?: Timestamp; // When the request was closed.
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
  national_id?: string;
  dept?: string;
  telephone_1?: string;
  telephone_2?: string;
  has_gates?: boolean;
  bk_type?: string;
  notes?: string;
  papers_date?: Timestamp;
  isSpecial?: boolean;
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
  id: string; // Document ID
  prefix: string;
  model: string;
  manufacturer: string;
};

// Represents the definition and properties of a spare part.
export type SparePart = {
  id: string; // Document ID
  partNumber?: string; // Optional SKU
  name: string;
  description?: string;
  compatibleModels: string[];
  defaultCost: number;
  isConsumable?: boolean;
  allowsMultiple?: boolean;
};

// Represents the stock level of a specific spare part in inventory.
export type InventoryItem = {
  id: string; // Document ID
  partId: string; // Links to SparePart ID
  quantity: number;
  minLevel: number;
  location: string;
};

// Logs changes to the defaultCost of a SparePart.
export type PriceChangeLog = {
    id: string; // Document ID
    partId: string; // ID of the SparePart
    oldCost: number;
    newCost: number;
    changedAt: Timestamp;
    userId: string; // UID of the user who made the change
}

export type Asset = {
  id: string;
  name: string;
  type: string;
  location: string;
  status: 'Operational' | 'Under Maintenance' | 'Decommissioned';
  lastMaintenance: string;
};

export type Technician = {
  id: string;
  name: string;
  speciality: string;
  status: 'Available' | 'Busy' | 'On Leave';
  tasks: number;
};

// Represents a user of the maintenance management system.
export type User = {
  id: string; // Document ID
  uid: string; // Firebase Auth UID
  email: string;
  displayName?: string;
  role?: string;
};
