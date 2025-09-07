import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { BackButton } from '@/components/BackButton';
import { AuthRequiredWrapper } from '@/components/booking/AuthRequiredWrapper';
import { BankTransferForm } from '@/components/payment/BankTransferForm';
import { BankTransferInfo } from '@/components/payment/BankTransferInfo';
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
import { createBooking } from '@/services/database';
import { completeDraftBooking, createEnhancedBooking } from '@/services/bookingService';
import type { BookingData } from '@/types/booking';

const EnhancedPayment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const bookingData = location.state?.bookingData as BookingData;
  const draftId = location.state?.draftId as string;
  
  const [selectedMethod, setSelectedMethod] = useState<'cash' | 'stripe' | 'bank-transfer'>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(bookingData?.totalPrice?.toString() || '');
  const [showBankTransferForm, setShowBankTransferForm] = useState(false);

  // Stripe payment form fields
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');

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
      name: t('cashOnArrival'),
      icon: Banknote,
      description: t('payInCash'),
      recommended: true
    },
    {
      id: 'stripe' as const,
      name: t('creditCard'),
      icon: CreditCard,
      description: t('secureCardPayment')
    },
    {
      id: 'bank-transfer' as const,
      name: t('bankTransfer'),
      icon: Building2,
      description: t('directBankTransfer')
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

      navigate('/booking-confirmation', {
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

      navigate('/booking-confirmation', {
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

  const handleBankTransferSubmit = async () => {
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
      const transactionId = `BANK-${Date.now()}`;
      
      // Create the booking with pending verification status
      await createEnhancedBooking(bookingData, {
        paymentMethod: 'Bank Transfer',
        transactionId,
        totalPrice: finalAmount,
        requiresVerification: true
      });

      // Complete draft if exists
      if (draftId) {
        await completeDraftBooking(draftId);
      }

      toast({
        title: t('bookingConfirmed'),
        description: t('bankTransferSubmitted'),
      });

      navigate('/booking-confirmation', {
        state: {
          bookingData: {
            ...bookingData,
            paymentMethod: 'Bank Transfer',
            transactionId,
            paidAmount: 0,
            totalPrice: finalAmount,
            status: 'pending_verification'
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
    <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-700/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          {t('bookingSummary')}
        </CardTitle>
        <CardDescription>{t('reviewBookingDetails')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-medium">{t('service')}:</span>
          <Badge variant="secondary">{bookingData.serviceType}</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium">{t('customer')}:</span>
          <span>{bookingData.userInfo.fullName}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium">{t('email')}:</span>
          <span>{bookingData.userInfo.email}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium">{t('phone')}:</span>
          <span>{bookingData.userInfo.phone}</span>
        </div>
        <div className="border-t pt-4">
          <div className="flex items-center justify-between font-semibold text-lg">
            <span>{t('totalAmount')}:</span>
            <span className="text-primary">${finalAmount.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderPaymentMethodSelector = () => (
    <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-700/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          {t('selectPaymentMethod')}
        </CardTitle>
        <CardDescription>{t('choosePreferredPayment')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {paymentMethods.map((method) => {
          const Icon = method.icon;
          return (
            <div
              key={method.id}
              className={`relative flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                selectedMethod === method.id
                  ? 'border-primary bg-primary/5'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
              onClick={() => setSelectedMethod(method.id)}
            >
              <div className="flex items-center space-x-3 flex-1">
                <Icon className="h-6 w-6" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{method.name}</span>
                    {method.recommended && (
                      <Badge variant="default" className="text-xs">
                        {t('recommended')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{method.description}</p>
                </div>
              </div>
              <div className={`w-4 h-4 border-2 rounded-full ${
                selectedMethod === method.id 
                  ? 'border-primary bg-primary' 
                  : 'border-slate-300 dark:border-slate-600'
              }`}>
                {selectedMethod === method.id && (
                  <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5" />
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
          <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Banknote className="h-5 w-5" />
                {t('cashPayment')}
              </CardTitle>
              <CardDescription>{t('payInCashDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <MessageCircle className="h-4 w-4" />
                <AlertDescription>
                  {t('cashPaymentInfo')}
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label htmlFor="amount">{t('confirmAmount')}</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  className="text-lg font-semibold"
                />
              </div>

              <Button 
                onClick={handleCashPayment}
                disabled={isProcessing || finalAmount <= 0}
                className="w-full"
                size="lg"
              >
                {isProcessing ? t('processing') : t('confirmCashBooking')}
              </Button>
            </CardContent>
          </Card>
        );

      case 'stripe':
        return (
          <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {t('creditCardPayment')}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                {t('securePayment')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStripePayment} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">{t('paymentAmount')}</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0.00"
                    className="text-lg font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardNumber">{t('cardNumber')}</Label>
                  <Input
                    id="cardNumber"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">{t('expiryDate')}</Label>
                    <Input
                      id="expiry"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      placeholder="MM/YY"
                      maxLength={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">{t('cvv')}</Label>
                    <Input
                      id="cvv"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      placeholder="123"
                      maxLength={4}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardholderName">{t('cardholderName')}</Label>
                  <Input
                    id="cardholderName"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    placeholder={t('enterCardholderName')}
                  />
                </div>

                <Button 
                  type="submit"
                  disabled={isProcessing || finalAmount <= 0}
                  className="w-full"
                  size="lg"
                >
                  {isProcessing ? t('processing') : `${t('payNow')} $${finalAmount.toFixed(2)}`}
                </Button>
              </form>
            </CardContent>
          </Card>
        );

      case 'bank-transfer':
        return (
          <div className="space-y-6">
            <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-700/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {t('bankTransferPayment')}
                </CardTitle>
                <CardDescription>{t('bankTransferDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">{t('transferAmount')}</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0.00"
                    className="text-lg font-semibold"
                  />
                </div>

                {!showBankTransferForm ? (
                  <Button 
                    onClick={() => setShowBankTransferForm(true)}
                    disabled={finalAmount <= 0}
                    className="w-full"
                    size="lg"
                  >
                    {t('showBankDetails')}
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <BankTransferInfo 
                      amount={finalAmount} 
                      transactionId={`BANK-${Date.now()}`}
                    />
                    <BankTransferForm
                      amount={finalAmount}
                      onConfirm={async () => {
                        await handleBankTransferSubmit();
                      }}
                      loading={isProcessing}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
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
            
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                {t('completePayment')}
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-400">
                {t('choosePaymentMethod')}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Booking Details */}
              <div className="space-y-6">
                {renderBookingDetails()}
                {renderPaymentMethodSelector()}
              </div>

              {/* Right Column - Payment Form */}
              <div>
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