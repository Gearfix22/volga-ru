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
  const paypalRef = useRef<HTMLDivElement>(null);
  const paypalButtonsRef = useRef<any>(null);
  const mountedRef = useRef(true);
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [selectedMethod, setSelectedMethod] = useState('credit-card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [customAmount, setCustomAmount] = useState(bookingData?.totalPrice?.toString() || '50');
  const [paypalLoaded, setPaypalLoaded] = useState(false);

  useEffect(() => {
    if (!bookingData) {
      navigate('/booking');
    }
  }, [bookingData, navigate]);

  // Enhanced cleanup function
  const cleanupPayPalButtons = () => {
    console.log('Cleaning up PayPal buttons...');
    
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
      renderTimeoutRef.current = null;
    }

    try {
      if (paypalButtonsRef.current) {
        if (typeof paypalButtonsRef.current.close === 'function') {
          paypalButtonsRef.current.close();
        }
        paypalButtonsRef.current = null;
      }
    } catch (error) {
      console.log('PayPal button cleanup error (safe to ignore):', error);
    }

    // Safe DOM cleanup
    if (paypalRef.current) {
      try {
        // Create a new container to avoid React DOM conflicts
        const newContainer = document.createElement('div');
        newContainer.className = paypalRef.current.className;
        
        // Replace the entire container
        if (paypalRef.current.parentNode) {
          paypalRef.current.parentNode.replaceChild(newContainer, paypalRef.current);
        }
        
        // Update ref to point to new container
        paypalRef.current = newContainer;
      } catch (error) {
        console.log('DOM cleanup error (safe to ignore):', error);
        // Fallback: just clear innerHTML
        try {
          if (paypalRef.current) {
            paypalRef.current.innerHTML = '';
          }
        } catch (fallbackError) {
          console.log('Fallback cleanup error (safe to ignore):', fallbackError);
        }
      }
    }
  };

  // Component unmount cleanup
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      cleanupPayPalButtons();
    };
  }, []);

  // Handle PayPal integration with improved error handling
  useEffect(() => {
    if (selectedMethod !== 'paypal' || !mountedRef.current) {
      cleanupPayPalButtons();
      return;
    }

    const loadPayPalScript = () => {
      // Check if PayPal is already loaded
      if (window.paypal) {
        setPaypalLoaded(true);
        renderPayPalButton();
        return;
      }

      // Check if script is already loading
      const existingScript = document.querySelector('script[src*="paypal.com/sdk"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => {
          if (mountedRef.current) {
            setPaypalLoaded(true);
            renderPayPalButton();
          }
        });
        return;
      }

      // Load PayPal script
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=AU15djn3gU9YlY__yWU0ZFAGCo8AepH1KSx2I5Kr_0YrgktGrApSOcI-yAaeAFmfHDN4-yWUu2V1NHqV&currency=USD`;
      script.onload = () => {
        if (mountedRef.current) {
          setPaypalLoaded(true);
          renderPayPalButton();
        }
      };
      script.onerror = () => {
        console.error('Failed to load PayPal SDK');
        if (mountedRef.current) {
          toast({
            title: "PayPal Error",
            description: "Failed to load PayPal. Please try again or use credit card.",
            variant: "destructive"
          });
        }
      };
      document.body.appendChild(script);
    };

    loadPayPalScript();
  }, [selectedMethod, customAmount]);

  const renderPayPalButton = () => {
    if (!window.paypal || !mountedRef.current || selectedMethod !== 'paypal') {
      return;
    }

    // Clean up existing buttons first
    cleanupPayPalButtons();

    const amount = parseFloat(customAmount) || 50;

    // Use timeout to ensure DOM is ready and avoid race conditions
    renderTimeoutRef.current = setTimeout(() => {
      if (!mountedRef.current || !paypalRef.current) {
        return;
      }

      try {
        console.log('Rendering PayPal button with amount:', amount);
        
        paypalButtonsRef.current = window.paypal.Buttons({
          createOrder: (data: any, actions: any) => {
            return actions.order.create({
              purchase_units: [{
                amount: {
                  value: amount.toFixed(2)
                }
              }]
            });
          },
          onApprove: async (data: any, actions: any) => {
            try {
              const details = await actions.order.capture();
              const transactionId = details.id;
              
              // Save booking to Supabase if user is authenticated
              if (user && bookingData) {
                await createBooking({
                  ...bookingData,
                  customAmount: amount,
                  totalPrice: amount
                }, {
                  paymentMethod: 'PayPal',
                  transactionId,
                  totalPrice: amount
                });
                
                toast({
                  title: "Booking saved successfully!",
                  description: "Your booking has been saved to your account.",
                });
              }
              
              // Store payment details for confirmation page
              localStorage.setItem('paymentStatus', 'completed');
              localStorage.setItem('transactionId', transactionId);
              localStorage.setItem('paymentAmount', amount.toString());
              
              toast({
                title: "Payment successful!",
                description: `Transaction ID: ${transactionId}`,
              });

              if (mountedRef.current) {
                navigate('/booking-confirmation', {
                  state: {
                    bookingData: {
                      ...bookingData,
                      paymentMethod: 'PayPal',
                      transactionId,
                      paidAmount: amount,
                      totalPrice: amount
                    }
                  }
                });
              }
            } catch (error) {
              console.error('PayPal payment error:', error);
              if (mountedRef.current) {
                toast({
                  title: "Payment failed",
                  description: "There was an error processing your PayPal payment.",
                  variant: "destructive"
                });
              }
            }
          },
          onError: (err: any) => {
            console.error('PayPal error:', err);
            if (mountedRef.current) {
              toast({
                title: "Payment error",
                description: "There was an error with PayPal. Please try again.",
                variant: "destructive"
              });
            }
          },
          onCancel: () => {
            if (mountedRef.current) {
              toast({
                title: "Payment cancelled",
                description: "PayPal payment was cancelled.",
              });
            }
          }
        });

        if (paypalRef.current && mountedRef.current) {
          paypalButtonsRef.current.render(paypalRef.current);
        }
      } catch (error) {
        console.error('Error rendering PayPal button:', error);
        if (mountedRef.current) {
          toast({
            title: "PayPal Error",
            description: "Failed to initialize PayPal button. Please try again.",
            variant: "destructive"
          });
        }
      }
    }, 200);
  };

  if (!bookingData) {
    return null;
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and decimal point
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
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const transactionId = `TXN${Date.now()}`;
      
      // Save booking to Supabase if user is authenticated
      if (user) {
        await createBooking({
          ...bookingData,
          customAmount: finalAmount,
          totalPrice: finalAmount
        }, {
          paymentMethod: 'Credit Card',
          transactionId,
          totalPrice: finalAmount
        });
        
        toast({
          title: "Booking saved successfully!",
          description: "Your booking has been saved to your account.",
        });
      }
      
      // Store payment details for confirmation page
      localStorage.setItem('paymentStatus', 'completed');
      localStorage.setItem('transactionId', transactionId);
      localStorage.setItem('paymentAmount', finalAmount.toString());
      
      navigate('/booking-confirmation', {
        state: {
          bookingData: {
            ...bookingData,
            paymentMethod: 'Credit Card',
            transactionId,
            paidAmount: finalAmount,
            totalPrice: finalAmount
          }
        }
      });
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
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Navigation */}
      <Navigation />
      
      {/* Main Content */}
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
            {/* Payment Form */}
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
                {/* Payment Amount */}
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
                    <p className="text-white/60 text-xs mt-1">
                      Enter the amount you wish to pay
                    </p>
                  </div>
                </div>

                {/* Payment Method Selection */}
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

                {/* Credit Card Form */}
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

                {/* PayPal Form */}
                {selectedMethod === 'paypal' && (
                  <div className="space-y-4">
                    <div className="bg-white/5 rounded-lg p-4 border border-white/20">
                      <h4 className="text-white font-medium mb-3">PayPal Payment</h4>
                      <p className="text-white/70 text-sm mb-4">
                        Click the PayPal button below to complete your payment securely.
                      </p>
                      <div 
                        ref={paypalRef} 
                        className="min-h-[50px] paypal-button-container"
                        key={`paypal-${customAmount}-${Date.now()}`}
                      >
                        {!paypalLoaded && (
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

            {/* Booking Summary */}
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
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Payment;
