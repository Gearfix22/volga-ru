import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { BackButton } from '@/components/BackButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Shield, Lock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { createBooking } from '@/services/database';
import { useToast } from '@/hooks/use-toast';

const Payment = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const bookingData = location.state?.bookingData;

  const [selectedMethod, setSelectedMethod] = useState('credit-card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!bookingData) {
      navigate('/booking');
    }
  }, [bookingData, navigate]);

  if (!bookingData) {
    return null;
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const transactionId = `TXN${Date.now()}`;
      const totalPrice = bookingData.totalPrice || 0;
      const paymentMethod = selectedMethod === 'credit-card' ? 'Credit Card' : 'PayPal';
      
      // Save booking to Supabase if user is authenticated
      if (user) {
        await createBooking(bookingData, {
          paymentMethod,
          transactionId,
          totalPrice
        });
        
        toast({
          title: "Booking saved successfully!",
          description: "Your booking has been saved to your account.",
        });
      }
      
      // Store payment details for confirmation page
      localStorage.setItem('paymentStatus', 'completed');
      localStorage.setItem('transactionId', transactionId);
      localStorage.setItem('paymentAmount', totalPrice.toString());
      
      navigate('/booking-confirmation', {
        state: {
          bookingData: {
            ...bookingData,
            paymentMethod,
            transactionId,
            paidAmount: totalPrice
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
                <form onSubmit={handlePayment} className="space-y-6">
                  {/* Payment Method Selection */}
                  <div className="space-y-4">
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
                    <div className="space-y-4">
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
                    </div>
                  )}

                  {/* PayPal Form */}
                  {selectedMethod === 'paypal' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-white text-sm font-medium mb-2">
                          PayPal Email
                        </label>
                        <input
                          type="email"
                          value={paypalEmail}
                          onChange={(e) => setPaypalEmail(e.target.value)}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-russian-gold"
                          placeholder="your@email.com"
                          required
                        />
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full bg-russian-gold hover:bg-russian-gold/90 text-white font-semibold py-3"
                  >
                    {isProcessing ? 'Processing...' : `Pay $${bookingData.totalPrice || 0}`}
                  </Button>
                </form>
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
                    <span className="text-russian-gold">${bookingData.totalPrice || 0}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-white/70 text-sm">
                  <Shield className="h-4 w-4" />
                  <span>Your payment is protected by 256-bit SSL encryption</span>
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
