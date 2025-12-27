import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, 
  Clock, 
  Users, 
  Bell, 
  CheckCircle, 
  XCircle, 
  Navigation as NavIcon,
  Phone,
  Globe,
  Calendar,
  Loader2
} from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  getGuideNotifications, 
  getGuideBookings, 
  markGuideNotificationRead,
  updateGuideLocation,
  type GuideNotification 
} from '@/services/guideService';
import { supabase } from '@/integrations/supabase/client';

const GuideDashboard = () => {
  const navigate = useNavigate();
  const { user, hasRole, signOut } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('bookings');
  const [notifications, setNotifications] = useState<GuideNotification[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTracking, setIsTracking] = useState(false);
  const [currentBookingId, setCurrentBookingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth?role=guide');
      return;
    }

    if (!hasRole('guide')) {
      toast({
        title: 'Access Denied',
        description: 'You do not have guide access.',
        variant: 'destructive'
      });
      navigate('/');
      return;
    }

    loadData();
  }, [user, hasRole]);

  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [notifs, bkgs] = await Promise.all([
        getGuideNotifications(user.id),
        getGuideBookings(user.id)
      ]);
      setNotifications(notifs);
      setBookings(bkgs);
    } catch (error) {
      console.error('Error loading guide data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptBooking = async (bookingId: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ 
        status: 'accepted',
        driver_response: 'accepted',
        driver_response_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to accept booking',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Booking Accepted',
        description: 'You have accepted this tour booking.'
      });
      loadData();
    }
  };

  const handleRejectBooking = async (bookingId: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ 
        status: 'pending',
        assigned_guide_id: null,
        driver_response: 'rejected',
        driver_response_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject booking',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Booking Rejected',
        description: 'The booking has been returned to the queue.'
      });
      loadData();
    }
  };

  const handleStartTour = async (bookingId: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'on_trip' })
      .eq('id', bookingId);

    if (!error) {
      setCurrentBookingId(bookingId);
      startLocationTracking(bookingId);
      toast({
        title: 'Tour Started',
        description: 'Location tracking is now active.'
      });
      loadData();
    }
  };

  const handleCompleteTour = async (bookingId: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'completed' })
      .eq('id', bookingId);

    if (!error) {
      stopLocationTracking();
      toast({
        title: 'Tour Completed',
        description: 'Thank you for completing the tour!'
      });
      loadData();
    }
  };

  const startLocationTracking = (bookingId: string) => {
    if (!navigator.geolocation) {
      toast({
        title: 'Location Not Supported',
        description: 'Your browser does not support location tracking.',
        variant: 'destructive'
      });
      return;
    }

    setIsTracking(true);

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        if (user) {
          await updateGuideLocation(
            user.id,
            bookingId,
            position.coords.latitude,
            position.coords.longitude,
            position.coords.heading ?? undefined,
            position.coords.speed ?? undefined,
            position.coords.accuracy ?? undefined
          );
        }
      },
      (error) => {
        console.error('Location error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    );

    // Store watch ID for cleanup
    (window as any).guideLocationWatchId = watchId;
  };

  const stopLocationTracking = () => {
    setIsTracking(false);
    setCurrentBookingId(null);
    if ((window as any).guideLocationWatchId) {
      navigator.geolocation.clearWatch((window as any).guideLocationWatchId);
    }
  };

  const handleMarkNotificationRead = async (notificationId: string) => {
    await markGuideNotificationRead(notificationId);
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <AnimatedBackground />
      <Navigation />

      <div className="relative z-10 pt-20 pb-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Guide Dashboard</h1>
              <p className="text-muted-foreground">Manage your tour bookings</p>
            </div>
            <div className="flex items-center gap-4">
              {isTracking && (
                <Badge variant="default" className="bg-green-600">
                  <NavIcon className="h-3 w-3 mr-1 animate-pulse" />
                  Tracking Active
                </Badge>
              )}
              <Button variant="outline" onClick={() => signOut()}>
                Sign Out
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="bookings">My Bookings</TabsTrigger>
              <TabsTrigger value="notifications" className="relative">
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bookings">
              <div className="grid gap-4">
                {bookings.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No bookings assigned yet.</p>
                    </CardContent>
                  </Card>
                ) : (
                  bookings.map((booking) => (
                    <Card key={booking.id} className="bg-card/95 backdrop-blur-sm">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            Tour #{booking.id.substring(0, 8)}
                          </CardTitle>
                          <Badge variant={
                            booking.status === 'completed' ? 'default' :
                            booking.status === 'on_trip' ? 'secondary' :
                            booking.status === 'accepted' ? 'outline' : 'destructive'
                          }>
                            {booking.status}
                          </Badge>
                        </div>
                        <CardDescription>
                          {booking.service_type} Service
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4 text-primary" />
                              <span>{booking.user_info?.phone || 'N/A'}</span>
                            </div>
                            {booking.tourist_guide_bookings?.[0] && (
                              <>
                                <div className="flex items-center gap-2 text-sm">
                                  <Globe className="h-4 w-4 text-primary" />
                                  <span>Language: {booking.tourist_guide_bookings[0].guide_language}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <MapPin className="h-4 w-4 text-primary" />
                                  <span>Area: {booking.tourist_guide_bookings[0].tour_area}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Clock className="h-4 w-4 text-primary" />
                                  <span>Duration: {booking.tourist_guide_bookings[0].tour_duration_hours}h</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Users className="h-4 w-4 text-primary" />
                                  <span>Group Size: {booking.tourist_guide_bookings[0].group_size}</span>
                                </div>
                              </>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 justify-end">
                            {booking.status === 'assigned' && (
                              <>
                                <Button 
                                  onClick={() => handleAcceptBooking(booking.id)}
                                  className="w-full"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Accept
                                </Button>
                                <Button 
                                  variant="outline"
                                  onClick={() => handleRejectBooking(booking.id)}
                                  className="w-full"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Decline
                                </Button>
                              </>
                            )}
                            {booking.status === 'accepted' && (
                              <Button 
                                onClick={() => handleStartTour(booking.id)}
                                className="w-full bg-green-600 hover:bg-green-700"
                              >
                                <NavIcon className="h-4 w-4 mr-2" />
                                Start Tour
                              </Button>
                            )}
                            {booking.status === 'on_trip' && (
                              <Button 
                                onClick={() => handleCompleteTour(booking.id)}
                                className="w-full"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Complete Tour
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="notifications">
              <div className="space-y-4">
                {notifications.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No notifications yet.</p>
                    </CardContent>
                  </Card>
                ) : (
                  notifications.map((notification) => (
                    <Card 
                      key={notification.id} 
                      className={`cursor-pointer transition-colors ${
                        !notification.is_read ? 'bg-primary/5 border-primary/20' : ''
                      }`}
                      onClick={() => handleMarkNotificationRead(notification.id)}
                    >
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{notification.title}</p>
                            <p className="text-sm text-muted-foreground">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(notification.created_at).toLocaleString()}
                            </p>
                          </div>
                          {!notification.is_read && (
                            <Badge variant="default" className="bg-primary">New</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default GuideDashboard;
