import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';

// Import the content from EnhancedDashboard without the layout wrapper
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
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

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <DashboardLayout title="My Dashboard">
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
                <FileText className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('confirmed')}</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.confirmed}</p>
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
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
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
                  <p className="text-2xl font-bold text-primary">{stats.inProgress}</p>
                </div>
                <RotateCcw className="h-8 w-8 text-primary" />
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
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
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
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">{booking.service_type}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(booking.created_at).toLocaleDateString()} • ${booking.total_price?.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                      {booking.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default UserDashboard;