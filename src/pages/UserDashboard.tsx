import { useState, useEffect, useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useServices, getServiceTypeLabel } from '@/hooks/useServices';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getDraftBookings, deleteDraftBooking, type DraftBooking } from '@/services/bookingService';
import { CustomerBookingTimeline } from '@/components/booking/CustomerBookingTimeline';
import { CustomerNotificationBell } from '@/components/booking/CustomerNotificationBell';
import { getStatusTranslationKey } from '@/utils/translationUtils';
import { getMultiplePaymentGuards } from '@/services/paymentGuardService';
import { 
  Clock, 
  CheckCircle, 
  FileText,
  PlayCircle,
  Plus,
  Trash2,
  CreditCard,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Calendar,
  RotateCcw
} from 'lucide-react';

import type { Json } from '@/integrations/supabase/types';

// Database booking record interface
interface BookingRecord {
  id: string;
  service_type: string;
  status: string;
  payment_status: string;
  total_price: number | null;
  created_at: string;
  service_details: Json | null;
}

// Enriched booking with payment guard data
interface EnrichedBooking extends BookingRecord {
  canPay: boolean;
  approvedPrice: number | null;
}

// Status classification constants
const FINAL_STATUSES = ['completed', 'cancelled', 'rejected'];
const IN_PROGRESS_STATUSES = ['assigned', 'accepted', 'on_trip'];
const PAID_STATUSES = ['paid', 'confirmed'];
const WAITING_STATUSES = ['pending', 'under_review', 'approved', 'awaiting_payment'];

