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
import { User, Mail, Phone, Calendar, DollarSign, FileText, Car, Edit, Save, X, Loader2, Lock, Check, Building2, Ticket, UserCheck, MapPin, Clock, Users } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { BookingStatusTimeline } from '@/components/booking/BookingStatusTimeline';
import { getPaymentGuard, type PaymentGuardData } from '@/services/paymentGuardService';
import { setBookingPrice as adminSetBookingPrice, updateBooking } from '@/services/adminService';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface BookingDetailsDialogProps {
  booking: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPriceUpdated?: () => void;
}

// Service icon mapping
const SERVICE_ICONS: Record<string, any> = {
  'Driver': Car,
  'Accommodation': Building2,
  'Events': Ticket,
  'Guide': UserCheck
};

export const BookingDetailsDialog: React.FC<BookingDetailsDialogProps> = ({
  booking,
  open,
  onOpenChange,
  onPriceUpdated,
}) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceValue, setPriceValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [priceGuard, setPriceGuard] = useState<PaymentGuardData | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(true);

  // Fetch price from v_booking_payment_guard (SINGLE SOURCE OF TRUTH)
  useEffect(() => {
    const fetchPrice = async () => {
      if (booking?.id) {
        setLoadingPrice(true);
        const guard = await getPaymentGuard(booking.id);
        setPriceGuard(guard);
        setLoadingPrice(false);
      }
    };
    if (open && booking?.id) {
      fetchPrice();
    }
  }, [booking?.id, open]);

  if (!booking) return null;

  // Price is locked after approval (using v_booking_payment_guard)
  const canEditPriceFlag = !priceGuard?.locked;
  const displayPrice = priceGuard?.approved_price || null;

  // Helper to render service-specific details
  const renderServiceTypeDetails = (serviceType: string, details: any) => {
    if (!details || Object.keys(details).length === 0) {
      return <p className="text-sm text-muted-foreground italic">No details provided</p>;
    }

    const Icon = SERVICE_ICONS[serviceType] || FileText;

    const renderField = (label: string, value: any, icon?: any) => {
      if (!value) return null;
      const FieldIcon = icon;
      return (
        <div className="flex items-center gap-2 text-sm">
          {FieldIcon && <FieldIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
          <span className="font-medium">{label}:</span>
          <span className="text-muted-foreground">{String(value)}</span>
        </div>
      );
    };

    switch (serviceType) {
      case 'Driver':
        return (
          <div className="space-y-2">
            {renderField('Pickup', details.pickupLocation, MapPin)}
            {renderField('Dropoff', details.dropoffLocation, MapPin)}
            {renderField('Date', details.pickupDate, Calendar)}
            {renderField('Time', details.pickupTime, Clock)}
            {renderField('Vehicle', details.vehicleType, Car)}
            {renderField('Passengers', details.passengers, Users)}
          </div>
        );
      case 'Accommodation':
        return (
          <div className="space-y-2">
            {renderField('Location', details.location, MapPin)}
            {renderField('Check-in', details.checkIn, Calendar)}
            {renderField('Check-out', details.checkOut, Calendar)}
            {renderField('Guests', details.guests, Users)}
            {renderField('Room Type', details.roomType, Building2)}
          </div>
        );
      case 'Events':
        return (
          <div className="space-y-2">
            {renderField('Event Type', details.eventType, Ticket)}
            {renderField('Location', details.location, MapPin)}
            {renderField('Date', details.date, Calendar)}
            {renderField('Tickets', details.tickets, Users)}
          </div>
        );
      case 'Guide':
        return (
          <div className="space-y-2">
            {renderField('Location', details.location, MapPin)}
            {renderField('Date', details.date, Calendar)}
            {renderField('Duration', details.duration ? `${details.duration} hours` : null, Clock)}
            {renderField('Language', details.language, UserCheck)}
          </div>
        );
      default:
        // Generic display for unknown service types
        return (
          <div className="space-y-2">
            {Object.entries(details)
              .filter(([key]) => !key.startsWith('_'))
              .map(([key, value]) => (
                <div key={key} className="flex items-start gap-2 text-sm">
                  <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                  <span className="text-muted-foreground">{String(value)}</span>
                </div>
              ))}
          </div>
        );
    }
  };

  // Parse multi-service bookings
  const renderMultiServiceDetails = (serviceDetails: any) => {
    if (!serviceDetails) return <p className="text-sm text-muted-foreground">No details available</p>;

    // Check for multi-service format
    if (serviceDetails._multiService && serviceDetails._selectedServices) {
      const selectedServices = serviceDetails._selectedServices as string[];
      
      return (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedServices.map((sType: string) => {
              const Icon = SERVICE_ICONS[sType] || FileText;
              return (
                <Badge key={sType} variant="outline" className="flex items-center gap-1">
                  <Icon className="h-3 w-3" />
                  {sType}
                </Badge>
              );
            })}
          </div>
          
          {selectedServices.map((serviceType: string, idx: number) => {
            const key = `_${serviceType.toLowerCase()}_details`;
            const details = serviceDetails[key];
            const Icon = SERVICE_ICONS[serviceType] || FileText;
            
            return (
              <div key={serviceType} className="space-y-2">
                {idx > 0 && <Separator className="my-3" />}
                <div className="flex items-center gap-2 font-medium">
                  <div className="p-1.5 rounded bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  {serviceType}
                </div>
                <div className="pl-8">
                  {renderServiceTypeDetails(serviceType, details)}
                </div>
              </div>
            );
          })}
        </div>
      );
    }
    
    // Single service format - render with the booking's service_type
    return renderServiceTypeDetails(booking.service_type, serviceDetails);
  };

  const handleEditPrice = () => {
    if (!canEditPriceFlag) {
      toast({
        title: 'Price Locked',
        description: 'Cannot edit price after approval',
        variant: 'destructive'
      });
      return;
    }
    setPriceValue(priceGuard?.approved_price?.toString() || '0');
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
      
      // Set price via Edge Function (writes to booking_prices table)
      const result = await adminSetBookingPrice(booking.id, newPrice, { lock: false });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update price');
      }
      
      toast({
        title: 'Price Updated',
        description: `Price set to $${newPrice.toFixed(2)}. Click "Approve & Lock" to allow payment.`,
      });
      
      // Refresh data
      const updated = await getPaymentGuard(booking.id);
      setPriceGuard(updated);
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
    if (!priceGuard?.approved_price) {
      toast({
        title: 'No Price Set',
        description: 'Please set a price first',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSaving(true);
      // Lock the price via Edge Function
      const result = await adminSetBookingPrice(booking.id, priceGuard.approved_price, { lock: true });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to approve price');
      }
      
      toast({
        title: 'Price Approved & Locked',
        description: `Price of $${priceGuard.approved_price.toFixed(2)} has been approved. Customer can now pay.`,
      });
      
      // Refresh data
      const updated = await getPaymentGuard(booking.id);
      setPriceGuard(updated);
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
                  Admin Price:
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
                      {priceGuard?.locked ? (
                        <Badge variant="default" className="text-xs bg-green-600">
                          <Lock className="h-3 w-3 mr-1" />
                          Approved
                        </Badge>
                      ) : priceGuard?.approved_price ? (
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
                            {priceGuard?.approved_price ? 'Edit' : 'Set Price'}
                          </Button>
                          {priceGuard?.approved_price && !priceGuard.locked && (
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
            <div className="bg-muted/50 p-4 rounded-lg space-y-4">
              {renderMultiServiceDetails(booking.service_details)}
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
