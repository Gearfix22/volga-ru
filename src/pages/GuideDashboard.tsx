import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  Loader2,
  Settings,
  Save,
  UserCheck,
  LogOut,
  RefreshCw
} from 'lucide-react';
import { GuideLocationTracker } from '@/components/guide/GuideLocationTracker';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  getGuideNotifications, 
  getGuideBookings, 
  markGuideNotificationRead,
  getGuideById,
  getGuideAvailability,
  upsertGuideAvailability,
  type GuideNotification,
  type Guide,
  type GuideAvailability
} from '@/services/guideService';
import { supabase } from '@/integrations/supabase/client';

const GuideDashboard = () => {
  const navigate = useNavigate();
  const { user, hasRole, signOut } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('bookings');
  const [notifications, setNotifications] = useState<GuideNotification[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [guideProfile, setGuideProfile] = useState<Guide | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Settings state
  const [isAvailable, setIsAvailable] = useState(true);
  const [availableFrom, setAvailableFrom] = useState('09:00');
  const [availableTo, setAvailableTo] = useState('18:00');
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [languages, setLanguages] = useState<string[]>(['English']);
  const [workingAreas, setWorkingAreas] = useState<string[]>(['City Center']);
  const [hourlyRate, setHourlyRate] = useState(50);
  const [newLanguage, setNewLanguage] = useState('');
  const [newArea, setNewArea] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/guide-login');
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
  }, [user, hasRole, navigate]);

  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [notifs, bkgs, profile, availability] = await Promise.all([
        getGuideNotifications(user.id),
        getGuideBookings(user.id),
        getGuideById(user.id),
        getGuideAvailability(user.id)
      ]);
      setNotifications(notifs);
      setBookings(bkgs);
      
      if (profile) {
        setGuideProfile(profile);
        setHourlyRate(profile.hourly_rate || 50);
      }
      
      if (availability) {
        setIsAvailable(availability.is_available);
        setAvailableFrom(availability.available_from || '09:00');
        setAvailableTo(availability.available_to || '18:00');
        setWorkingDays(availability.working_days || [1, 2, 3, 4, 5]);
        setLanguages(availability.languages || ['English']);
        setWorkingAreas(availability.service_areas || ['City Center']);
      }
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
      toast({
        title: 'Tour Completed',
        description: 'Thank you for completing the tour!'
      });
      loadData();
    }
  };
  const handleMarkNotificationRead = async (notificationId: string) => {
    await markGuideNotificationRead(notificationId);
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      // Save to guide_availability table
      const availSuccess = await upsertGuideAvailability(user.id, {
        is_available: isAvailable,
        available_from: availableFrom,
        available_to: availableTo,
        working_days: workingDays,
        languages,
        service_areas: workingAreas
      });

      // Also update hourly rate in guides table
      const { error } = await supabase
        .from('guides')
        .update({
          hourly_rate: hourlyRate,
          status: isAvailable ? 'active' : 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error || !availSuccess) throw error;

      toast({
        title: 'Settings Saved',
        description: 'Your availability has been updated.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const addLanguage = () => {
    if (newLanguage.trim() && !languages.includes(newLanguage.trim())) {
      setLanguages([...languages, newLanguage.trim()]);
      setNewLanguage('');
    }
  };

  const removeLanguage = (lang: string) => {
    setLanguages(languages.filter(l => l !== lang));
  };

  const addWorkingArea = () => {
    if (newArea.trim() && !workingAreas.includes(newArea.trim())) {
      setWorkingAreas([...workingAreas, newArea.trim()]);
      setNewArea('');
    }
  };

  const removeWorkingArea = (area: string) => {
    setWorkingAreas(workingAreas.filter(a => a !== area));
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
    <div className="min-h-screen bg-background">
      {/* Guide-specific header - no customer navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserCheck className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Guide Portal</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={loadData} disabled={loading}>
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            
            <Button variant="outline" onClick={() => signOut()}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-24 pb-12 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Guide Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome, {guideProfile?.full_name || 'Guide'}
            </p>
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
              <TabsTrigger value="settings" className="flex items-center gap-1">
                <Settings className="h-3 w-3" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bookings">
              <div className="grid gap-4">
                {/* Show location tracker for active tour */}
                {bookings.find(b => b.status === 'on_trip' || b.status === 'accepted') && (
                  <GuideLocationTracker 
                    activeBookingId={bookings.find(b => b.status === 'on_trip')?.id || bookings.find(b => b.status === 'accepted')?.id}
                    bookingStatus={bookings.find(b => b.status === 'on_trip')?.status || bookings.find(b => b.status === 'accepted')?.status}
                  />
                )}
                
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

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Guide Settings</CardTitle>
                  <CardDescription>Manage your availability and preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Availability</Label>
                      <p className="text-sm text-muted-foreground">Toggle to accept new bookings</p>
                    </div>
                    <Switch checked={isAvailable} onCheckedChange={setIsAvailable} />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Available From</Label>
                      <Input type="time" value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Available To</Label>
                      <Input type="time" value={availableTo} onChange={(e) => setAvailableTo(e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Working Days</Label>
                    <div className="flex flex-wrap gap-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                        <Badge
                          key={day}
                          variant={workingDays.includes(idx) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => {
                            if (workingDays.includes(idx)) {
                              setWorkingDays(workingDays.filter(d => d !== idx));
                            } else {
                              setWorkingDays([...workingDays, idx].sort());
                            }
                          }}
                        >
                          {day}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Hourly Rate (USD)</Label>
                    <Input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(Number(e.target.value))} className="max-w-[200px]" />
                  </div>

                  <div className="space-y-2">
                    <Label>Languages</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {languages.map(lang => (
                        <Badge key={lang} variant="secondary" className="cursor-pointer" onClick={() => removeLanguage(lang)}>
                          {lang} <XCircle className="h-3 w-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input value={newLanguage} onChange={(e) => setNewLanguage(e.target.value)} placeholder="Add language" className="max-w-[200px]" />
                      <Button type="button" variant="outline" size="sm" onClick={addLanguage}>Add</Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Service Areas</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {workingAreas.map(area => (
                        <Badge key={area} variant="secondary" className="cursor-pointer" onClick={() => removeWorkingArea(area)}>
                          {area} <XCircle className="h-3 w-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input value={newArea} onChange={(e) => setNewArea(e.target.value)} placeholder="Add area" className="max-w-[200px]" />
                      <Button type="button" variant="outline" size="sm" onClick={addWorkingArea}>Add</Button>
                    </div>
                  </div>

                  <Button onClick={handleSaveSettings} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Settings
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
      </main>
    </div>
  );
};

export default GuideDashboard;
