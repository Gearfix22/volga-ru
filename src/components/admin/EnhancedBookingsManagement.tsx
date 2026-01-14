import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  Search,
  Mail,
  Phone,
  User,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Edit,
  Save,
  FileEdit,
  AlertCircle,
  RefreshCw,
  Trash2,
  Car,
  MapPin,
  Archive
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BookingDetailsDialog } from './BookingDetailsDialog';
import { RejectBookingModal } from './RejectBookingModal';
import { DriverAssignmentSelect } from './DriverAssignmentSelect';
import { GuideAssignmentSelect } from './GuideAssignmentSelect';
import { BookingStatusTimeline } from '@/components/booking/BookingStatusTimeline';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getAdminBookings,
  confirmBooking,
  rejectBooking,
  updateBooking,
  updatePaymentStatus,
  deleteBooking,
  setBookingPrice,
} from '@/services/adminService';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ACTIVE_STATUSES, FINAL_STATUSES } from '@/utils/bookingWorkflow';

interface Booking {
  id: string;
  service_type: string;
  status: string;
  payment_status: string;
  total_price: number;
  created_at: string;
  user_info: any;
  service_details: any;
  admin_notes: string | null;
  customer_notes: string | null;
  payment_method: string | null;
  transaction_id: string | null;
  assigned_driver_id: string | null;
  assigned_guide_id: string | null;
  driver_required: boolean;
}

interface DraftBooking {
  id: string;
  service_type: string;
  booking_progress: string;
  total_price: number | null;
  created_at: string;
  updated_at: string;
  user_info: any;
  service_details: any;
}

