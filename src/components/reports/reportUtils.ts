import { format } from 'date-fns';
import { ReportData } from './ReportTypes';

export const processApiResponse = (data: any): ReportData[] => {
  if (!data || !Array.isArray(data)) return [];
  
  return data.map((item: any) => ({
    id: item.id || '',
    userId: item.userId || '',
    name: item.name || 'Unknown',
    type: item.type || 'unknown',
    date: item.date || new Date().toISOString(),
    timeIn: item.timeIn || new Date().toISOString(),
    timeOut: item.timeOut || null,
    status: item.status || 'unknown',
    ...item // Spread any additional properties
  }));
};

export const generatePdf = async (data: ReportData[], dateRange: { from?: Date; to?: Date }) => {
  try {
    // Dynamically import jsPDF and jspdf-autotable to reduce bundle size
    const { jsPDF } = await import('jspdf');
    // Import autoTable directly
    const autoTable = (await import('jspdf-autotable')).default;
    
    // Create a new PDF document
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text(`Attendance Report - ${format(new Date(), 'MMMM d, yyyy')}`, 14, 22);
    
    // Add date range
    doc.setFontSize(11);
    doc.setTextColor(100);
    
    const fromDate = dateRange?.from ? format(dateRange.from, 'MMM d, yyyy') : 'N/A';
    const toDate = dateRange?.to ? format(dateRange.to, 'MMM d, yyyy') : 'N/A';
    
    doc.text(
      `Date Range: ${fromDate} - ${toDate}`,
      14,
      30
    );
    
    // Define columns
    const columns = [
      'Name',
      'Type',
      'Date',
      'Time In',
      'Time Out',
      'Status'
    ];
    
    // Prepare data
    const rows = data.map(item => [
      item.name,
      item.type,
      format(new Date(item.date), 'MMM d, yyyy'),
      item.timeIn ? format(new Date(item.timeIn), 'h:mm a') : 'N/A',
      item.timeOut ? format(new Date(item.timeOut), 'h:mm a') : 'N/A',
      item.status.charAt(0).toUpperCase() + item.status.slice(1)
    ]);
    
    // Generate table
    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 40,
      styles: { 
        fontSize: 10,
        cellPadding: 3,
        overflow: 'linebreak',
        valign: 'middle' as const
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold' as const,
        halign: 'center' as const
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { top: 40 }
    });
    
    // Save the PDF
    doc.save(`attendance-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
