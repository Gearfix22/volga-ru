
import React from 'react';
import { Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BookingSummaryProps {
  bookingData: any;
  finalAmount: number;
}

export const BookingSummary: React.FC<BookingSummaryProps> = ({ bookingData, finalAmount }) => {
  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader>
        <CardTitle className="text-white">Booking Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between text-white">
            <span>Service:</span>
            <span className="font-medium">{bookingData.serviceName || bookingData.serviceType}</span>
          </div>
          {bookingData.date && (
            <div className="flex justify-between text-white">
              <span>Date:</span>
              <span>{bookingData.date}</span>
            </div>
          )}
          {bookingData.time && (
            <div className="flex justify-between text-white">
              <span>Time:</span>
              <span>{bookingData.time}</span>
            </div>
          )}
          {bookingData.duration && (
            <div className="flex justify-between text-white">
              <span>Duration:</span>
              <span>{bookingData.duration}</span>
            </div>
          )}
          {bookingData.location && (
            <div className="flex justify-between text-white">
              <span>Location:</span>
              <span>{bookingData.location}</span>
            </div>
          )}
          {bookingData.guests && (
            <div className="flex justify-between text-white">
              <span>Guests:</span>
              <span>{bookingData.guests}</span>
            </div>
          )}
        </div>

        <div className="border-t border-white/20 pt-4">
          <div className="flex justify-between text-white text-lg font-bold">
            <span>Total:</span>
            <span className="text-russian-gold">${finalAmount.toFixed(2)}</span>
          </div>
          {finalAmount !== (bookingData.totalPrice || 0) && bookingData.totalPrice && (
            <p className="text-white/60 text-sm mt-1">
              Original amount: ${bookingData.totalPrice || 0}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 text-white/70 text-sm">
          <Shield className="h-4 w-4" />
          <span>Your payment is protected by secure encryption</span>
        </div>
      </CardContent>
    </Card>
  );
};
