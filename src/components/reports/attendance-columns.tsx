import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

export type AttendanceReport = {
  id: string;
  date: string;
  userType: 'student' | 'employee';
  status: 'present' | 'late' | 'absent';
  count: number;
};

export const columns: ColumnDef<AttendanceReport>[] = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      const date = row.getValue("date") as string;
      return <div>{format(new Date(date), 'PP')}</div>;
    },
  },
  {
    accessorKey: "userType",
    header: "User Type",
    cell: ({ row }) => {
      const userType = row.getValue("userType") as string;
      return <div className="capitalize">{userType}</div>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      
      if (status === 'present') {
        return (
          <div className="flex items-center">
            <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
            <span className="capitalize">{status}</span>
          </div>
        );
      } else if (status === 'late') {
        return (
          <div className="flex items-center">
            <Clock className="mr-2 h-4 w-4 text-amber-500" />
            <span className="capitalize">{status}</span>
          </div>
        );
      } else {
        return (
          <div className="flex items-center">
            <XCircle className="mr-2 h-4 w-4 text-red-500" />
            <span className="capitalize">{status}</span>
          </div>
        );
      }
    },
  },
  {
    accessorKey: "count",
    header: "Count",
    cell: ({ row }) => {
      const count = parseInt(row.getValue("count") as string);
      return <div className="font-medium">{count}</div>;
    },
  },
];
