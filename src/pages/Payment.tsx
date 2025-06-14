import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { BackButton } from '@/components/BackButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Shield, Lock, DollarSign } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { createBooking } from '@/services/database';
import { createPayPalOrder, capturePayPalPayment, processCreditCardPayment } from '@/services/paymentService';
import { useToast } from '@/hooks/use-toast';

declare global {
  interface Window {
    paypal: any;
  }
}

const Payment = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const bookingData = location.state?.bookingData;
  const paypalContainerRef = useRef<HTMLDivElement>(null);

  const [selectedMethod, setSelectedMethod] = useState('credit-card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [customAmount, setCustomAmount] = useState(bookingData?.totalPrice?.toString() || '50');
  const [paypalScriptLoaded, setPaypalScriptLoaded] = useState(false);
  const [paypalOrderId, setPaypalOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingData) {
      navigate('/booking');
    }
  }, [bookingData, navigate]);

  // Load PayPal script
  useEffect(() => {
    if (paypalScriptLoaded || window.paypal) {
      setPaypalScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=AU15djn3gU9YlY__yWU0ZFAGCo8AepH1KSx2I5Kr_0YrgktGrApSOcI-yAaeAFmfHDN4-yWUu2V1NHqV&currency=USD`;
    script.onload = () => setPaypalScriptLoaded(true);
    script.onerror = () => {
      toast({
        title: "PayPal Error",
        description: "Failed to load PayPal SDK",
        variant: "destructive"
      });
    };
    document.body.appendChild(script);
  }, []);

  // Render PayPal buttons
  useEffect(() => {
    if (selectedMethod !== 'paypal' || !paypalScriptLoaded || !window.paypal || !paypalContainerRef.current) {
      return;
    }

    const amount = parseFloat(customAmount) || 50;

    paypalContainerRef.current.innerHTML = '';

    window.paypal.Buttons({
      createOrder: async () => {
        try {
          const response = await createPayPalOrder(amount, bookingData);
          if (response.success && response.order) {
            setPaypalOrderId(response.order.id);
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

            navigate('/booking-confirmation', {
              state: {
                bookingData: {
                  ...bookingData,
                  paymentMethod: 'PayPal',
                  transactionId: response.transactionId,
                  paidAmount: amount,
                  totalPrice: amount
                }
              }
            });
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
  }, [selectedMethod, paypalScriptLoaded, customAmount, bookingData, navigate, toast]);

  if (!bookingData) {
    return null;
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setCustomAmount(value);
    }
  };

  const finalAmount = parseFloat(customAmount) || 0;

  const handleCreditCardPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (finalAmount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid payment amount greater than $0.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const response = await processCreditCardPayment(
        finalAmount,
        {
          number: cardNumber,
          expiry: expiryDate,
          cvv: cvv,
          name: cardholderName
        },
        bookingData
      );

      if (response.success) {
        toast({
          title: "Payment successful!",
          description: `Transaction ID: ${response.transactionId}`,
        });

        navigate('/booking-confirmation', {
          state: {
            bookingData: {
              ...bookingData,
              paymentMethod: 'Credit Card',
              transactionId: response.transactionId,
              paidAmount: finalAmount,
              totalPrice: finalAmount
            }
          }
        });
      } else {
        throw new Error(response.error || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment failed:', error);
      toast({
        title: "Payment failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const paymentMethods = [
    {
      id: 'credit-card',
      name: 'Credit Card',
      icon: CreditCard,
      description: 'Secure payment with your credit or debit card'
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: Shield,
      description: 'Pay securely with your PayPal account'
    }
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatedBackground />
      <Navigation />
      
      <div className="relative z-10 pt-16 sm:pt-20 lg:pt-24 pb-8 sm:pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="mb-6">
            <BackButton variant="outline" className="mb-4 bg-white/10 border-white/20 text-white hover:bg-white/20" />
          </div>

          {!user && (
            <Card className="bg-yellow-50 border-yellow-200 mb-6">
              <CardContent className="p-4">
                <p className="text-yellow-800 text-sm">
                  <strong>Note:</strong> You're not logged in. Your booking will be processed but not saved to an account. 
                  Consider signing in to keep track of your bookings.
                </p>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Secure Payment
                </CardTitle>
                <CardDescription className="text-white/70">
                  Complete your booking with secure payment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-6">
                  <h3 className="text-white font-medium flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Payment Amount
                  </h3>
                  <div>
                    <Label htmlFor="amount" className="block text-white text-sm font-medium mb-2">
                      Amount (USD)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70">$</span>
                      <Input
                        id="amount"
                        type="text"
                        value={customAmount}
                        onChange={handleAmountChange}
                        className="pl-8 bg-white/10 border-white/20 text-white placeholder-white/50 focus:ring-russian-gold"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <h3 className="text-white font-medium">Payment Method</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {paymentMethods.map((method) => (
                      <div
                        key={method.id}
                        className={`relative rounded-lg border-2 cursor-pointer transition-all ${
                          selectedMethod === method.id
                            ? 'border-russian-gold bg-russian-gold/10'
                            : 'border-white/20 bg-white/5 hover:border-white/30'
                        }`}
                        onClick={() => setSelectedMethod(method.id)}
                      >
                        <div className="p-4 flex items-center space-x-3">
                          <method.icon className="h-5 w-5 text-white" />
                          <div className="flex-1">
                            <p className="text-white font-medium">{method.name}</p>
                            <p className="text-white/60 text-sm">{method.description}</p>
                          </div>
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            selectedMethod === method.id
                              ? 'border-russian-gold bg-russian-gold'
                              : 'border-white/40'
                          }`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedMethod === 'credit-card' && (
                  <form onSubmit={handleCreditCardPayment} className="space-y-4">
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        value={cardholderName}
                        onChange={(e) => setCardholderName(e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-russian-gold"
                        placeholder="Enter cardholder name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Card Number
                      </label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-russian-gold"
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-white text-sm font-medium mb-2">
                          Expiry Date
                        </label>
                        <input
                          type="text"
                          value={expiryDate}
                          onChange={(e) => setExpiryDate(e.target.value)}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-russian-gold"
                          placeholder="MM/YY"
                          maxLength={5}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-white text-sm font-medium mb-2">
                          CVV
                        </label>
                        <input
                          type="text"
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value)}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-russian-gold"
                          placeholder="123"
                          maxLength={4}
                          required
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isProcessing || finalAmount <= 0}
                      className="w-full bg-russian-gold hover:bg-russian-gold/90 text-white font-semibold py-3"
                    >
                      {isProcessing ? 'Processing...' : `Pay $${finalAmount.toFixed(2)} with Credit Card`}
                    </Button>
                  </form>
                )}

                {selectedMethod === 'paypal' && (
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
                )}
              </CardContent>
            </Card>

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
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Payment;
