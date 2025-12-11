export type MaintenanceRequest = {
  id: string;
  asset: string;
  issue: string;
  status: 'Open' | 'In Progress' | 'Closed' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High';
  technician: string;
  createdDate: string;
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
