import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Loader2, 
  DollarSign, 
  Check, 
  X, 
  RefreshCw,
  MessageCircle,
  ArrowUpDown,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { 
  setAdminPrice, 
  acceptProposedPrice, 
  rejectProposedPrice 
} from '@/services/priceNegotiationService';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface NegotiationBooking {
  id: string;
  service_type: string;
  total_price: number | null;
  customer_proposed_price: number | null;
  price_confirmed: boolean | null;
  price_confirmed_at: string | null;
  created_at: string;
  user_info: any;
  status: string;
}

export const AdminPriceNegotiations = () => {
  const [bookings, setBookings] = useState<NegotiationBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [counterOfferDialog, setCounterOfferDialog] = useState<{open: boolean; booking: NegotiationBooking | null}>({
    open: false,
    booking: null
  });
  const [setPriceDialog, setSetPriceDialog] = useState<{open: boolean; booking: NegotiationBooking | null}>({
    open: false,
    booking: null
  });
  const [counterPrice, setCounterPrice] = useState('');
  const [newPrice, setNewPrice] = useState('');

  useEffect(() => {
    fetchNegotiations();

    const channel = supabase
      .channel('price-negotiations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchNegotiations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNegotiations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select('id, service_type, total_price, customer_proposed_price, price_confirmed, price_confirmed_at, created_at, user_info, status')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching negotiations:', error);
      toast.error('Failed to fetch price negotiations');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptProposal = async (bookingId: string) => {
    try {
      setActionLoading(bookingId);
      const success = await acceptProposedPrice(bookingId);
      if (success) {
        toast.success('Customer proposal accepted');
        fetchNegotiations();
      } else {
        toast.error('Failed to accept proposal');
      }
    } catch (error) {
      console.error('Error accepting proposal:', error);
      toast.error('Failed to accept proposal');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectWithCounter = async () => {
    if (!counterOfferDialog.booking || !counterPrice) return;
    
    const price = parseFloat(counterPrice);
    if (isNaN(price) || price <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    try {
      setActionLoading(counterOfferDialog.booking.id);
      const success = await rejectProposedPrice(counterOfferDialog.booking.id, price);
      if (success) {
        toast.success('Counter-offer sent to customer');
        setCounterOfferDialog({ open: false, booking: null });
        setCounterPrice('');
        fetchNegotiations();
      } else {
        toast.error('Failed to send counter-offer');
      }
    } catch (error) {
      console.error('Error sending counter-offer:', error);
      toast.error('Failed to send counter-offer');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSetInitialPrice = async () => {
    if (!setPriceDialog.booking || !newPrice) return;
    
    const price = parseFloat(newPrice);
    if (isNaN(price) || price <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    try {
      setActionLoading(setPriceDialog.booking.id);
      const success = await setAdminPrice(setPriceDialog.booking.id, price);
      if (success) {
        toast.success('Price set and customer notified');
        setSetPriceDialog({ open: false, booking: null });
        setNewPrice('');
        fetchNegotiations();
      } else {
        toast.error('Failed to set price');
      }
    } catch (error) {
      console.error('Error setting price:', error);
      toast.error('Failed to set price');
    } finally {
      setActionLoading(null);
    }
  };

  // Filter bookings that need price action
  const pendingProposals = bookings.filter(b => b.customer_proposed_price && !b.price_confirmed);
  const awaitingPrice = bookings.filter(b => !b.total_price && b.status === 'pending');
  const awaitingConfirmation = bookings.filter(b => b.total_price && !b.price_confirmed && !b.customer_proposed_price);
  const confirmedPrices = bookings.filter(b => b.price_confirmed);

  const getStatusBadge = (booking: NegotiationBooking) => {
    if (booking.price_confirmed) {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Confirmed</Badge>;
    }
    if (booking.customer_proposed_price) {
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Customer Proposal</Badge>;
    }
    if (!booking.total_price) {
      return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">Needs Price</Badge>;
    }
    return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">Awaiting Response</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={pendingProposals.length > 0 ? 'border-blue-300 bg-blue-50 dark:bg-blue-950/30' : ''}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Customer Proposals</p>
                <p className="text-2xl font-bold text-blue-600">{pendingProposals.length}</p>
              </div>
              <MessageCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className={awaitingPrice.length > 0 ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/30' : ''}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Needs Pricing</p>
                <p className="text-2xl font-bold text-amber-600">{awaitingPrice.length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Awaiting Customer</p>
                <p className="text-2xl font-bold text-purple-600">{awaitingConfirmation.length}</p>
              </div>
              <ArrowUpDown className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Confirmed</p>
                <p className="text-2xl font-bold text-green-600">{confirmedPrices.length}</p>
              </div>
              <Check className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Customer Proposals - Priority Section */}
      {pendingProposals.length > 0 && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <MessageCircle className="h-5 w-5" />
              Customer Price Proposals ({pendingProposals.length})
            </CardTitle>
            <CardDescription>
              Customers have proposed different prices - respond to accept or counter
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Your Price</TableHead>
                    <TableHead>Their Proposal</TableHead>
                    <TableHead>Difference</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingProposals.map((booking) => {
                    const difference = (booking.customer_proposed_price || 0) - (booking.total_price || 0);
                    return (
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
                        <TableCell className="font-medium">${booking.total_price?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell className="font-bold text-blue-600">${booking.customer_proposed_price?.toFixed(2)}</TableCell>
                        <TableCell className={difference < 0 ? 'text-red-600' : 'text-green-600'}>
                          {difference >= 0 ? '+' : ''}${difference.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleAcceptProposal(booking.id)}
                              disabled={actionLoading === booking.id}
                            >
                              {actionLoading === booking.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Check className="h-4 w-4 mr-1" />
                                  Accept
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setCounterOfferDialog({ open: true, booking });
                                setCounterPrice(booking.total_price?.toString() || '');
                              }}
                              disabled={actionLoading === booking.id}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Counter
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bookings Needing Price */}
      {awaitingPrice.length > 0 && (
        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <AlertCircle className="h-5 w-5" />
              Bookings Needing Price ({awaitingPrice.length})
            </CardTitle>
            <CardDescription>
              Set a price for these bookings so customers can proceed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {awaitingPrice.map((booking) => (
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
                      <TableCell>{getStatusBadge(booking)}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSetPriceDialog({ open: true, booking });
                            setNewPrice('');
                          }}
                          disabled={actionLoading === booking.id}
                        >
                          <DollarSign className="h-4 w-4 mr-1" />
                          Set Price
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Negotiations Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                All Price Negotiations
              </CardTitle>
              <CardDescription>
                Complete history of price negotiations ({bookings.length} total)
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchNegotiations} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No negotiations found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Admin Price</TableHead>
                    <TableHead>Customer Offer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Confirmed At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
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
                      <TableCell className="font-medium">
                        {booking.total_price ? `$${booking.total_price.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell>
                        {booking.customer_proposed_price ? (
                          <span className="text-blue-600 font-medium">
                            ${booking.customer_proposed_price.toFixed(2)}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(booking)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {booking.price_confirmed_at 
                          ? format(new Date(booking.price_confirmed_at), 'MMM d, yyyy HH:mm')
                          : '-'
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Counter Offer Dialog */}
      <Dialog open={counterOfferDialog.open} onOpenChange={(open) => setCounterOfferDialog({ open, booking: open ? counterOfferDialog.booking : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Counter-Offer</DialogTitle>
            <DialogDescription>
              Customer proposed ${counterOfferDialog.booking?.customer_proposed_price?.toFixed(2)}. 
              Enter your counter-offer price.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Counter Price</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.01"
                  value={counterPrice}
                  onChange={(e) => setCounterPrice(e.target.value)}
                  placeholder="Enter price"
                  className="pl-8"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCounterOfferDialog({ open: false, booking: null })}>
              Cancel
            </Button>
            <Button onClick={handleRejectWithCounter} disabled={actionLoading !== null}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Send Counter-Offer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set Price Dialog */}
      <Dialog open={setPriceDialog.open} onOpenChange={(open) => setSetPriceDialog({ open, booking: open ? setPriceDialog.booking : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Booking Price</DialogTitle>
            <DialogDescription>
              Set the price for this {setPriceDialog.booking?.service_type} booking. 
              The customer will be notified and can accept or propose a different price.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Price (USD)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.01"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="Enter price"
                  className="pl-8"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSetPriceDialog({ open: false, booking: null })}>
              Cancel
            </Button>
            <Button onClick={handleSetInitialPrice} disabled={actionLoading !== null}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Set Price & Notify Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPriceNegotiations;
