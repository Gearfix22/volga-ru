
import React from 'react';
import { DollarSign } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AmountInputProps {
  amount: string;
  onAmountChange: (amount: string) => void;
}

export const AmountInput: React.FC<AmountInputProps> = ({ amount, onAmountChange }) => {
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      onAmountChange(value);
    }
  };

  return (
    <div className="space-y-4 mb-6">
      <h3 className="text-white font-medium flex items-center gap-2">
        <DollarSign className="h-5 w-5" />
        Payment Amount
      </h3>
      <div>
        <Label htmlFor="amount" className="block text-white text-sm font-medium mb-2">
          Amount (USD)
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70">$</span>
          <Input
            id="amount"
            type="text"
            value={amount}
            onChange={handleAmountChange}
            className="pl-8 bg-white/10 border-white/20 text-white placeholder-white/50 focus:ring-russian-gold"
            placeholder="0.00"
            required
          />
        </div>
      </div>
    </div>
  );
};
