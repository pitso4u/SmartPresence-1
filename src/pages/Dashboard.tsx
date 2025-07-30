import React, { useState, useEffect } from 'react';
import { Users, UserCheck, UserPlus, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import { studentService } from '../services/studentService';
import { employeeService } from '../services/employeeService';
import { visitorService } from '../services/visitorService';
import { incidentService } from '../services/incidentService';
import { attendanceService } from '../services/attendanceService';

interface DashboardStats {
  totalStudents: number;
  totalEmployees: number;
  activeVisitors: number;
  todayIncidents: number;
  todayAttendance: number;
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalEmployees: 0,
    activeVisitors: 0,
    todayIncidents: 0,
    todayAttendance: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [students, employees, visitors, incidents, attendance] = await Promise.all([
          studentService.getAll(),
          employeeService.getAll(),
          visitorService.getAll(),
          incidentService.getAll(),
          attendanceService.getAll()
        ]);

        const today = new Date().toDateString();
        const activeVisitors = visitors.filter(v => !v.exit_time).length;
        const todayIncidents = incidents.filter(i => 
          new Date(i.reported_at).toDateString() === today
        ).length;
        const todayAttendance = attendance.filter(a => 
          new Date(a.timestamp).toDateString() === today
        ).length;

        setStats({
          totalStudents: students.length,
          totalEmployees: employees.length,
          activeVisitors,
          todayIncidents,
          todayAttendance
        });
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  const statCards = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Total Employees',
      value: stats.totalEmployees,
      icon: UserCheck,
      color: 'bg-green-500',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Active Visitors',
      value: stats.activeVisitors,
      icon: UserPlus,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Today\'s Incidents',
      value: stats.todayIncidents,
      icon: AlertTriangle,
      color: 'bg-red-500',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Today\'s Attendance',
      value: stats.todayAttendance,
      icon: TrendingUp,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50'
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of your school management system</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {statCards.map((card, index) => (
          <div key={index} className={`${card.bgColor} rounded-xl p-6 border border-gray-100`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
              <div className={`${card.color} p-3 rounded-lg`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-blue-500" />
                <span className="font-medium">Add New Student</span>
              </div>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3">
                <UserPlus className="h-5 w-5 text-purple-500" />
                <span className="font-medium">Register Visitor</span>
              </div>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span className="font-medium">Report Incident</span>
              </div>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Database Connection</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Face Recognition</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                Active
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Last Sync</span>
              <span className="text-gray-500 text-sm flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                2 minutes ago
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}