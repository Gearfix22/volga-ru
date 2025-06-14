
import React from 'react';
import { CreditCard, Shield } from 'lucide-react';

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  description: string;
}

interface PaymentMethodSelectorProps {
  selectedMethod: string;
  onMethodChange: (method: string) => void;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onMethodChange
}) => {
  const paymentMethods: PaymentMethod[] = [
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
            onClick={() => onMethodChange(method.id)}
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
  );
};
