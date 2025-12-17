import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, Calendar, DollarSign, FileText, Car } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface BookingDetailsDialogProps {
  booking: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BookingDetailsDialog: React.FC<BookingDetailsDialogProps> = ({
  booking,
  open,
  onOpenChange,
}) => {
  if (!booking) return null;

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
                  Total Price:
                </span>
                <p className="text-lg font-bold text-primary">
                  ${booking.total_price?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium">Booking Status:</span>
                <div>
                  <Badge variant={
                    booking.status === 'confirmed' ? 'default' : 
                    booking.status === 'pending' ? 'secondary' : 
                    'destructive'
                  }>
                    {booking.status}
                  </Badge>
                </div>
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
