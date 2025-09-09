import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface Booking {
  id: string;
  service_type: string;
  status: string;
  payment_status: string;
  total_price: number;
  created_at: string;
  user_info: any;
  user_id: string;
}

const BookingsManagement = () => {
  const { t } = useLanguage();
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  useEffect(() => {
    if (hasRole('admin')) {
      fetchBookings();
      
      // Set up real-time subscription
      const channel = supabase
        .channel('admin-bookings-table')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'bookings' 
        }, () => {
          fetchBookings();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [hasRole]);

  useEffect(() => {
    filterBookings();
  }, [bookings, searchQuery, statusFilter, paymentFilter]);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch bookings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = bookings;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(booking =>
        booking.service_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.user_info?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    // Payment filter
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(booking => booking.payment_status === paymentFilter);
    }

    setFilteredBookings(filtered);
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Booking status updated to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: 'Error',
        description: 'Failed to update booking status',
        variant: 'destructive'
      });
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

  if (!hasRole('admin')) {
    return (
      <DashboardLayout title="Access Denied">
        <div className="text-center py-8">
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Bookings Management">
      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search bookings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setPaymentFilter('all');
              }}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bookings Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              All Bookings ({filteredBookings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveTable
              data={filteredBookings}
              loading={loading}
              columns={[
                {
                  key: 'id',
                  label: 'ID',
                  render: (value) => (
                    <span className="font-mono text-sm">{value.slice(0, 8)}...</span>
                  )
                },
                {
                  key: 'service_type',
                  label: 'Service',
                  className: 'font-medium'
                },
                {
                  key: 'user_info',
                  label: 'Customer',
                  render: (value) => value?.fullName || value?.email || 'N/A'
                },
                {
                  key: 'total_price',
                  label: 'Amount',
                  render: (value) => `$${value?.toFixed(2) || '0.00'}`
                },
                {
                  key: 'status',
                  label: 'Status',
                  render: (value) => (
                    <Badge className={getStatusColor(value)}>{value}</Badge>
                  )
                },
                {
                  key: 'payment_status',
                  label: 'Payment',
                  render: (value) => (
                    <Badge className={getStatusColor(value)}>{value}</Badge>
                  )
                },
                {
                  key: 'created_at',
                  label: 'Date',
                  render: (value) => new Date(value).toLocaleDateString()
                }
              ]}
              actions={(booking) => (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  {booking.status === 'pending' && (
                    <>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                      >
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                      >
                        <XCircle className="h-4 w-4 text-red-600" />
                      </Button>
                    </>
                  )}
                </div>
              )}
              emptyState={
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No bookings found</p>
                </div>
              }
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default BookingsManagement;