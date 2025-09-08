import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { AuthRequiredWrapper } from '@/components/booking/AuthRequiredWrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  DollarSign,
  FileText,
  PlayCircle,
  Trash2,
  RotateCcw,
  AlertTriangle,
  TrendingUp,
  Plus
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getDraftBookings, deleteDraftBooking, type DraftBooking } from '@/services/bookingService';

interface Booking {
  id: string;
  service_type: string;
  status: string;
  payment_status: string;
  total_price: number;
  payment_method: string;
  transaction_id: string;
  created_at: string;
  user_info: any;
  service_details: any;
}

const EnhancedDashboard = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('overview');
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
      // Fetch completed/submitted bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      // Fetch draft bookings
      const drafts = await getDraftBookings();

      setBookings(bookingsData || []);
      setDraftBookings(drafts);

      // Calculate stats
      const totalBookings = (bookingsData?.length || 0) + drafts.length;
      const confirmedBookings = bookingsData?.filter(b => 
        b.status === 'confirmed' || b.status === 'paid'
      ).length || 0;
      const pendingBookings = bookingsData?.filter(b => 
        b.status === 'pending' || b.status === 'pending_verification'
      ).length || 0;

      setStats({
        total: totalBookings,
        confirmed: confirmedBookings,
        pending: pendingBookings,
        inProgress: drafts.length
      });

    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: t('error'),
        description: t('failedToLoadData'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'pending':
      case 'pending_verification':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'cancelled':
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'paid':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
      case 'pending_verification':
        return <Clock className="h-4 w-4" />;
      case 'cancelled':
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const handleResumeBooking = (draft: DraftBooking) => {
    navigate('/enhanced-booking', {
      state: { resumeDraft: draft }
    });
  };

  const handleDeleteDraft = async (draftId: string) => {
    try {
      await deleteDraftBooking(draftId);
      setDraftBookings(prev => prev.filter(d => d.id !== draftId));
      toast({
        title: t('success'),
        description: t('draftDeleted'),
      });
    } catch (error) {
      toast({
        title: t('error'),
        description: t('failedToDeleteDraft'),
        variant: 'destructive'
      });
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('totalBookings')}</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('confirmed')}</p>
                <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('pending')}</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('inProgress')}</p>
                <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
              </div>
              <RotateCcw className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('quickActions')}</CardTitle>
          <CardDescription>{t('quickActionsDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={() => navigate('/enhanced-booking')} className="flex-1">
              <Plus className="h-4 w-4 mr-2" />
              {t('newBooking')}
            </Button>
            <Button onClick={() => navigate('/services')} variant="outline" className="flex-1">
              <TrendingUp className="h-4 w-4 mr-2" />
              {t('browseServices')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>{t('recentActivity')}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : bookings.length === 0 && draftBookings.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t('noBookingsYet')}</p>
              <Button onClick={() => navigate('/enhanced-booking')} className="mt-4">
                {t('createFirstBooking')}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Show recent draft bookings first */}
              {draftBookings.slice(0, 2).map(draft => (
                <div key={draft.id} className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/10">
                  <div className="flex items-center gap-3">
                    <RotateCcw className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="font-medium">{draft.service_type} - {t('inProgress')}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('lastUpdated')}: {new Date(draft.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => handleResumeBooking(draft)} size="sm">
                    <PlayCircle className="h-4 w-4 mr-2" />
                    {t('resume')}
                  </Button>
                </div>
              ))}
              
              {/* Show recent completed bookings */}
              {bookings.slice(0, 3).map(booking => (
                <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(booking.status)}
                    <div>
                      <p className="font-medium">{booking.service_type}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(booking.created_at).toLocaleDateString()} • ${booking.total_price?.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(booking.status)}>
                    {booking.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderInProgressBookings = () => (
    <div className="space-y-4">
      {draftBookings.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <RotateCcw className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('noInProgressBookings')}</h3>
            <p className="text-muted-foreground mb-4">{t('allBookingsCompleted')}</p>
            <Button onClick={() => navigate('/enhanced-booking')}>
              {t('startNewBooking')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        draftBookings.map(draft => (
          <Card key={draft.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <RotateCcw className="h-5 w-5 text-blue-600" />
                  {draft.service_type}
                </CardTitle>
                <Badge variant="outline">{t('inProgress')}</Badge>
              </div>
              <CardDescription>
                {t('started')}: {new Date(draft.created_at).toLocaleString()} • 
                {t('lastUpdated')}: {new Date(draft.updated_at).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t('progress')}:</span>
                  <span className="text-sm capitalize">{draft.booking_progress?.replace('_', ' ')}</span>
                </div>
                
                {draft.total_price && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t('estimatedPrice')}:</span>
                    <span className="text-sm font-semibold">${draft.total_price.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button onClick={() => handleResumeBooking(draft)} className="flex-1">
                    <PlayCircle className="h-4 w-4 mr-2" />
                    {t('resumeBooking')}
                  </Button>
                  <Button 
                    onClick={() => handleDeleteDraft(draft.id)}
                    variant="outline"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  const renderCompletedBookings = () => (
    <div className="space-y-4">
      {bookings.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('noCompletedBookings')}</h3>
            <p className="text-muted-foreground mb-4">{t('completeFirstBooking')}</p>
            <Button onClick={() => navigate('/enhanced-booking')}>
              {t('startBooking')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        bookings.map(booking => (
          <Card key={booking.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(booking.status)}
                  {booking.service_type}
                </CardTitle>
                <Badge className={getStatusColor(booking.status)}>
                  {booking.status}
                </Badge>
              </div>
              <CardDescription>
                {t('booked')}: {new Date(booking.created_at).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">${booking.total_price?.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{booking.payment_method}</span>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  {t('transactionId')}: {booking.transaction_id}
                </div>

                {booking.status === 'pending_verification' && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {t('paymentVerificationPending')}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  return (
    <AuthRequiredWrapper requireAuth={true}>
      <div className="relative min-h-screen overflow-hidden">
        <AnimatedBackground />
        <Navigation />
        
        <div className="relative z-10 pt-24 pb-12">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                {t('dashboard')}
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-400">
                {t('manageYourBookings')}
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">{t('overview')}</TabsTrigger>
                <TabsTrigger value="in-progress">{t('inProgress')} ({stats.inProgress})</TabsTrigger>
                <TabsTrigger value="completed">{t('allBookings')} ({bookings.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-6">
                {renderOverview()}
              </TabsContent>
              
              <TabsContent value="in-progress" className="space-y-6">
                {renderInProgressBookings()}
              </TabsContent>
              
              <TabsContent value="completed" className="space-y-6">
                {renderCompletedBookings()}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <Footer />
      </div>
    </AuthRequiredWrapper>
  );
};

export default EnhancedDashboard;