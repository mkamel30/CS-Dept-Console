'use client';

import { createRoot } from 'react-dom/client';
import { MaintenanceRequest } from '@/lib/types';
import { ReportTemplate } from './report-template';

export function generateMaintenanceReport(request: MaintenanceRequest) {
  // Create a new window or an iframe for printing
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Please allow pop-ups to print the report.');
    return;
  }

  // Create a container div in the new window
  const container = printWindow.document.createElement('div');
  printWindow.document.body.appendChild(container);

  // Render the React component into the new window
  const root = createRoot(container);
  root.render(<ReportTemplate request={request} />);

  // Wait for the component to render before printing
  setTimeout(() => {
    printWindow.document.title = `Report-${request.id.substring(0, 6)}`;
    printWindow.print();
    // Optional: close the window after printing
    // setTimeout(() => printWindow.close(), 1000);
  }, 500); // Adjust timeout as needed
}
