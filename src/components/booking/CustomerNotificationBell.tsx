import React, { useState, useEffect, useCallback } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { 
  CustomerNotification,
  getUnreadCustomerNotifications,
  markCustomerNotificationAsRead,
  markAllCustomerNotificationsAsRead,
  subscribeToCustomerNotifications,
  getNotificationIcon
} from '@/services/customerNotificationService';
import { formatDistanceToNow } from 'date-fns';

export const CustomerNotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();

  const loadNotifications = useCallback(async () => {
    const data = await getUnreadCustomerNotifications();
    setNotifications(data);
  }, []);

  useEffect(() => {
    loadNotifications();

    // Subscribe to new notifications
    if (user) {
      const unsubscribe = subscribeToCustomerNotifications(user.id, (newNotification) => {
        setNotifications(prev => [newNotification, ...prev]);
      });

      return unsubscribe;
    }
  }, [user, loadNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    await markCustomerNotificationAsRead(notificationId);
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const handleMarkAllAsRead = async () => {
    await markAllCustomerNotificationsAsRead();
    setNotifications([]);
  };

  const handleNotificationClick = async (notification: CustomerNotification) => {
    await handleMarkAsRead(notification.id);
    if (notification.booking_id) {
      // Fixed: Navigate to correct user dashboard route
      navigate(`/user-dashboard?booking=${notification.booking_id}`);
    }
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {notifications.length > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {notifications.length > 9 ? '9+' : notifications.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-80">
        <div className={cn("flex items-center justify-between px-3 py-2 border-b", isRTL && "flex-row-reverse")}>
          <span className="font-semibold">{t('notifications.title')}</span>
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
              <CheckCheck className={cn("h-4 w-4", isRTL ? "ml-1" : "mr-1")} />
              {t('notifications.markAllRead')}
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              {t('notifications.noNew')}
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem 
                key={notification.id}
                className={cn("flex flex-col items-start p-3 cursor-pointer", isRTL && "items-end")}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className={cn("flex items-start gap-2 w-full", isRTL && "flex-row-reverse")}>
                  <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                  <div className={cn("flex-1 min-w-0", isRTL && "text-right")}>
                    <p className="font-medium text-sm">{notification.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsRead(notification.id);
                    }}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
        
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-center text-primary cursor-pointer justify-center"
              onClick={() => {
                navigate('/user-dashboard');
                setIsOpen(false);
              }}
            >
              {t('notifications.viewAll')}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CustomerNotificationBell;