export const EnhancedBookingsManagement = () => {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [draftBookings, setDraftBookings] = useState<DraftBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  
  // Rejection modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [bookingToReject, setBookingToReject] = useState<Booking | null>(null);

  // Delete modal state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);

  // Price editing state
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [priceValue, setPriceValue] = useState('');

  useEffect(() => {
    fetchBookings();
    fetchDraftBookings();

    // Real-time subscription for UI updates (including booking_prices for price changes)
    const channel = supabase
      .channel('admin-bookings-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchBookings();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'booking_prices' }, () => {
        // Refetch when prices change (SINGLE SOURCE OF TRUTH)
        fetchBookings();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'draft_bookings' }, () => {
        fetchDraftBookings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await getAdminBookings({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        payment_status: paymentFilter !== 'all' ? paymentFilter : undefined,
      });
      setBookings(data || []);
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load bookings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDraftBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('draft_bookings')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setDraftBookings(data || []);
    } catch (error: any) {
      console.error('Error fetching draft bookings:', error);
    }
  };

  // Refetch when filters change
  useEffect(() => {
    if (!loading) {
      fetchBookings();
    }
  }, [statusFilter, paymentFilter]);

  const handleConfirmBooking = async (booking: Booking) => {
    try {
      setActionLoading(booking.id);
      await confirmBooking(booking.id);
      
      // Optimistic update
      setBookings(prev => prev.map(b => 
        b.id === booking.id ? { ...b, status: 'confirmed' } : b
      ));
      
      toast({
        title: 'Success',
        description: `Booking confirmed successfully`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
      fetchBookings(); // Refresh on error
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (booking: Booking) => {
    setBookingToReject(booking);
    setRejectModalOpen(true);
  };

  const handleRejectBooking = async (reason: string) => {
    if (!bookingToReject) return;
    
    try {
      setActionLoading(bookingToReject.id);
      await rejectBooking(bookingToReject.id, reason);
      
      // Optimistic update
      setBookings(prev => prev.map(b => 
        b.id === bookingToReject.id 
          ? { ...b, status: 'cancelled', admin_notes: `Rejected: ${reason}` } 
          : b
      ));
      
      toast({
        title: 'Booking Rejected',
        description: `Booking has been rejected and customer will be notified`,
      });
      
      setRejectModalOpen(false);
      setBookingToReject(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
      fetchBookings();
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    try {
      setActionLoading(bookingId);
      await updateBooking(bookingId, { status: newStatus });
      
      // Optimistic update
      setBookings(prev => prev.map(b => 
        b.id === bookingId ? { ...b, status: newStatus } : b
      ));
      
      toast({
        title: 'Success',
        description: `Booking status updated to ${newStatus}`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
      fetchBookings();
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdatePaymentStatus = async (bookingId: string, newStatus: string) => {
    try {
      setActionLoading(bookingId);
      await updatePaymentStatus(bookingId, newStatus);
      
      // Optimistic update
      setBookings(prev => prev.map(b => 
        b.id === bookingId ? { ...b, payment_status: newStatus } : b
      ));
      
      toast({
        title: 'Success',
        description: 'Payment status updated',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
      fetchBookings();
    } finally {
      setActionLoading(null);
    }
  };

  const saveAdminNote = async (bookingId: string) => {
    try {
      setActionLoading(bookingId);
      await updateBooking(bookingId, { admin_notes: noteText });
      
      // Optimistic update
      setBookings(prev => prev.map(b => 
        b.id === bookingId ? { ...b, admin_notes: noteText } : b
      ));
      
      toast({
        title: 'Success',
        description: 'Note saved successfully',
      });
      setEditingNotes(null);
      setNoteText('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const savePrice = async (bookingId: string) => {
    const trimmedValue = priceValue.trim();
    
    // Validate input
    if (!trimmedValue) {
      toast({
        title: 'Invalid Price',
        description: 'Please enter a price value',
        variant: 'destructive'
      });
      return;
    }
    
    const newPrice = parseFloat(trimmedValue);
    
    if (isNaN(newPrice)) {
      toast({
        title: 'Invalid Price',
        description: 'Please enter a valid number',
        variant: 'destructive'
      });
      return;
    }
    
    if (newPrice <= 0) {
      toast({
        title: 'Invalid Price',
        description: 'Price must be greater than zero',
        variant: 'destructive'
      });
      return;
    }

    try {
      setActionLoading(bookingId);
      
      // Store original price for rollback
      const originalBooking = bookings.find(b => b.id === bookingId);
      const originalPrice = originalBooking?.total_price;
      
      // Optimistic update first for instant feedback
      setBookings(prev => prev.map(b => 
        b.id === bookingId ? { ...b, total_price: newPrice, status: 'awaiting_customer_confirmation' } : b
      ));
      
      // CRITICAL: Use setBookingPrice which writes to booking_prices table
      // This is the SINGLE SOURCE OF TRUTH for pricing
      const result = await setBookingPrice(bookingId, newPrice, { lock: true });
      
      if (!result.success) {
        // Rollback on failure
        setBookings(prev => prev.map(b => 
          b.id === bookingId ? { ...b, total_price: originalPrice ?? 0, status: originalBooking?.status || 'pending' } : b
        ));
        throw new Error(result.error || 'Failed to set price');
      }
      
      toast({
        title: 'Price Set & Locked',
        description: `Price set to $${newPrice.toFixed(2)} - Customer can now pay`,
      });
      
      setEditingPrice(null);
      setPriceValue('');
      
      // Refetch to get updated data
      fetchBookings();
    } catch (error: any) {
      console.error('Price update error:', error);
      toast({
        title: 'Error Setting Price',
        description: error.message || 'Failed to save price. Please try again.',
        variant: 'destructive'
      });
      // Refresh to get actual state from server
      fetchBookings();
    } finally {
      setActionLoading(null);
    }
  };

  const confirmDeleteBooking = (booking: Booking) => {
    setBookingToDelete(booking);
    setDeleteDialogOpen(true);
  };

  const handleDeleteBooking = async () => {
    if (!bookingToDelete) return;
    
    try {
      setActionLoading(bookingToDelete.id);
      await deleteBooking(bookingToDelete.id);
      
      // Optimistic update
      setBookings(prev => prev.filter(b => b.id !== bookingToDelete.id));
      
      toast({
        title: 'Success',
        description: 'Booking deleted successfully',
      });
      setDeleteDialogOpen(false);
      setBookingToDelete(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
      fetchBookings();
    } finally {
      setActionLoading(null);
    }
  };

  // FIXED: Separate active vs archived bookings using status
  const activeBookings = useMemo(() => {
    return bookings.filter(b => ACTIVE_STATUSES.includes(b.status));
  }, [bookings]);

  const archivedBookings = useMemo(() => {
    return bookings.filter(b => FINAL_STATUSES.includes(b.status));
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    const sourceBookings = activeTab === 'active' ? activeBookings : archivedBookings;
    return sourceBookings.filter(booking => {
      const matchesSearch = 
        booking.user_info?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.user_info?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.user_info?.phone?.includes(searchQuery) ||
        booking.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [activeBookings, archivedBookings, activeTab, searchQuery]);

  const getStatusBadge = (status: string) => {
    // FINAL WORKFLOW status labels
    const config: Record<string, { variant: any; icon: any; label: string }> = {
      draft: { variant: 'secondary', icon: Clock, label: 'Draft' },
      under_review: { variant: 'secondary', icon: Clock, label: 'Under Review' },
      awaiting_customer_confirmation: { variant: 'default', icon: AlertCircle, label: 'Awaiting Confirmation' },
      paid: { variant: 'default', icon: CheckCircle, label: 'Paid' },
      in_progress: { variant: 'default', icon: Car, label: 'In Progress' },
      completed: { variant: 'outline', icon: CheckCircle, label: 'Completed' },
      cancelled: { variant: 'destructive', icon: XCircle, label: 'Cancelled' },
      rejected: { variant: 'destructive', icon: XCircle, label: 'Rejected' },
      // Legacy support
      pending: { variant: 'secondary', icon: Clock, label: 'Pending' },
      confirmed: { variant: 'default', icon: CheckCircle, label: 'Confirmed' },
    };

    const { variant, icon: Icon, label } = config[status] || { variant: 'secondary', icon: Clock, label: status };

    return (
      <Badge variant={variant}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="active">
            Active Bookings
            {activeBookings.length > 0 && (
              <Badge variant="secondary" className="ml-2">{activeBookings.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="archived">
            Archived
            {archivedBookings.length > 0 && (
              <Badge variant="outline" className="ml-2">{archivedBookings.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="drafts">
            Drafts
            {draftBookings.length > 0 && (
              <Badge variant="secondary" className="ml-2">{draftBookings.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Active Bookings
                  </CardTitle>
                  <CardDescription>
                    Bookings that are pending, in progress, or awaiting action
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => fetchBookings()}
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Badge variant="outline" className="text-lg px-4 py-2">
                    {filteredBookings.length} Active
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, phone, ID..."
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
                    <SelectItem value="pending">Requested</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="assigned">Driver Assigned</SelectItem>
                    <SelectItem value="accepted">Driver Confirmed</SelectItem>
                    <SelectItem value="on_trip">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by payment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payments</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending_verification">Pending Verification</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">Loading bookings...</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Driver</TableHead>
                        <TableHead>Guide</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBookings.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                            No bookings found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredBookings.map((booking) => (
                          <TableRow key={booking.id} className={actionLoading === booking.id ? 'opacity-50' : ''}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                {booking.user_info?.fullName || 'N/A'}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {new Date(booking.created_at).toLocaleDateString()}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1 text-sm">
                                <div className="flex items-center gap-1">
                                  <Mail className="h-3 w-3 text-muted-foreground" />
                                  <span className="truncate max-w-[150px]">{booking.user_info?.email || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3 text-muted-foreground" />
                                  <span className="font-mono text-primary font-semibold">{booking.user_info?.phone || 'N/A'}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <Badge variant="outline">{booking.service_type}</Badge>
                                {booking.driver_required && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Car className="h-3 w-3 mr-1" />
                                    Driver needed
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {editingPrice === booking.id ? (
                                <div className="flex items-center gap-1">
                                  <Input
                                    type="number"
                                    value={priceValue}
                                    onChange={(e) => setPriceValue(e.target.value)}
                                    className="w-20 h-8"
                                    min="0"
                                    step="0.01"
                                  />
                                  <Button 
                                    size="sm" 
                                    className="h-8 px-2"
                                    onClick={() => savePrice(booking.id)}
                                    disabled={actionLoading === booking.id}
                                  >
                                    <Save className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-8 px-2"
                                    onClick={() => {
                                      setEditingPrice(null);
                                      setPriceValue('');
                                    }}
                                  >
                                    ✕
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <span className="font-semibold">${booking.total_price?.toFixed(2) || '0.00'}</span>
                                  {/* Allow price edit before payment is completed */}
                                  {booking.payment_status !== 'paid' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 px-2 ml-1"
                                      onClick={() => {
                                        setEditingPrice(booking.id);
                                        setPriceValue(booking.total_price?.toString() || '0');
                                      }}
                                      disabled={actionLoading === booking.id}
                                    >
                                      <Edit className="h-3 w-3 mr-1" />
                                      Edit
                                    </Button>
                                  )}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-2">
                                <BookingStatusTimeline currentStatus={booking.status} compact />
                                <Select
                                  value={booking.status}
                                  onValueChange={(value) => handleUpdateStatus(booking.id, value)}
                                  disabled={actionLoading === booking.id}
                                >
                                  <SelectTrigger className="w-[130px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="confirmed">Confirmed</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="assigned">Assigned</SelectItem>
                                    <SelectItem value="accepted">Accepted</SelectItem>
                                    <SelectItem value="on_trip">On Trip</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={booking.payment_status}
                                onValueChange={(value) => handleUpdatePaymentStatus(booking.id, value)}
                                disabled={actionLoading === booking.id}
                              >
                                <SelectTrigger className="w-[130px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="paid">Paid</SelectItem>
                                  <SelectItem value="cash_on_delivery">Cash on Arrival</SelectItem>
                                  <SelectItem value="pending_verification">Verifying</SelectItem>
                                  <SelectItem value="awaiting_quote">Awaiting Quote</SelectItem>
                                  <SelectItem value="awaiting_payment">Awaiting Payment</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              {booking.driver_required ? (
                                <DriverAssignmentSelect
                                  bookingId={booking.id}
                                  currentDriverId={booking.assigned_driver_id}
                                  onAssigned={fetchBookings}
                                  disabled={actionLoading === booking.id || booking.status === 'cancelled' || booking.status === 'completed' || booking.status === 'pending'}
                                />
                              ) : (
                                <span className="text-sm text-muted-foreground">Not required</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {booking.service_type === 'tourist_guide' || booking.service_type === 'Guide' ? (
                                <GuideAssignmentSelect
                                  bookingId={booking.id}
                                  currentGuideId={booking.assigned_guide_id}
                                  onAssigned={fetchBookings}
                                  disabled={actionLoading === booking.id || booking.status === 'cancelled' || booking.status === 'completed' || booking.status === 'pending'}
                                  tourDetails={{
                                    tour_date: booking.service_details?.tour_date,
                                    tour_start_time: booking.service_details?.tour_start_time,
                                    tour_area: booking.service_details?.tour_area,
                                    guide_language: booking.service_details?.guide_language,
                                  }}
                                />
                              ) : (
                                <span className="text-sm text-muted-foreground">N/A</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {editingNotes === booking.id ? (
                                <div className="flex flex-col gap-2 min-w-[200px]">
                                  <Textarea
                                    value={noteText}
                                    onChange={(e) => setNoteText(e.target.value)}
                                    placeholder="Add admin note..."
                                    className="min-h-[60px]"
                                    maxLength={500}
                                  />
                                  <div className="flex gap-1">
                                    <Button 
                                      size="sm" 
                                      onClick={() => saveAdminNote(booking.id)}
                                      disabled={actionLoading === booking.id}
                                    >
                                      <Save className="h-3 w-3 mr-1" />
                                      Save
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => {
                                      setEditingNotes(null);
                                      setNoteText('');
                                    }}>
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-muted-foreground truncate max-w-[100px]">
                                    {booking.admin_notes || 'No notes'}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setEditingNotes(booking.id);
                                      setNoteText(booking.admin_notes || '');
                                    }}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                {/* Quick Action Buttons */}
                                {booking.status === 'pending' && (
                                  <div className="flex gap-1 mb-1">
                                    <Button
                                      size="sm"
                                      variant="default"
                                      className="bg-green-600 hover:bg-green-700"
                                      onClick={() => handleConfirmBooking(booking)}
                                      disabled={actionLoading === booking.id}
                                    >
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Confirm
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => openRejectModal(booking)}
                                      disabled={actionLoading === booking.id}
                                    >
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Reject
                                    </Button>
                                  </div>
                                )}
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedBooking(booking);
                                      setShowDetails(true);
                                    }}
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    View
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => confirmDeleteBooking(booking)}
                                    disabled={actionLoading === booking.id}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
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
        </TabsContent>

        <TabsContent value="drafts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileEdit className="h-5 w-5" />
                Incomplete Bookings (Drafts)
              </CardTitle>
              <CardDescription>
                Bookings that users started but haven't completed
              </CardDescription>
            </CardHeader>
            <CardContent>
              {draftBookings.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No incomplete bookings found</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Service Type</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Started</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {draftBookings.map((draft) => (
                        <TableRow key={draft.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">
                                {draft.user_info?.fullName || 'Unknown'}
                              </div>
                              {draft.user_info?.email && (
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {draft.user_info.email}
                                </div>
                              )}
                              {draft.user_info?.phone && (
                                <div className="text-xs font-mono text-primary font-semibold flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {draft.user_info.phone}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{draft.service_type}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{draft.booking_progress}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(draft.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(draft.updated_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <pre className="text-xs bg-muted p-2 rounded max-w-[200px] overflow-hidden">
                              {JSON.stringify(draft.service_details, null, 2).slice(0, 100)}...
                            </pre>
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

      <BookingDetailsDialog
        booking={selectedBooking}
        open={showDetails}
        onOpenChange={setShowDetails}
        onPriceUpdated={fetchBookings}
      />

      {/* Reject Booking Modal */}
      <RejectBookingModal
        open={rejectModalOpen}
        onOpenChange={setRejectModalOpen}
        bookingId={bookingToReject?.id || ''}
        customerName={bookingToReject?.user_info?.fullName || 'Unknown'}
        onConfirm={handleRejectBooking}
        isLoading={!!actionLoading}
      />

      {/* Delete Booking Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this booking? This will permanently remove all associated data including payment receipts and history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteBooking} 
              className="bg-destructive text-destructive-foreground"
            >
              Delete Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};