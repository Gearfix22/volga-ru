
import React, { useRef, useEffect } from 'react';
import { createPayPalOrder, capturePayPalPayment } from '@/services/paymentService';
import { useToast } from '@/hooks/use-toast';

interface PayPalSectionProps {
  amount: number;
  bookingData: any;
  paypalScriptLoaded: boolean;
  onPaymentSuccess: (transactionId: string) => void;
  setIsProcessing: (processing: boolean) => void;
}

declare global {
  interface Window {
    paypal: any;
  }
}

export const PayPalSection: React.FC<PayPalSectionProps> = ({
  amount,
  bookingData,
  paypalScriptLoaded,
  onPaymentSuccess,
  setIsProcessing
}) => {
  const paypalContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!paypalScriptLoaded || !window.paypal || !paypalContainerRef.current) {
      return;
    }

    paypalContainerRef.current.innerHTML = '';

    window.paypal.Buttons({
      createOrder: async () => {
        try {
          const response = await createPayPalOrder(amount, bookingData);
          if (response.success && response.order) {
            return response.order.id;
          } else {
            throw new Error(response.error || 'Failed to create order');
          }
        } catch (error) {
          console.error('Error creating PayPal order:', error);
          toast({
            title: "Order Creation Failed",
            description: "Failed to create PayPal order",
            variant: "destructive"
          });
          throw error;
        }
      },
      onApprove: async (data: any) => {
        try {
          setIsProcessing(true);
          const response = await capturePayPalPayment(data.orderID, bookingData);
          
          if (response.success) {
            toast({
              title: "Payment successful!",
              description: `Transaction ID: ${response.transactionId}`,
            });
            onPaymentSuccess(response.transactionId || '');
          } else {
            throw new Error(response.error || 'Payment capture failed');
          }
        } catch (error) {
          console.error('PayPal payment error:', error);
          toast({
            title: "Payment failed",
            description: "There was an error processing your PayPal payment.",
            variant: "destructive"
          });
        } finally {
          setIsProcessing(false);
        }
      },
      onError: (err: any) => {
        console.error('PayPal error:', err);
        toast({
          title: "Payment error",
          description: "There was an error with PayPal. Please try again.",
          variant: "destructive"
        });
      },
      onCancel: () => {
        toast({
          title: "Payment cancelled",
          description: "PayPal payment was cancelled.",
        });
      }
    }).render(paypalContainerRef.current);
  }, [paypalScriptLoaded, amount, bookingData, onPaymentSuccess, setIsProcessing, toast]);

  return (
    <div className="space-y-4">
      <div className="bg-white/5 rounded-lg p-4 border border-white/20">
        <h4 className="text-white font-medium mb-3">PayPal Payment</h4>
        <p className="text-white/70 text-sm mb-4">
          Click the PayPal button below to complete your payment securely.
        </p>
        <div 
          ref={paypalContainerRef}
          className="min-h-[50px]"
        >
          {!paypalScriptLoaded && (
            <div className="flex items-center justify-center py-4">
              <div className="text-white/60">Loading PayPal...</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
