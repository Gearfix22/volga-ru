
import React, { useRef, useEffect, useState } from 'react';
import { createPayPalOrder, capturePayPalPayment } from '@/services/paymentService';
import { checkPaymentServiceStatus } from '@/services/serviceStatus';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [isCheckingService, setIsCheckingService] = useState(false);

  const checkService = async () => {
    setIsCheckingService(true);
    const status = await checkPaymentServiceStatus();
    setIsCheckingService(false);
    
    if (status.status === 'error') {
      setServiceError(status.message);
    } else {
      setServiceError(null);
      toast({
        title: "Service Status",
        description: status.message,
      });
    }
  };

  useEffect(() => {
    if (!paypalScriptLoaded || !window.paypal || !paypalContainerRef.current || serviceError) {
      return;
    }

    paypalContainerRef.current.innerHTML = '';

    window.paypal.Buttons({
      createOrder: async () => {
        try {
          console.log('PayPal createOrder called with amount:', amount);
          const response = await createPayPalOrder(amount, bookingData);
          console.log('CreateOrder response:', response);
          
          if (response.success && response.order) {
            return response.order.id;
          } else {
            setServiceError(response.error || 'Failed to create order');
            throw new Error(response.error || 'Failed to create order');
          }
        } catch (error) {
          console.error('Error creating PayPal order:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          setServiceError(errorMessage);
          toast({
            title: "Order Creation Failed",
            description: errorMessage,
            variant: "destructive"
          });
          throw error;
        }
      },
      onApprove: async (data: any) => {
        try {
          setIsProcessing(true);
          console.log('PayPal onApprove called with data:', data);
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
        setServiceError('PayPal service error occurred');
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
  }, [paypalScriptLoaded, amount, bookingData, onPaymentSuccess, setIsProcessing, toast, serviceError]);

  if (serviceError) {
    return (
      <div className="space-y-4">
        <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <h4 className="text-white font-medium">PayPal Service Issue</h4>
          </div>
          <p className="text-white/70 text-sm mb-4">{serviceError}</p>
          <div className="space-y-2">
            <p className="text-white/60 text-xs">
              Possible solutions:
            </p>
            <ul className="text-white/60 text-xs space-y-1 ml-4">
              <li>• Ensure PayPal edge functions are deployed in Supabase</li>
              <li>• Check that PayPal credentials are set in Supabase secrets</li>
              <li>• Verify your internet connection</li>
            </ul>
          </div>
          <Button
            onClick={checkService}
            disabled={isCheckingService}
            variant="outline"
            size="sm"
            className="mt-3 bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            {isCheckingService ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Connection
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

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
