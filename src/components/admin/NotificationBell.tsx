import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  Notification,
  getUnreadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  subscribeToNotifications,
  getNotificationIcon,
} from '@/services/notificationService';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    loadNotifications();
    
    // Subscribe to real-time notifications
    const unsubscribe = subscribeToNotifications((newNotification) => {
      setNotifications(prev => [newNotification, ...prev]);
      toast({
        title: 'New Notification',
        description: newNotification.message,
      });
    });
    
    return unsubscribe;
  }, []);

  const loadNotifications = async () => {
    const data = await getUnreadNotifications();
    setNotifications(data);
  };

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await markNotificationAsRead(id);
    if (success) {
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    const success = await markAllNotificationsAsRead();
    if (success) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast({
        title: 'All notifications marked as read',
      });
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.booking_id) {
      navigate(`/admin?tab=bookings`);
    }
    markNotificationAsRead(notification.id);
    setNotifications(prev =>
      prev.map(n => (n.id === notification.id ? { ...n, is_read: true } : n))
    );
    setIsOpen(false);
  };

  // Use imported getNotificationIcon from service

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-card border shadow-lg z-50">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleMarkAllAsRead}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex items-start gap-3 p-3 cursor-pointer ${
                  !notification.is_read ? 'bg-primary/5' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <span className="text-lg flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!notification.is_read ? 'font-medium' : ''}`}>
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </p>
                </div>
                {!notification.is_read && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0"
                    onClick={(e) => handleMarkAsRead(notification.id, e)}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                )}
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
