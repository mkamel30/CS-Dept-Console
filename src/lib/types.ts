
import { Timestamp } from "firebase/firestore";

export type MaintenanceRequest = {
  id: string;
  machineId: string;
  customerName: string;
  machineModel: string;
  machineManufacturer: string;
  status: 'Open' | 'In Progress' | 'Closed' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High';
  technician: string;
  createdAt: string; // Should be Timestamp from Firestore, but using string for now
};

export type Customer = {
  id: string;
  name: string;
};

export type PosMachine = {
  id: string;
  serialNumber: string;
  model: string;
  manufacturer: string;
  customerId: string;
};

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
  id: string;
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
