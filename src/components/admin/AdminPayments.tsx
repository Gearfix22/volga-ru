import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2, Search, CreditCard, CheckCircle, XCircle, Clock, Trash2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { updatePaymentStatus, deleteBooking } from '@/services/adminService';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface PaymentBooking {
  id: string;
  service_type: string;
  total_price: number | null;
  payment_status: string | null;
  payment_method: string | null;
  transaction_id: string | null;
  created_at: string;
  user_info: any;
}

export const AdminPayments = () => {
  const [bookings, setBookings] = useState<PaymentBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<PaymentBooking | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments();

    const channel = supabase
      .channel('payments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchPayments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select('id, service_type, total_price, payment_status, payment_method, transaction_id, created_at, user_info')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePaymentStatus = async (bookingId: string, newStatus: string) => {
    try {
      setActionLoading(bookingId);
      await updatePaymentStatus(bookingId, newStatus);
      toast.success('Payment status updated');
      fetchPayments();
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Failed to update payment status');
    } finally {
      setActionLoading(null);
    }
  };

  const confirmDeletePayment = (payment: PaymentBooking) => {
    setPaymentToDelete(payment);
    setDeleteDialogOpen(true);
  };

  const handleDeletePayment = async () => {
    if (!paymentToDelete) return;
    
    try {
      setActionLoading(paymentToDelete.id);
      await deleteBooking(paymentToDelete.id);
      toast.success('Payment record deleted');
      setDeleteDialogOpen(false);
      setPaymentToDelete(null);
      fetchPayments();
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast.error('Failed to delete payment');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.service_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (booking.user_info as any)?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.transaction_id?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.payment_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" /> Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'pending_verification':
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" /> Awaiting Verification</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" /> Failed</Badge>;
      default:
        return <Badge variant="secondary">{status || 'Unknown'}</Badge>;
    }
  };

  const totalRevenue = bookings
    .filter(b => b.payment_status === 'paid')
    .reduce((sum, b) => sum + (b.total_price || 0), 0);

  const pendingAmount = bookings
    .filter(b => b.payment_status === 'pending' || b.payment_status === 'pending_verification')
    .reduce((sum, b) => sum + (b.total_price || 0), 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">${totalRevenue.toFixed(2)}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Amount</p>
                <p className="text-2xl font-bold text-yellow-600">${pendingAmount.toFixed(2)}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">{bookings.length}</p>
              </div>
              <CreditCard className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Management
              </CardTitle>
              <CardDescription>
                Manage and track all payments ({filteredBookings.length} records)
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" size="sm" onClick={fetchPayments} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search payments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-48"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="pending_verification">Awaiting Verification</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No payments found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(booking.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{(booking.user_info as any)?.fullName || 'N/A'}</p>
                          <p className="text-xs text-muted-foreground">{(booking.user_info as any)?.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{booking.service_type.replace(/_/g, ' ')}</TableCell>
                      <TableCell className="capitalize">{booking.payment_method || 'N/A'}</TableCell>
                      <TableCell className="font-medium">${booking.total_price?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell>{getStatusBadge(booking.payment_status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Select
                            value={booking.payment_status || 'pending'}
                            onValueChange={(value) => handleUpdatePaymentStatus(booking.id, value)}
                            disabled={actionLoading === booking.id}
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="pending_verification">Verify</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="failed">Failed</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => confirmDeletePayment(booking)}
                            disabled={actionLoading === booking.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Payment Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payment record for {(paymentToDelete?.user_info as any)?.fullName || 'this customer'}? 
              This will also delete the associated booking. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeletePayment} 
              className="bg-destructive text-destructive-foreground"
            >
              Delete Record
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPayments;
