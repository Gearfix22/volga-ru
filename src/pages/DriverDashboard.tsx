import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Car, 
  LogOut, 
  Calendar, 
  MapPin, 
  Phone, 
  User, 
  Bell, 
  CheckCircle,
  Clock,
  Navigation as NavigationIcon,
  DollarSign,
  RefreshCw
} from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { 
  getDriverAssignedBookings, 
  getDriverNotifications,
  markDriverNotificationRead,
  updateBookingStatusByDriver,
  subscribeToDriverNotifications,
  subscribeToAssignedBookings,
  AssignedBooking,
  DriverNotification
} from '@/services/driverService';
import { useToast } from '@/hooks/use-toast';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

const DriverDashboard = () => {
  const { user, signOut, hasRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [bookings, setBookings] = useState<AssignedBooking[]>([]);
  const [notifications, setNotifications] = useState<DriverNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [updatingBooking, setUpdatingBooking] = useState<string | null>(null);

  useEffect(() => {
    if (user && hasRole('driver')) {
      loadData();
      
      // Subscribe to real-time notifications
      const unsubNotifications = subscribeToDriverNotifications(user.id, (newNotification) => {
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        toast({
          title: newNotification.title,
          description: newNotification.message,
        });
      });
      
      // Subscribe to booking changes
      const unsubBookings = subscribeToAssignedBookings(user.id, () => {
        loadBookings();
      });
      
      return () => {
        unsubNotifications();
        unsubBookings();
      };
    }
  }, [user, hasRole]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadBookings(), loadNotifications()]);
    setLoading(false);
  };

  const loadBookings = async () => {
    const data = await getDriverAssignedBookings();
    setBookings(data);
  };

  const loadNotifications = async () => {
    const data = await getDriverNotifications();
    setNotifications(data);
    setUnreadCount(data.filter(n => !n.is_read).length);
  };

  const handleMarkRead = async (notificationId: string) => {
    const success = await markDriverNotificationRead(notificationId);
    if (success) {
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const handleUpdateStatus = async (bookingId: string, status: 'in_progress' | 'completed') => {
    setUpdatingBooking(bookingId);
    const result = await updateBookingStatusByDriver(bookingId, status);
    
    if (result.success) {
      toast({
        title: 'Status Updated',
        description: `Booking marked as ${status.replace('_', ' ')}`,
      });
      loadBookings();
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to update status',
        variant: 'destructive',
      });
    }
    setUpdatingBooking(null);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth?role=driver');
  };

  // Check if user has driver role
  if (!hasRole('driver')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive">Access denied. Driver privileges required.</p>
            <Button className="mt-4" onClick={() => navigate('/auth?role=driver')}>
              Go to Driver Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: any; label: string }> = {
      pending: { variant: 'secondary', label: 'Pending' },
      confirmed: { variant: 'default', label: 'Confirmed' },
      in_progress: { variant: 'outline', label: 'In Progress' },
      completed: { variant: 'outline', label: 'Completed' },
    };
    const { variant, label } = config[status] || { variant: 'secondary', label: status };
    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-20 pb-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Car className="h-8 w-8 text-primary" />
              Driver Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! You have {bookings.length} active assignment{bookings.length !== 1 ? 's' : ''}.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Notifications</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-100px)] mt-4">
                  {notifications.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No notifications</p>
                  ) : (
                    <div className="space-y-3">
                      {notifications.map((notification) => (
                        <Card 
                          key={notification.id} 
                          className={`cursor-pointer transition-colors ${!notification.is_read ? 'bg-primary/5 border-primary/20' : ''}`}
                          onClick={() => !notification.is_read && handleMarkRead(notification.id)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium text-sm">{notification.title}</p>
                                <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                                <p className="text-xs text-muted-foreground mt-2">
                                  {new Date(notification.created_at).toLocaleString()}
                                </p>
                              </div>
                              {!notification.is_read && (
                                <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </SheetContent>
            </Sheet>
            
            <Button variant="outline" size="icon" onClick={loadData} disabled={loading}>
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{bookings.length}</p>
                  <p className="text-sm text-muted-foreground">Active Assignments</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-500/10">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{bookings.filter(b => b.status === 'confirmed').length}</p>
                  <p className="text-sm text-muted-foreground">Ready to Start</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-orange-500/10">
                  <Clock className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{bookings.filter(b => b.status === 'pending').length}</p>
                  <p className="text-sm text-muted-foreground">Pending Confirmation</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assigned Trips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <NavigationIcon className="h-5 w-5 text-primary" />
              Your Assigned Trips
            </CardTitle>
            <CardDescription>Manage your current bookings and update their status</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading assignments...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-12">
                <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No trips assigned yet.</p>
                <p className="text-sm text-muted-foreground mt-1">You'll be notified when a new trip is assigned to you.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <Card key={booking.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{booking.service_type}</Badge>
                            {getStatusBadge(booking.status)}
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{booking.user_info?.fullName || 'Customer'}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <a 
                              href={`tel:${booking.user_info?.phone}`} 
                              className="text-primary hover:underline font-mono"
                            >
                              {booking.user_info?.phone || 'N/A'}
                            </a>
                          </div>
                          
                          {booking.service_details?.pickupLocation && (
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>{booking.service_details.pickupLocation}</span>
                              {booking.service_details?.dropoffLocation && (
                                <>
                                  <span className="text-muted-foreground">→</span>
                                  <span>{booking.service_details.dropoffLocation}</span>
                                </>
                              )}
                            </div>
                          )}
                          
                          {booking.total_price && (
                            <div className="flex items-center gap-2 text-sm">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span className="font-semibold">${booking.total_price.toFixed(2)}</span>
                            </div>
                          )}
                          
                          {booking.customer_notes && (
                            <p className="text-sm text-muted-foreground italic">
                              "{booking.customer_notes}"
                            </p>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          {booking.status === 'confirmed' && (
                            <Button 
                              onClick={() => handleUpdateStatus(booking.id, 'in_progress')}
                              disabled={updatingBooking === booking.id}
                            >
                              <Car className="h-4 w-4 mr-2" />
                              Start Trip
                            </Button>
                          )}
                          
                          {booking.status === 'in_progress' && (
                            <Button 
                              variant="default"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleUpdateStatus(booking.id, 'completed')}
                              disabled={updatingBooking === booking.id}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Complete Trip
                            </Button>
                          )}
                          
                          <Button variant="outline" asChild>
                            <a href={`https://wa.me/${booking.user_info?.phone?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                              <Phone className="h-4 w-4 mr-2" />
                              Contact Customer
                            </a>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Support */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              Need Help?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Contact dispatch for any questions or issues.
            </p>
            <Button asChild>
              <a href="https://wa.me/79522212903" target="_blank" rel="noopener noreferrer">
                Contact via WhatsApp
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DriverDashboard;
