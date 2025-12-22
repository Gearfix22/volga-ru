import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DollarSign, RefreshCw, Save } from 'lucide-react';
import { getCurrencyRates, updateCurrencyRate, CurrencyRate, CurrencyCode } from '@/services/currencyService';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export const AdminCurrencySettings: React.FC = () => {
  const [rates, setRates] = useState<CurrencyRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRates, setEditingRates] = useState<Record<CurrencyCode, string>>({} as Record<CurrencyCode, string>);
  const [saving, setSaving] = useState<CurrencyCode | null>(null);
  const { toast } = useToast();

  const fetchRates = async () => {
    setLoading(true);
    const data = await getCurrencyRates();
    setRates(data);
    
    // Initialize editing values
    const initial: Record<CurrencyCode, string> = {} as Record<CurrencyCode, string>;
    data.forEach(r => {
      initial[r.currency_code] = r.rate_to_usd.toString();
    });
    setEditingRates(initial);
    setLoading(false);
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const handleSaveRate = async (currencyCode: CurrencyCode) => {
    const newRate = parseFloat(editingRates[currencyCode]);
    if (isNaN(newRate) || newRate <= 0) {
      toast({
        title: 'Invalid Rate',
        description: 'Please enter a valid positive number',
        variant: 'destructive'
      });
      return;
    }

    setSaving(currencyCode);
    const success = await updateCurrencyRate(currencyCode, newRate);
    
    if (success) {
      toast({
        title: 'Rate Updated',
        description: `${currencyCode} rate updated to ${newRate}`
      });
      await fetchRates();
    } else {
      toast({
        title: 'Update Failed',
        description: 'Failed to update currency rate',
        variant: 'destructive'
      });
    }
    setSaving(null);
  };

  const getCurrencyFlag = (code: CurrencyCode) => {
    switch (code) {
      case 'USD': return '🇺🇸';
      case 'SAR': return '🇸🇦';
      case 'EGP': return '🇪🇬';
      default: return '💱';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Currency Exchange Rates
          </CardTitle>
          <Button variant="outline" size="sm" onClick={fetchRates} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Base currency is USD (1.00). Rates show how many units of each currency equal 1 USD.
        </p>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Currency</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead>Rate to USD</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : rates.map((rate) => (
              <TableRow key={rate.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getCurrencyFlag(rate.currency_code)}</span>
                    <span className="font-medium">{rate.currency_code}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{rate.symbol}</Badge>
                </TableCell>
                <TableCell>
                  {rate.currency_code === 'USD' ? (
                    <span className="text-muted-foreground">1.00 (base)</span>
                  ) : (
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={editingRates[rate.currency_code] || ''}
                      onChange={(e) => setEditingRates(prev => ({
                        ...prev,
                        [rate.currency_code]: e.target.value
                      }))}
                      className="w-32"
                    />
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {format(new Date(rate.updated_at), 'MMM dd, yyyy HH:mm')}
                </TableCell>
                <TableCell>
                  {rate.currency_code !== 'USD' && (
                    <Button
                      size="sm"
                      onClick={() => handleSaveRate(rate.currency_code)}
                      disabled={saving === rate.currency_code}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      {saving === rate.currency_code ? 'Saving...' : 'Save'}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">Conversion Examples</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            {rates.map((rate) => (
              <div key={rate.id} className="flex justify-between">
                <span>$100 USD =</span>
                <span className="font-medium">
                  {(100 * rate.rate_to_usd).toFixed(2)} {rate.symbol}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminCurrencySettings;
