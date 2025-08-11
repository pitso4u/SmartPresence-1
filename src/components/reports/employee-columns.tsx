import { ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

export type EmployeeReport = {
  id: string;
  fullName: string;
  department: string;
  position: string;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  totalRecords: number;
  attendanceRate: number;
};

export const columns: ColumnDef<EmployeeReport>[] = [
  {
    accessorKey: "fullName",
    header: "Employee Name",
    cell: ({ row }) => {
      return <div className="font-medium">{row.getValue("fullName")}</div>;
    },
  },
  {
    accessorKey: "department",
    header: "Department",
  },
  {
    accessorKey: "position",
    header: "Position",
  },
  {
    accessorKey: "presentCount",
    header: "Present",
    cell: ({ row }) => {
      const count = parseInt(row.getValue("presentCount") as string);
      return (
        <div className="flex items-center">
          <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-green-500" />
          <span>{count}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "lateCount",
    header: "Late",
    cell: ({ row }) => {
      const count = parseInt(row.getValue("lateCount") as string);
      return (
        <div className="flex items-center">
          <Clock className="mr-1 h-3.5 w-3.5 text-amber-500" />
          <span>{count}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "absentCount",
    header: "Absent",
    cell: ({ row }) => {
      const count = parseInt(row.getValue("absentCount") as string);
      return (
        <div className="flex items-center">
          <XCircle className="mr-1 h-3.5 w-3.5 text-red-500" />
          <span>{count}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "totalRecords",
    header: "Total Records",
  },
  {
    accessorKey: "attendanceRate",
    header: "Attendance Rate",
    cell: ({ row }) => {
      const rate = row.getValue("attendanceRate") as number;
      return (
        <div className="flex items-center">
          <div 
            className={`h-2 w-2 rounded-full mr-2 ${
              rate >= 90 ? 'bg-green-500' : 
              rate >= 75 ? 'bg-amber-500' : 'bg-red-500'
            }`} 
          />
          {rate}%
        </div>
      );
    },
  },
];
