import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Calendar,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  FileEdit,
  Trash2,
  ArrowRight,
  CreditCard,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getDraftBookings, deleteDraftBooking, DraftBooking } from '@/services/bookingService';
import { getStatusTranslationKey } from '@/utils/translationUtils';

interface Booking {
  id: string;
  service_type: string;
  status: string;
  payment_status: string;
  total_price: number;
  created_at: string;
  service_details: any;
}

interface DashboardStats {
  total: number;
  confirmed: number;
  pending: number;
  drafts: number;
}

export const UserDashboardContent = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [draftBookings, setDraftBookings] = useState<DraftBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    confirmed: 0,
    pending: 0,
    drafts: 0
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch completed bookings
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(bookingsData || []);

      // Fetch draft bookings
      const drafts = await getDraftBookings();
      setDraftBookings(drafts);

      // ALIGNED WITH DATABASE ENUM - Correct status classification
      const FINAL_STATUSES = ['completed', 'cancelled', 'rejected'];
      const PAID_CONFIRMED_STATUSES = ['paid', 'confirmed'];
      const IN_PROGRESS_STATUSES = ['assigned', 'accepted', 'on_trip'];
      const WAITING_STATUSES = ['pending', 'under_review', 'approved', 'awaiting_payment'];
      
      const total = bookingsData?.length || 0;
      
      // "Confirmed" = Paid + In Progress + Completed
      const confirmed = bookingsData?.filter(b => 
        PAID_CONFIRMED_STATUSES.includes(b.status) || 
        IN_PROGRESS_STATUSES.includes(b.status) || 
        b.status === 'completed'
      ).length || 0;
      
      // "Pending" = Awaiting admin action or customer payment
      const pending = bookingsData?.filter(b => 
        WAITING_STATUSES.includes(b.status)
      ).length || 0;

      setStats({
        total,
        confirmed,
        pending,
        drafts: drafts.length
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: t('common.error'),
        description: t('common.failedToLoad'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResumeBooking = (draft: DraftBooking) => {
    navigate('/booking', {
      state: {
        resumeDraft: draft,
        serviceType: draft.service_type
      }
    });
  };

  const handleDeleteDraft = async (draftId: string) => {
    try {
      await deleteDraftBooking(draftId);
      setDraftBookings(prev => prev.filter(d => d.id !== draftId));
      setStats(prev => ({ ...prev, drafts: prev.drafts - 1 }));
      toast({
        title: t('common.deleted'),
        description: t('common.draftDeleted')
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('common.failedToDelete'),
        variant: 'destructive'
      });
    }
  };

  const handlePayNow = (booking: Booking) => {
    navigate('/payment', {
      state: { bookingId: booking.id, amount: booking.total_price }
    });
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: any; icon: any; color: string }> = {
      pending: { variant: 'secondary', icon: Clock, color: 'text-yellow-600' },
      confirmed: { variant: 'default', icon: CheckCircle, color: 'text-green-600' },
      completed: { variant: 'outline', icon: CheckCircle, color: 'text-blue-600' },
      cancelled: { variant: 'destructive', icon: XCircle, color: 'text-red-600' },
    };

    const { variant, icon: Icon, color } = config[status] || config.pending;

    return (
      <Badge variant={variant}>
        <Icon className={`h-3 w-3 mr-1 ${color}`} />
        {t(getStatusTranslationKey(status))}
      </Badge>
    );
  };

  const formatServiceDetails = (serviceType: string, details: any) => {
    if (!details) return t('common.notAvailable');
    switch (serviceType) {
      case 'Transportation':
      case 'Driver':
        return `${details.pickup || details.pickupLocation || t('common.notAvailable')} → ${details.dropoff || details.dropoffLocation || t('common.notAvailable')}`;
      case 'Hotels':
      case 'Accommodation':
        return `${details.city || t('common.notAvailable')} - ${details.hotel || details.hotelName || t('common.notAvailable')}`;
      case 'Events':
      case 'Events & Entertainment':
        return `${details.eventName || t('common.notAvailable')}`;
      case 'Custom Trips':
        return `${details.duration || t('common.notAvailable')} ${t('common.in')} ${details.regions || t('common.notAvailable')}`;
      default:
        return t('common.notAvailable');
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('userDashboard.totalBookings')}</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('userDashboard.confirmed')}</p>
                <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('userDashboard.pending')}</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('userDashboard.drafts')}</p>
                <p className="text-2xl font-bold text-orange-600">{stats.drafts}</p>
              </div>
              <FileEdit className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <Button onClick={() => navigate('/booking')} className="gap-2">
          <Plus className="h-4 w-4" />
          {t('userDashboard.newBooking')}
        </Button>
        <Button variant="outline" onClick={() => navigate('/services')} className="gap-2">
          {t('userDashboard.browseServices')}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="overview">{t('userDashboard.myBookings')}</TabsTrigger>
          <TabsTrigger value="drafts">
            {t('userDashboard.incomplete')}
            {stats.drafts > 0 && (
              <Badge variant="secondary" className="ml-2">{stats.drafts}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">{t('userDashboard.history')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('userDashboard.activeBookings')}</CardTitle>
              <CardDescription>{t('userDashboard.ongoingReservations')}</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : bookings.filter(b => !['completed', 'cancelled', 'rejected'].includes(b.status)).length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">{t('emptyStates.noActiveBookings')}</p>
                  <Button className="mt-4" onClick={() => navigate('/booking')}>
                    {t('userDashboard.makeBooking')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.filter(b => !['completed', 'cancelled', 'rejected'].includes(b.status)).map((booking) => (
                    <Card key={booking.id} className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{booking.service_type}</Badge>
                            {getStatusBadge(booking.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatServiceDetails(booking.service_type, booking.service_details)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t('userDashboard.bookedOn')} {new Date(booking.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-semibold">${booking.total_price?.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">
                              {t('userDashboard.payment')}: {t(getStatusTranslationKey(booking.payment_status))}
                            </p>
                          </div>
                          {booking.payment_status === 'pending' && (
                            <Button size="sm" onClick={() => handlePayNow(booking)}>
                              <CreditCard className="h-4 w-4 mr-1" />
                              {t('userDashboard.payNow')}
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drafts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileEdit className="h-5 w-5" />
                {t('userDashboard.incompleteBookings')}
              </CardTitle>
              <CardDescription>{t('userDashboard.resumeDrafts')}</CardDescription>
            </CardHeader>
            <CardContent>
              {draftBookings.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">{t('emptyStates.noIncompleteBookings')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {draftBookings.map((draft) => (
                    <Card key={draft.id} className="p-4 border-dashed">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{draft.service_type}</Badge>
                            <Badge variant="secondary">{draft.booking_progress}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {t('userDashboard.startedOn')} {new Date(draft.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t('userDashboard.lastUpdated')}: {new Date(draft.updated_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => handleResumeBooking(draft)}>
                            <ArrowRight className="h-4 w-4 mr-1" />
                            {t('userDashboard.resume')}
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="icon"
                            onClick={() => handleDeleteDraft(draft.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('userDashboard.bookingHistory')}</CardTitle>
              <CardDescription>{t('userDashboard.allPastReservations')}</CardDescription>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">{t('emptyStates.noBookingHistory')}</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('userDashboard.service')}</TableHead>
                        <TableHead>{t('userDashboard.details')}</TableHead>
                        <TableHead>{t('userDashboard.date')}</TableHead>
                        <TableHead>{t('userDashboard.status')}</TableHead>
                        <TableHead>{t('userDashboard.amount')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell>
                            <Badge variant="outline">{booking.service_type}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatServiceDetails(booking.service_type, booking.service_details)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(booking.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(booking.status)}
                          </TableCell>
                          <TableCell className="font-semibold">
                            ${booking.total_price?.toFixed(2) || '0.00'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};