
import React from 'react';
import { Button } from '@/components/ui/button';

interface CreditCardFormProps {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
  onCardNumberChange: (value: string) => void;
  onExpiryDateChange: (value: string) => void;
  onCvvChange: (value: string) => void;
  onCardholderNameChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isProcessing: boolean;
  finalAmount: number;
}

export const CreditCardForm: React.FC<CreditCardFormProps> = ({
  cardNumber,
  expiryDate,
  cvv,
  cardholderName,
  onCardNumberChange,
  onExpiryDateChange,
  onCvvChange,
  onCardholderNameChange,
  onSubmit,
  isProcessing,
  finalAmount
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-white text-sm font-medium mb-2">
          Cardholder Name
        </label>
        <input
          type="text"
          value={cardholderName}
          onChange={(e) => onCardholderNameChange(e.target.value)}
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
          onChange={(e) => onCardNumberChange(e.target.value)}
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
            onChange={(e) => onExpiryDateChange(e.target.value)}
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
            onChange={(e) => onCvvChange(e.target.value)}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-russian-gold"
            placeholder="123"
            maxLength={4}
            required
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={isProcessing || finalAmount <= 0}
        className="w-full bg-russian-gold hover:bg-russian-gold/90 text-white font-semibold py-3"
      >
        {isProcessing ? 'Processing...' : `Pay $${finalAmount.toFixed(2)} with Credit Card`}
      </Button>
    </form>
  );
};
