import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { getEnhancedBookings, updateBookingStatus, getBookingStatusHistory } from '@/services/bookingService';
import { 
  Eye, 
  Edit, 
  Clock, 
  CheckCircle, 
  XCircle, 
  DollarSign, 
  Filter,
  Search,
  History,
  AlertTriangle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface BookingFilters {
  status?: string;
  paymentStatus?: string;
  serviceType?: string;
  requiresVerification?: boolean;
  search?: string;
}

export const AdminBookingsTable: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [filters, setFilters] = useState<BookingFilters>({});
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [newPaymentStatus, setNewPaymentStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const { data: bookings, isLoading, refetch } = useQuery({
    queryKey: ['admin-bookings', filters],
    queryFn: () => getEnhancedBookings(filters),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const filteredBookings = bookings?.filter(booking => {
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const userInfo = booking.user_info as any;
      return (
        userInfo?.fullName?.toLowerCase().includes(searchTerm) ||
        userInfo?.email?.toLowerCase().includes(searchTerm) ||
        booking.service_type?.toLowerCase().includes(searchTerm) ||
        booking.transaction_id?.toLowerCase().includes(searchTerm)
      );
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pending': { variant: 'secondary' as const, icon: Clock },
      'confirmed': { variant: 'default' as const, icon: CheckCircle },
      'cancelled': { variant: 'destructive' as const, icon: XCircle },
      'completed': { variant: 'default' as const, icon: CheckCircle }
    };
    
    const config = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (paymentStatus: string) => {
    const statusMap = {
      'pending': { variant: 'secondary' as const, color: 'text-yellow-600' },
      'paid': { variant: 'default' as const, color: 'text-green-600' },
      'failed': { variant: 'destructive' as const, color: 'text-red-600' },
      'awaiting_verification': { variant: 'secondary' as const, color: 'text-orange-600' },
      'cash_on_delivery': { variant: 'outline' as const, color: 'text-blue-600' }
    };
    
    const config = statusMap[paymentStatus as keyof typeof statusMap] || statusMap.pending;
    
    return (
      <Badge variant={config.variant} className={config.color}>
        <DollarSign className="h-3 w-3 mr-1" />
        {paymentStatus}
      </Badge>
    );
  };

  const handleStatusUpdate = async () => {
    if (!selectedBooking || (!newStatus && !newPaymentStatus)) return;
    
    setUpdating(true);
    try {
      if (newStatus) {
        await updateBookingStatus(
          selectedBooking.id,
          newStatus,
          newPaymentStatus || undefined,
          adminNotes || undefined
        );
      }
      
      toast({
        title: t('success'),
        description: t('admin.statusUpdated')
      });
      
      refetch();
      setShowStatusDialog(false);
      resetStatusDialog();
    } catch (error) {
      toast({
        title: t('error'),
        description: t('admin.statusUpdateError'),
        variant: 'destructive'
      });
    } finally {
      setUpdating(false);
    }
  };

  const resetStatusDialog = () => {
    setNewStatus('');
    setNewPaymentStatus('');
    setAdminNotes('');
    setSelectedBooking(null);
  };

  const handleViewHistory = async (booking: any) => {
    try {
      const history = await getBookingStatusHistory(booking.id);
      setStatusHistory(history);
      setSelectedBooking(booking);
      setShowHistoryDialog(true);
    } catch (error) {
      toast({
        title: t('error'),
        description: t('admin.historyLoadError'),
        variant: 'destructive'
      });
    }
  };

  const formatServiceDetails = (booking: any) => {
    const { service_type, service_details } = booking;
    
    switch (service_type) {
      case 'Transportation':
        return `${service_details.pickup} → ${service_details.dropoff}`;
      case 'Hotels':
        return `${service_details.city} - ${service_details.roomType}`;
      case 'Events':
        return `${service_details.eventName} (${service_details.tickets} tickets)`;
      case 'Custom Trips':
        return `${service_details.regions} - ${service_details.duration}`;
      default:
        return 'Details not available';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            {t('admin.bookingsManagement')}
          </CardTitle>
          <CardDescription>
            {t('admin.bookingsManagementDescription')}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-4 w-4" />
            {t('admin.filters')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>{t('admin.search')}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('admin.searchPlaceholder')}
                  value={filters.search || ''}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('admin.status')}</Label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.allStatuses')}</SelectItem>
                  <SelectItem value="pending">{t('admin.pending')}</SelectItem>
                  <SelectItem value="confirmed">{t('admin.confirmed')}</SelectItem>
                  <SelectItem value="cancelled">{t('admin.cancelled')}</SelectItem>
                  <SelectItem value="completed">{t('admin.completed')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('admin.paymentStatus')}</Label>
              <Select
                value={filters.paymentStatus || 'all'}
                onValueChange={(value) => setFilters({ ...filters, paymentStatus: value === 'all' ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.allPaymentStatuses')}</SelectItem>
                  <SelectItem value="pending">{t('admin.paymentPending')}</SelectItem>
                  <SelectItem value="paid">{t('admin.paid')}</SelectItem>
                  <SelectItem value="failed">{t('admin.paymentFailed')}</SelectItem>
                  <SelectItem value="awaiting_verification">{t('admin.awaitingVerification')}</SelectItem>
                  <SelectItem value="cash_on_delivery">{t('admin.cashOnDelivery')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('admin.serviceType')}</Label>
              <Select
                value={filters.serviceType || 'all'}
                onValueChange={(value) => setFilters({ ...filters, serviceType: value === 'all' ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.allServices')}</SelectItem>
                  <SelectItem value="Transportation">{t('services.transportation')}</SelectItem>
                  <SelectItem value="Hotels">{t('services.hotels')}</SelectItem>
                  <SelectItem value="Events">{t('services.events')}</SelectItem>
                  <SelectItem value="Custom Trips">{t('services.customTrips')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.booking')}</TableHead>
                  <TableHead>{t('admin.customer')}</TableHead>
                  <TableHead>{t('admin.service')}</TableHead>
                  <TableHead>{t('admin.amount')}</TableHead>
                  <TableHead>{t('admin.status')}</TableHead>
                  <TableHead>{t('admin.payment')}</TableHead>
                  <TableHead>{t('admin.created')}</TableHead>
                  <TableHead className="text-right">{t('admin.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={8}>
                        <div className="animate-pulse h-4 bg-gray-200 rounded"></div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredBookings?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <p className="text-muted-foreground">{t('admin.noBookings')}</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBookings?.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{booking.transaction_id}</div>
                          <div className="text-sm text-muted-foreground">ID: {booking.id.slice(0, 8)}</div>
                          {booking.requires_verification && (
                            <Badge variant="outline" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {t('admin.requiresVerification')}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{(booking.user_info as any)?.fullName}</div>
                          <div className="text-sm text-muted-foreground">{(booking.user_info as any)?.email}</div>
                          <div className="text-sm text-muted-foreground">{(booking.user_info as any)?.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant="outline">{booking.service_type}</Badge>
                          <div className="text-sm text-muted-foreground">
                            {formatServiceDetails(booking)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">${booking.total_price}</div>
                          <div className="text-sm text-muted-foreground">{booking.payment_method}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(booking.status)}</TableCell>
                      <TableCell>{getPaymentStatusBadge(booking.payment_status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDistanceToNow(new Date(booking.created_at), { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewHistory(booking)}
                          >
                            <History className="h-4 w-4" />
                          </Button>

                          <Dialog open={showStatusDialog && selectedBooking?.id === booking.id} onOpenChange={setShowStatusDialog}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedBooking(booking);
                                  setNewStatus(booking.status);
                                  setNewPaymentStatus(booking.payment_status);
                                  setAdminNotes(booking.admin_notes || '');
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>{t('admin.updateBookingStatus')}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label>{t('admin.bookingStatus')}</Label>
                                  <Select value={newStatus} onValueChange={setNewStatus}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">{t('admin.pending')}</SelectItem>
                                      <SelectItem value="confirmed">{t('admin.confirmed')}</SelectItem>
                                      <SelectItem value="cancelled">{t('admin.cancelled')}</SelectItem>
                                      <SelectItem value="completed">{t('admin.completed')}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label>{t('admin.paymentStatus')}</Label>
                                  <Select value={newPaymentStatus} onValueChange={setNewPaymentStatus}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">{t('admin.paymentPending')}</SelectItem>
                                      <SelectItem value="paid">{t('admin.paid')}</SelectItem>
                                      <SelectItem value="failed">{t('admin.paymentFailed')}</SelectItem>
                                      <SelectItem value="awaiting_verification">{t('admin.awaitingVerification')}</SelectItem>
                                      <SelectItem value="cash_on_delivery">{t('admin.cashOnDelivery')}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label>{t('admin.adminNotes')}</Label>
                                  <Textarea
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder={t('admin.adminNotesPlaceholder')}
                                    rows={3}
                                  />
                                </div>

                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
                                    {t('common.cancel')}
                                  </Button>
                                  <Button onClick={handleStatusUpdate} disabled={updating}>
                                    {updating ? t('admin.updating') : t('admin.updateStatus')}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Status History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              {t('admin.bookingHistory')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {statusHistory.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {t('admin.noHistoryAvailable')}
              </p>
            ) : (
              statusHistory.map((entry, index) => (
                <div key={entry.id} className="border-l-2 border-gray-200 pl-4 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">
                      {entry.old_status} → {entry.new_status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  {entry.notes && (
                    <p className="text-sm text-muted-foreground">{entry.notes}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};