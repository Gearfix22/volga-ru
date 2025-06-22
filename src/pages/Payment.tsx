
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
import { CreditCard, Shield, Lock, DollarSign, MapPin, Calendar, Clock, Users, Car, Building2, Ticket, Globe, Banknote, MessageCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { createBooking } from '@/services/database';
import { useToast } from '@/hooks/use-toast';
import { sendBookingEmail, redirectToWhatsApp, processCreditCardPayment } from '@/utils/postBookingActions';

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
  const paypalButtonsInstance = useRef<any>(null);
  const isPaypalMounted = useRef(false);

  const [selectedMethod, setSelectedMethod] = useState('credit-card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [customAmount, setCustomAmount] = useState(bookingData?.totalPrice?.toString() || '50');
  const [paypalScriptLoaded, setPaypalScriptLoaded] = useState(false);
  const [paypalError, setPaypalError] = useState('');

  useEffect(() => {
    if (!bookingData) {
      navigate('/booking');
    }
  }, [bookingData, navigate]);

  // Clean up PayPal when component unmounts or method changes
  const cleanupPayPal = () => {
    console.log('Cleaning up PayPal...');
    if (paypalButtonsInstance.current) {
      try {
        if (typeof paypalButtonsInstance.current.close === 'function') {
          paypalButtonsInstance.current.close();
        }
      } catch (error) {
        console.log('PayPal cleanup error (safe to ignore):', error);
      }
      paypalButtonsInstance.current = null;
    }
    
    if (paypalContainerRef.current) {
      paypalContainerRef.current.innerHTML = '';
    }
    
    isPaypalMounted.current = false;
  };

  // Load PayPal script only once
  useEffect(() => {
    if (paypalScriptLoaded || window.paypal) {
      setPaypalScriptLoaded(true);
      return;
    }

    const existingScript = document.querySelector('script[src*="paypal.com/sdk"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => setPaypalScriptLoaded(true));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=AU15djn3gU9YlY__yWU0ZFAGCo8AepH1KSx2I5Kr_0YrgktGrApSOcI-yAaeAFmfHDN4-yWUu2V1NHqV&currency=USD`;
    script.onload = () => setPaypalScriptLoaded(true);
    script.onerror = () => {
      setPaypalError('Failed to load PayPal SDK');
      toast({
        title: "PayPal Error",
        description: "Failed to load PayPal. Please try credit card instead.",
        variant: "destructive"
      });
    };
    document.body.appendChild(script);
  }, []);

  // Handle PayPal button rendering with better error handling
  useEffect(() => {
    if (selectedMethod !== 'paypal' || !paypalScriptLoaded || !window.paypal || isPaypalMounted.current) {
      if (selectedMethod !== 'paypal') {
        cleanupPayPal();
      }
      return;
    }

    const renderPayPalButtons = () => {
      if (!paypalContainerRef.current || isPaypalMounted.current) {
        return;
      }

      const amount = parseFloat(customAmount) || 50;
      console.log('Rendering PayPal buttons with amount:', amount);

      try {
        paypalButtonsInstance.current = window.paypal.Buttons({
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
              
              localStorage.setItem('paymentStatus', 'completed');
              localStorage.setItem('transactionId', transactionId);
              localStorage.setItem('paymentAmount', amount.toString());
              
              toast({
                title: "Payment successful!",
                description: `Transaction ID: ${transactionId}`,
              });

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
            } catch (error) {
              console.error('PayPal payment error:', error);
              toast({
                title: "Payment failed",
                description: "There was an error processing your PayPal payment.",
                variant: "destructive"
              });
            }
          },
          onError: (err: any) => {
            console.error('PayPal error:', err);
            setPaypalError('PayPal error occurred');
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
        });

        if (paypalContainerRef.current) {
          paypalButtonsInstance.current.render(paypalContainerRef.current).then(() => {
            isPaypalMounted.current = true;
            console.log('PayPal buttons rendered successfully');
          }).catch((error: any) => {
            console.error('PayPal render error:', error);
            setPaypalError('Failed to render PayPal buttons');
          });
        }
      } catch (error) {
        console.error('Error setting up PayPal buttons:', error);
        setPaypalError('Failed to initialize PayPal');
      }
    };

    // Small delay to ensure DOM is ready
    setTimeout(renderPayPalButtons, 100);
  }, [selectedMethod, paypalScriptLoaded, customAmount, user, bookingData, navigate, toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupPayPal();
    };
  }, []);

  if (!bookingData) {
    return null;
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setCustomAmount(value);
      // Reset PayPal when amount changes
      if (selectedMethod === 'paypal') {
        cleanupPayPal();
      }
    }
  };

  const handlePaymentMethodChange = (method: string) => {
    if (method !== selectedMethod) {
      cleanupPayPal();
      setPaypalError('');
    }
    setSelectedMethod(method);
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

    // Validate credit card fields
    if (!cardNumber || !expiryDate || !cvv || !cardholderName) {
      toast({
        title: "Missing information",
        description: "Please fill in all credit card details.",
        variant: "destructive"
      });
      return;
    }

    // Basic card number validation (remove spaces and check length)
    const cleanCardNumber = cardNumber.replace(/\s/g, '');
    if (cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
      toast({
        title: "Invalid card number",
        description: "Please enter a valid credit card number.",
        variant: "destructive"
      });
      return;
    }

    // Basic expiry date validation (MM/YY format)
    if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
      toast({
        title: "Invalid expiry date",
        description: "Please enter expiry date in MM/YY format.",
        variant: "destructive"
      });
      return;
    }

    // Basic CVV validation
    if (cvv.length < 3 || cvv.length > 4) {
      toast({
        title: "Invalid CVV",
        description: "Please enter a valid CVV code.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const cardDetails = {
        cardNumber: cleanCardNumber,
        expiryDate,
        cvv,
        cardholderName
      };

      const paymentResult = await processCreditCardPayment(cardDetails, finalAmount, bookingData);
      
      const transactionId = paymentResult.transactionId;
      
      // Save booking if user is logged in
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

      // Send booking email
      await sendBookingEmail(bookingData, transactionId, finalAmount.toString());
      
      localStorage.setItem('paymentStatus', 'completed');
      localStorage.setItem('transactionId', transactionId);
      localStorage.setItem('paymentAmount', finalAmount.toString());
      
      toast({
        title: "Payment successful!",
        description: `Transaction ID: ${transactionId}`,
      });
      
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
    } catch (error: any) {
      console.error('Payment failed:', error);
      toast({
        title: "Payment failed",
        description: error.message || "There was an error processing your payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCashPaymentConfirmation = async () => {
    const transactionId = `CASH${Date.now()}`;
    
    if (user) {
      await createBooking({
        ...bookingData,
        customAmount: finalAmount,
        totalPrice: finalAmount
      }, {
        paymentMethod: 'Cash on Arrival',
        transactionId,
        totalPrice: finalAmount
      });
      
      toast({
        title: "Booking confirmed!",
        description: "Your booking has been saved. Redirecting to WhatsApp for arrangements.",
      });
    }
    
    // Send booking email
    await sendBookingEmail(bookingData, transactionId, finalAmount.toString());
    
    localStorage.setItem('paymentStatus', 'confirmed');
    localStorage.setItem('transactionId', transactionId);
    localStorage.setItem('paymentAmount', finalAmount.toString());
    
    // Redirect to WhatsApp
    redirectToWhatsApp(bookingData, transactionId, finalAmount);
    
    // Also navigate to booking confirmation
    navigate('/booking-confirmation', {
      state: {
        bookingData: {
          ...bookingData,
          paymentMethod: 'Cash on Arrival',
          transactionId,
          paidAmount: finalAmount,
          totalPrice: finalAmount
        }
      }
    });
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
    },
    {
      id: 'cash-on-arrival',
      name: 'Payment upon arrival (Cash on hand)',
      icon: MessageCircle,
      description: 'Pay cash when service is delivered - Contact via WhatsApp'
    }
  ];

  const renderBookingDetails = () => {
    const { serviceType, serviceDetails } = bookingData;
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="secondary" className="bg-russian-gold/20 text-russian-gold">
            {serviceType}
          </Badge>
        </div>
        
        {serviceType === 'Transportation' && serviceDetails && 'pickup' in serviceDetails && (
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-white/70 mt-1" />
              <div>
                <p className="text-white/70 text-sm">Pickup Location</p>
                <p className="text-white font-medium">{serviceDetails.pickup}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-white/70 mt-1" />
              <div>
                <p className="text-white/70 text-sm">Drop-off Location</p>
                <p className="text-white font-medium">{serviceDetails.dropoff}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-white/70 mt-1" />
              <div>
                <p className="text-white/70 text-sm">Date & Time</p>
                <p className="text-white font-medium">{serviceDetails.date} at {serviceDetails.time}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Car className="h-4 w-4 text-white/70 mt-1" />
              <div>
                <p className="text-white/70 text-sm">Vehicle Type</p>
                <p className="text-white font-medium">{serviceDetails.vehicleType}</p>
              </div>
            </div>
          </div>
        )}

        {serviceType === 'Hotels' && serviceDetails && 'city' in serviceDetails && (
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-white/70 mt-1" />
              <div>
                <p className="text-white/70 text-sm">City</p>
                <p className="text-white font-medium">{serviceDetails.city}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Building2 className="h-4 w-4 text-white/70 mt-1" />
              <div>
                <p className="text-white/70 text-sm">Hotel</p>
                <p className="text-white font-medium">{serviceDetails.hotel}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-white/70 mt-1" />
              <div>
                <p className="text-white/70 text-sm">Check-in / Check-out</p>
                <p className="text-white font-medium">{serviceDetails.checkin} - {serviceDetails.checkout}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="h-4 w-4 text-white/70 mt-1" />
              <div>
                <p className="text-white/70 text-sm">Room Type</p>
                <p className="text-white font-medium">{serviceDetails.roomType}</p>
              </div>
            </div>
          </div>
        )}

        {serviceType === 'Events' && serviceDetails && 'eventName' in serviceDetails && (
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Ticket className="h-4 w-4 text-white/70 mt-1" />
              <div>
                <p className="text-white/70 text-sm">Event Name</p>
                <p className="text-white font-medium">{serviceDetails.eventName}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-white/70 mt-1" />
              <div>
                <p className="text-white/70 text-sm">Location</p>
                <p className="text-white font-medium">{serviceDetails.eventLocation}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-white/70 mt-1" />
              <div>
                <p className="text-white/70 text-sm">Event Date</p>
                <p className="text-white font-medium">{serviceDetails.eventDate}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="h-4 w-4 text-white/70 mt-1" />
              <div>
                <p className="text-white/70 text-sm">Tickets</p>
                <p className="text-white font-medium">{serviceDetails.tickets}</p>
              </div>
            </div>
          </div>
        )}

        {serviceType === 'Custom Trips' && serviceDetails && 'duration' in serviceDetails && (
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Clock className="h-4 w-4 text-white/70 mt-1" />
              <div>
                <p className="text-white/70 text-sm">Duration</p>
                <p className="text-white font-medium">{serviceDetails.duration}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Globe className="h-4 w-4 text-white/70 mt-1" />
              <div>
                <p className="text-white/70 text-sm">Regions</p>
                <p className="text-white font-medium">{serviceDetails.regions}</p>
              </div>
            </div>
            {serviceDetails.interests && serviceDetails.interests.length > 0 && (
              <div className="flex items-start gap-3">
                <Users className="h-4 w-4 text-white/70 mt-1" />
                <div>
                  <p className="text-white/70 text-sm">Interests</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {serviceDetails.interests.map((interest, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Customer Information */}
        <div className="border-t border-white/20 pt-4 mt-6">
          <h4 className="text-white font-medium mb-3">Customer Information</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/70">Name:</span>
              <span className="text-white">{bookingData.userInfo.fullName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/70">Email:</span>
              <span className="text-white">{bookingData.userInfo.email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/70">Phone:</span>
              <span className="text-white">{bookingData.userInfo.phone}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/70">Language:</span>
              <span className="text-white">{bookingData.userInfo.language}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
                        onClick={() => handlePaymentMethodChange(method.id)}
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
                        onChange={(e) => {
                          // Format card number with spaces
                          const value = e.target.value.replace(/\D/g, '');
                          const formattedValue = value.replace(/(\d{4})(?=\d)/g, '$1 ');
                          setCardNumber(formattedValue);
                        }}
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
                          onChange={(e) => {
                            // Format as MM/YY
                            const value = e.target.value.replace(/\D/g, '');
                            if (value.length >= 2) {
                              const formattedValue = value.slice(0, 2) + '/' + value.slice(2, 4);
                              setExpiryDate(formattedValue);
                            } else {
                              setExpiryDate(value);
                            }
                          }}
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
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            setCvv(value);
                          }}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-russian-gold"
                          placeholder="123"
                          maxLength={4}
                          required
                        />
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                      <h4 className="text-blue-800 dark:text-blue-200 font-medium mb-2">Bank Transfer Information</h4>
                      <p className="text-blue-700 dark:text-blue-300 text-sm mb-2">
                        Your payment will be processed securely. For bank transfer details, please contact us at:
                      </p>
                      <p className="text-blue-800 dark:text-blue-200 text-sm font-mono">
                        info@volgaservices.com
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={isProcessing || finalAmount <= 0}
                      className="w-full bg-russian-gold hover:bg-russian-gold/90 text-white font-semibold py-3"
                    >
                      {isProcessing ? 'Processing Payment...' : `Pay $${finalAmount.toFixed(2)} with Credit Card`}
                    </Button>
                  </form>
                )}

                {/* PayPal Form */}
                {selectedMethod === 'paypal' && (
                  <div className="space-y-4">
                    <div className="bg-white/5 rounded-lg p-4 border border-white/20">
                      <h4 className="text-white font-medium mb-3">PayPal Payment</h4>
                      {paypalError ? (
                        <div className="text-red-400 text-sm mb-4 p-3 bg-red-500/10 rounded">
                          {paypalError}
                          <Button 
                            onClick={() => {
                              setPaypalError('');
                              cleanupPayPal();
                            }}
                            className="ml-2 text-xs bg-red-500/20 hover:bg-red-500/30"
                            size="sm"
                          >
                            Retry
                          </Button>
                        </div>
                      ) : (
                        <p className="text-white/70 text-sm mb-4">
                          Click the PayPal button below to complete your payment securely.
                        </p>
                      )}
                      <div 
                        ref={paypalContainerRef}
                        className="min-h-[50px]"
                      >
                        {!paypalScriptLoaded && !paypalError && (
                          <div className="flex items-center justify-center py-4">
                            <div className="text-white/60">Loading PayPal...</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Cash on Arrival Form */}
                {selectedMethod === 'cash-on-arrival' && (
                  <div className="space-y-4">
                    <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
                          <MessageCircle className="h-5 w-5" />
                          Payment upon Arrival
                        </CardTitle>
                        <CardDescription className="text-green-700 dark:text-green-300">
                          Confirm your booking and arrange payment details via WhatsApp
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border">
                          <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">How it works:</h4>
                          <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
                            <li>• Confirm your booking by clicking the button below</li>
                            <li>• You'll be redirected to WhatsApp to contact our team</li>
                            <li>• Arrange service details and confirm payment upon arrival</li>
                            <li>• Pay cash when the service is delivered</li>
                          </ul>
                        </div>
                        
                        <div className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-lg border">
                          <div>
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Amount to Pay on Arrival</p>
                            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">${finalAmount.toFixed(2)} USD</p>
                          </div>
                          <DollarSign className="h-5 w-5 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Button
                      onClick={handleCashPaymentConfirmation}
                      disabled={finalAmount <= 0}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 flex items-center gap-2"
                    >
                      <MessageCircle className="h-5 w-5" />
                      Confirm Booking & Contact via WhatsApp
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enhanced Booking Summary */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Booking Summary</CardTitle>
                <CardDescription className="text-white/70">
                  Review your service details before payment
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderBookingDetails()}

                <div className="border-t border-white/20 pt-4 mt-6">
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

                <div className="flex items-center gap-2 text-white/70 text-sm mt-4">
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
