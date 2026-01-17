import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  RefreshCw,
  XCircle,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { 
  getDriverAssignedBookings, 
  getDriverNotifications,
  markDriverNotificationRead,
  updateBookingStatusByDriver,
  acceptBooking,
  rejectBookingByDriver,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DriverLocationTracker } from '@/components/driver/DriverLocationTracker';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface ExtendedBooking extends AssignedBooking {
  driver_response?: string;
}

const DriverDashboard = () => {
  const { user, signOut, hasRole } = useAuth();
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  
  const [bookings, setBookings] = useState<ExtendedBooking[]>([]);
  const [notifications, setNotifications] = useState<DriverNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [updatingBooking, setUpdatingBooking] = useState<string | null>(null);
  const [driverName, setDriverName] = useState<string>('');
  
  // Reject dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [bookingToReject, setBookingToReject] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');

  useEffect(() => {
    if (user && hasRole('driver')) {
      loadData();
      loadDriverName();
      
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

  const loadDriverName = async () => {
    if (!user) return;
    try {
      // First try to get from drivers table
      const { data: driverData } = await supabase
        .from('drivers')
        .select('full_name')
        .eq('id', user.id)
        .single();
      
      if (driverData?.full_name) {
        setDriverName(driverData.full_name);
        return;
      }
      
      // Fallback to profiles table
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      
      if (profileData?.full_name) {
        setDriverName(profileData.full_name);
      }
    } catch (error) {
      console.error('Error loading driver name:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadBookings(), loadNotifications()]);
    setLoading(false);
  };

  const loadBookings = async () => {
    const data = await getDriverAssignedBookings();
    setBookings(data as ExtendedBooking[]);
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

  const handleAcceptBooking = async (bookingId: string) => {
    setUpdatingBooking(bookingId);
    const result = await acceptBooking(bookingId);
    
    if (result.success) {
      toast({
        title: t('driver.bookingAccepted'),
        description: t('driver.customerNotified'),
      });
      loadBookings();
    } else {
      toast({
        title: t('common.error'),
        description: result.error || t('common.error'),
        variant: 'destructive',
      });
    }
    setUpdatingBooking(null);
  };

  const openRejectDialog = (bookingId: string) => {
    setBookingToReject(bookingId);
    setRejectNotes('');
    setRejectDialogOpen(true);
  };

  const handleRejectBooking = async () => {
    if (!bookingToReject) return;
    
    setUpdatingBooking(bookingToReject);
    const result = await rejectBookingByDriver(bookingToReject, rejectNotes);
    
    if (result.success) {
      toast({
        title: t('driver.bookingDeclined'),
        description: t('driver.adminReassign'),
      });
      setRejectDialogOpen(false);
      setBookingToReject(null);
      loadBookings();
    } else {
      toast({
        title: t('common.error'),
        description: result.error || t('common.error'),
        variant: 'destructive',
      });
    }
    setUpdatingBooking(null);
  };

  const handleUpdateStatus = async (bookingId: string, status: 'on_trip' | 'completed') => {
    setUpdatingBooking(bookingId);
    const result = await updateBookingStatusByDriver(bookingId, status);
    
    if (result.success) {
      toast({
        title: t('driver.statusUpdated'),
        description: status === 'on_trip' ? t('driver.onTheWay') : t('driver.tripCompleted'),
      });
      loadBookings();
    } else {
      toast({
        title: t('common.error'),
        description: result.error || t('common.error'),
        variant: 'destructive',
      });
    }
    setUpdatingBooking(null);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/driver-login');
  };

  const getStatusBadge = (status: string, driverResponse?: string) => {
    if (driverResponse === 'pending' && status === 'confirmed') {
      return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600">{t('driver.awaitingYourResponse')}</Badge>;
    }
    
    const config: Record<string, { variant: any; label: string; className?: string }> = {
      pending: { variant: 'secondary', label: t('bookings.statusPending') },
      assigned: { variant: 'secondary', label: t('common.assigned') },
      confirmed: { variant: 'secondary', label: t('bookings.statusConfirmed') },
      accepted: { variant: 'default', label: t('driver.accepted'), className: 'bg-green-600' },
      on_trip: { variant: 'default', label: t('driver.onTrip'), className: 'bg-blue-600' },
      completed: { variant: 'outline', label: t('bookings.statusCompleted') },
    };
    const { variant, label, className } = config[status] || { variant: 'secondary', label: status };
    return <Badge variant={variant} className={className}>{label}</Badge>;
  };

  // FIXED: Properly filter bookings based on status and driver_response
  // Pending = assigned to driver, awaiting their response (status=assigned AND driver_response=pending or null)
  // OR confirmed with driver assigned but no response yet
  const pendingResponse = bookings.filter(b => 
    (b.status === 'assigned' && (b.driver_response === 'pending' || !b.driver_response)) ||
    (b.status === 'confirmed' && b.driver_response === 'pending')
  );
  // Active = driver accepted or on_trip
  const activeBookings = bookings.filter(b => 
    b.status === 'accepted' || 
    b.status === 'on_trip' ||
    (b.driver_response === 'accepted' && b.status !== 'completed')
  );
  const completedBookings = bookings.filter(b => b.status === 'completed');
  
  // Get active booking for location tracking (ID and status)
  const activeBooking = useMemo(() => {
    const onTrip = bookings.find(b => b.status === 'on_trip');
    if (onTrip) return { id: onTrip.id, status: onTrip.status };
    const accepted = bookings.find(b => b.status === 'accepted');
    if (accepted) return { id: accepted.id, status: accepted.status };
    const confirmed = bookings.find(b => b.driver_response === 'accepted' && b.status === 'confirmed');
    if (confirmed) return { id: confirmed.id, status: 'confirmed' };
    return null;
  }, [bookings]);

  return (
    <div className="min-h-screen bg-background">
      {/* Driver-specific header - no customer navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className={cn("container mx-auto px-4 h-16 flex items-center justify-between", isRTL && "flex-row-reverse")}>
          <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
            <Car className="h-8 w-8 text-primary" />
            <div>
              <span className="text-xl font-bold">{t('driver.portal')}</span>
              {driverName && (
                <p className="text-sm text-muted-foreground">{driverName}</p>
              )}
            </div>
          </div>
          
          <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
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
                  <SheetTitle>{t('driver.notifications')}</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-100px)] mt-4">
                  {notifications.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">{t('driver.noNotifications')}</p>
                  ) : (
                    <div className="space-y-3">
                      {notifications.map((notification) => (
                        <Card 
                          key={notification.id} 
                          className={`cursor-pointer transition-colors ${!notification.is_read ? 'bg-primary/5 border-primary/20' : ''}`}
                          onClick={() => !notification.is_read && handleMarkRead(notification.id)}
                        >
                          <CardContent className="p-3">
                            <div className={cn("flex items-start justify-between gap-2", isRTL && "flex-row-reverse")}>
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
              <LogOut className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
              {t('driver.signOut')}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-24 pb-12">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            {driverName ? t('driver.welcomeNamed', { name: driverName }) : t('driver.welcomeDriver')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {pendingResponse.length > 0 
              ? t('driver.pendingBookings', { count: pendingResponse.length })
              : t('driver.activeAssignments', { count: activeBookings.length })
            }
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card className={pendingResponse.length > 0 ? 'border-yellow-500/50 bg-yellow-500/5' : ''}>
            <CardContent className="pt-6">
              <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
                <div className={`p-3 rounded-full ${pendingResponse.length > 0 ? 'bg-yellow-500/20' : 'bg-muted'}`}>
                  <Bell className={`h-6 w-6 ${pendingResponse.length > 0 ? 'text-yellow-600' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingResponse.length}</p>
                  <p className="text-sm text-muted-foreground">{t('driver.awaitingResponse')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
                <div className="p-3 rounded-full bg-green-500/10">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{bookings.filter(b => b.status === 'accepted').length}</p>
                  <p className="text-sm text-muted-foreground">{t('driver.accepted')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
                <div className="p-3 rounded-full bg-blue-500/10">
                  <Car className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{bookings.filter(b => b.status === 'on_trip').length}</p>
                  <p className="text-sm text-muted-foreground">{t('driver.onTrip')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
                <div className="p-3 rounded-full bg-primary/10">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{completedBookings.length}</p>
                  <p className="text-sm text-muted-foreground">{t('driver.completedToday')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Location Tracker */}
        <div className="mb-6">
          <DriverLocationTracker 
            activeBookingId={activeBooking?.id} 
            bookingStatus={activeBooking?.status}
          />
        </div>

        {/* Pending Response Section */}
        {pendingResponse.length > 0 && (
          <Card className="mb-6 border-yellow-500/50">
            <CardHeader className="bg-yellow-500/5">
              <CardTitle className={cn("flex items-center gap-2 text-yellow-700", isRTL && "flex-row-reverse")}>
                <Bell className="h-5 w-5" />
                {t('driver.newAssignments')}
              </CardTitle>
              <CardDescription>{t('driver.acceptOrDecline')}</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                {pendingResponse.map((booking) => (
                  <Card key={booking.id} className={cn("border-l-4 border-l-yellow-500", isRTL && "border-l-0 border-r-4 border-r-yellow-500")}>
                    <CardContent className="p-4">
                      <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-4", isRTL && "md:flex-row-reverse")}>
                        <div className="space-y-2">
                          <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                            <Badge variant="outline">{booking.service_type}</Badge>
                            {getStatusBadge(booking.status, booking.driver_response)}
                          </div>
                          
                          <div className={cn("flex items-center gap-2 text-sm", isRTL && "flex-row-reverse")}>
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{String(booking.user_info?.fullName || t('driver.customer'))}</span>
                          </div>
                          
                          {booking.user_info?.phone && (
                            <div className={cn("flex items-center gap-2 text-sm", isRTL && "flex-row-reverse")}>
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span>{String(booking.user_info.phone)}</span>
                            </div>
                          )}
                          
                          {booking.service_details?.pickupLocation && (
                            <div className={cn("flex items-center gap-2 text-sm", isRTL && "flex-row-reverse")}>
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>{String(booking.service_details.pickupLocation)}</span>
                              {booking.service_details?.dropoffLocation && (
                                <>
                                  <span className="text-muted-foreground">{isRTL ? '←' : '→'}</span>
                                  <span>{String(booking.service_details.dropoffLocation)}</span>
                                </>
                              )}
                            </div>
                          )}
                          
                          {booking.service_details?.travelDate && (
                            <div className={cn("flex items-center gap-2 text-sm", isRTL && "flex-row-reverse")}>
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>{String(booking.service_details.travelDate)}</span>
                              {booking.service_details?.travelTime && (
                                <span className="text-muted-foreground">{t('driver.at')} {String(booking.service_details.travelTime)}</span>
                              )}
                            </div>
                          )}
                          
                          {booking.total_price && (
                            <div className={cn("flex items-center gap-2 text-sm", isRTL && "flex-row-reverse")}>
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span className="font-semibold">${booking.total_price.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className={cn("flex gap-2", isRTL && "flex-row-reverse")}>
                          <Button 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleAcceptBooking(booking.id)}
                            disabled={updatingBooking === booking.id}
                          >
                            <ThumbsUp className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                            {t('driver.accept')}
                          </Button>
                          <Button 
                            variant="destructive"
                            onClick={() => openRejectDialog(booking.id)}
                            disabled={updatingBooking === booking.id}
                          >
                            <ThumbsDown className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                            {t('driver.decline')}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Trips */}
        {activeBookings.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <Car className="h-5 w-5 text-primary" />
                {t('driver.activeTrips')}
              </CardTitle>
              <CardDescription>{t('driver.manageAssignments')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeBookings.map((booking) => (
                  <Card key={booking.id} className={cn("border-l-4 border-l-primary", isRTL && "border-l-0 border-r-4 border-r-primary")}>
                    <CardContent className="p-4">
                      <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-4", isRTL && "md:flex-row-reverse")}>
                        <div className="space-y-2">
                          <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                            <Badge variant="outline">{booking.service_type}</Badge>
                            {getStatusBadge(booking.status)}
                          </div>
                          
                          <div className={cn("flex items-center gap-2 text-sm", isRTL && "flex-row-reverse")}>
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{String(booking.user_info?.fullName || t('driver.customer'))}</span>
                          </div>
                          
                          {booking.user_info?.phone && (
                            <div className={cn("flex items-center gap-2 text-sm", isRTL && "flex-row-reverse")}>
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <a href={`tel:${String(booking.user_info.phone)}`} className="text-primary hover:underline">
                                {String(booking.user_info.phone)}
                              </a>
                            </div>
                          )}
                          
                          {booking.service_details?.pickupLocation && (
                            <div className={cn("flex items-center gap-2 text-sm", isRTL && "flex-row-reverse")}>
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>{String(booking.service_details.pickupLocation)}</span>
                              {booking.service_details?.dropoffLocation && (
                                <>
                                  <span className="text-muted-foreground">{isRTL ? '←' : '→'}</span>
                                  <span>{String(booking.service_details.dropoffLocation)}</span>
                                </>
                              )}
                            </div>
                          )}
                          
                          {booking.total_price && (
                            <div className={cn("flex items-center gap-2 text-sm", isRTL && "flex-row-reverse")}>
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span className="font-semibold">${booking.total_price.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className={cn("flex gap-2", isRTL && "flex-row-reverse")}>
                          {booking.status === 'accepted' && (
                            <Button 
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => handleUpdateStatus(booking.id, 'on_trip')}
                              disabled={updatingBooking === booking.id}
                            >
                              <NavigationIcon className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                              {t('driver.startTrip')}
                            </Button>
                          )}
                          {booking.status === 'on_trip' && (
                            <Button 
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleUpdateStatus(booking.id, 'completed')}
                              disabled={updatingBooking === booking.id}
                            >
                              <CheckCircle className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                              {t('driver.completeTrip')}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Bookings Message */}
        {bookings.length === 0 && !loading && (
          <Card>
            <CardContent className="py-12 text-center">
              <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('driver.noActiveAssignments')}</h3>
              <p className="text-muted-foreground">
                {t('driver.noAssignmentsMessage')}
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('driverDialog.declineBooking')}</DialogTitle>
            <DialogDescription>
              {t('driverDialog.declineDescription')}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder={t('driverDialog.reasonPlaceholder')}
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
            rows={3}
          />
          <DialogFooter className={cn(isRTL && "flex-row-reverse")}>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              {t('driverDialog.cancel')}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRejectBooking}
              disabled={updatingBooking === bookingToReject}
            >
              {t('driverDialog.declineButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DriverDashboard;
