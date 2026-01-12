import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getDraftBookings, deleteDraftBooking, type DraftBooking } from '@/services/bookingService';
import { CustomerBookingTimeline } from '@/components/booking/CustomerBookingTimeline';
import { getStatusTranslationKey, getServiceTypeTranslationKey } from '@/utils/translationUtils';
import { canPayForBooking, getMultiplePaymentGuards } from '@/services/paymentGuardService';
import { 
  Clock, 
  CheckCircle, 
  FileText,
  PlayCircle,
  RotateCcw,
  TrendingUp,
  Plus,
  Trash2,
  CreditCard,
  ArrowRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface Booking {
  id: string;
  service_type: string;
  status: string;
  payment_status: string;
  total_price: number;
  created_at: string;
  service_details: any;
  canPay?: boolean;
  approvedPrice?: number | null;
}

// Expandable booking card with timeline
function BookingCardWithTimeline({ booking, onPayNow }: { booking: Booking; onPayNow: (b: Booking) => void }) {
  const [expanded, setExpanded] = useState(false);
  const { t, isRTL } = useLanguage();
  
  const isActiveBooking = ['pending', 'confirmed', 'assigned', 'accepted', 'on_trip'].includes(booking.status);
  // Use can_pay from v_booking_payment_guard
  const canPayNow = booking.canPay === true;

  return (
    <div className="border rounded-lg overflow-hidden">
      <div 
        className={`flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`p-2 rounded-full ${
            booking.status === 'confirmed' || booking.status === 'completed' 
              ? 'bg-green-100 dark:bg-green-900/20' 
              : booking.status === 'pending'
              ? 'bg-yellow-100 dark:bg-yellow-900/20'
              : booking.status === 'on_trip' || booking.status === 'assigned' || booking.status === 'accepted'
              ? 'bg-blue-100 dark:bg-blue-900/20'
              : 'bg-red-100 dark:bg-red-900/20'
          }`}>
            {booking.status === 'confirmed' || booking.status === 'completed' ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : booking.status === 'pending' ? (
              <Clock className="h-5 w-5 text-yellow-600" />
            ) : booking.status === 'on_trip' || booking.status === 'assigned' || booking.status === 'accepted' ? (
              <PlayCircle className="h-5 w-5 text-blue-600" />
            ) : (
              <Clock className="h-5 w-5 text-red-600" />
            )}
          </div>
          <div className={isRTL ? 'text-right' : ''}>
            <p className="font-medium">{t(getServiceTypeTranslationKey(booking.service_type))}</p>
            <p className="text-sm text-muted-foreground">
              {new Date(booking.created_at).toLocaleDateString()} • ${booking.total_price?.toFixed(2) || '0.00'}
            </p>
          </div>
        </div>
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Badge className={
            booking.status === 'confirmed' || booking.status === 'completed'
              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
              : booking.status === 'pending'
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
              : booking.status === 'on_trip' || booking.status === 'assigned' || booking.status === 'accepted'
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
          }>
            {t(getStatusTranslationKey(booking.status))}
          </Badge>
          {canPayNow && booking.payment_status !== 'paid' && (
            <Button size="sm" onClick={(e) => { e.stopPropagation(); onPayNow(booking); }}>
              <CreditCard className={`h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
              {t('common.payNow')}
            </Button>
          )}
          {isActiveBooking && (
            expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>
      
      {expanded && isActiveBooking && (
        <div className="border-t bg-muted/30 p-4">
          <CustomerBookingTimeline booking={booking} showEstimates={true} />
        </div>
      )}
    </div>
  );
}

const UserDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [draftBookings, setDraftBookings] = useState<DraftBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    pending: 0,
    inProgress: 0
  });

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      const drafts = await getDraftBookings();
      
      // Fetch payment guards for all bookings from v_booking_payment_guard
      const bookingIds = (bookingsData || []).map(b => b.id);
      const paymentGuards = await getMultiplePaymentGuards(bookingIds);

      // Enrich bookings with can_pay from v_booking_payment_guard
      const enrichedBookings: Booking[] = (bookingsData || []).map(b => ({
        ...b,
        canPay: paymentGuards[b.id]?.can_pay ?? false,
        approvedPrice: paymentGuards[b.id]?.approved_price ?? null
      }));

      setBookings(enrichedBookings);
      setDraftBookings(drafts);

      const totalBookings = enrichedBookings.length + drafts.length;
      const confirmedBookings = enrichedBookings.filter(b => 
        b.status === 'confirmed' || b.status === 'completed'
      ).length;
      const pendingBookings = enrichedBookings.filter(b => 
        b.status === 'pending'
      ).length;

      setStats({
        total: totalBookings,
        confirmed: confirmedBookings,
        pending: pendingBookings,
        inProgress: drafts.length
      });

    } catch (error) {
      console.error('Error fetching user data:', error);
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
      state: { resumeDraft: draft, serviceType: draft.service_type }
    });
  };

  const handleDeleteDraft = async (draftId: string) => {
    try {
      await deleteDraftBooking(draftId);
      setDraftBookings(prev => prev.filter(d => d.id !== draftId));
      setStats(prev => ({ ...prev, inProgress: prev.inProgress - 1, total: prev.total - 1 }));
      toast({
        title: t('common.deleted'),
        description: t('common.draftDeleted'),
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
    // Navigate to payment page with booking ID - price comes from v_booking_payment_guard
    navigate('/enhanced-payment', {
      state: { 
        bookingId: booking.id, 
        bookingData: {
          serviceType: booking.service_type,
          userInfo: { fullName: '', email: '', phone: '' }, // Will be fetched
          serviceDetails: booking.service_details
        }
      }
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <DashboardLayout title={t('dashboard.dashboard')}>
      <div className="space-y-8">
        {/* Back to Home Button */}
        <div className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={isRTL ? 'text-right' : ''}>
            <h2 className="text-2xl font-bold text-foreground">{t('common.welcomeBack')}</h2>
            <p className="text-muted-foreground">{t('common.manageBookings')}</p>
          </div>
          <Button onClick={() => navigate('/')} variant="outline" size="lg">
            <ArrowRight className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2 rotate-180'}`} />
            {t('common.backToHome')}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className={`border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow ${isRTL ? 'border-l-0 border-r-4 border-r-primary' : ''}`}>
            <CardContent className="p-6">
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={isRTL ? 'text-right' : ''}>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{t('common.totalBookings')}</p>
                  <p className="text-3xl font-bold text-foreground">{stats.total}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow ${isRTL ? 'border-l-0 border-r-4 border-r-green-500' : ''}`}>
            <CardContent className="p-6">
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={isRTL ? 'text-right' : ''}>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{t('common.confirmed')}</p>
                  <p className="text-3xl font-bold text-green-600">{stats.confirmed}</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`border-l-4 border-l-yellow-500 shadow-sm hover:shadow-md transition-shadow ${isRTL ? 'border-l-0 border-r-4 border-r-yellow-500' : ''}`}>
            <CardContent className="p-6">
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={isRTL ? 'text-right' : ''}>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{t('common.pending')}</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow ${isRTL ? 'border-l-0 border-r-4 border-r-orange-500' : ''}`}>
            <CardContent className="p-6">
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={isRTL ? 'text-right' : ''}>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{t('common.inProgress')}</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.inProgress}</p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                  <RotateCcw className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">{t('common.quickActions')}</CardTitle>
            <CardDescription>{t('common.quickActionsDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={() => navigate('/booking')} className="flex-1" size="lg">
                <Plus className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('common.newBooking')}
              </Button>
              <Button onClick={() => navigate('/services')} variant="outline" className="flex-1" size="lg">
                <TrendingUp className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('common.browseServices')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Incomplete Bookings Alert */}
        {draftBookings.length > 0 && (
          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className={`flex items-center gap-2 text-orange-700 dark:text-orange-400 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <RotateCcw className="h-5 w-5" />
                {t('common.incompleteBookings')} ({draftBookings.length})
              </CardTitle>
              <CardDescription>{t('common.incompleteBookingsDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {draftBookings.map(draft => (
                <div key={draft.id} className={`flex items-center justify-between p-4 bg-background rounded-lg border shadow-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={isRTL ? 'text-right' : ''}>
                    <p className="font-semibold text-foreground">{t(getServiceTypeTranslationKey(draft.service_type))}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('common.lastUpdated')}: {new Date(draft.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Button onClick={() => handleResumeBooking(draft)} size="sm">
                      <PlayCircle className={`h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                      {t('common.resume')}
                    </Button>
                    <Button onClick={() => handleDeleteDraft(draft.id)} size="sm" variant="destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Recent Bookings */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">{t('common.recentBookings')}</CardTitle>
            <CardDescription>{t('common.recentBookingsDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">{t('common.noBookingsYet')}</p>
                <Button onClick={() => navigate('/booking')}>
                  {t('common.createFirstBooking')}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.slice(0, 5).map(booking => (
                  <BookingCardWithTimeline 
                    key={booking.id} 
                    booking={booking} 
                    onPayNow={handlePayNow} 
                  />
                ))}
                {bookings.length > 5 && (
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => navigate('/dashboard/reservations')}
                  >
                    {t('common.viewAllBookings')}
                    <ArrowRight className={`h-4 w-4 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default UserDashboard;
