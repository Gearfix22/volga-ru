
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { BackButton } from '@/components/BackButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { processCreditCardPayment } from '@/services/paymentService';
import { useToast } from '@/hooks/use-toast';
import { PaymentMethodSelector } from '@/components/payment/PaymentMethodSelector';
import { AmountInput } from '@/components/payment/AmountInput';
import { CreditCardForm } from '@/components/payment/CreditCardForm';
import { PayPalSection } from '@/components/payment/PayPalSection';
import { BookingSummary } from '@/components/payment/BookingSummary';
import { usePayPalScript } from '@/hooks/usePayPalScript';

const Payment = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const bookingData = location.state?.bookingData;
  const paypalScriptLoaded = usePayPalScript();

  const [selectedMethod, setSelectedMethod] = useState('credit-card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [customAmount, setCustomAmount] = useState(bookingData?.totalPrice?.toString() || '50');

  useEffect(() => {
    if (!bookingData) {
      navigate('/booking');
    }
  }, [bookingData, navigate]);

  if (!bookingData) {
    return null;
  }

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

  const handlePayPalPaymentSuccess = (transactionId: string) => {
    navigate('/booking-confirmation', {
      state: {
        bookingData: {
          ...bookingData,
          paymentMethod: 'PayPal',
          transactionId: transactionId,
          paidAmount: finalAmount,
          totalPrice: finalAmount
        }
      }
    });
  };

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
                <AmountInput
                  amount={customAmount}
                  onAmountChange={setCustomAmount}
                />

                <PaymentMethodSelector
                  selectedMethod={selectedMethod}
                  onMethodChange={setSelectedMethod}
                />

                {selectedMethod === 'credit-card' && (
                  <CreditCardForm
                    cardNumber={cardNumber}
                    expiryDate={expiryDate}
                    cvv={cvv}
                    cardholderName={cardholderName}
                    onCardNumberChange={setCardNumber}
                    onExpiryDateChange={setExpiryDate}
                    onCvvChange={setCvv}
                    onCardholderNameChange={setCardholderName}
                    onSubmit={handleCreditCardPayment}
                    isProcessing={isProcessing}
                    finalAmount={finalAmount}
                  />
                )}

                {selectedMethod === 'paypal' && (
                  <PayPalSection
                    amount={finalAmount}
                    bookingData={bookingData}
                    paypalScriptLoaded={paypalScriptLoaded}
                    onPaymentSuccess={handlePayPalPaymentSuccess}
                    setIsProcessing={setIsProcessing}
                  />
                )}
              </CardContent>
            </Card>

            <BookingSummary
              bookingData={bookingData}
              finalAmount={finalAmount}
            />
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Payment;
