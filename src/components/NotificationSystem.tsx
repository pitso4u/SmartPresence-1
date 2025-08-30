import { useState, useEffect, useCallback } from 'react';
import { Bell, X, CheckCircle, AlertTriangle, Info, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import apiClient from '@/config/api';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationSystemProps {
  notifications?: Notification[];
  onNotificationClick?: (notification: Notification) => void;
  onMarkAsRead?: (notificationId: string) => void;
  onClearAll?: () => void;
}

export function NotificationSystem({
  notifications = [],
  onNotificationClick,
  onMarkAsRead,
  onClearAll
}: NotificationSystemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [realNotifications, setRealNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch real notifications from server
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch recent activity data
      const [attendanceLogs, incidents, visitors] = await Promise.all([
        apiClient.get('/attendance?limit=10'),
        apiClient.get('/incidents?limit=5'),
        apiClient.get('/visitors?limit=5')
      ]);

      const notifications: Notification[] = [];

      // Process attendance logs
      const recentAttendance = attendanceLogs.data?.slice(0, 5) || [];
      recentAttendance.forEach((log: any) => {
        const timestamp = new Date(log.timestamp);
        const timeAgo = formatTimeAgo(timestamp);
        
        let type: Notification['type'] = 'success';
        let title = 'Attendance Recorded';
        let message = `${log.user_name || 'Unknown User'} checked in`;
        
        if (log.status === 'late') {
          type = 'warning';
          title = 'Late Arrival';
          message = `${log.user_name || 'Unknown User'} arrived late`;
        } else if (log.status === 'absent') {
          type = 'error';
          title = 'Absence Recorded';
          message = `${log.user_name || 'Unknown User'} marked as absent`;
        }

        notifications.push({
          id: `attendance_${log.id}`,
          type,
          title,
          message,
          timestamp,
          read: false,
          action: {
            label: 'View Details',
            onClick: () => console.log('View attendance details for:', log.id)
          }
        });
      });

      // Process incidents
      const recentIncidents = incidents.data?.slice(0, 3) || [];
      recentIncidents.forEach((incident: any) => {
        const timestamp = new Date(incident.timestamp);
        notifications.push({
          id: `incident_${incident.id}`,
          type: 'error',
          title: 'Incident Reported',
          message: `${incident.type || 'Incident'} reported by ${incident.reported_by || 'Unknown'}`,
          timestamp,
          read: false,
          action: {
            label: 'Review',
            onClick: () => console.log('Review incident:', incident.id)
          }
        });
      });

      // Process visitors
      const recentVisitors = visitors.data?.slice(0, 3) || [];
      recentVisitors.forEach((visitor: any) => {
        const timestamp = new Date(visitor.check_in_time);
        notifications.push({
          id: `visitor_${visitor.id}`,
          type: 'info',
          title: 'Visitor Check-in',
          message: `${visitor.full_name || 'Unknown Visitor'} signed in as visitor`,
          timestamp,
          read: false,
          action: {
            label: 'View Details',
            onClick: () => console.log('View visitor details:', visitor.id)
          }
        });
      });

      // Add system notifications
      const systemNotifications = await generateSystemNotifications();
      notifications.push(...systemNotifications);

      // Sort by timestamp (most recent first)
      notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      setRealNotifications(notifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      // Fallback to mock notifications if API fails
      setRealNotifications(generateMockNotifications());
    } finally {
      setLoading(false);
    }
  }, []);

  const generateSystemNotifications = async (): Promise<Notification[]> => {
    const notifications: Notification[] = [];
    
    try {
      // Check system status
      const systemStatus = await apiClient.get('/system/status');
      
      if (systemStatus.data?.server?.systemLoad > 80) {
        notifications.push({
          id: 'system_high_load',
          type: 'warning',
          title: 'High System Load',
          message: `System load is at ${systemStatus.data.server.systemLoad}%`,
          timestamp: new Date(),
          read: false
        });
      }

      // Check sync status from offline service
      const syncStatus = await getSyncStatus();
      if (syncStatus && syncStatus.pendingItems > 0) {
        notifications.push({
          id: 'sync_pending',
          type: 'info',
          title: 'Data Sync Pending',
          message: `${syncStatus.pendingItems} items waiting to sync`,
          timestamp: new Date(),
          read: false,
          action: {
            label: 'Sync Now',
            onClick: () => console.log('Trigger sync')
          }
        });
      }
    } catch (error) {
      console.error('Failed to generate system notifications:', error);
    }

    return notifications;
  };

  const getSyncStatus = async () => {
    try {
      // This would typically come from the offline sync service
      // For now, return null to avoid errors
      return null;
    } catch (error) {
      return null;
    }
  };

  const generateMockNotifications = (): Notification[] => [
    {
      id: '1',
      type: 'success',
      title: 'Attendance Recorded',
      message: 'John Smith checked in successfully at 8:15 AM',
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      read: false,
      action: {
        label: 'View Details',
        onClick: () => console.log('View attendance details')
      }
    },
    {
      id: '2',
      type: 'warning',
      title: 'Late Arrival',
      message: 'Sarah Johnson arrived 15 minutes late',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      read: false,
      action: {
        label: 'Review',
        onClick: () => console.log('Review late arrival')
      }
    },
    {
      id: '3',
      type: 'info',
      title: 'Visitor Check-in',
      message: 'Alice Cooper signed in as a visitor',
      timestamp: new Date(Date.now() - 8 * 60 * 1000),
      read: true
    },
    {
      id: '4',
      type: 'error',
      title: 'System Alert',
      message: 'Face recognition service temporarily unavailable',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      read: false
    },
    {
      id: '5',
      type: 'success',
      title: 'Attendance Sync Complete',
      message: 'All offline attendance records have been synchronized',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      read: true
    }
  ];

  useEffect(() => {
    fetchNotifications();
    
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const displayNotifications = notifications.length > 0 ? notifications : realNotifications;

  useEffect(() => {
    const unread = displayNotifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  }, [displayNotifications]);

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return timestamp.toLocaleDateString();
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return timestamp.toLocaleDateString();
  };

  const handleNotificationClick = useCallback((notification: Notification) => {
    if (!notification.read && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
    if (notification.action) {
      notification.action.onClick();
    }
  }, [onMarkAsRead, onNotificationClick]);

  const handleMarkAllAsRead = useCallback(() => {
    displayNotifications.forEach(notification => {
      if (!notification.read && onMarkAsRead) {
        onMarkAsRead(notification.id);
      }
    });
  }, [displayNotifications, onMarkAsRead]);

  return (
    <div className="relative">
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        className="relative p-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Notifications</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="text-xs"
                  >
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p>Loading notifications...</p>
                </div>
              ) : displayNotifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {displayNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium ${
                              !notification.read ? 'text-blue-900' : 'text-gray-900'
                            }`}>
                              {notification.title}
                            </p>
                            <span className="text-xs text-gray-500">
                              {formatTimestamp(notification.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          {notification.action && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                              onClick={(e) => {
                                e.stopPropagation();
                                notification.action!.onClick();
                              }}
                            >
                              {notification.action.label}
                            </Button>
                          )}
                        </div>
                        {!notification.read && (
                          <div className="flex-shrink-0">
                            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {displayNotifications.length > 0 && (
              <div className="p-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    if (onClearAll) {
                      onClearAll();
                    }
                    setIsOpen(false);
                  }}
                >
                  Clear All Notifications
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Toast notification component for real-time alerts
export function ToastNotification({ notification }: { notification: Notification }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right">
      <Card className={`border-l-4 ${
        notification.type === 'success' ? 'border-green-500' :
        notification.type === 'warning' ? 'border-yellow-500' :
        notification.type === 'error' ? 'border-red-500' :
        'border-blue-500'
      }`}>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            {getNotificationIcon(notification.type)}
            <div className="flex-1">
              <h4 className="font-medium">{notification.title}</h4>
              <p className="text-sm text-gray-600">{notification.message}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to get notification icon (exported for use in ToastNotification)
function getNotificationIcon(type: Notification['type']) {
  switch (type) {
    case 'success':
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    case 'error':
      return <AlertTriangle className="h-5 w-5 text-red-600" />;
    case 'info':
      return <Info className="h-5 w-5 text-blue-600" />;
    default:
      return <Info className="h-5 w-5 text-gray-600" />;
  }
}