// Booking card with expandable timeline
function BookingCard({ 
  booking, 
  onPayNow, 
  getServiceName 
}: { 
  booking: EnrichedBooking; 
  onPayNow: (b: EnrichedBooking) => void;
  getServiceName: (type: string) => string;
}) {
  const [expanded, setExpanded] = useState(false);
  const { t, isRTL } = useLanguage();
  
  const isActiveBooking = !FINAL_STATUSES.includes(booking.status);
  const isInProgress = IN_PROGRESS_STATUSES.includes(booking.status);
  const isPaid = PAID_STATUSES.includes(booking.status);
  const isWaiting = WAITING_STATUSES.includes(booking.status);
  const isCompleted = booking.status === 'completed';
  const canPayNow = booking.canPay === true;

  const statusColor = useMemo(() => {
    if (isCompleted || isPaid) return 'green';
    if (isInProgress) return 'blue';
    if (isWaiting) return 'yellow';
    return 'red';
  }, [isCompleted, isPaid, isInProgress, isWaiting]);

  const colorClasses = {
    green: { bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-600', badge: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
    blue: { bg: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-600', badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' },
    yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900/20', text: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' },
    red: { bg: 'bg-red-100 dark:bg-red-900/20', text: 'text-red-600', badge: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' }
  }[statusColor];

  const StatusIcon = isCompleted || isPaid ? CheckCircle : isInProgress ? PlayCircle : Clock;

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      <div 
        className={`flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
        onClick={() => isActiveBooking && setExpanded(!expanded)}
      >
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`p-2 rounded-full ${colorClasses.bg}`}>
            <StatusIcon className={`h-5 w-5 ${colorClasses.text}`} />
          </div>
          <div className={isRTL ? 'text-right' : ''}>
            <p className="font-medium text-foreground">{getServiceName(booking.service_type)}</p>
            <p className="text-sm text-muted-foreground">
              {new Date(booking.created_at).toLocaleDateString()} • {
                booking.approvedPrice 
                  ? `$${booking.approvedPrice.toFixed(2)} USD` 
                  : t('userDashboard.awaitingPrice')
              }
            </p>
          </div>
        </div>
        
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Badge className={colorClasses.badge}>
            {t(getStatusTranslationKey(booking.status))}
          </Badge>
          {canPayNow && booking.payment_status !== 'paid' && (
            <Button 
              size="sm" 
              onClick={(e) => { e.stopPropagation(); onPayNow(booking); }}
            >
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

// Dashboard stats component
function DashboardStats({ 
  stats, 
  loading, 
  isRTL 
}: { 
  stats: { total: number; completed: number; pending: number; inProgress: number }; 
  loading: boolean;
  isRTL: boolean;
}) {
  const { t } = useLanguage();

  const statItems = [
    { label: t('common.totalBookings'), value: stats.total, color: 'primary', Icon: FileText },
    { label: t('common.confirmed'), value: stats.completed, color: 'green', Icon: CheckCircle },
    { label: t('common.pending'), value: stats.pending, color: 'yellow', Icon: Clock },
    { label: t('common.inProgress'), value: stats.inProgress, color: 'blue', Icon: RotateCcw }
  ];

  const colorMap = {
    primary: { border: 'border-l-primary border-r-primary', text: 'text-primary', bg: 'bg-primary/10' },
    green: { border: 'border-l-green-500 border-r-green-500', text: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/20' },
    yellow: { border: 'border-l-yellow-500 border-r-yellow-500', text: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/20' },
    blue: { border: 'border-l-blue-500 border-r-blue-500', text: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/20' }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="shadow-sm">
            <CardContent className="p-4">
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map(({ label, value, color, Icon }) => {
        const colors = colorMap[color as keyof typeof colorMap];
        return (
          <Card key={label} className={`shadow-sm ${isRTL ? 'border-r-4' : 'border-l-4'} ${colors.border}`}>
            <CardContent className="p-4">
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={isRTL ? 'text-right' : ''}>
                  <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
                  <p className={`text-2xl font-bold ${colors.text}`}>{value}</p>
                </div>
                <div className={`p-2 rounded-full ${colors.bg}`}>
                  <Icon className={`h-5 w-5 ${colors.text}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

const UserDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { t, isRTL } = useLanguage();
  const { getServiceName } = useServices();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [bookings, setBookings] = useState<EnrichedBooking[]>([]);
  const [draftBookings, setDraftBookings] = useState<DraftBooking[]>([]);
  const [loading, setLoading] = useState(true);

  // Derived stats - computed from bookings, not stored separately
  const stats = useMemo(() => {
    const total = bookings.length + draftBookings.length;
    const completed = bookings.filter(b => b.status === 'completed').length;
    const pending = bookings.filter(b => WAITING_STATUSES.includes(b.status)).length;
    const inProgress = bookings.filter(b => 
      IN_PROGRESS_STATUSES.includes(b.status) || PAID_STATUSES.includes(b.status)
    ).length + draftBookings.length;
    
    return { total, completed, pending, inProgress };
  }, [bookings, draftBookings]);

  // Active bookings (non-final status)
  const activeBookings = useMemo(() => 
    bookings.filter(b => !FINAL_STATUSES.includes(b.status)),
  [bookings]);

  // Booking history (all bookings)
  const bookingHistory = useMemo(() => bookings, [bookings]);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // Fetch bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, service_type, status, payment_status, total_price, created_at, service_details')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      // Fetch drafts
      const drafts = await getDraftBookings();
      
      // Fetch payment guards for all bookings
      const bookingIds = (bookingsData || []).map(b => b.id);
      const paymentGuards = await getMultiplePaymentGuards(bookingIds);

      // Enrich bookings with can_pay from v_booking_payment_guard
      const enrichedBookings: EnrichedBooking[] = (bookingsData || []).map(b => ({
        ...b,
        canPay: paymentGuards[b.id]?.can_pay ?? false,
        approvedPrice: paymentGuards[b.id]?.approved_price ?? null
      }));

      setBookings(enrichedBookings);
      setDraftBookings(drafts);

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
    navigate('/enhanced-booking', {
      state: { resumeDraft: draft, serviceType: draft.service_type }
    });
  };

  const handleDeleteDraft = async (draftId: string) => {
    try {
      await deleteDraftBooking(draftId);
      setDraftBookings(prev => prev.filter(d => d.id !== draftId));
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

  const handlePayNow = async (booking: EnrichedBooking) => {
    // Fetch user profile for consistent userInfo
    let userInfo = { fullName: '', email: user?.email || '', phone: '', language: 'english' };
    
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone, preferred_language')
        .eq('id', user?.id)
        .maybeSingle();
      
      if (profile) {
        userInfo = {
          fullName: profile.full_name || '',
          email: user?.email || '',
          phone: profile.phone || '',
          language: profile.preferred_language || 'english'
        };
      }
    } catch (error) {
      console.error('Error fetching profile for payment:', error);
    }
    
    navigate('/enhanced-payment', {
      state: { 
        bookingId: booking.id, 
        bookingData: {
          serviceType: booking.service_type,
          userInfo,
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
      <div className="space-y-6">
        {/* Header */}
        <div className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={isRTL ? 'text-right' : ''}>
            <h2 className="text-xl font-semibold text-foreground">{t('common.welcomeBack')}</h2>
            <p className="text-sm text-muted-foreground">{t('common.manageBookings')}</p>
          </div>
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <CustomerNotificationBell />
            <Button onClick={() => navigate('/')} variant="ghost" size="sm">
              <ArrowRight className={`h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1 rotate-180'}`} />
              {t('common.backToHome')}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <DashboardStats stats={stats} loading={loading} isRTL={isRTL} />

        {/* Quick Actions */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-base">{t('common.quickActions')}</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={() => navigate('/enhanced-booking')} className="flex-1">
                <Plus className={`h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                {t('common.newBooking')}
              </Button>
              <Button onClick={() => navigate('/services')} variant="outline" className="flex-1">
                <Calendar className={`h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                {t('common.browseServices')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Draft Bookings Alert */}
        {draftBookings.length > 0 && (
          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className={`flex items-center gap-2 text-orange-700 dark:text-orange-400 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <RotateCcw className="h-5 w-5" />
                {t('common.incompleteBookings')} ({draftBookings.length})
              </CardTitle>
              <CardDescription>{t('common.incompleteBookingsDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {draftBookings.map(draft => (
                <div key={draft.id} className={`flex items-center justify-between p-4 bg-background rounded-lg border ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={isRTL ? 'text-right' : ''}>
                    <p className="font-semibold text-foreground">{getServiceName(draft.service_type)}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('common.lastUpdated')}: {new Date(draft.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Button onClick={() => handleResumeBooking(draft)} size="sm">
                      <ArrowRight className={`h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                      {t('common.resume')}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDeleteDraft(draft.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Active Bookings */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">{t('userDashboard.activeBookings')}</CardTitle>
            <CardDescription>{t('userDashboard.ongoingReservations')}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map(i => <Skeleton key={i} className="h-20 w-full" />)}
              </div>
            ) : activeBookings.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">{t('emptyStates.noActiveBookings')}</p>
                <Button onClick={() => navigate('/enhanced-booking')}>
                  {t('userDashboard.makeBooking')}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {activeBookings.map(booking => (
                  <BookingCard 
                    key={booking.id} 
                    booking={booking} 
                    onPayNow={handlePayNow}
                    getServiceName={getServiceName}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Booking History */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">{t('userDashboard.bookingHistory')}</CardTitle>
            <CardDescription>{t('userDashboard.allPastReservations')}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : bookingHistory.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{t('emptyStates.noBookingHistory')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {bookingHistory.slice(0, 10).map(booking => (
                  <div 
                    key={booking.id} 
                    className={`flex items-center justify-between p-3 border rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Badge variant="outline">{getServiceName(booking.service_type)}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(booking.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span className="text-sm font-medium">
                        {booking.approvedPrice ? `$${booking.approvedPrice.toFixed(2)}` : '—'}
                      </span>
                      <Badge 
                        variant={FINAL_STATUSES.includes(booking.status) ? 'secondary' : 'default'}
                        className="text-xs"
                      >
                        {t(getStatusTranslationKey(booking.status))}
                      </Badge>
                    </div>
                  </div>
                ))}
                {bookingHistory.length > 10 && (
                  <p className="text-center text-sm text-muted-foreground py-2">
                    {t('common.andMore', { count: bookingHistory.length - 10 })}
                  </p>
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
