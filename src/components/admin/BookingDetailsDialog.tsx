import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Mail, Phone, Calendar, DollarSign, FileText, Car, Edit, Save, X, Loader2, Lock, Check } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { BookingStatusTimeline } from '@/components/booking/BookingStatusTimeline';
import { getPriceWorkflow, setProposedPrice, approvePrice, type PriceWorkflow } from '@/services/bookingPriceWorkflowService';
import { updateBooking } from '@/services/adminService';
import { useToast } from '@/hooks/use-toast';

interface BookingDetailsDialogProps {
  booking: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPriceUpdated?: () => void;
}

export const BookingDetailsDialog: React.FC<BookingDetailsDialogProps> = ({
  booking,
  open,
  onOpenChange,
  onPriceUpdated,
}) => {
  const { toast } = useToast();
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceValue, setPriceValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [priceWorkflow, setPriceWorkflow] = useState<PriceWorkflow | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(true);

  // Fetch price workflow from booking_price_workflow table
  useEffect(() => {
    const fetchPrice = async () => {
      if (booking?.id) {
        setLoadingPrice(true);
        const workflow = await getPriceWorkflow(booking.id);
        setPriceWorkflow(workflow);
        setLoadingPrice(false);
      }
    };
    if (open && booking?.id) {
      fetchPrice();
    }
  }, [booking?.id, open]);

  if (!booking) return null;

  // Price is locked after approval
  const canEditPriceFlag = !priceWorkflow?.locked;
  const displayPrice = priceWorkflow?.approved_price || priceWorkflow?.proposed_price || null;

  const handleEditPrice = () => {
    if (!canEditPriceFlag) {
      toast({
        title: 'Price Locked',
        description: 'Cannot edit price after approval',
        variant: 'destructive'
      });
      return;
    }
    setPriceValue(priceWorkflow?.proposed_price?.toString() || '0');
    setEditingPrice(true);
  };

  const handleCancelEdit = () => {
    setEditingPrice(false);
    setPriceValue('');
  };

  const handleSavePrice = async () => {
    if (!canEditPriceFlag) {
      toast({
        title: 'Price Locked',
        description: 'Cannot update price after approval',
        variant: 'destructive'
      });
      setEditingPrice(false);
      return;
    }

    const trimmedValue = priceValue.trim();
    
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
    
    if (newPrice < 0) {
      toast({
        title: 'Invalid Price',
        description: 'Price cannot be negative',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSaving(true);
      
      // Set proposed price in booking_price_workflow table
      const result = await setProposedPrice(booking.id, newPrice);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update price');
      }
      
      toast({
        title: 'Price Updated',
        description: `Proposed price set to $${newPrice.toFixed(2)}. Click "Approve" to lock the price.`,
      });
      
      // Refresh workflow data
      const updated = await getPriceWorkflow(booking.id);
      setPriceWorkflow(updated);
      setEditingPrice(false);
      setPriceValue('');
      onPriceUpdated?.();
    } catch (error: any) {
      console.error('Price update error:', error);
      toast({
        title: 'Error Updating Price',
        description: error.message || 'Failed to save price. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleApprovePrice = async () => {
    if (!priceWorkflow?.proposed_price) {
      toast({
        title: 'No Price Set',
        description: 'Please set a proposed price first',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSaving(true);
      const result = await approvePrice(booking.id);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to approve price');
      }
      
      toast({
        title: 'Price Approved & Locked',
        description: `Price of $${priceWorkflow.proposed_price.toFixed(2)} has been approved. Customer can now pay.`,
      });
      
      // Refresh workflow data
      const updated = await getPriceWorkflow(booking.id);
      setPriceWorkflow(updated);
      onPriceUpdated?.();
    } catch (error: any) {
      console.error('Price approval error:', error);
      toast({
        title: 'Error Approving Price',
        description: error.message || 'Failed to approve price.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Booking Details</DialogTitle>
          <DialogDescription>
            Complete information about booking #{booking.id.slice(0, 8)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Full Name:</span>
                </div>
                <p className="text-sm ml-6">{booking.user_info?.fullName || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Email:</span>
                </div>
                <p className="text-sm ml-6 break-all">{booking.user_info?.email || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Phone:</span>
                </div>
                <p className="text-sm ml-6 font-mono">{booking.user_info?.phone || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Booking Date:</span>
                </div>
                <p className="text-sm ml-6">
                  {new Date(booking.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Status Timeline */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Status Progress
            </h3>
            <div className="bg-muted/50 p-4 rounded-lg">
              <BookingStatusTimeline currentStatus={booking.status} />
            </div>
          </div>

          <Separator />

          {/* Booking Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Booking Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg">
              <div className="space-y-2">
                <span className="text-sm font-medium">Service Type:</span>
                <div>
                  <Badge variant="outline" className="text-sm">
                    {booking.service_type}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Price (from booking_price_workflow):
                </span>
                {loadingPrice ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading...</span>
                  </div>
                ) : editingPrice ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={priceValue}
                      onChange={(e) => setPriceValue(e.target.value)}
                      className="w-28 h-9"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                    <Button 
                      size="sm" 
                      onClick={handleSavePrice}
                      disabled={saving}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={handleCancelEdit}
                      disabled={saving}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-bold text-primary">
                        {displayPrice ? `$${displayPrice.toFixed(2)}` : 'Not set'}
                      </p>
                      {priceWorkflow?.locked ? (
                        <Badge variant="default" className="text-xs bg-green-600">
                          <Lock className="h-3 w-3 mr-1" />
                          Approved
                        </Badge>
                      ) : priceWorkflow?.proposed_price ? (
                        <Badge variant="secondary" className="text-xs">
                          Proposed
                        </Badge>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      {canEditPriceFlag ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleEditPrice}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            {priceWorkflow?.proposed_price ? 'Edit' : 'Set Price'}
                          </Button>
                          {priceWorkflow?.proposed_price && !priceWorkflow.locked && (
                            <Button
                              size="sm"
                              onClick={handleApprovePrice}
                              disabled={saving}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve & Lock
                            </Button>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Price locked - cannot edit
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium">Payment Status:</span>
                <div>
                  <Badge variant={
                    booking.payment_status === 'paid' ? 'default' : 
                    booking.payment_status === 'pending' ? 'secondary' : 
                    'outline'
                  }>
                    {booking.payment_status}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Driver Required:
                </span>
                <div>
                  <Badge variant={booking.driver_required ? 'default' : 'secondary'}>
                    {booking.driver_required ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
              {booking.payment_method && (
                <div className="space-y-2">
                  <span className="text-sm font-medium">Payment Method:</span>
                  <p className="text-sm">{booking.payment_method}</p>
                </div>
              )}
              {booking.transaction_id && (
                <div className="space-y-2">
                  <span className="text-sm font-medium">Transaction ID:</span>
                  <p className="text-sm font-mono">{booking.transaction_id}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Service Details */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Service Details</h3>
            <div className="bg-muted/50 p-4 rounded-lg">
              <pre className="text-xs whitespace-pre-wrap break-words overflow-x-auto">
                {JSON.stringify(booking.service_details, null, 2)}
              </pre>
            </div>
          </div>

          {/* Notes */}
          {(booking.customer_notes || booking.admin_notes) && (
            <>
              <Separator />
              <div className="space-y-4">
                {booking.customer_notes && (
                  <div>
                    <h4 className="font-semibold mb-2">Customer Notes:</h4>
                    <p className="text-sm bg-muted/50 p-3 rounded">
                      {booking.customer_notes}
                    </p>
                  </div>
                )}
                {booking.admin_notes && (
                  <div>
                    <h4 className="font-semibold mb-2">Admin Notes:</h4>
                    <p className="text-sm bg-muted/50 p-3 rounded">
                      {booking.admin_notes}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
