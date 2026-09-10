export interface ScanResult {
  code: string;
  type: 'Book' | 'Member' | 'Location' | 'Unknown';
  status: 'Success' | 'NotFound' | 'Invalid';
  data?: any;
}

export interface PrintItem {
  id: string;
  code: string;
  label: string;
  type: 'Book' | 'Member' | 'Location';
}

export interface PrintJob {
  id: string;
  items: PrintItem[];
  status: 'Pending' | 'Printed' | 'Failed';
  createdAt: string;
}
