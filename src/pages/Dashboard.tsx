import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserCheck, UserPlus, AlertTriangle, Clock, FileText, UserCog, BarChart2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import reportService from '../services/reportService';
import apiClient from '@/config/api';

interface ReportSummaryData {
  total?: {
    students?: number;
    employees?: number;
    visitors?: number;
    openIncidents?: number;
    attendance?: number;
  };
  byType?: {
    students?: number;
    employees?: number;
    visitors?: number;
    attendance?: number;
  };
  recent?: Array<{
    id: string | number;
    type: string;
    title: string;
    date: string;
  }>;
}

interface DashboardStats {
  totalStudents: number;
  totalEmployees: number;
  activeVisitors: number;
  todayIncidents: number;
  todayAttendance: number;
}

interface SystemStats {
  dbStatus: 'connected' | 'disconnected' | 'error';
  lastSync: Date;
  serverUptime: number; // in minutes
  activeUsers: number;
  systemLoad: number; // percentage
}

interface ReportItem {
  id: string | number;
  type: string;
  title: string;
  date: string;
}

export function Dashboard() {
  const navigate = useNavigate();
  
  // State for dashboard data
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalEmployees: 0,
    activeVisitors: 0,
    todayIncidents: 0,
    todayAttendance: 0
  });
  
  const [recentReports, setRecentReports] = useState<ReportItem[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats>({
    dbStatus: 'connected',
    lastSync: new Date(),
    serverUptime: 0,
    activeUsers: 0,
    systemLoad: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper functions for system stats
  const formatUptime = useCallback((minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m`;
    } else {
      const days = Math.floor(minutes / 1440);
      const hours = Math.floor((minutes % 1440) / 60);
      return `${days}d ${hours}h`;
    }
  }, []);

  const formatLastSync = useCallback((date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  }, []);

  const getStatusColor = useCallback((status: string): string => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'disconnected':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const getLoadColor = useCallback((load: number): string => {
    if (load < 30) return 'bg-green-100 text-green-800';
    if (load < 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  }, []);

  const loadSystemStats = useCallback(async (): Promise<void> => {
    try {
      console.log('Fetching system status...');
      const response = await apiClient.get<{
        database?: { status: 'connected' | 'disconnected' | 'error' };
        lastSync?: string;
        uptime?: number;
        activeUsers?: number;
        systemLoad?: number;
      }>('/system/status');
      
      if (response && response.data) {
        console.log('System status response:', response.data);
        
        // Ensure dbStatus is one of the allowed values
        const dbStatus = ['connected', 'disconnected', 'error'].includes(response.data.database?.status || '')
          ? (response.data.database?.status as 'connected' | 'disconnected' | 'error')
          : 'error';

        setSystemStats({
          dbStatus,
          lastSync: response.data.lastSync ? new Date(response.data.lastSync) : new Date(),
          serverUptime: response.data.uptime || 0,
          activeUsers: response.data.activeUsers || 0,
          systemLoad: response.data.systemLoad || 0
        });
      } else {
        console.warn('Empty or invalid response from /system/status');
        throw new Error('No data in response');
      }
    } catch (error) {
      console.error('Failed to load system stats:', error);
      // Set default values without any mock data
      setSystemStats({
        dbStatus: 'error',
        lastSync: new Date(),
        serverUptime: 0,
        activeUsers: 0,
        systemLoad: 0
      });
      
      // Don't show error to user for system stats as it's not critical
      // The UI will show the error state through the system status indicator
    }
  }, []);

  const loadDashboardStats = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Fetching reports summary...');
      const response = await reportService.getAll();
      
      if (!response) {
        throw new Error('Empty response from server');
      }
      
      console.log('API Response:', JSON.stringify(response, null, 2));
      
      // The backend returns the data directly, not wrapped in a 'data' property
      const responseData = response as ReportSummaryData;
      
      if (!responseData) {
        throw new Error('No data in response');
      }
      
      try {
        // Map the API response to our stats state with fallbacks
        const statsData: DashboardStats = {
          totalStudents: Number(responseData.byType?.students ?? responseData.total?.students ?? 0),
          totalEmployees: Number(responseData.byType?.employees ?? responseData.total?.employees ?? 0),
          activeVisitors: Number(responseData.byType?.visitors ?? responseData.total?.visitors ?? 0),
          todayIncidents: Number(responseData.total?.openIncidents ?? 0),
          todayAttendance: Number(responseData.byType?.attendance ?? responseData.total?.attendance ?? 0)
        };
        
        console.log('Mapped stats data:', statsData);
        
        setStats(statsData);
        setRecentReports(Array.isArray(responseData.recent) ? responseData.recent : []);
      } catch (mappingError) {
        console.error('Error mapping API response:', mappingError);
        throw new Error('Failed to process server response');
      }
    } catch (err) {
      const error = err as Error;
      console.error('Error loading dashboard stats:', error);
      
      // Don't show technical errors to the user
      const userFriendlyError = error.message.includes('Failed to fetch') 
        ? 'Unable to connect to the server. Please check your connection.'
        : 'Failed to load dashboard data. Please try again later.';
        
      setError(userFriendlyError);
      setError(`Failed to load dashboard data: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardStats();
    loadSystemStats();
    
    // Auto-refresh system stats every 60 seconds
    const interval = setInterval(loadSystemStats, 60000);
    
    return () => clearInterval(interval);
  }, [loadDashboardStats, loadSystemStats]);

  // Render loading state
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                </CardTitle>
                <div className="h-6 w-6 rounded-full bg-gray-200 animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                <div className="mt-2 h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={loadDashboardStats}
                  className="rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main dashboard content
  return (
    <div className="container mx-auto py-6 px-4">
      {/* Main content container */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Dashboard Overview
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back! Here's what's happening with your school today.          
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadDashboardStats} 
            disabled={isLoading}
            className="flex items-center gap-2 bg-background/50 backdrop-blur-sm"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </div>
      </div>

      {/* Stats Grid - Top Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* System Status Card */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">System Status</CardTitle>
            <div className="p-2 rounded-lg bg-blue-100">
              <BarChart2 className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-block w-2 h-2 rounded-full ${
                systemStats.dbStatus === 'connected' ? 'bg-green-500' : 
                systemStats.dbStatus === 'disconnected' ? 'bg-yellow-500' : 'bg-red-500'
              }`}></span>
              <span className="text-sm font-medium">
                {systemStats.dbStatus === 'connected' ? 'All Systems Operational' : 
                 systemStats.dbStatus === 'disconnected' ? 'Partial Outage' : 'System Error'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Uptime: {formatUptime(systemStats.serverUptime)} • Load: {systemStats.systemLoad}%
            </p>
          </CardContent>
        </Card>

        {/* Students Card */}
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-l-4 border-emerald-500 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800">Total Students</CardTitle>
            <div className="p-2 rounded-lg bg-emerald-100">
              <Users className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              {stats.todayAttendance > 0 ? `${stats.todayAttendance} present today` : 'No attendance data'}
            </p>
          </CardContent>
        </Card>

        {/* Employees Card */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Staff Members</CardTitle>
            <div className="p-2 rounded-lg bg-purple-100">
              <UserCog className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalStudents > 0 ? `${Math.round((stats.totalEmployees / stats.totalStudents) * 100)}% of students` : 'Staff members'}
            </p>
          </CardContent>
        </Card>

        {/* Visitors Card */}
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-l-4 border-amber-500 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-800">Active Visitors</CardTitle>
            <div className="p-2 rounded-lg bg-amber-100">
              <UserPlus className="h-5 w-5 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeVisitors}</div>
            <p className="text-xs text-muted-foreground">
              Currently on site • {formatLastSync(systemStats.lastSync)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Second Row of Cards */}
      <div className="grid gap-4 mt-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Incidents Card */}
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-red-500 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Today's Incidents</CardTitle>
            <div className="p-2 rounded-lg bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayIncidents}</div>
            <p className="text-xs text-muted-foreground">
              {stats.todayIncidents === 0 ? 'No incidents reported today' : 'Reported today'}
            </p>
          </CardContent>
        </Card>

        {/* Attendance Overview Card */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Today's Attendance</CardTitle>
            <div className="p-2 rounded-lg bg-green-100">
              <UserCheck className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayAttendance}</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${Math.min(100, (stats.todayAttendance / (stats.totalStudents + stats.totalEmployees)) * 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalStudents + stats.totalEmployees > 0 ? 
                `${Math.round((stats.todayAttendance / (stats.totalStudents + stats.totalEmployees)) * 100)}% of community` : 
                'No attendance data'}
            </p>
          </CardContent>
        </Card>

        {/* Attendance Overview Card - Keeping this card */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Attendance Rate</CardTitle>
            <div className="p-2 rounded-lg bg-green-100">
              <UserCheck className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalStudents > 0 ? Math.round((stats.todayAttendance / stats.totalStudents) * 100) : '0'}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalStudents > 0 ? `${stats.todayAttendance} of ${stats.totalStudents} students` : 'No attendance data'}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Reports</h2>
          <button
            onClick={() => navigate('/reports')}
            className="text-sm font-medium text-primary hover:underline"
          >
            View All
          </button>
        </div>
        
        {recentReports.length > 0 ? (
          <div className="space-y-4">
            {recentReports.slice(0, 5).map((report) => (
              <Card key={`${report.id}-${report.type}`} className="hover:bg-gray-50 transition-colors">
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{report.title}</h3>
                      <p className="text-sm text-gray-500">
                        {report.type} • {new Date(report.date).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/reports/${report.id}`)}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      View
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            No recent reports available
          </div>
        )}
      </div>

      {/* System Status Grid */}
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* System Health Card */}
        <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-t-4 border-teal-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-teal-800">System Health</CardTitle>
            <div className={`p-2 rounded-lg ${systemStats.dbStatus === 'connected' ? 'bg-teal-100' : 'bg-red-100'}`}>
              <div className={`h-3 w-3 rounded-full ${systemStats.dbStatus === 'connected' ? 'bg-teal-500' : 'bg-red-500'}`}></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{systemStats.dbStatus}</div>
            <p className="text-xs text-muted-foreground">
              Last sync: {formatLastSync(systemStats.lastSync)}
            </p>
          </CardContent>
        </Card>

        {/* Server Uptime Card */}
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-t-4 border-amber-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-800">Server Uptime</CardTitle>
            <div className="p-2 rounded-lg bg-amber-100">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatUptime(systemStats.serverUptime)}</div>
            <p className="text-xs text-muted-foreground">
              {systemStats.activeUsers} active users
            </p>
          </CardContent>
        </Card>

        {/* System Load Card */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-t-4 border-blue-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">System Load</CardTitle>
            <div className="p-2 rounded-lg bg-blue-100">
              <div className="text-sm font-medium text-blue-600">{systemStats.systemLoad}%</div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full ${
                  systemStats.systemLoad > 80 ? 'bg-red-500' : 
                  systemStats.systemLoad > 50 ? 'bg-amber-500' : 'bg-green-500'
                }`}
                style={{ width: `${systemStats.systemLoad}%` }}
              ></div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {systemStats.systemLoad < 50 ? 'Optimal' : systemStats.systemLoad < 80 ? 'Moderate' : 'High'} load
            </p>
          </CardContent>
        </Card>

        {/* Quick Stats Card */}
        <Card className="bg-gradient-to-br from-violet-50 to-violet-100 border-t-4 border-violet-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-violet-800">Quick Stats</CardTitle>
            <div className="p-2 rounded-lg bg-violet-100">
              <BarChart2 className="h-5 w-5 text-violet-600" />
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-muted-foreground">Avg. Daily Visits</p>
              <p className="font-medium">{(stats.activeVisitors * 2.5).toFixed(1)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Incident Rate</p>
              <p className="font-medium">
                {stats.todayIncidents > 0 ? (stats.todayIncidents / 10 * 100).toFixed(1) : '0.0'}%
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Staff:Student</p>
              <p className="font-medium">
                1:{stats.totalStudents > 0 ? Math.round(stats.totalStudents / (stats.totalEmployees || 1)) : '0'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Attendance Rate</p>
              <p className="font-medium">
                {stats.totalStudents > 0 ? Math.round((stats.todayAttendance / stats.totalStudents) * 100) : '0'}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions and Recent Activity */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center mb-4">
            <div className="p-2 rounded-lg bg-indigo-100 mr-3">
              <FileText className="h-5 w-5 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button 
              onClick={() => navigate('/students')}
              className="group text-left p-4 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Add New Student</p>
                  <p className="text-sm text-gray-500">Register a new student record</p>
                </div>
              </div>
            </button>

            <button 
              onClick={() => navigate('/visitors')}
              className="group text-left p-4 rounded-xl border border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                  <UserPlus className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Visitors</p>
                  <p className="text-sm text-gray-500">Manage visitor records</p>
                </div>
              </div>
            </button>

            <button 
              onClick={() => navigate('/incidents')}
              className="group text-left p-4 rounded-xl border border-gray-200 hover:border-red-500 hover:bg-red-50 transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Incidents</p>
                  <p className="text-sm text-gray-500">View and manage incidents</p>
                </div>
              </div>
            </button>

            <button 
              onClick={() => navigate('/employees')}
              className="group text-left p-4 rounded-xl border border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                  <UserCog className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Employees</p>
                  <p className="text-sm text-gray-500">Manage employee records</p>
                </div>
              </div>
            </button>

            <button 
              onClick={() => navigate('/attendance')}
              className="group text-left p-4 rounded-xl border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                  <Clock className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Attendance</p>
                  <p className="text-sm text-gray-500">View and manage attendance</p>
                </div>
              </div>
            </button>

            <button 
              onClick={() => navigate('/reports')}
              className="group text-left p-4 rounded-xl border border-gray-200 hover:border-amber-500 hover:bg-amber-50 transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-100 rounded-lg group-hover:bg-amber-200 transition-colors">
                  <FileText className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Generate Reports</p>
                  <p className="text-sm text-gray-500">Export attendance and logs</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Database Connection</span>
              <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(systemStats.dbStatus)}`}>
                {systemStats.dbStatus === 'connected' ? 'Connected' : 
                 systemStats.dbStatus === 'disconnected' ? 'Disconnected' : 'Error'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Server Uptime</span>
              <span className="text-gray-500 text-sm">
                {formatUptime(systemStats.serverUptime)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Active Users</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                {systemStats.activeUsers}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">System Load</span>
              <span className={`px-2 py-1 text-xs rounded-full font-medium ${getLoadColor(systemStats.systemLoad)}`}>
                {systemStats.systemLoad}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Last Sync</span>
              <span className="text-gray-500 text-sm flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {formatLastSync(systemStats.lastSync)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}