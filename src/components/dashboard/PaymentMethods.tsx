import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDataTracking } from '@/hooks/useDataTracking';
import { useLanguage } from '@/contexts/LanguageContext';

interface PaymentMethod {
  id: string;
  type: string;
  last4: string;
  expiryMonth: string;
  expiryYear: string;
  isDefault: boolean;
}

export const PaymentMethods: React.FC = () => {
  const { toast } = useToast();
  const { t, isRTL } = useLanguage();
  const { trackForm, savePreference } = useDataTracking();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCard, setNewCard] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    name: '',
  });

  const handleAddCard = async () => {
    try {
      const newPaymentMethod: PaymentMethod = {
        id: Date.now().toString(),
        type: 'Visa',
        last4: newCard.cardNumber.slice(-4),
        expiryMonth: newCard.expiryMonth,
        expiryYear: newCard.expiryYear,
        isDefault: paymentMethods.length === 0,
      };

      setPaymentMethods(prev => [...prev, newPaymentMethod]);
      await savePreference('payment_methods', [...paymentMethods, newPaymentMethod]);
      
      trackForm('payment_method', 'submitted', {
        action: 'add_card',
        cardType: newPaymentMethod.type,
      });

      toast({
        title: t('paymentMethods.cardAdded'),
        description: t('paymentMethods.cardAddedDesc'),
      });

      setShowAddCard(false);
      setNewCard({
        cardNumber: '',
        expiryMonth: '',
        expiryYear: '',
        cvv: '',
        name: '',
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('paymentMethods.addError'),
        variant: "destructive",
      });
    }
  };

  const handleRemoveCard = async (id: string) => {
    try {
      const updatedMethods = paymentMethods.filter(method => method.id !== id);
      setPaymentMethods(updatedMethods);
      await savePreference('payment_methods', updatedMethods);

      trackForm('payment_method', 'submitted', {
        action: 'remove_card',
        cardId: id,
      });

      toast({
        title: t('paymentMethods.cardRemoved'),
        description: t('paymentMethods.cardRemovedDesc'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('paymentMethods.removeError'),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Saved Payment Methods */}
      <Card>
        <CardHeader>
          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <CardTitle>{t('paymentMethods.title')}</CardTitle>
            <Button
              onClick={() => setShowAddCard(true)}
              className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <Plus className="h-4 w-4" />
              <span>{t('paymentMethods.addCard')}</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {paymentMethods.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t('paymentMethods.noMethods')}</p>
              <Button
                onClick={() => setShowAddCard(true)}
                className="mt-4"
              >
                {t('paymentMethods.addFirstCard')}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`flex items-center justify-between p-4 border rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <CreditCard className="h-8 w-8 text-muted-foreground" />
                    <div className={isRTL ? 'text-right' : 'text-left'}>
                      <p className="font-medium">
                        {method.type} •••• {method.last4}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t('paymentMethods.expires')} {method.expiryMonth}/{method.expiryYear}
                      </p>
                      {method.isDefault && (
                        <span className="inline-flex px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                          {t('paymentMethods.default')}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveCard(method.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add New Card Form */}
      {showAddCard && (
        <Card>
          <CardHeader>
            <CardTitle>{t('paymentMethods.addNew')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="cardNumber">{t('paymentMethods.cardNumber')}</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={newCard.cardNumber}
                  onChange={(e) => setNewCard(prev => ({ ...prev, cardNumber: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="expiryMonth">{t('paymentMethods.expiryMonth')}</Label>
                  <select
                    id="expiryMonth"
                    value={newCard.expiryMonth}
                    onChange={(e) => setNewCard(prev => ({ ...prev, expiryMonth: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                  >
                    <option value="">{t('paymentMethods.month')}</option>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                        {String(i + 1).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="expiryYear">{t('paymentMethods.expiryYear')}</Label>
                  <select
                    id="expiryYear"
                    value={newCard.expiryYear}
                    onChange={(e) => setNewCard(prev => ({ ...prev, expiryYear: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                  >
                    <option value="">{t('paymentMethods.year')}</option>
                    {Array.from({ length: 10 }, (_, i) => {
                      const year = new Date().getFullYear() + i;
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <Label htmlFor="cvv">{t('paymentMethods.cvv')}</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    value={newCard.cvv}
                    onChange={(e) => setNewCard(prev => ({ ...prev, cvv: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="name">{t('paymentMethods.nameOnCard')}</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={newCard.name}
                  onChange={(e) => setNewCard(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className={`flex justify-end gap-2 pt-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Button variant="outline" onClick={() => setShowAddCard(false)}>
                  {t('paymentMethods.cancel')}
                </Button>
                <Button onClick={handleAddCard}>
                  {t('paymentMethods.addMethod')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Notice */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-2">{t('paymentMethods.securityNotice')}</p>
            <p>{t('paymentMethods.securityMessage')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
