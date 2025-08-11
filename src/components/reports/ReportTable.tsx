import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ReportData, ReportTableProps } from './ReportTypes';
import { format } from 'date-fns';

export function ReportTable({ data, isLoading, onRowClick }: ReportTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 w-full bg-gray-100 rounded animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No records found</p>
      </div>
    );
  }

  const formatDate = (date: string | Date) => {
    try {
      return format(new Date(date), 'MMM d, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };

  const formatTime = (time: string | Date | null | undefined) => {
    if (!time) return 'N/A';
    try {
      return format(new Date(time), 'h:mm a');
    } catch (e) {
      return 'Invalid time';
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      present: 'bg-green-100 text-green-800',
      absent: 'bg-red-100 text-red-800',
      late: 'bg-yellow-100 text-yellow-800',
      excused: 'bg-blue-100 text-blue-800',
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          statusMap[status.toLowerCase()] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Time In</TableHead>
            <TableHead>Time Out</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow 
              key={`${item.id}-${item.date}`} 
              className={onRowClick ? 'cursor-pointer hover:bg-accent' : ''}
              onClick={() => onRowClick?.(item.id)}
            >
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell className="capitalize">{item.type}</TableCell>
              <TableCell>{formatDate(item.date)}</TableCell>
              <TableCell>{formatTime(item.timeIn)}</TableCell>
              <TableCell>{formatTime(item.timeOut)}</TableCell>
              <TableCell>{getStatusBadge(item.status)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
