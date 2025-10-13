import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Search,
  Mail,
  Phone,
  User,
  CheckCircle,
  XCircle,
  Clock,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { BookingDetailsDialog } from './BookingDetailsDialog';

interface Booking {
  id: string;
  service_type: string;
  status: string;
  payment_status: string;
  total_price: number;
  created_at: string;
  user_info: any;
  service_details: any;
}

export const EnhancedBookingsManagement = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setBookings(data || []);
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      toast({
        title: t('error'),
        description: 'Failed to load bookings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: t('success'),
        description: `Booking status updated to ${newStatus}`,
      });

      fetchBookings();
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const filteredBookings = bookings.filter(booking => 
    booking.user_info?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    booking.user_info?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    booking.user_info?.phone?.includes(searchQuery) ||
    booking.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      pending: { variant: 'secondary', icon: Clock },
      confirmed: { variant: 'default', icon: CheckCircle },
      paid: { variant: 'default', icon: CheckCircle },
      cancelled: { variant: 'destructive', icon: XCircle },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant as any}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t('bookingsManagement')}
              </CardTitle>
              <CardDescription>
                {t('viewAndManageAllBookings')}
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {filteredBookings.length} {t('bookings')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchBookings')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">{t('loading')}</p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('customer')}</TableHead>
                    <TableHead>{t('contactInfo')}</TableHead>
                    <TableHead>{t('serviceType')}</TableHead>
                    <TableHead>{t('price')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
                    <TableHead>{t('paymentStatus')}</TableHead>
                    <TableHead>{t('date')}</TableHead>
                    <TableHead>{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        {t('noBookingsFound')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {booking.user_info?.fullName || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              {booking.user_info?.email || 'N/A'}
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span className="font-mono">{booking.user_info?.phone || 'N/A'}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{booking.service_type}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          ${booking.total_price?.toFixed(2) || '0.00'}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(booking.status)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(booking.payment_status)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(booking.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedBooking(booking);
                                setShowDetails(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {booking.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                                >
                                  Confirm
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <BookingDetailsDialog
        booking={selectedBooking}
        open={showDetails}
        onOpenChange={setShowDetails}
      />
    </>
  );
};