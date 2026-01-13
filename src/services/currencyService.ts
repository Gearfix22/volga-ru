import { supabase } from '@/integrations/supabase/client';

// Supported currencies: USD, SAR, EGP, RUB
export type CurrencyCode = 'USD' | 'SAR' | 'EGP' | 'RUB';

export interface CurrencyRate {
  id: string;
  currency_code: CurrencyCode;
  rate_to_usd: number;
  symbol: string;
  updated_at: string;
}

/**
 * Get all currency rates
 */
export async function getCurrencyRates(): Promise<CurrencyRate[]> {
  const { data, error } = await supabase
    .from('currency_rates')
    .select('*')
    .order('currency_code');

  if (error) {
    console.error('Error fetching currency rates:', error);
    return [];
  }

  return data as CurrencyRate[];
}

/**
 * Get a specific currency rate
 */
export async function getCurrencyRate(code: CurrencyCode): Promise<CurrencyRate | null> {
  const { data, error } = await supabase
    .from('currency_rates')
    .select('*')
    .eq('currency_code', code)
    .single();

  if (error) {
    console.error('Error fetching currency rate:', error);
    return null;
  }

  return data as CurrencyRate;
}

/**
 * Convert USD to target currency
 */
export function convertFromUSD(amountUSD: number, rateToUSD: number): number {
  return amountUSD * rateToUSD;
}

/**
 * Convert from target currency to USD
 */
export function convertToUSD(amount: number, rateToUSD: number): number {
  return amount / rateToUSD;
}

/**
 * Format price with currency symbol
 */
export function formatPrice(amount: number, currency: CurrencyRate): string {
  const formatted = amount.toFixed(2);
  if (currency.currency_code === 'USD') {
    return `${currency.symbol}${formatted}`;
  }
  return `${formatted} ${currency.symbol}`;
}

/**
 * Update currency rate (admin only)
 */
export async function updateCurrencyRate(
  currencyCode: CurrencyCode,
  newRate: number
): Promise<boolean> {
  const { error } = await supabase
    .from('currency_rates')
    .update({
      rate_to_usd: newRate,
      updated_at: new Date().toISOString()
    })
    .eq('currency_code', currencyCode);

  if (error) {
    console.error('Error updating currency rate:', error);
    return false;
  }

  return true;
}

/**
 * Get user's preferred currency
 */
export async function getUserPreferredCurrency(): Promise<CurrencyCode> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 'USD';

  const { data, error } = await supabase
    .from('profiles')
    .select('preferred_currency')
    .eq('id', user.id)
    .single();

  if (error || !data?.preferred_currency) {
    return 'USD';
  }

  return data.preferred_currency as CurrencyCode;
}

/**
 * Set user's preferred currency
 */
export async function setUserPreferredCurrency(currency: CurrencyCode): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('profiles')
    .update({ preferred_currency: currency })
    .eq('id', user.id);

  if (error) {
    console.error('Error setting preferred currency:', error);
    return false;
  }

  return true;
}
