import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { BackButton } from '@/components/BackButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { CreditCard, CheckCircle, FileText, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import type { BookingData } from '@/types/booking';

const Payment = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('credit-card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [customAmount, setCustomAmount] = useState(0);
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  
  // Credit card form fields
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');

  useEffect(() => {
    const storedData = localStorage.getItem('bookingData');
    if (storedData) {
      const data = JSON.parse(storedData);
      setBookingData(data);
      setCustomAmount(calculatePrice(data));
    } else {
      navigate('/booking');
    }
  }, [navigate]);

  const calculatePrice = (data?: BookingData) => {
    if (!data) return 0;
    
    const basePrices = {
      transportation: 50,
      hotel: 100,
      event: 75,
      trip: 200
    };
    
    let basePrice = basePrices[data.serviceType as keyof typeof basePrices] || 100;
    
    // Add some logic based on service details
    if (data.serviceType === 'event') {
      const details = data.serviceDetails as any;
      if (details.tickets) {
        basePrice *= parseInt(details.tickets);
      }
    }
    
    return basePrice;
  };

  const handleAmountChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setCustomAmount(numValue);
  };

  const saveAmountToBooking = () => {
    if (bookingData) {
      const updatedBookingData = {
        ...bookingData,
        customAmount: customAmount
      };
      localStorage.setItem('bookingData', JSON.stringify(updatedBookingData));
      setBookingData(updatedBookingData);
    }
    setIsEditingAmount(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (allowedTypes.includes(file.type)) {
        setReceiptFile(file);
      } else {
        toast({
          title: t('invalidFileType'),
          description: t('uploadValidFile'),
          variant: "destructive"
        });
      }
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.length <= 19) {
      setCardNumber(formatted);
    }
  };

  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiryDate(e.target.value);
    if (formatted.length <= 5) {
      setExpiryDate(formatted);
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/gi, '');
    if (value.length <= 4) {
      setCvv(value);
    }
  };

  const validateCreditCardForm = () => {
    if (!cardNumber || cardNumber.replace(/\s/g, '').length < 13) {
      toast({
        title: "Invalid Card Number",
        description: "Please enter a valid card number",
        variant: "destructive"
      });
      return false;
    }
    if (!expiryDate || expiryDate.length < 5) {
      toast({
        title: "Invalid Expiry Date",
        description: "Please enter a valid expiry date (MM/YY)",
        variant: "destructive"
      });
      return false;
    }
    if (!cvv || cvv.length < 3) {
      toast({
        title: "Invalid CVV",
        description: "Please enter a valid CVV",
        variant: "destructive"
      });
      return false;
    }
    if (!cardholderName.trim()) {
      toast({
        title: "Cardholder Name Required",
        description: "Please enter the cardholder name",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const handleCreditCardPayment = () => {
    if (!validateCreditCardForm()) {
      return;
    }

    setIsProcessing(true);
    
    // Save the custom amount before processing
    saveAmountToBooking();
    
    // Credit card processing would go here
    // For now, simulate successful payment
    setTimeout(() => {
      const transactionId = `CC${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('paymentStatus', 'completed');
      localStorage.setItem('transactionId', transactionId);
      localStorage.setItem('paymentAmount', customAmount.toString());
      navigate('/booking-confirmation');
    }, 3000);
  };

  const handlePayPalPayment = () => {
    setIsProcessing(true);
    
    // Save the custom amount before processing
    saveAmountToBooking();
    
    // PayPal integration would go here
    // For now, simulate successful payment
    setTimeout(() => {
      const transactionId = `PP${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('paymentStatus', 'completed');
      localStorage.setItem('transactionId', transactionId);
      localStorage.setItem('paymentAmount', customAmount.toString());
      navigate('/booking-confirmation');
    }, 3000);
  };

  const getServiceTypeName = (type: string) => {
    const names = {
      transportation: t('transportation'),
      hotel: t('hotelReservation'),
      event: t('eventBooking'),
      trip: t('customTrip')
    };
    return names[type as keyof typeof names] || type;
  };

  const renderServiceDetails = () => {
    if (!bookingData) return null;
    
    const details = bookingData.serviceDetails as any;
    return Object.entries(details).map(([key, value]) => {
      if (value && typeof value !== 'object') {
        return (
          <div key={key} className="flex justify-between">
            <span className="capitalize font-medium">{key.replace(/([A-Z])/g, ' $1')}:</span>
            <span className="text-slate-600 dark:text-slate-400">{String(value)}</span>
          </div>
        );
      }
      return null;
    }).filter(Boolean);
  };

  if (!bookingData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatedBackground />
      <Navigation />
      
      <div className="relative z-10 pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-6">
            <BackButton className="text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800" />
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              {t('paymentAndConfirmation')}
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              {t('reviewBookingComplete')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Booking Summary */}
            <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-700/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {t('bookingSummary')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">{t('serviceDetails')}</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    {getServiceTypeName(bookingData.serviceType)}
                  </p>
                  
                  <div className="space-y-2 text-sm">
                    {renderServiceDetails()}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold text-lg mb-2">{t('contactInformation')}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">{t('name')}:</span>
                      <span className="text-slate-600 dark:text-slate-400">{bookingData.userInfo.fullName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">{t('email')}:</span>
                      <span className="text-slate-600 dark:text-slate-400">{bookingData.userInfo.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">{t('phone')}:</span>
                      <span className="text-slate-600 dark:text-slate-400">{bookingData.userInfo.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">{t('language')}:</span>
                      <span className="text-slate-600 dark:text-slate-400 capitalize">{bookingData.userInfo.language}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">{t('total')}:</span>
                    <div className="flex items-center gap-2">
                      {isEditingAmount ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm">$</span>
                          <Input
                            type="number"
                            value={customAmount}
                            onChange={(e) => handleAmountChange(e.target.value)}
                            className="w-24 h-8"
                            min="0"
                            step="0.01"
                          />
                          <span className="text-sm">USD</span>
                          <Button
                            size="sm"
                            onClick={saveAmountToBooking}
                            className="h-8 px-2"
                          >
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="text-2xl font-bold text-primary">
                            ${customAmount} USD
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsEditingAmount(true)}
                            className="h-8 px-2"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {isEditingAmount && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 text-right">
                      Click the checkmark to save your custom amount
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment Options */}
            <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-700/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  {t('paymentMethod')}
                </CardTitle>
                <CardDescription>
                  {t('choosePaymentMethod')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="credit-card" id="credit-card" />
                    <Label htmlFor="credit-card" className="font-medium">Credit Card</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="paypal" id="paypal" />
                    <Label htmlFor="paypal" className="font-medium">{t('paypal')}</Label>
                  </div>
                </RadioGroup>

                {paymentMethod === 'credit-card' && (
                  <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <h3 className="font-semibold">Credit Card Information</h3>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cardNumber">Card Number *</Label>
                        <Input
                          id="cardNumber"
                          type="text"
                          placeholder="1234 5678 9012 3456"
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                          className="font-mono"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="cardholderName">Cardholder Name *</Label>
                        <Input
                          id="cardholderName"
                          type="text"
                          placeholder="John Doe"
                          value={cardholderName}
                          onChange={(e) => setCardholderName(e.target.value)}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="expiryDate">Expiry Date *</Label>
                          <Input
                            id="expiryDate"
                            type="text"
                            placeholder="MM/YY"
                            value={expiryDate}
                            onChange={handleExpiryDateChange}
                            className="font-mono"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cvv">CVV *</Label>
                          <Input
                            id="cvv"
                            type="text"
                            placeholder="123"
                            value={cvv}
                            onChange={handleCvvChange}
                            className="font-mono"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border-l-4 border-blue-400">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        Amount to charge: <strong>${customAmount} USD</strong>
                      </p>
                    </div>

                    <Button 
                      onClick={handleCreditCardPayment}
                      disabled={isProcessing}
                      className="w-full"
                    >
                      {isProcessing ? (
                        <>
                          <CreditCard className="mr-2 h-4 w-4 animate-spin" />
                          Processing Payment...
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Pay ${customAmount} USD
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {paymentMethod === 'paypal' && (
                  <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <h3 className="font-semibold">{t('paypalPayment')}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {t('paypalRedirect')}
                    </p>
                    
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border-l-4 border-yellow-400">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        {t('amountToCharge')}: <strong>${customAmount} USD</strong>
                      </p>
                    </div>

                    <Button 
                      onClick={handlePayPalPayment}
                      disabled={isProcessing}
                      className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white"
                    >
                      {isProcessing ? (
                        <>
                          <CreditCard className="mr-2 h-4 w-4 animate-spin" />
                          {t('processing')}
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-4 w-4" />
                          {t('payWithPaypal')}
                        </>
                      )}
                    </Button>
                  </div>
                )}

                <div className="pt-4">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/booking')}
                    className="w-full"
                  >
                    {t('backToBooking')}
                  </Button>
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
