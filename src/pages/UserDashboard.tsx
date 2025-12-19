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
import { CustomerBookingTimeline } from '@/components/booking/CustomerBookingTimeline';
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
}

// Expandable booking card with timeline
function BookingCardWithTimeline({ booking, onPayNow }: { booking: Booking; onPayNow: (b: Booking) => void }) {
  const [expanded, setExpanded] = useState(false);
  
  const isActiveBooking = ['pending', 'confirmed', 'assigned', 'accepted', 'on_trip'].includes(booking.status);

  return (
    <div className="border rounded-lg overflow-hidden">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
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
              : booking.status === 'on_trip' || booking.status === 'assigned' || booking.status === 'accepted'
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
          }>
            {booking.status}
          </Badge>
          {booking.payment_status === 'pending' && (
            <Button size="sm" onClick={(e) => { e.stopPropagation(); onPayNow(booking); }}>
              <CreditCard className="h-4 w-4 mr-1" />
              Pay Now
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
      <div className="space-y-8">
        {/* Back to Home Button */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Welcome Back!</h2>
            <p className="text-muted-foreground">Manage your bookings and account settings</p>
          </div>
          <Button onClick={() => navigate('/')} variant="outline" size="lg">
            <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
            Back to Home
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Bookings</p>
                  <p className="text-3xl font-bold text-foreground">{stats.total}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Confirmed</p>
                  <p className="text-3xl font-bold text-green-600">{stats.confirmed}</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">In Progress</p>
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
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Start a new booking or browse our services</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={() => navigate('/booking')} className="flex-1" size="lg">
                <Plus className="h-5 w-5 mr-2" />
                New Booking
              </Button>
              <Button onClick={() => navigate('/services')} variant="outline" className="flex-1" size="lg">
                <TrendingUp className="h-5 w-5 mr-2" />
                Browse Services
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Incomplete Bookings Alert */}
        {draftBookings.length > 0 && (
          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                <RotateCcw className="h-5 w-5" />
                Incomplete Bookings ({draftBookings.length})
              </CardTitle>
              <CardDescription>You have bookings that need to be completed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {draftBookings.map(draft => (
                <div key={draft.id} className="flex items-center justify-between p-4 bg-background rounded-lg border shadow-sm">
                  <div>
                    <p className="font-semibold text-foreground">{draft.service_type}</p>
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
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Recent Bookings</CardTitle>
            <CardDescription>Your latest reservations</CardDescription>
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
                <p className="text-muted-foreground mb-4">No bookings yet</p>
                <Button onClick={() => navigate('/booking')}>
                  Create Your First Booking
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
