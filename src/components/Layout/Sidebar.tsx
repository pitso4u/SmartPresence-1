import { NavLink } from 'react-router-dom';
import { 
  Users, 
  UserCheck, 
  UserPlus, 
  ClipboardList, 
  AlertTriangle, 
  CreditCard,
  LayoutDashboard,
  FileText,
  Settings as SettingsIcon
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Students', href: '/students', icon: Users },
  { name: 'Employees', href: '/employees', icon: UserCheck },
  { name: 'Visitors', href: '/visitors', icon: UserPlus },
  { name: 'Attendance', href: '/attendance', icon: ClipboardList },
  { name: 'Incidents', href: '/incidents', icon: AlertTriangle },
  { name: 'ID Cards', href: '/cards', icon: CreditCard },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Settings', href: '/settings', icon: SettingsIcon },
];

export function Sidebar() {
  return (
    <div className="bg-gray-900 text-white w-64 min-h-screen p-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-blue-400">SmartPresence</h1>
        <p className="text-gray-400 text-sm">School Management System</p>
      </div>
      
      <nav className="space-y-2">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}