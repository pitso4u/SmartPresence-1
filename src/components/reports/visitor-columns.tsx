import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Building2, CalendarDays, Clock, User } from "lucide-react";

export type VisitorReport = {
  id: string;
  fullName: string;
  contactNumber: string;
  email: string;
  purpose: string;
  visitDate: string;
  checkInTime: string;
  checkOutTime: string | null;
  employeeName: string | null;
  employeeDepartment: string | null;
  status: 'checked-in' | 'checked-out';
};

export const columns: ColumnDef<VisitorReport>[] = [
  {
    accessorKey: "fullName",
    header: "Visitor Name",
    cell: ({ row }) => {
      return (
        <div className="flex items-center">
          <User className="mr-2 h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.getValue("fullName")}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "contactNumber",
    header: "Contact",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "purpose",
    header: "Purpose",
    cell: ({ row }) => {
      const purpose = row.getValue("purpose") as string;
      return <div className="max-w-[200px] truncate">{purpose}</div>;
    },
  },
  {
    accessorKey: "visitDate",
    header: "Visit Date",
    cell: ({ row }) => {
      const date = row.getValue("visitDate") as string;
      return (
        <div className="flex items-center">
          <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>{format(new Date(date), 'PP')}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "checkInTime",
    header: "Check-in Time",
    cell: ({ row }) => {
      const time = row.getValue("checkInTime") as string;
      return (
        <div className="flex items-center">
          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>{format(new Date(time), 'p')}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "checkOutTime",
    header: "Check-out Time",
    cell: ({ row }) => {
      const time = row.getValue("checkOutTime") as string | null;
      return time ? (
        <div className="flex items-center">
          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>{format(new Date(time), 'p')}</span>
        </div>
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    },
  },
  {
    accessorKey: "employeeName",
    header: "Employee Visited",
    cell: ({ row }) => {
      const employeeName = row.getValue("employeeName") as string | null;
      const department = row.getValue("employeeDepartment") as string | null;
      
      if (!employeeName) return <span className="text-muted-foreground">-</span>;
      
      return (
        <div>
          <div className="font-medium">{employeeName}</div>
          {department && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Building2 className="mr-1 h-3 w-3" />
              {department}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          status === 'checked-in' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-blue-100 text-blue-800'
        }`}>
          {status === 'checked-in' ? 'Checked In' : 'Checked Out'}
        </div>
      );
    },
  },
];
