import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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

      // Calculate stats
      const total = bookingsData?.length || 0;
      const confirmed = bookingsData?.filter(b => b.status === 'confirmed' || b.status === 'completed').length || 0;
      const pending = bookingsData?.filter(b => b.status === 'pending').length || 0;

      setStats({
        total,
        confirmed,
        pending,
        drafts: drafts.length
      });
    } catch (error) {
      console.error('Error fetching data:', error);
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
        title: 'Deleted',
        description: 'Draft booking removed successfully'
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
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatServiceDetails = (serviceType: string, details: any) => {
    if (!details) return 'N/A';
    switch (serviceType) {
      case 'Transportation':
        return `${details.pickup || 'N/A'} → ${details.dropoff || 'N/A'}`;
      case 'Hotels':
        return `${details.city || 'N/A'} - ${details.hotel || 'N/A'}`;
      case 'Events':
        return `${details.eventName || 'N/A'}`;
      case 'Custom Trips':
        return `${details.duration || 'N/A'} in ${details.regions || 'N/A'}`;
      default:
        return 'N/A';
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
                <p className="text-sm text-muted-foreground">Total Bookings</p>
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
                <p className="text-sm text-muted-foreground">Confirmed</p>
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
                <p className="text-sm text-muted-foreground">Pending</p>
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
                <p className="text-sm text-muted-foreground">Drafts</p>
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
          New Booking
        </Button>
        <Button variant="outline" onClick={() => navigate('/services')} className="gap-2">
          Browse Services
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="overview">My Bookings</TabsTrigger>
          <TabsTrigger value="drafts">
            Incomplete
            {stats.drafts > 0 && (
              <Badge variant="secondary" className="ml-2">{stats.drafts}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Bookings</CardTitle>
              <CardDescription>Your ongoing and confirmed reservations</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : bookings.filter(b => b.status !== 'cancelled' && b.status !== 'completed').length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No active bookings</p>
                  <Button className="mt-4" onClick={() => navigate('/booking')}>
                    Make a Booking
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.filter(b => b.status !== 'cancelled' && b.status !== 'completed').map((booking) => (
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
                            Booked on {new Date(booking.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-semibold">${booking.total_price?.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">
                              Payment: {booking.payment_status}
                            </p>
                          </div>
                          {booking.payment_status === 'pending' && (
                            <Button size="sm" onClick={() => handlePayNow(booking)}>
                              <CreditCard className="h-4 w-4 mr-1" />
                              Pay Now
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
                Incomplete Bookings
              </CardTitle>
              <CardDescription>Resume your saved booking drafts</CardDescription>
            </CardHeader>
            <CardContent>
              {draftBookings.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No incomplete bookings</p>
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
                            Started on {new Date(draft.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Last updated: {new Date(draft.updated_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => handleResumeBooking(draft)}>
                            <ArrowRight className="h-4 w-4 mr-1" />
                            Resume
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
              <CardTitle>Booking History</CardTitle>
              <CardDescription>All your past reservations</CardDescription>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No booking history</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Service</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Amount</TableHead>
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
