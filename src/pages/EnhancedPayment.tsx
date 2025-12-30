import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { BackButton } from '@/components/BackButton';
import { AuthRequiredWrapper } from '@/components/booking/AuthRequiredWrapper';
import { BankTransferForm } from '@/components/payment/BankTransferForm';
import { BankTransferInfo } from '@/components/payment/BankTransferInfo';
import { CurrencySelector } from '@/components/booking/CurrencySelector';
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
import { createBooking } from '@/services/database';
import { completeDraftBooking, createEnhancedBooking } from '@/services/bookingService';
import { convertFromUSD, getCurrencyRates, type CurrencyCode, type CurrencyRate } from '@/services/currencyService';
import type { BookingData } from '@/types/booking';

const EnhancedPayment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  
  const bookingData = location.state?.bookingData as BookingData;
  const draftId = location.state?.draftId as string;
  
  const [selectedMethod, setSelectedMethod] = useState<'cash' | 'stripe' | 'bank-transfer'>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(bookingData?.totalPrice?.toString() || '');
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('USD');
  const [currencyRates, setCurrencyRates] = useState<CurrencyRate[]>([]);
  const [convertedAmount, setConvertedAmount] = useState<number>(bookingData?.totalPrice || 0);

  // Stripe payment form fields
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');

  // Load currency rates
  useEffect(() => {
    const loadRates = async () => {
      const rates = await getCurrencyRates();
      setCurrencyRates(rates);
    };
    loadRates();
  }, []);

  // Update converted amount when currency changes
  useEffect(() => {
    const baseAmount = parseFloat(paymentAmount) || 0;
    const rate = currencyRates.find(r => r.currency_code === selectedCurrency);
    const converted = rate ? convertFromUSD(baseAmount, rate.rate_to_usd) : baseAmount;
    setConvertedAmount(converted);
  }, [selectedCurrency, paymentAmount, currencyRates]);

  useEffect(() => {
    if (!bookingData) {
      toast({
        title: t('error'),
        description: t('noBookingData'),
        variant: 'destructive'
      });
      navigate('/enhanced-booking');
    }
  }, [bookingData, navigate, t, toast]);

  if (!bookingData) {
    return null;
  }

  const finalAmount = parseFloat(paymentAmount) || 0;

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
      
      // Create the booking using enhanced booking service
      await createEnhancedBooking(bookingData, {
        paymentMethod: 'Cash on Arrival',
        transactionId,
        totalPrice: finalAmount
      });

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
      
      // Create the booking using enhanced booking service
      await createEnhancedBooking(bookingData, {
        paymentMethod: 'Credit Card',
        transactionId,
        totalPrice: finalAmount
      });

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
      
      // Create the booking with pending verification status
      const booking = await createEnhancedBooking(bookingData, {
        paymentMethod: 'Bank Transfer',
        transactionId,
        totalPrice: finalAmount,
        requiresVerification: true,
        adminNotes: `Reference: ${transferDetails.referenceNumber}, Date: ${transferDetails.transferDate}`,
        customerNotes: transferDetails.notes
      });

      // Save payment receipt record if file was uploaded
      if (receiptUrl && booking) {
        await supabase.from('payment_receipts').insert({
          booking_id: booking.id,
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

  const renderBookingDetails = () => (
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
        
        {/* Currency Selector */}
        <div className="border-t-2 pt-4 mt-4">
          <Label className="text-sm font-medium mb-2 block">{t('booking.selectCurrency')}</Label>
          <CurrencySelector
            selectedCurrency={selectedCurrency}
            onCurrencyChange={setSelectedCurrency}
          />
        </div>
        
        <div className="border-t-2 pt-4 mt-4">
          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span className="text-lg font-semibold">{t('messages.paymentAmount')}:</span>
            <div className={`text-${isRTL ? 'left' : 'right'}`}>
              {selectedCurrency !== 'USD' && (
                <span className="text-sm text-muted-foreground block">
                  (${finalAmount.toFixed(2)} USD)
                </span>
              )}
              <span className="text-2xl font-bold text-primary">
                {currencyRates.find(r => r.currency_code === selectedCurrency)?.symbol || '$'}
                {convertedAmount.toFixed(2)}
                {selectedCurrency !== 'USD' && ` ${selectedCurrency}`}
              </span>
            </div>
          </div>
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
              <CardTitle className="flex items-center gap-2 text-xl">
                <Banknote className="h-6 w-6 text-primary" />
                Cash on Arrival
              </CardTitle>
              <CardDescription>Pay in cash when you receive the service</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
                <MessageCircle className="h-5 w-5 text-blue-600" />
                <AlertDescription className="text-blue-900 dark:text-blue-100">
                  You will pay the full amount in cash upon service delivery. Our team will contact you via WhatsApp to confirm the booking details.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-base font-semibold">Total Amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0.00"
                    className="text-xl font-bold pl-10 h-14"
                    readOnly
                  />
                </div>
              </div>

              <Button 
                onClick={handleCashPayment}
                disabled={isProcessing || finalAmount <= 0}
                className="w-full h-12 text-base font-semibold"
                size="lg"
              >
                {isProcessing ? 'Processing Booking...' : 'Confirm Cash Payment Booking'}
              </Button>
            </CardContent>
          </Card>
        );

      case 'stripe':
        return (
          <Card className="backdrop-blur-sm bg-white/90 dark:bg-slate-900/90 border-2 border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <CreditCard className="h-6 w-6 text-primary" />
                Visa / Credit Card Payment
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-green-600" />
                Secure SSL encrypted payment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStripePayment} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-base font-semibold">Payment Amount</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="0.00"
                      className="text-xl font-bold pl-10 h-14"
                      readOnly
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardNumber" className="text-base">Card Number</Label>
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
                    <Label htmlFor="expiry" className="text-base">Expiry Date</Label>
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
                    <Label htmlFor="cvv" className="text-base">CVV</Label>
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
                  <Label htmlFor="cardholderName" className="text-base">Cardholder Name</Label>
                  <Input
                    id="cardholderName"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    placeholder="John Doe"
                    className="h-12 text-base"
                    required
                  />
                </div>

                <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                  <Shield className="h-5 w-5 text-green-600" />
                  <AlertDescription className="text-green-900 dark:text-green-100">
                    Your payment information is encrypted and secure. We accept Visa, Mastercard, and American Express.
                  </AlertDescription>
                </Alert>

                <Button 
                  type="submit"
                  disabled={isProcessing || finalAmount <= 0}
                  className="w-full h-12 text-base font-semibold"
                  size="lg"
                >
                  {isProcessing ? 'Processing Payment...' : `Pay $${finalAmount.toFixed(2)} Now`}
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