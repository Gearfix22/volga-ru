import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { getCurrencyRates, CurrencyRate, CurrencyCode, formatPrice, convertFromUSD } from '@/services/currencyService';

interface CurrencySelectorProps {
  selectedCurrency: CurrencyCode;
  onCurrencyChange: (currency: CurrencyCode) => void;
  priceUSD?: number;
  showConvertedPrice?: boolean;
  label?: string;
  disabled?: boolean;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  selectedCurrency,
  onCurrencyChange,
  priceUSD,
  showConvertedPrice = true,
  label = 'Currency',
  disabled = false
}) => {
  const [rates, setRates] = useState<CurrencyRate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRates = async () => {
      const data = await getCurrencyRates();
      setRates(data);
      setLoading(false);
    };
    fetchRates();
  }, []);

  const selectedRate = rates.find(r => r.currency_code === selectedCurrency);
  const convertedPrice = priceUSD && selectedRate 
    ? convertFromUSD(priceUSD, selectedRate.rate_to_usd) 
    : null;

  const getCurrencyFlag = (code: CurrencyCode) => {
    switch (code) {
      case 'USD': return '🇺🇸';
      case 'SAR': return '🇸🇦';
      case 'EGP': return '🇪🇬';
      default: return '💱';
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="h-10 bg-muted animate-pulse rounded-md" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select 
        value={selectedCurrency} 
        onValueChange={(v) => onCurrencyChange(v as CurrencyCode)}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {rates.map((rate) => (
            <SelectItem key={rate.currency_code} value={rate.currency_code}>
              <span className="flex items-center gap-2">
                <span>{getCurrencyFlag(rate.currency_code)}</span>
                <span>{rate.currency_code}</span>
                <span className="text-muted-foreground">({rate.symbol})</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showConvertedPrice && convertedPrice !== null && selectedRate && (
        <p className="text-sm text-muted-foreground">
          ≈ {formatPrice(convertedPrice, selectedRate)}
          {selectedCurrency !== 'USD' && ` (${priceUSD?.toFixed(2)} USD)`}
        </p>
      )}
    </div>
  );
};

export default CurrencySelector;
