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
  const { t, isRTL } = useLanguage();
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
    if (paypalButtonsInstance.current) {
      try {
        if (typeof paypalButtonsInstance.current.close === 'function') {
          paypalButtonsInstance.current.close();
        }
      } catch (error) {
        // PayPal cleanup error (safe to ignore)
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
      setPaypalError(t('paymentPage.paypalError'));
      toast({
        title: t('paymentPage.paypalError'),
        description: t('paymentPage.paypalLoadFailed'),
        variant: "destructive"
      });
    };
    document.body.appendChild(script);
  }, [t, toast]);

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
                  title: t('paymentPage.bookingSaved'),
                  description: t('paymentPage.bookingSavedDesc'),
                });
              }
              
              localStorage.setItem('paymentStatus', 'completed');
              localStorage.setItem('transactionId', transactionId);
              localStorage.setItem('paymentAmount', amount.toString());
              
              toast({
                title: t('paymentPage.paymentSuccessful'),
                description: `${t('confirmation.transactionId')}: ${transactionId}`,
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
                title: t('paymentPage.paymentFailed'),
                description: t('paymentPage.paymentError'),
                variant: "destructive"
              });
            }
          },
          onError: (err: any) => {
            console.error('PayPal error:', err);
            setPaypalError(t('paymentPage.paypalError'));
            toast({
              title: t('paymentPage.paymentError'),
              description: t('paymentPage.paypalError'),
              variant: "destructive"
            });
          },
          onCancel: () => {
            toast({
              title: t('paymentPage.paymentCancelled'),
              description: t('paymentPage.paypalCancelled'),
            });
          }
        });

        if (paypalContainerRef.current) {
          paypalButtonsInstance.current.render(paypalContainerRef.current).then(() => {
            isPaypalMounted.current = true;
          }).catch((error: any) => {
            setPaypalError(t('paymentPage.paypalRenderFailed'));
          });
        }
      } catch (error) {
        console.error('Error setting up PayPal buttons:', error);
        setPaypalError(t('paymentPage.paypalInitFailed'));
      }
    };

    // Small delay to ensure DOM is ready
    setTimeout(renderPayPalButtons, 100);
  }, [selectedMethod, paypalScriptLoaded, customAmount, user, bookingData, navigate, toast, t]);

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
        title: t('paymentPage.invalidAmount'),
        description: t('paymentPage.enterValidAmount'),
        variant: "destructive"
      });
      return;
    }

    // Validate credit card fields
    if (!cardNumber || !expiryDate || !cvv || !cardholderName) {
      toast({
        title: t('paymentPage.missingInfo'),
        description: t('paymentPage.fillCardDetails'),
        variant: "destructive"
      });
      return;
    }

    // Basic card number validation (remove spaces and check length)
    const cleanCardNumber = cardNumber.replace(/\s/g, '');
    if (cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
      toast({
        title: t('paymentPage.invalidCardNumber'),
        description: t('paymentPage.enterValidCardNumber'),
        variant: "destructive"
      });
      return;
    }

    // Basic expiry date validation (MM/YY format)
    if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
      toast({
        title: t('paymentPage.invalidExpiryDate'),
        description: t('paymentPage.enterExpiryFormat'),
        variant: "destructive"
      });
      return;
    }

    // Basic CVV validation
    if (cvv.length < 3 || cvv.length > 4) {
      toast({
        title: t('paymentPage.invalidCVV'),
        description: t('paymentPage.enterValidCVV'),
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
          title: t('paymentPage.bookingSaved'),
          description: t('paymentPage.bookingSavedDesc'),
        });
      }

      // Send booking email
      await sendBookingEmail(bookingData, transactionId, finalAmount.toString());
      
      localStorage.setItem('paymentStatus', 'completed');
      localStorage.setItem('transactionId', transactionId);
      localStorage.setItem('paymentAmount', finalAmount.toString());
      
      toast({
        title: t('paymentPage.paymentSuccessful'),
        description: `${t('confirmation.transactionId')}: ${transactionId}`,
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
        title: t('paymentPage.paymentFailed'),
        description: error.message || t('paymentPage.paymentError'),
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCashPaymentConfirmation = async () => {
    try {
      const transactionId = `CASH${Date.now()}`;
      
      // Validate required data
      if (!bookingData || !bookingData.userInfo) {
        toast({
          title: t('error'),
          description: t('paymentPage.bookingDataMissing'),
          variant: "destructive"
        });
        return;
      }
      
      if (finalAmount <= 0) {
        toast({
          title: t('paymentPage.invalidAmount'),
          description: t('paymentPage.enterValidAmount'),
          variant: "destructive"
        });
        return;
      }
      
      // Save booking if user is logged in
      if (user) {
        try {
          await createBooking({
            ...bookingData,
            customAmount: finalAmount,
            totalPrice: finalAmount,
            paymentMethod: 'Cash on Arrival'
          }, {
            paymentMethod: 'Cash on Arrival',
            transactionId,
            totalPrice: finalAmount
          });
          
          toast({
            title: t('paymentPage.bookingSaved'),
            description: t('paymentPage.bookingSavedDesc'),
          });
        } catch (error) {
          console.error('Error saving booking:', error);
          toast({
            title: t('warning'),
            description: t('paymentPage.warningNotSaved'),
            variant: "destructive"
          });
        }
      }
      
      // Send booking email
      try {
        await sendBookingEmail(bookingData, transactionId, finalAmount.toString());
      } catch (error) {
        // Error handled gracefully
      }
      
      // Store payment information
      localStorage.setItem('paymentStatus', 'confirmed');
      localStorage.setItem('transactionId', transactionId);
      localStorage.setItem('paymentAmount', finalAmount.toString());
      
      toast({
        title: t('paymentPage.bookingConfirmed'),
        description: t('paymentPage.redirectingWhatsApp'),
      });
      
      // Small delay to show the toast before redirecting
      setTimeout(() => {
        // Redirect to WhatsApp
        const whatsappUrl = redirectToWhatsApp(bookingData, transactionId, finalAmount);
        
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
      }, 1500);
      
    } catch (error) {
      toast({
        title: t('error'),
        description: t('paymentPage.bookingError'),
        variant: "destructive"
      });
    }
  };

  const paymentMethods = [
    {
      id: 'credit-card',
      name: t('paymentPage.creditCard'),
      icon: CreditCard,
      description: t('paymentPage.creditCardDesc')
    },
    {
      id: 'paypal',
      name: t('paymentPage.paypal'),
      icon: Shield,
      description: t('paymentPage.paypalDesc')
    },
    {
      id: 'cash-on-arrival',
      name: t('paymentPage.cashOnArrival'),
      icon: MessageCircle,
      description: t('paymentPage.cashOnArrivalDesc')
    }
  ];

  const renderBookingDetails = () => {
    const { serviceType, serviceDetails } = bookingData;
    
    return (
      <div className={`space-y-4 ${isRTL ? 'text-right' : ''}`}>
        <div className={`flex items-center gap-2 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Badge variant="secondary" className="bg-russian-gold/20 text-russian-gold">
            {serviceType}
          </Badge>
        </div>
        
        {serviceType === 'Transportation' && serviceDetails && 'pickup' in serviceDetails && (
          <div className="space-y-3">
            <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <MapPin className="h-4 w-4 text-white/70 mt-1" />
              <div>
                <p className="text-white/70 text-sm">{t('paymentPage.pickupLocation')}</p>
                <p className="text-white font-medium">{serviceDetails.pickup}</p>
              </div>
            </div>
            <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <MapPin className="h-4 w-4 text-white/70 mt-1" />
              <div>
                <p className="text-white/70 text-sm">{t('paymentPage.dropoffLocation')}</p>
                <p className="text-white font-medium">{serviceDetails.dropoff}</p>
              </div>
            </div>
            <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Calendar className="h-4 w-4 text-white/70 mt-1" />
              <div>
                <p className="text-white/70 text-sm">{t('paymentPage.dateAndTime')}</p>
                <p className="text-white font-medium">{serviceDetails.date} {t('at')} {serviceDetails.time}</p>
              </div>
            </div>
            <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Car className="h-4 w-4 text-white/70 mt-1" />
              <div>
                <p className="text-white/70 text-sm">{t('paymentPage.vehicleType')}</p>
                <p className="text-white font-medium">{serviceDetails.vehicleType}</p>
              </div>
            </div>
          </div>
        )}

        {serviceType === 'Hotels' && serviceDetails && 'city' in serviceDetails && (
          <div className="space-y-3">
            <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <MapPin className="h-4 w-4 text-white/70 mt-1" />
              <div>
                <p className="text-white/70 text-sm">{t('paymentPage.city')}</p>
                <p className="text-white font-medium">{serviceDetails.city}</p>
              </div>
            </div>
            <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Building2 className="h-4 w-4 text-white/70 mt-1" />
              <div>
                <p className="text-white/70 text-sm">{t('paymentPage.hotel')}</p>
                <p className="text-white font-medium">{serviceDetails.hotel}</p>
              </div>
            </div>
            <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Calendar className="h-4 w-4 text-white/70 mt-1" />
              <div>
                <p className="text-white/70 text-sm">{t('paymentPage.checkInOut')}</p>
                <p className="text-white font-medium">{serviceDetails.checkin} - {serviceDetails.checkout}</p>
              </div>
            </div>
            <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Users className="h-4 w-4 text-white/70 mt-1" />
              <div>
                <p className="text-white/70 text-sm">{t('paymentPage.roomType')}</p>
                <p className="text-white font-medium">{serviceDetails.roomType}</p>
              </div>
            </div>
          </div>
        )}

        {serviceType === 'Events' && serviceDetails && 'eventName' in serviceDetails && (
          <div className="space-y-3">
            <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Ticket className="h-4 w-4 text-white/70 mt-1" />
              <div>
                <p className="text-white/70 text-sm">{t('paymentPage.eventName')}</p>
                <p className="text-white font-medium">{serviceDetails.eventName}</p>
              </div>
            </div>
            <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <MapPin className="h-4 w-4 text-white/70 mt-1" />
              <div>
                <p className="text-white/70 text-sm">{t('paymentPage.location')}</p>
                <p className="text-white font-medium">{serviceDetails.eventLocation}</p>
              </div>
            </div>
            <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Calendar className="h-4 w-4 text-white/70 mt-1" />
              <div>
                <p className="text-white/70 text-sm">{t('paymentPage.eventDate')}</p>
                <p className="text-white font-medium">{serviceDetails.eventDate}</p>
              </div>
            </div>
            <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Users className="h-4 w-4 text-white/70 mt-1" />
              <div>
                <p className="text-white/70 text-sm">{t('paymentPage.numberOfTickets')}</p>
                <p className="text-white font-medium">{serviceDetails.tickets}</p>
              </div>
            </div>
          </div>
        )}

        {serviceType === 'Custom Trips' && serviceDetails && 'duration' in serviceDetails && (
          <div className="space-y-3">
            <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Clock className="h-4 w-4 text-white/70 mt-1" />
              <div>
                <p className="text-white/70 text-sm">{t('paymentPage.tripDuration')}</p>
                <p className="text-white font-medium">{serviceDetails.duration}</p>
              </div>
            </div>
            <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Globe className="h-4 w-4 text-white/70 mt-1" />
              <div>
                <p className="text-white/70 text-sm">{t('paymentPage.regionsToVisit')}</p>
                <p className="text-white font-medium">{serviceDetails.regions}</p>
              </div>
            </div>
            {serviceDetails.interests && serviceDetails.interests.length > 0 && (
              <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Users className="h-4 w-4 text-white/70 mt-1" />
                <div>
                  <p className="text-white/70 text-sm">{t('paymentPage.interests')}</p>
                  <div className={`flex flex-wrap gap-2 mt-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
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
          <h4 className="text-white font-medium mb-3">{t('paymentPage.customerInformation')}</h4>
          <div className="space-y-2">
            <div className={`flex justify-between text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="text-white/70">{t('paymentPage.name')}:</span>
              <span className="text-white">{bookingData.userInfo.fullName}</span>
            </div>
            <div className={`flex justify-between text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="text-white/70">{t('paymentPage.email')}:</span>
              <span className="text-white">{bookingData.userInfo.email}</span>
            </div>
            <div className={`flex justify-between text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="text-white/70">{t('paymentPage.phone')}:</span>
              <span className="text-white">{bookingData.userInfo.phone}</span>
            </div>
            <div className={`flex justify-between text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="text-white/70">{t('paymentPage.language')}:</span>
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
                  <strong>{t('note')}:</strong> {t('paymentPage.notLoggedIn')} {t('paymentPage.considerSignIn')} <button 
                    onClick={() => navigate('/auth')} 
                    className="underline text-yellow-900 hover:text-yellow-700"
                  >
                    {t('paymentPage.signingIn')}
                  </button>.
                </p>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Payment Form */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className={`text-white flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Lock className="h-5 w-5" />
                  {t('paymentPage.securePayment')}
                </CardTitle>
                <CardDescription className="text-white/70">
                  {t('paymentPage.completeBookingSecurely')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Payment Amount */}
                <div className="space-y-4 mb-6">
                  <h3 className={`text-white font-medium flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <DollarSign className="h-5 w-5" />
                    {t('paymentPage.paymentAmount')}
                  </h3>
                  <div>
                    <Label htmlFor="amount" className="block text-white text-sm font-medium mb-2">
                      {t('paymentPage.amountUSD')}
                    </Label>
                    <div className="relative">
                      <span className={`absolute top-1/2 transform -translate-y-1/2 text-white/70 ${isRTL ? 'right-3' : 'left-3'}`}>$</span>
                      <Input
                        id="amount"
                        type="text"
                        value={customAmount}
                        onChange={handleAmountChange}
                        className={`bg-white/10 border-white/20 text-white placeholder-white/50 focus:ring-russian-gold ${isRTL ? 'pr-8' : 'pl-8'}`}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <p className="text-white/60 text-xs mt-1">
                      {t('paymentPage.enterAmountToPay')}
                    </p>
                  </div>
                </div>

                {/* Payment Method Selection */}
                <div className="space-y-4 mb-6">
                  <h3 className="text-white font-medium">{t('payment.paymentMethod')}</h3>
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
                        <div className={`p-4 flex items-center space-x-3 ${isRTL ? 'flex-row-reverse space-x-reverse' : ''}`}>
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
                        {t('paymentPage.cardholderName')}
                      </label>
                      <input
                        type="text"
                        value={cardholderName}
                        onChange={(e) => setCardholderName(e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-russian-gold"
                        placeholder={t('paymentPage.enterCardholderName')}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        {t('paymentPage.cardNumber')}
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
                          {t('paymentPage.expiryDate')}
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
                          {t('paymentPage.cvv')}
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
                      <h4 className="text-blue-800 dark:text-blue-200 font-medium mb-2">{t('paymentPage.bankTransferInfo')}</h4>
                      <p className="text-blue-700 dark:text-blue-300 text-sm mb-2">
                        {t('paymentPage.bankTransferDescription')}
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
                      {isProcessing ? t('paymentPage.processingPayment') : t('paymentPage.payWithCard', { amount: finalAmount.toFixed(2) })}
                    </Button>
                  </form>
                )}

                {/* PayPal Form */}
                {selectedMethod === 'paypal' && (
                  <div className="space-y-4">
                    <div className="bg-white/5 rounded-lg p-4 border border-white/20">
                      <h4 className="text-white font-medium mb-3">{t('paymentPage.paypalPayment')}</h4>
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
                            {t('paymentPage.retry')}
                          </Button>
                        </div>
                      ) : (
                        <p className="text-white/70 text-sm mb-4">
                          {t('paymentPage.completeWithPaypal')}
                        </p>
                      )}
                      <div 
                        ref={paypalContainerRef} 
                        className="min-h-[100px] flex items-center justify-center"
                      >
                        {!paypalScriptLoaded && !paypalError && (
                          <div className="text-white/50 text-sm">{t('loading')}...</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Cash on Arrival Form */}
                {selectedMethod === 'cash-on-arrival' && (
                  <div className="space-y-4">
                    <div className="bg-white/5 rounded-lg p-4 border border-white/20">
                      <h4 className="text-white font-medium mb-3">{t('paymentPage.cashPaymentTitle')}</h4>
                      <p className="text-white/70 text-sm mb-4">
                        {t('paymentPage.cashPaymentDesc')}
                      </p>
                      <Button
                        onClick={handleCashPaymentConfirmation}
                        className="w-full bg-russian-gold hover:bg-russian-gold/90 text-white font-semibold py-3"
                        disabled={finalAmount <= 0}
                      >
                        <MessageCircle className="h-5 w-5 mr-2" />
                        {t('paymentPage.confirmAndWhatsApp')}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Booking Summary */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className={`text-white flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <DollarSign className="h-5 w-5" />
                  {t('paymentPage.bookingDetails')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderBookingDetails()}
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