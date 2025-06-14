
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Upload, CheckCircle, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import type { BookingData } from '@/types/booking';

const Payment = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('bank-transfer');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const storedData = localStorage.getItem('bookingData');
    if (storedData) {
      setBookingData(JSON.parse(storedData));
    } else {
      navigate('/booking');
    }
  }, [navigate]);

  const calculatePrice = () => {
    if (!bookingData) return 0;
    
    const basePrices = {
      transportation: 50,
      hotel: 100,
      event: 75,
      trip: 200
    };
    
    let basePrice = basePrices[bookingData.serviceType as keyof typeof basePrices] || 100;
    
    // Add some logic based on service details
    if (bookingData.serviceType === 'event') {
      const details = bookingData.serviceDetails as any;
      if (details.tickets) {
        basePrice *= parseInt(details.tickets);
      }
    }
    
    return basePrice;
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

  const handleBankTransferSubmit = () => {
    if (!receiptFile) {
      toast({
        title: t('receiptRequired'),
        description: t('pleaseUploadReceipt'),
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate upload process
    setTimeout(() => {
      localStorage.setItem('paymentStatus', 'pending-verification');
      localStorage.setItem('transactionId', `BT${Date.now()}`);
      navigate('/booking-confirmation');
    }, 2000);
  };

  const handlePayPalPayment = () => {
    setIsProcessing(true);
    
    // PayPal integration would go here
    // For now, simulate successful payment
    setTimeout(() => {
      const transactionId = `PP${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('paymentStatus', 'completed');
      localStorage.setItem('transactionId', transactionId);
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

  const totalAmount = calculatePrice();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatedBackground />
      <Navigation />
      
      <div className="relative z-10 pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-6xl">
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

                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    {t('total')}: ${totalAmount} USD
                  </div>
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
                    <RadioGroupItem value="bank-transfer" id="bank-transfer" />
                    <Label htmlFor="bank-transfer" className="font-medium">{t('bankTransfer')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="paypal" id="paypal" />
                    <Label htmlFor="paypal" className="font-medium">{t('paypal')}</Label>
                  </div>
                </RadioGroup>

                {paymentMethod === 'bank-transfer' && (
                  <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <h3 className="font-semibold">{t('bankTransferDetails')}</h3>
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">{t('bankName')}:</span>
                        <span>Volga Tourism Bank</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">{t('accountNumber')}:</span>
                        <span>1234567890123456</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">{t('swiftCode')}:</span>
                        <span>VTBANKRU</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">{t('iban')}:</span>
                        <span>RU1234567890123456789012</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">{t('beneficiary')}:</span>
                        <span>Volga Tourism Services LLC</span>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border-l-4 border-blue-400">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        {t('transferAmount')}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="receipt">{t('uploadPaymentReceipt')} *</Label>
                      <div className="flex items-center gap-4">
                        <Input
                          id="receipt"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleFileUpload}
                          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                        />
                        {receiptFile && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                      {receiptFile && (
                        <p className="text-sm text-green-600 dark:text-green-400">
                          {t('fileUploaded')}: {receiptFile.name}
                        </p>
                      )}
                    </div>

                    <Button 
                      onClick={handleBankTransferSubmit}
                      disabled={!receiptFile || isProcessing}
                      className="w-full"
                    >
                      {isProcessing ? (
                        <>
                          <Upload className="mr-2 h-4 w-4 animate-spin" />
                          {t('processing')}
                        </>
                      ) : (
                        t('submitPaymentReceipt')
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
                        {t('amountToCharge')}: <strong>${totalAmount} USD</strong>
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
