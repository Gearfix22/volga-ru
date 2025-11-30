import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getDraftBookings, deleteDraftBooking, type DraftBooking } from '@/services/bookingService';
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
  ArrowRight
} from 'lucide-react';

interface Booking {
  id: string;
  service_type: string;
  status: string;
  payment_status: string;
  total_price: number;
  created_at: string;
  service_details: any;
}

const UserDashboard = () => {
  const { user, loading: authLoading } = useAuth();
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

      setBookings(bookingsData || []);
      setDraftBookings(drafts);

      const totalBookings = (bookingsData?.length || 0) + drafts.length;
      const confirmedBookings = bookingsData?.filter(b => 
        b.status === 'confirmed' || b.status === 'completed'
      ).length || 0;
      const pendingBookings = bookingsData?.filter(b => 
        b.status === 'pending'
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
        title: 'Error',
        description: 'Failed to load your bookings',
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
        title: 'Deleted',
        description: 'Draft booking removed successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete draft',
        variant: 'destructive'
      });
    }
  };

  const handlePayNow = (booking: Booking) => {
    navigate('/payment', {
      state: { bookingId: booking.id, amount: booking.total_price }
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
    <DashboardLayout title="My Dashboard">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <FileText className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Confirmed</p>
                  <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.inProgress}</p>
                </div>
                <RotateCcw className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Start a new booking or browse our services</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={() => navigate('/booking')} className="flex-1">
                <Plus className="h-4 w-4 mr-2" />
                New Booking
              </Button>
              <Button onClick={() => navigate('/services')} variant="outline" className="flex-1">
                <TrendingUp className="h-4 w-4 mr-2" />
                Browse Services
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Incomplete Bookings Alert */}
        {draftBookings.length > 0 && (
          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                <RotateCcw className="h-5 w-5" />
                Incomplete Bookings ({draftBookings.length})
              </CardTitle>
              <CardDescription>You have bookings that need to be completed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {draftBookings.map(draft => (
                <div key={draft.id} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                  <div>
                    <p className="font-medium">{draft.service_type}</p>
                    <p className="text-sm text-muted-foreground">
                      Last updated: {new Date(draft.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleResumeBooking(draft)} size="sm">
                      <PlayCircle className="h-4 w-4 mr-1" />
                      Resume
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
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
            <CardDescription>Your latest reservations</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No bookings yet</p>
                <Button onClick={() => navigate('/booking')}>
                  Create Your First Booking
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.slice(0, 5).map(booking => (
                  <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        booking.status === 'confirmed' || booking.status === 'completed' 
                          ? 'bg-green-100 dark:bg-green-900/20' 
                          : booking.status === 'pending'
                          ? 'bg-yellow-100 dark:bg-yellow-900/20'
                          : 'bg-red-100 dark:bg-red-900/20'
                      }`}>
                        {booking.status === 'confirmed' || booking.status === 'completed' ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : booking.status === 'pending' ? (
                          <Clock className="h-5 w-5 text-yellow-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{booking.service_type}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(booking.created_at).toLocaleDateString()} • ${booking.total_price?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={
                        booking.status === 'confirmed' || booking.status === 'completed'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : booking.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }>
                        {booking.status}
                      </Badge>
                      {booking.payment_status === 'pending' && (
                        <Button size="sm" onClick={() => handlePayNow(booking)}>
                          <CreditCard className="h-4 w-4 mr-1" />
                          Pay Now
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {bookings.length > 5 && (
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => navigate('/dashboard/reservations')}
                  >
                    View All Bookings
                    <ArrowRight className="h-4 w-4 ml-2" />
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
