import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Building2, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBankDetails } from '@/hooks/useAppSettings';

interface BankTransferInfoProps {
  amount: number;
  transactionId?: string;
}

export const BankTransferInfo: React.FC<BankTransferInfoProps> = ({ amount, transactionId }) => {
  const { toast } = useToast();
  const { t, isRTL } = useLanguage();
  const { data: bankDetails, loading } = useBankDetails();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: t('messages.copied') || 'Copied!',
        description: `${label} ${t('messages.copiedToClipboard') || 'copied to clipboard'}`,
      });
    });
  };

  if (loading || !bankDetails) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-muted rounded-lg"></div>
        <div className="h-24 bg-muted rounded-lg"></div>
      </div>
    );
  }

  const supportedCurrencies = ['USD', 'EUR', 'RUB'];

  return (
    <div className={`space-y-6 ${isRTL ? 'text-right' : ''}`}>
      <Card className="backdrop-blur-sm bg-blue-50/90 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-3">
          <CardTitle className={`flex items-center gap-2 text-blue-800 dark:text-blue-200 text-xl ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Building2 className="h-6 w-6" />
            {t('payment.bankTransferInstructions') || 'Bank Transfer Instructions'}
          </CardTitle>
          <CardDescription className="text-blue-700 dark:text-blue-300">
            {t('payment.bankTransferDescription') || 'Transfer the payment amount directly to our bank account using the details below'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {/* Amount to Transfer */}
            <div className={`flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-lg border ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {t('payment.amountToTransfer') || 'Amount to Transfer'}
                </p>
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">${amount.toFixed(2)} USD</p>
              </div>
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>

            {/* Bank Name */}
            <div className={`flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-lg border ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {t('payment.bankName') || 'Bank Name'}
                </p>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{bankDetails.bankName}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(bankDetails.bankName, t('payment.bankName') || 'Bank name')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            {/* Account Holder */}
            <div className={`flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-lg border ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {t('payment.accountHolder') || 'Account Holder'}
                </p>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{bankDetails.accountHolder}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(bankDetails.accountHolder, t('payment.accountHolder') || 'Account holder name')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            {/* IBAN */}
            <div className={`flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-lg border ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {t('payment.ibanAccountNumber') || 'IBAN / Account Number'}
                </p>
                <p className="font-mono font-semibold text-slate-900 dark:text-slate-100">{bankDetails.iban}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(bankDetails.iban, 'IBAN')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            {/* SWIFT */}
            <div className={`flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-lg border ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {t('payment.swiftCode') || 'SWIFT/BIC Code'}
                </p>
                <p className="font-mono font-semibold text-slate-900 dark:text-slate-100">{bankDetails.swift}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(bankDetails.swift, 'SWIFT code')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            {/* Supported Currencies */}
            <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                {t('payment.supportedCurrencies') || 'Supported Currencies'}
              </p>
              <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                {supportedCurrencies.map((currency) => (
                  <Badge key={currency} variant="secondary">
                    {currency}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Reference Number */}
            {transactionId && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                  {t('payment.referenceNumber') || 'Reference Number (Include in transfer notes)'}
                </p>
                <div className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <p className="font-mono font-semibold text-yellow-900 dark:text-yellow-100">{transactionId}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(transactionId, t('payment.referenceNumber') || 'Reference number')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instructions Card */}
      <Card className="backdrop-blur-sm bg-amber-50/90 dark:bg-amber-900/30 border-2 border-amber-200 dark:border-amber-800">
        <CardContent className="p-5">
          <h4 className={`font-semibold text-amber-800 dark:text-amber-200 mb-3 text-lg flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <DollarSign className="h-5 w-5" />
            {t('payment.importantInstructions') || 'Important Instructions:'}
          </h4>
          <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-2">
            <li className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="font-bold">•</span>
              <span>{t('payment.instruction1') || 'Include the reference number in your transfer notes'}</span>
            </li>
            <li className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="font-bold">•</span>
              <span>{t('payment.instruction2') || 'Bank transfers may take 1-3 business days to process'}</span>
            </li>
            <li className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="font-bold">•</span>
              <span>{t('payment.instruction3') || 'Keep your transfer receipt for your records'}</span>
            </li>
            <li className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="font-bold">•</span>
              <span>{t('payment.instruction4') || 'Contact us after completing the transfer'}</span>
            </li>
            <li className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="font-bold">•</span>
              <span>{t('payment.instruction5') || 'Currency conversion fees may apply through your bank'}</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
