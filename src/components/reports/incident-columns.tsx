import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { AlertCircle, Check, Clock, X } from "lucide-react";

export type IncidentReport = {
  id: string;
  title: string;
  description: string;
  incidentDate: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  reporterName: string;
  reporterRole: string;
  createdAt: string;
  updatedAt: string;
};

export const columns: ColumnDef<IncidentReport>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => {
      const title = row.getValue("title") as string;
      const description = row.getValue("description") as string;
      return (
        <div>
          <div className="font-medium">{title}</div>
          <div className="text-sm text-muted-foreground line-clamp-1">{description}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "incidentDate",
    header: "Date",
    cell: ({ row }) => {
      const date = row.getValue("incidentDate") as string;
      return format(new Date(date), 'PP');
    },
  },
  {
    accessorKey: "severity",
    header: "Severity",
    cell: ({ row }) => {
      const severity = row.getValue("severity") as string;
      const severityMap = {
        low: { bg: 'bg-blue-100 text-blue-800', label: 'Low' },
        medium: { bg: 'bg-amber-100 text-amber-800', label: 'Medium' },
        high: { bg: 'bg-orange-100 text-orange-800', label: 'High' },
        critical: { bg: 'bg-red-100 text-red-800', label: 'Critical' },
      };
      
      const { bg, label } = severityMap[severity as keyof typeof severityMap] || 
        { bg: 'bg-gray-100 text-gray-800', label: 'Unknown' };
      
      return (
        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg}`}>
          {label}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const statusMap = {
        open: { bg: 'bg-blue-100 text-blue-800', icon: AlertCircle, label: 'Open' },
        'in-progress': { bg: 'bg-amber-100 text-amber-800', icon: Clock, label: 'In Progress' },
        resolved: { bg: 'bg-green-100 text-green-800', icon: Check, label: 'Resolved' },
        closed: { bg: 'bg-gray-100 text-gray-800', icon: X, label: 'Closed' },
      };
      
      const { bg, icon: Icon, label } = statusMap[status as keyof typeof statusMap] || 
        { bg: 'bg-gray-100 text-gray-800', icon: AlertCircle, label: 'Unknown' };
      
      return (
        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg}`}>
          <Icon className="mr-1 h-3 w-3" />
          {label}
        </div>
      );
    },
  },
  {
    accessorKey: "reporterName",
    header: "Reported By",
    cell: ({ row }) => {
      const reporterName = row.getValue("reporterName") as string;
      const reporterRole = row.getValue("reporterRole") as string;
      
      return (
        <div>
          <div className="font-medium">{reporterName}</div>
          <div className="text-xs text-muted-foreground capitalize">{reporterRole}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Reported On",
    cell: ({ row }) => {
      const date = row.getValue("createdAt") as string;
      return format(new Date(date), 'PPp');
    },
  },
  {
    accessorKey: "updatedAt",
    header: "Last Updated",
    cell: ({ row }) => {
      const date = row.getValue("updatedAt") as string;
      return format(new Date(date), 'PPp');
    },
  },
];
