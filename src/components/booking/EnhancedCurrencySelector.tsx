import React, { useState, useEffect, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, TrendingUp } from 'lucide-react';
import { getCurrencyRates, CurrencyRate, CurrencyCode, formatPrice, convertFromUSD } from '@/services/currencyService';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface EnhancedCurrencySelectorProps {
  selectedCurrency: CurrencyCode;
  onCurrencyChange: (currency: CurrencyCode, rate: number) => void;
  basePriceUSD: number;
  label?: string;
  disabled?: boolean;
  showConversion?: boolean;
  showRateInfo?: boolean;
  className?: string;
}

/**
 * Enhanced Currency Selector with real-time conversion display
 * - Shows base price in USD
 * - Shows converted amount in selected currency
 * - Returns exchange rate for audit trail
 */
export const EnhancedCurrencySelector: React.FC<EnhancedCurrencySelectorProps> = ({
  selectedCurrency,
  onCurrencyChange,
  basePriceUSD,
  label,
  disabled = false,
  showConversion = true,
  showRateInfo = false,
  className
}) => {
  const { t, isRTL } = useLanguage();
  const [rates, setRates] = useState<CurrencyRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getCurrencyRates();
        if (data.length === 0) {
          setError('Failed to load currency rates');
        } else {
          setRates(data);
        }
      } catch (err) {
        console.error('Error fetching currency rates:', err);
        setError('Currency service unavailable');
      } finally {
        setLoading(false);
      }
    };
    fetchRates();
  }, []);

  const selectedRate = useMemo(() => 
    rates.find(r => r.currency_code === selectedCurrency),
    [rates, selectedCurrency]
  );

  const convertedPrice = useMemo(() => {
    if (!selectedRate || basePriceUSD <= 0) return 0;
    return convertFromUSD(basePriceUSD, selectedRate.rate_to_usd);
  }, [basePriceUSD, selectedRate]);

  const handleCurrencyChange = (code: CurrencyCode) => {
    const rate = rates.find(r => r.currency_code === code);
    if (rate) {
      onCurrencyChange(code, rate.rate_to_usd);
    }
  };

  const getCurrencyFlag = (code: CurrencyCode): string => {
    const flags: Record<CurrencyCode, string> = {
      'USD': '🇺🇸',
      'EUR': '🇪🇺',
      'SAR': '🇸🇦',
      'EGP': '🇪🇬',
      'RUB': '🇷🇺'
    };
    return flags[code] || '💱';
  };

  if (loading) {
    return (
      <div className={cn('space-y-2', className)}>
        {label && <Label>{label}</Label>}
        <div className="h-10 bg-muted animate-pulse rounded-md flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('space-y-2', className)}>
        {label && <Label>{label}</Label>}
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <Label className={cn('text-base font-medium', isRTL && 'text-right block')}>
          {label}
        </Label>
      )}
      
      <Select 
        value={selectedCurrency} 
        onValueChange={(v) => handleCurrencyChange(v as CurrencyCode)}
        disabled={disabled}
      >
        <SelectTrigger className="h-12">
          <SelectValue>
            {selectedRate && (
              <span className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
                <span className="text-xl">{getCurrencyFlag(selectedCurrency)}</span>
                <span className="font-medium">{selectedCurrency}</span>
                <span className="text-muted-foreground">({selectedRate.symbol})</span>
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {rates.map((rate) => (
            <SelectItem key={rate.currency_code} value={rate.currency_code}>
              <span className={cn('flex items-center gap-3', isRTL && 'flex-row-reverse')}>
                <span className="text-xl">{getCurrencyFlag(rate.currency_code as CurrencyCode)}</span>
                <span className="font-medium min-w-[40px]">{rate.currency_code}</span>
                <span className="text-muted-foreground">({rate.symbol})</span>
                {rate.currency_code !== 'USD' && (
                  <Badge variant="outline" className="ml-auto text-xs">
                    1 USD = {rate.rate_to_usd.toFixed(2)} {rate.symbol}
                  </Badge>
                )}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Conversion Display */}
      {showConversion && selectedRate && basePriceUSD > 0 && (
        <div className={cn(
          'p-4 rounded-lg border-2 bg-muted/50',
          isRTL && 'text-right'
        )}>
          <div className={cn('flex items-center justify-between mb-2', isRTL && 'flex-row-reverse')}>
            <span className="text-sm text-muted-foreground">
              {t('payment.basePrice') || 'Base Price (USD)'}:
            </span>
            <span className="font-medium">${basePriceUSD.toFixed(2)}</span>
          </div>
          
          {selectedCurrency !== 'USD' && (
            <>
              <div className={cn('flex items-center justify-between mb-2', isRTL && 'flex-row-reverse')}>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {t('payment.exchangeRate') || 'Exchange Rate'}:
                </span>
                <span className="text-sm">
                  1 USD = {selectedRate.rate_to_usd.toFixed(4)} {selectedRate.symbol}
                </span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className={cn('flex items-center justify-between', isRTL && 'flex-row-reverse')}>
                  <span className="font-semibold">
                    {t('payment.youWillPay') || 'You will pay'}:
                  </span>
                  <span className="text-xl font-bold text-primary">
                    {formatPrice(convertedPrice, selectedRate)}
                  </span>
                </div>
              </div>
            </>
          )}
          
          {selectedCurrency === 'USD' && (
            <div className={cn('flex items-center justify-between pt-2 border-t', isRTL && 'flex-row-reverse')}>
              <span className="font-semibold">
                {t('payment.youWillPay') || 'You will pay'}:
              </span>
              <span className="text-xl font-bold text-primary">
                ${basePriceUSD.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Rate Info */}
      {showRateInfo && selectedRate && selectedCurrency !== 'USD' && (
        <p className="text-xs text-muted-foreground">
          {t('payment.rateUpdated') || 'Rate updated'}: {new Date(selectedRate.updated_at).toLocaleDateString()}
        </p>
      )}
    </div>
  );
};

export default EnhancedCurrencySelector;
