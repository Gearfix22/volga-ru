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
import { useLanguage } from '@/contexts/LanguageContext';
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
  const { t, isRTL } = useLanguage();
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

  // Weekday labels for i18n
  const weekDays = [
    t('guideDashboard.sunday'),
    t('guideDashboard.monday'),
    t('guideDashboard.tuesday'),
    t('guideDashboard.wednesday'),
    t('guideDashboard.thursday'),
    t('guideDashboard.friday'),
    t('guideDashboard.saturday')
  ];

  useEffect(() => {
    if (!user) {
      navigate('/guide-login');
      return;
    }

    if (!hasRole('guide')) {
      toast({
        title: t('guideDashboard.accessDenied'),
        description: t('guideDashboard.noGuideAccess'),
        variant: 'destructive'
      });
      navigate('/');
      return;
    }

    loadData();
  }, [user, hasRole, navigate, t]);

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
        title: t('guideDashboard.error'),
        description: t('guideDashboard.acceptFailed'),
        variant: 'destructive'
      });
    } else {
      toast({
        title: t('guideDashboard.bookingAccepted'),
        description: t('guideDashboard.bookingAcceptedDesc')
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
        title: t('guideDashboard.error'),
        description: t('guideDashboard.rejectFailed'),
        variant: 'destructive'
      });
    } else {
      toast({
        title: t('guideDashboard.bookingRejected'),
        description: t('guideDashboard.bookingRejectedDesc')
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
        title: t('guideDashboard.tourStarted'),
        description: t('guideDashboard.locationActive')
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
        title: t('guideDashboard.tourCompleted'),
        description: t('guideDashboard.tourCompletedDesc')
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
      const availSuccess = await upsertGuideAvailability(user.id, {
        is_available: isAvailable,
        available_from: availableFrom,
        available_to: availableTo,
        working_days: workingDays,
        languages,
        service_areas: workingAreas
      });

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
        title: t('guideDashboard.settingsSaved'),
        description: t('guideDashboard.availabilityUpdated')
      });
    } catch (error) {
      toast({
        title: t('guideDashboard.error'),
        description: t('guideDashboard.acceptFailed'),
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
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Guide-specific header */}
      <header className={`fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-b`}>
        <div className={`container mx-auto px-4 h-16 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <UserCheck className="h-8 w-8 text-primary" />
            <div className={isRTL ? 'text-right' : 'text-left'}>
              <span className="text-xl font-bold">{t('guideDashboard.portal')}</span>
              {guideProfile?.full_name && (
                <p className="text-sm text-muted-foreground">{guideProfile.full_name}</p>
              )}
            </div>
          </div>
          
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Button variant="outline" size="icon" onClick={loadData} disabled={loading}>
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            
            <Button variant="outline" onClick={() => signOut()} className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
              <LogOut className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('guideDashboard.signOut')}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-24 pb-12 max-w-6xl">
        <div className={`flex items-center justify-between mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h1 className="text-3xl font-bold text-foreground">{t('guideDashboard.dashboard')}</h1>
            <p className="text-muted-foreground">
              {t('guideDashboard.welcome')}, {guideProfile?.full_name || 'Guide'}
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="bookings">{t('guideDashboard.myBookings')}</TabsTrigger>
            <TabsTrigger value="notifications" className="relative">
              {t('guideDashboard.notifications')}
              {unreadCount > 0 && (
                <Badge variant="destructive" className={`${isRTL ? 'mr-2' : 'ml-2'} h-5 w-5 p-0 text-xs`}>
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings" className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Settings className="h-3 w-3" />
              {t('guideDashboard.settings')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookings">
            <div className="grid gap-4">
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
                    <p className="text-muted-foreground">{t('guideDashboard.noBookingsAssigned')}</p>
                  </CardContent>
                </Card>
              ) : (
                bookings.map((booking) => (
                  <Card key={booking.id} className="bg-card/95 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <CardTitle className="text-lg">
                          {t('guideDashboard.tour')} #{booking.id.substring(0, 8)}
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
                        {booking.service_type} {t('guideDashboard.service')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                          <div className={`flex items-center gap-2 text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <Phone className="h-4 w-4 text-primary" />
                            <span>{booking.user_info?.phone || 'N/A'}</span>
                          </div>
                          {booking.tourist_guide_bookings?.[0] && (
                            <>
                              <div className={`flex items-center gap-2 text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <Globe className="h-4 w-4 text-primary" />
                                <span>{t('guideDashboard.language')}: {booking.tourist_guide_bookings[0].guide_language}</span>
                              </div>
                              <div className={`flex items-center gap-2 text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <MapPin className="h-4 w-4 text-primary" />
                                <span>{t('guideDashboard.area')}: {booking.tourist_guide_bookings[0].tour_area}</span>
                              </div>
                              <div className={`flex items-center gap-2 text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <Clock className="h-4 w-4 text-primary" />
                                <span>{t('guideDashboard.duration')}: {booking.tourist_guide_bookings[0].tour_duration_hours}h</span>
                              </div>
                              <div className={`flex items-center gap-2 text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <Users className="h-4 w-4 text-primary" />
                                <span>{t('guideDashboard.groupSize')}: {booking.tourist_guide_bookings[0].group_size}</span>
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
                                <CheckCircle className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                {t('guideDashboard.accept')}
                              </Button>
                              <Button 
                                variant="outline"
                                onClick={() => handleRejectBooking(booking.id)}
                                className="w-full"
                              >
                                <XCircle className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                {t('guideDashboard.decline')}
                              </Button>
                            </>
                          )}
                          {booking.status === 'accepted' && (
                            <Button 
                              onClick={() => handleStartTour(booking.id)}
                              className="w-full bg-green-600 hover:bg-green-700"
                            >
                              <NavIcon className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                              {t('guideDashboard.startTour')}
                            </Button>
                          )}
                          {booking.status === 'on_trip' && (
                            <Button 
                              onClick={() => handleCompleteTour(booking.id)}
                              className="w-full"
                            >
                              <CheckCircle className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                              {t('guideDashboard.completeTour')}
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
                    <p className="text-muted-foreground">{t('guideDashboard.noNotifications')}</p>
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
                      <div className={`flex items-start justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={isRTL ? 'text-right' : 'text-left'}>
                          <p className="font-medium">{notification.title}</p>
                          <p className="text-sm text-muted-foreground">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <Badge variant="default" className="bg-primary">{t('common.new')}</Badge>
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
                <CardTitle>{t('guideDashboard.settings')}</CardTitle>
                <CardDescription>{t('guideDashboard.availability')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <Label>{t('guideDashboard.isAvailable')}</Label>
                    <p className="text-sm text-muted-foreground">{t('guideDashboard.availability')}</p>
                  </div>
                  <Switch checked={isAvailable} onCheckedChange={setIsAvailable} />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t('guideDashboard.availableFrom')}</Label>
                    <Input type="time" value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('guideDashboard.availableTo')}</Label>
                    <Input type="time" value={availableTo} onChange={(e) => setAvailableTo(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('guideDashboard.workingDays')}</Label>
                  <div className="flex flex-wrap gap-2">
                    {weekDays.map((day, idx) => (
                      <Badge
                        key={idx}
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
                  <Label>{t('guideDashboard.hourlyRate')}</Label>
                  <Input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(Number(e.target.value))} className="max-w-[200px]" />
                </div>

                <div className="space-y-2">
                  <Label>{t('guideDashboard.languages')}</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {languages.map(lang => (
                      <Badge key={lang} variant="secondary" className="cursor-pointer" onClick={() => removeLanguage(lang)}>
                        {lang} <XCircle className={`h-3 w-3 ${isRTL ? 'mr-1' : 'ml-1'}`} />
                      </Badge>
                    ))}
                  </div>
                  <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Input value={newLanguage} onChange={(e) => setNewLanguage(e.target.value)} placeholder={t('guideDashboard.addLanguage')} className="max-w-[200px]" />
                    <Button type="button" variant="outline" size="sm" onClick={addLanguage}>{t('common.add')}</Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('guideDashboard.workingAreas')}</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {workingAreas.map(area => (
                      <Badge key={area} variant="secondary" className="cursor-pointer" onClick={() => removeWorkingArea(area)}>
                        {area} <XCircle className={`h-3 w-3 ${isRTL ? 'mr-1' : 'ml-1'}`} />
                      </Badge>
                    ))}
                  </div>
                  <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Input value={newArea} onChange={(e) => setNewArea(e.target.value)} placeholder={t('guideDashboard.addArea')} className="max-w-[200px]" />
                    <Button type="button" variant="outline" size="sm" onClick={addWorkingArea}>{t('common.add')}</Button>
                  </div>
                </div>

                <Button onClick={handleSaveSettings} disabled={saving} className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                  {saving ? <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} /> : <Save className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />}
                  {saving ? t('guideDashboard.saving') : t('guideDashboard.saveSettings')}
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
