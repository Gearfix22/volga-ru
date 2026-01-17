import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { BackButton } from '@/components/BackButton';
import { AuthRequiredWrapper } from '@/components/booking/AuthRequiredWrapper';
import { BankTransferForm } from '@/components/payment/BankTransferForm';
import { EnhancedCurrencySelector } from '@/components/booking/EnhancedCurrencySelector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  Banknote, 
  Building2, 
  Shield, 
  Lock, 
  CheckCircle, 
  AlertTriangle,
  DollarSign,
  MessageCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { completeDraftBooking, createEnhancedBooking, processBookingPayment } from '@/services/bookingService';
import { canPayForBooking, subscribeToPaymentGuardChanges } from '@/services/paymentGuardService';
import { convertFromUSD, getCurrencyRates, type CurrencyCode, type CurrencyRate, formatPrice } from '@/services/currencyService';
import type { BookingData } from '@/types/booking';

const EnhancedPayment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  
  // Accept both bookingData (from booking flow) and bookingId (from dashboard)
  const initialBookingData = location.state?.bookingData as BookingData | undefined;
  const bookingId = location.state?.bookingId as string | undefined;
  const draftId = location.state?.draftId as string | undefined;
  
  const [bookingData, setBookingData] = useState<BookingData | null>(initialBookingData || null);
  const [payablePrice, setPayablePrice] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<'cash' | 'stripe' | 'bank-transfer'>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('USD');
  const [selectedExchangeRate, setSelectedExchangeRate] = useState<number>(1);
  const [currencyRates, setCurrencyRates] = useState<CurrencyRate[]>([]);
  const [convertedAmount, setConvertedAmount] = useState<number>(0);
  const [currentBookingId, setCurrentBookingId] = useState<string | null>(bookingId || null);

  // Stripe payment form fields
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');

  // Load currency rates, booking data, and payment eligibility
  useEffect(() => {
    const loadData = async () => {
      const rates = await getCurrencyRates();
      setCurrencyRates(rates);
      
      // If bookingId is provided, fetch booking data and payment eligibility
      if (bookingId) {
        setCurrentBookingId(bookingId);
        
        // Fetch payment eligibility from v_booking_payment_guard (SINGLE SOURCE OF TRUTH)
        const payCheck = await canPayForBooking(bookingId);
        if (payCheck.canPay && payCheck.amount) {
          setPayablePrice(payCheck.amount);
        } else {
          setPayablePrice(null);
        }
        
        // If no bookingData provided, fetch basic info from bookings table
        if (!initialBookingData) {
          const { data: booking, error } = await supabase
            .from('bookings')
            .select('service_type, user_info, service_details')
            .eq('id', bookingId)
            .single();
          
          if (!error && booking) {
            const userInfo = typeof booking.user_info === 'object' && booking.user_info !== null
              ? booking.user_info as { fullName?: string; email?: string; phone?: string; language?: string }
              : { fullName: '', email: '', phone: '', language: 'english' };
            
            setBookingData({
              serviceType: booking.service_type,
              userInfo: {
                fullName: userInfo.fullName || '',
                email: userInfo.email || '',
                phone: userInfo.phone || '',
                language: userInfo.language || 'english'
              },
              serviceDetails: (typeof booking.service_details === 'object' && booking.service_details !== null ? booking.service_details : {}) as import('@/types/booking').ServiceDetails,
              totalPrice: 0 // Will be overridden by payablePrice
            });
          }
        }
      }
      
      setPriceLoading(false);
    };
    loadData();

    // Subscribe to real-time updates for payment eligibility
    let unsubscribe: (() => void) | undefined;
    if (bookingId) {
      unsubscribe = subscribeToPaymentGuardChanges(bookingId, async (guard) => {
        if (guard?.can_pay && guard.approved_price) {
          setPayablePrice(guard.approved_price);
        }
      });
    }

    return () => {
      unsubscribe?.();
    };
  }, [bookingId, initialBookingData]);

  // Update converted amount when currency changes
  useEffect(() => {
    const baseAmount = payablePrice || 0;
    const rate = currencyRates.find(r => r.currency_code === selectedCurrency);
    const converted = rate ? convertFromUSD(baseAmount, rate.rate_to_usd) : baseAmount;
    setConvertedAmount(converted);
  }, [selectedCurrency, payablePrice, currencyRates]);

  const hasPayablePrice = payablePrice !== null && payablePrice > 0;

  // Redirect if no booking context at all
  useEffect(() => {
    if (!bookingId && !initialBookingData) {
      toast({
        title: t('error'),
        description: t('noBookingData'),
        variant: 'destructive'
      });
      navigate('/enhanced-booking');
    }
  }, [bookingId, initialBookingData, navigate, t, toast]);

  // Show loading while fetching price
  if (priceLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className={`text-center ${isRTL ? 'rtl' : ''}`}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{t('enhancedPayment.loadingPaymentDetails')}</p>
        </div>
      </div>
    );
  }

  // Check if price has been set
  if (!hasPayablePrice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className={`text-center max-w-md mx-auto p-6 ${isRTL ? 'rtl' : ''}`}>
          <h2 className="text-2xl font-bold mb-4">{t('enhancedPayment.priceNotSet')}</h2>
          <p className="text-muted-foreground mb-6">
            {t('enhancedPayment.priceNotSetDesc')}
          </p>
          <Button onClick={() => navigate('/user-dashboard')}>
            {t('enhancedPayment.goToDashboard')}
          </Button>
        </div>
      </div>
    );
  }

  // Use admin price from booking_prices as the payment amount (locked, non-editable)
  const finalAmount = payablePrice!;

  const paymentMethods = [
    {
      id: 'cash' as const,
      name: t('paymentMethods.cashOnArrival'),
      icon: Banknote,
      description: t('messages.cashOnArrivalDescription'),
      recommended: true
    },
    {
      id: 'stripe' as const,
      name: t('paymentMethods.creditCard'),
      icon: CreditCard,
      description: t('messages.creditCardDescription')
    },
    {
      id: 'bank-transfer' as const,
      name: t('paymentMethods.bankTransfer'),
      icon: Building2,
      description: t('payment.bankTransferNote')
    }
  ];

  const handleCashPayment = async () => {
    if (finalAmount <= 0) {
      toast({
        title: t('invalidAmount'),
        description: t('enterValidAmount'),
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    try {
      const transactionId = `CASH-${Date.now()}`;
      const convertedPrice = convertFromUSD(finalAmount, selectedExchangeRate);
      
      // If we have an existing booking, update it with payment info
      // Otherwise, create a new booking (for new service selection flow)
      if (currentBookingId) {
        await processBookingPayment(currentBookingId, {
          paymentMethod: 'Cash on Arrival',
          transactionId,
          paidAmount: finalAmount,
          paymentCurrency: selectedCurrency,
          exchangeRateUsed: selectedExchangeRate,
          finalPaidAmount: convertedPrice,
          requiresVerification: false
        });
      } else if (bookingData) {
        await createEnhancedBooking(bookingData, {
          paymentMethod: 'Cash on Arrival',
          transactionId,
          totalPrice: finalAmount,
          paymentCurrency: selectedCurrency,
          exchangeRateUsed: selectedExchangeRate,
          finalPaidAmount: convertedPrice
        });
      }

      // Complete draft if exists
      if (draftId) {
        await completeDraftBooking(draftId);
      }

      toast({
        title: t('bookingConfirmed'),
        description: t('cashPaymentConfirmed'),
      });

      navigate('/enhanced-confirmation', {
        state: {
          bookingData: {
            ...bookingData,
            paymentMethod: 'Cash on Arrival',
            transactionId,
            paidAmount: 0,
            totalPrice: finalAmount,
            status: 'confirmed'
          }
        }
      });
    } catch (error) {
      console.error('Cash payment error:', error);
      toast({
        title: t('error'),
        description: t('bookingError'),
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStripePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (finalAmount <= 0) {
      toast({
        title: t('invalidAmount'),
        description: t('enterValidAmount'),
        variant: 'destructive'
      });
      return;
    }

    // Validate credit card fields
    if (!cardNumber || !expiryDate || !cvv || !cardholderName) {
      toast({
        title: t('missingInformation'),
        description: t('fillAllCardDetails'),
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    try {
      // For now, simulate Stripe payment (you would integrate real Stripe here)
      const transactionId = `STRIPE-${Date.now()}`;
      const convertedPrice = convertFromUSD(finalAmount, selectedExchangeRate);
      
      // If we have an existing booking, update it with payment info
      if (currentBookingId) {
        await processBookingPayment(currentBookingId, {
          paymentMethod: 'Credit Card',
          transactionId,
          paidAmount: finalAmount,
          paymentCurrency: selectedCurrency,
          exchangeRateUsed: selectedExchangeRate,
          finalPaidAmount: convertedPrice,
          requiresVerification: false
        });
      } else if (bookingData) {
        await createEnhancedBooking(bookingData, {
          paymentMethod: 'Credit Card',
          transactionId,
          totalPrice: finalAmount,
          paymentCurrency: selectedCurrency,
          exchangeRateUsed: selectedExchangeRate,
          finalPaidAmount: convertedPrice
        });
      }

      // Complete draft if exists
      if (draftId) {
        await completeDraftBooking(draftId);
      }

      toast({
        title: t('paymentSuccessful'),
        description: `Transaction ID: ${transactionId}`,
      });

      navigate('/enhanced-confirmation', {
        state: {
          bookingData: {
            ...bookingData,
            paymentMethod: 'Credit Card',
            transactionId,
            paidAmount: finalAmount,
            totalPrice: finalAmount,
            status: 'paid'
          }
        }
      });
    } catch (error) {
      console.error('Stripe payment error:', error);
      toast({
        title: t('paymentFailed'),
        description: t('paymentError'),
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBankTransferSubmit = async (transferDetails: {
    referenceNumber: string;
    transferDate: string;
    notes?: string;
    receiptFile?: File;
  }) => {
    if (finalAmount <= 0) {
      toast({
        title: t('invalidAmount'),
        description: t('enterValidAmount'),
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    try {
      const transactionId = `BANK-${Date.now()}-${transferDetails.referenceNumber}`;
      let receiptUrl = '';
      
      // Upload receipt file if provided
      if (transferDetails.receiptFile) {
        const fileExt = transferDetails.receiptFile.name.split('.').pop();
        const fileName = `${user?.id}/${transactionId}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('payment-receipts')
          .upload(fileName, transferDetails.receiptFile);
        
        if (uploadError) {
          console.error('Receipt upload error:', uploadError);
          toast({
            title: t('warning'),
            description: t('payment.receiptUploadFailed'),
            variant: 'destructive'
          });
        } else if (uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from('payment-receipts')
            .getPublicUrl(fileName);
          receiptUrl = publicUrl;
        }
      }
      
      // Process payment for existing booking or create new one
      const convertedPrice = convertFromUSD(finalAmount, selectedExchangeRate);
      let booking: any;
      
      if (currentBookingId) {
        // Update existing booking with bank transfer payment info
        booking = await processBookingPayment(currentBookingId, {
          paymentMethod: 'Bank Transfer',
          transactionId,
          paidAmount: finalAmount,
          paymentCurrency: selectedCurrency,
          exchangeRateUsed: selectedExchangeRate,
          finalPaidAmount: convertedPrice,
          requiresVerification: true,
          customerNotes: `Reference: ${transferDetails.referenceNumber}, Date: ${transferDetails.transferDate}. ${transferDetails.notes || ''}`
        });
      } else if (bookingData) {
        // Create new booking for new service selection flow
        booking = await createEnhancedBooking(bookingData, {
          paymentMethod: 'Bank Transfer',
          transactionId,
          totalPrice: finalAmount,
          requiresVerification: true,
          adminNotes: `Reference: ${transferDetails.referenceNumber}, Date: ${transferDetails.transferDate}`,
          customerNotes: transferDetails.notes,
          paymentCurrency: selectedCurrency,
          exchangeRateUsed: selectedExchangeRate,
          finalPaidAmount: convertedPrice
        });
      }

      // Save payment receipt record if file was uploaded
      const targetBookingId = currentBookingId || booking?.id;
      if (receiptUrl && targetBookingId) {
        await supabase.from('payment_receipts').insert({
          booking_id: targetBookingId,
          file_url: receiptUrl,
          file_name: transferDetails.receiptFile?.name || ''
        });
      }

      // Complete draft if exists
      if (draftId) {
        await completeDraftBooking(draftId);
      }

      toast({
        title: t('bookingConfirmed'),
        description: t('bankTransferSubmitted'),
      });

      navigate('/enhanced-confirmation', {
        state: {
          bookingData: {
            ...bookingData,
            paymentMethod: 'Bank Transfer',
            transactionId,
            paidAmount: 0,
            totalPrice: finalAmount,
            status: 'pending_verification',
            receiptUrl
          }
        }
      });
    } catch (error) {
      console.error('Bank transfer error:', error);
      toast({
        title: t('error'),
        description: t('bookingError'),
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderBookingDetails = () => {
    // Guard against null bookingData - should not happen but adds safety
    if (!bookingData) {
      return (
        <Card className="backdrop-blur-sm bg-white/90 dark:bg-slate-900/90 border-2 border-slate-200 dark:border-slate-700 sticky top-24">
          <CardContent className="p-6">
            <p className="text-muted-foreground">{t('messages.loadingBookingDetails')}</p>
          </CardContent>
        </Card>
      );
    }
    
    return (
    <Card className="backdrop-blur-sm bg-white/90 dark:bg-slate-900/90 border-2 border-slate-200 dark:border-slate-700 sticky top-24">
      <CardHeader className="pb-3">
        <CardTitle className={`flex items-center gap-2 text-xl ${isRTL ? 'flex-row-reverse' : ''}`}>
          <CheckCircle className="h-6 w-6 text-green-600" />
          {t('payment.bookingSummary')}
        </CardTitle>
        <CardDescription>{t('messages.reviewBookingDetails')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className={`flex items-center justify-between pb-2 border-b ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span className="text-muted-foreground">{t('dashboard.serviceType')}:</span>
            <Badge variant="secondary" className="font-semibold">{bookingData.serviceType}</Badge>
          </div>
          <div className={`flex items-center justify-between pb-2 border-b ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span className="text-muted-foreground">{t('messages.customerInformation')}:</span>
            <span className="font-medium">{bookingData.userInfo.fullName}</span>
          </div>
          <div className={`flex items-center justify-between pb-2 border-b ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span className="text-muted-foreground">{t('footer.email')}:</span>
            <span className="text-sm">{bookingData.userInfo.email}</span>
          </div>
          <div className={`flex items-center justify-between pb-2 border-b ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span className="text-muted-foreground">{t('footer.phone')}:</span>
            <span className="text-sm">{bookingData.userInfo.phone}</span>
          </div>
        </div>
        
        {/* Enhanced Currency Selector with Conversion Display */}
        <div className="border-t-2 pt-4 mt-4">
          <EnhancedCurrencySelector
            selectedCurrency={selectedCurrency}
            onCurrencyChange={(currency, rate) => {
              setSelectedCurrency(currency);
              setSelectedExchangeRate(rate);
            }}
            basePriceUSD={finalAmount}
            label={t('payment.selectCurrency') || 'Select Currency'}
            showConversion={true}
            showRateInfo={true}
          />
        </div>
        <Alert className="mt-4">
          <Shield className="h-4 w-4" />
          <AlertDescription className="text-xs">
            {t('messages.securePayment')}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
  };

  const renderPaymentMethodSelector = () => (
    <Card className="backdrop-blur-sm bg-white/90 dark:bg-slate-900/90 border-2 border-slate-200 dark:border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className={`flex items-center gap-2 text-xl ${isRTL ? 'flex-row-reverse' : ''}`}>
          <DollarSign className="h-6 w-6 text-primary" />
          {t('payment.paymentMethod')}
        </CardTitle>
        <CardDescription>{t('payment.choosePaymentMethod')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {paymentMethods.map((method) => {
          const Icon = method.icon;
          const isSelected = selectedMethod === method.id;
          return (
            <div
              key={method.id}
              className={`relative flex items-center p-5 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${isRTL ? 'flex-row-reverse' : ''} ${
                isSelected
                  ? 'border-primary bg-primary/10 shadow-lg'
                  : 'border-slate-200 dark:border-slate-700 hover:border-primary/50'
              }`}
              onClick={() => setSelectedMethod(method.id)}
            >
              <div className={`flex items-start space-x-4 flex-1 ${isRTL ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`p-3 rounded-lg ${isSelected ? 'bg-primary/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                  <Icon className={`h-6 w-6 ${isSelected ? 'text-primary' : 'text-slate-600 dark:text-slate-400'}`} />
                </div>
                <div className="flex-1">
                  <div className={`flex items-center gap-2 mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className={`font-semibold ${isSelected ? 'text-primary' : ''}`}>{method.name}</span>
                    {method.recommended && (
                      <Badge variant="default" className="text-xs bg-green-600">
                        {t('messages.recommended')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{method.description}</p>
                </div>
              </div>
              <div className={`w-6 h-6 border-2 rounded-full flex items-center justify-center ${
                isSelected 
                  ? 'border-primary bg-primary' 
                  : 'border-slate-300 dark:border-slate-600'
              }`}>
                {isSelected && (
                  <CheckCircle className="h-4 w-4 text-white" />
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );

  const renderPaymentForm = () => {
    switch (selectedMethod) {
      case 'cash':
        return (
          <Card className="backdrop-blur-sm bg-white/90 dark:bg-slate-900/90 border-2 border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className={`flex items-center gap-2 text-xl ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Banknote className="h-6 w-6 text-primary" />
                {t('paymentMethods.cashOnArrival')}
              </CardTitle>
              <CardDescription>{t('messages.cashOnArrivalDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
                <MessageCircle className="h-5 w-5 text-blue-600" />
                <AlertDescription className="text-blue-900 dark:text-blue-100">
                  {t('messages.cashOnArrivalDescription')}
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-base font-semibold">{t('messages.paymentAmount')}</Label>
                <div className="relative">
                  <DollarSign className={`absolute top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={finalAmount}
                    readOnly
                    placeholder="0.00"
                    className={`text-xl font-bold h-14 bg-muted ${isRTL ? 'pr-10' : 'pl-10'}`}
                  />
                </div>
              </div>

              <Button 
                onClick={handleCashPayment}
                disabled={isProcessing || finalAmount <= 0}
                className="w-full h-12 text-base font-semibold"
                size="lg"
              >
                {isProcessing ? t('messages.processingPayment') : t('payment.confirmBooking')}
              </Button>
            </CardContent>
          </Card>
        );

      case 'stripe':
        return (
          <Card className="backdrop-blur-sm bg-white/90 dark:bg-slate-900/90 border-2 border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className={`flex items-center gap-2 text-xl ${isRTL ? 'flex-row-reverse' : ''}`}>
                <CreditCard className="h-6 w-6 text-primary" />
                {t('paymentMethods.creditCard')}
              </CardTitle>
              <CardDescription className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Lock className="h-4 w-4 text-green-600" />
                {t('messages.securePayment')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStripePayment} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-base font-semibold">{t('messages.paymentAmount')}</Label>
                  <div className="relative">
                    <DollarSign className={`absolute top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={finalAmount}
                      readOnly
                      placeholder="0.00"
                      className={`text-xl font-bold h-14 bg-muted ${isRTL ? 'pr-10' : 'pl-10'}`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardNumber" className="text-base">{t('payment.cardNumber')}</Label>
                  <Input
                    id="cardNumber"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    className="h-12 text-base"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry" className="text-base">{t('payment.expiryDate')}</Label>
                    <Input
                      id="expiry"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      placeholder="MM/YY"
                      maxLength={5}
                      className="h-12 text-base"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv" className="text-base">{t('payment.cvv')}</Label>
                    <Input
                      id="cvv"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      placeholder="123"
                      maxLength={4}
                      className="h-12 text-base"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardholderName" className="text-base">{t('payment.cardholderName')}</Label>
                  <Input
                    id="cardholderName"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    placeholder={t('payment.enterCardholderName')}
                    className="h-12 text-base"
                    required
                  />
                </div>

                <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                  <Shield className="h-5 w-5 text-green-600" />
                  <AlertDescription className="text-green-900 dark:text-green-100">
                    {t('messages.securePayment')}
                  </AlertDescription>
                </Alert>

                <Button 
                  type="submit"
                  disabled={isProcessing || finalAmount <= 0}
                  className="w-full h-12 text-base font-semibold"
                  size="lg"
                >
                  {isProcessing ? t('messages.processingPayment') : `${t('payment.payNow')} $${finalAmount.toFixed(2)}`}
                </Button>
              </form>
            </CardContent>
          </Card>
        );

      case 'bank-transfer':
        return (
          <BankTransferForm
            amount={finalAmount}
            onConfirm={handleBankTransferSubmit}
            loading={isProcessing}
          />
        );

      default:
        return null;
    }
  };

  return (
    <AuthRequiredWrapper requireAuth={true}>
      <div className="relative min-h-screen overflow-hidden">
        <AnimatedBackground />
        <Navigation />
        
        <div className="relative z-10 pt-24 pb-12">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="mb-6">
              <BackButton className="text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800" />
            </div>
            
            <div className={`text-center mb-10 ${isRTL ? 'rtl' : ''}`}>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {t('messages.completeBookingSecure')}
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('payment.choosePaymentMethod')}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Booking Details (Sticky Sidebar) */}
              <div className="lg:col-span-1">
                {renderBookingDetails()}
              </div>

              {/* Right Column - Payment Methods and Forms */}
              <div className="lg:col-span-2 space-y-6">
                {renderPaymentMethodSelector()}
                {renderPaymentForm()}
              </div>
            </div>
          </div>
        </div>
        
        <Footer />
      </div>
    </AuthRequiredWrapper>
  );
};

export default EnhancedPayment;