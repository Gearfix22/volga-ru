
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Building2, CreditCard, Globe, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BankTransferInfoProps {
  amount: number;
  transactionId?: string;
}

export const BankTransferInfo: React.FC<BankTransferInfoProps> = ({ amount, transactionId }) => {
  const { toast } = useToast();

  const bankDetails = {
    bankName: 'Arab African International Bank',
    accountHolder: 'AHMED KAMAL ALSaeed Alshourbagy',
    iban: 'EG960057028801154116110010201',
    swift: 'ARAIEGCXCOL',
    currencies: ['USD', 'EUR', 'RUB']
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: 'Copied!',
        description: `${label} copied to clipboard`,
      });
    });
  };

  return (
    <div className="space-y-6">
      <Card className="backdrop-blur-sm bg-blue-50/90 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200 text-xl">
            <Building2 className="h-6 w-6" />
            Bank Transfer Instructions
          </CardTitle>
          <CardDescription className="text-blue-700 dark:text-blue-300">
            Transfer the payment amount directly to our bank account using the details below
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-lg border">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Amount to Transfer</p>
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">${amount.toFixed(2)} USD</p>
              </div>
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>

            <div className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-lg border">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Bank Name</p>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{bankDetails.bankName}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(bankDetails.bankName, 'Bank name')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-lg border">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Account Holder</p>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{bankDetails.accountHolder}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(bankDetails.accountHolder, 'Account holder name')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-lg border">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">IBAN / Account Number</p>
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

            <div className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-lg border">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">SWIFT/BIC Code</p>
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

            <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Supported Currencies</p>
              <div className="flex gap-2">
                {bankDetails.currencies.map((currency) => (
                  <Badge key={currency} variant="secondary">
                    {currency}
                  </Badge>
                ))}
              </div>
            </div>

            {transactionId && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                  Reference Number (Include in transfer notes)
                </p>
                <div className="flex justify-between items-center">
                  <p className="font-mono font-semibold text-yellow-900 dark:text-yellow-100">{transactionId}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(transactionId, 'Reference number')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="backdrop-blur-sm bg-amber-50/90 dark:bg-amber-900/30 border-2 border-amber-200 dark:border-amber-800">
        <CardContent className="p-5">
          <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-3 text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Important Instructions:
          </h4>
          <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-2">
            <li className="flex gap-2">
              <span className="font-bold">•</span>
              <span>Include the reference number in your transfer notes</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">•</span>
              <span>Bank transfers may take 1-3 business days to process</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">•</span>
              <span>Keep your transfer receipt for your records</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">•</span>
              <span>Contact us at info@volgaservices.com after completing the transfer</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">•</span>
              <span>Currency conversion fees may apply through your bank</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
