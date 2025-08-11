import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";

export type IdCardReport = {
  id: string;
  cardNumber: string;
  userId: string;
  userType: 'student' | 'employee';
  userName: string;
  issueDate: string;
  expiryDate: string;
  status: 'active' | 'inactive' | 'lost' | 'stolen' | 'expired';
  lastUsed: string | null;
};

export const columns: ColumnDef<IdCardReport>[] = [
  {
    accessorKey: "cardNumber",
    header: "Card Number",
    cell: ({ row }) => {
      const cardNumber = row.getValue("cardNumber") as string;
      const status = row.getValue("status") as string;
      
      return (
        <div>
          <div className="font-mono font-medium">{cardNumber}</div>
          <div className="text-xs text-muted-foreground">
            {status === 'active' ? 'Active' : 
             status === 'inactive' ? 'Inactive' : 
             status === 'lost' ? 'Lost' : 
             status === 'stolen' ? 'Stolen' : 'Expired'}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "userName",
    header: "Card Holder",
    cell: ({ row }) => {
      const userName = row.getValue("userName") as string;
      const userType = row.getValue("userType") as string;
      
      return (
        <div>
          <div className="font-medium">{userName}</div>
          <div className="text-xs text-muted-foreground capitalize">
            {userType}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "issueDate",
    header: "Issue Date",
    cell: ({ row }) => {
      const date = row.getValue("issueDate") as string;
      return format(new Date(date), 'PP');
    },
  },
  {
    accessorKey: "expiryDate",
    header: "Expiry Date",
    cell: ({ row }) => {
      const date = row.getValue("expiryDate") as string;
      const isExpired = new Date(date) < new Date();
      
      return (
        <div className={isExpired ? 'text-red-600 font-medium' : ''}>
          {format(new Date(date), 'PP')}
        </div>
      );
    },
  },
  {
    accessorKey: "lastUsed",
    header: "Last Used",
    cell: ({ row }) => {
      const lastUsed = row.getValue("lastUsed") as string | null;
      return lastUsed ? format(new Date(lastUsed), 'PPp') : 'Never';
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const statusMap = {
        active: { 
          bg: 'bg-green-100 text-green-800', 
          icon: CheckCircle2, 
          label: 'Active' 
        },
        inactive: { 
          bg: 'bg-gray-100 text-gray-800', 
          icon: Clock, 
          label: 'Inactive' 
        },
        lost: { 
          bg: 'bg-amber-100 text-amber-800', 
          icon: AlertCircle, 
          label: 'Lost' 
        },
        stolen: { 
          bg: 'bg-red-100 text-red-800', 
          icon: XCircle, 
          label: 'Stolen' 
        },
        expired: { 
          bg: 'bg-gray-100 text-gray-800', 
          icon: XCircle, 
          label: 'Expired' 
        },
      };
      
      const { bg, icon: Icon, label } = statusMap[status as keyof typeof statusMap] || 
        { bg: 'bg-gray-100 text-gray-800', icon: Clock, label: 'Unknown' };
      
      return (
        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg}`}>
          <Icon className="mr-1 h-3 w-3" />
          {label}
        </div>
      );
    },
  },
];
