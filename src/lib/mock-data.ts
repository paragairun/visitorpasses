export interface Vehicle {
  id: string;
  flat_number: string;
  wing: string;
  vehicle_number: string;
  vehicle_type: 'car' | 'bike' | 'scooty';
  owner_name: string;
  qr_code: string;
}

export interface VisitorRequest {
  id: string;
  visitor_name: string;
  phone: string;
  vehicle_number: string;
  purpose: string;
  flat_number: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface EntryLog {
  id: string;
  vehicle_number: string;
  flat_number: string;
  wing: string;
  entry_type: 'resident' | 'visitor';
  entry_time: string;
  exit_time: string | null;
  owner_name: string;
}

export const mockVehicles: Vehicle[] = [
  { id: '1', flat_number: '101', wing: 'A', vehicle_number: 'MH02AB1234', vehicle_type: 'car', owner_name: 'Rajesh Sharma', qr_code: 'RES-7F3K9M2Q8X1P' },
  { id: '2', flat_number: '202', wing: 'B', vehicle_number: 'MH02CD5678', vehicle_type: 'bike', owner_name: 'Priya Patel', qr_code: 'RES-4N8T1V6L0Q2R' },
  { id: '3', flat_number: '305', wing: 'A', vehicle_number: 'MH02EF9012', vehicle_type: 'car', owner_name: 'Amit Kumar', qr_code: 'RES-9P2D5H7K3W8M' },
  { id: '4', flat_number: '410', wing: 'C', vehicle_number: 'MH02GH3456', vehicle_type: 'scooty', owner_name: 'Sunita Devi', qr_code: 'RES-2X6B9J4N1C7T' },
];

export const mockVisitorRequests: VisitorRequest[] = [
  { id: '1', visitor_name: 'Vikram Singh', phone: '9876543210', vehicle_number: 'MH04XY7890', purpose: 'Delivery', flat_number: 'A-101', status: 'pending', created_at: new Date().toISOString() },
  { id: '2', visitor_name: 'Meera Joshi', phone: '9123456789', vehicle_number: 'MH01ZZ1234', purpose: 'Guest Visit', flat_number: 'B-202', status: 'pending', created_at: new Date(Date.now() - 600000).toISOString() },
];

export const mockEntryLogs: EntryLog[] = [
  { id: '1', vehicle_number: 'MH02AB1234', flat_number: '101', wing: 'A', entry_type: 'resident', entry_time: new Date(Date.now() - 3600000).toISOString(), exit_time: null, owner_name: 'Rajesh Sharma' },
  { id: '2', vehicle_number: 'MH02CD5678', flat_number: '202', wing: 'B', entry_type: 'resident', entry_time: new Date(Date.now() - 7200000).toISOString(), exit_time: null, owner_name: 'Priya Patel' },
  { id: '3', vehicle_number: 'MH04AA5555', flat_number: '305', wing: 'A', entry_type: 'visitor', entry_time: new Date(Date.now() - 1800000).toISOString(), exit_time: null, owner_name: 'Delivery - Amazon' },
];
