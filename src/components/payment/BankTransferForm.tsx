import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '@/contexts/LanguageContext';
import { BankTransferInfo } from '@/components/payment/BankTransferInfo';
import { Upload, FileText, CheckCircle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BankTransferFormProps {
  amount: number;
  onConfirm: (transferDetails: {
    referenceNumber: string;
    transferDate: string;
    notes?: string;
    receiptFile?: File;
  }) => void;
  loading?: boolean;
}

export const BankTransferForm: React.FC<BankTransferFormProps> = ({
  amount,
  onConfirm,
  loading = false
}) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [referenceNumber, setReferenceNumber] = useState('');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type (images and PDFs)
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: t('error'),
          description: t('payment.invalidFileType'),
          variant: 'destructive'
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: t('error'),
          description: t('payment.fileTooLarge'),
          variant: 'destructive'
        });
        return;
      }

      setReceiptFile(file);
      toast({
        title: t('success'),
        description: t('payment.fileUploaded')
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!referenceNumber.trim()) {
      toast({
        title: t('error'),
        description: t('payment.referenceNumberRequired'),
        variant: 'destructive'
      });
      return;
    }

    if (!transferDate) {
      toast({
        title: t('error'),
        description: t('payment.transferDateRequired'),
        variant: 'destructive'
      });
      return;
    }

    const transferDetails = {
      referenceNumber: referenceNumber.trim(),
      transferDate,
      notes: notes.trim() || undefined,
      receiptFile: receiptFile || undefined
    };

    onConfirm(transferDetails);
  };

  return (
    <div className="space-y-6">
      {/* Bank Transfer Information */}
      <BankTransferInfo amount={amount} />

      {/* Transfer Confirmation Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            {t('payment.confirmTransfer')}
          </CardTitle>
          <CardDescription>
            {t('payment.confirmTransferDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount Display */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>{t('payment.transferAmount')}:</strong> ${amount.toFixed(2)}
              </AlertDescription>
            </Alert>

            {/* Reference Number */}
            <div className="space-y-2">
              <Label htmlFor="referenceNumber">
                {t('payment.referenceNumber')} *
              </Label>
              <Input
                id="referenceNumber"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder={t('payment.referenceNumberPlaceholder')}
                required
              />
              <p className="text-sm text-muted-foreground">
                {t('payment.referenceNumberHelp')}
              </p>
            </div>

            {/* Transfer Date */}
            <div className="space-y-2">
              <Label htmlFor="transferDate">
                {t('payment.transferDate')} *
              </Label>
              <Input
                id="transferDate"
                type="date"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            {/* Receipt Upload */}
            <div className="space-y-2">
              <Label htmlFor="receipt">
                {t('payment.uploadReceipt')} ({t('common.optional')})
              </Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors">
                <input
                  id="receipt"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="receipt" className="cursor-pointer">
                  <div className="text-center">
                    {receiptFile ? (
                      <div className="flex items-center justify-center gap-2 text-green-600">
                        <FileText className="h-5 w-5" />
                        <span className="text-sm">{receiptFile.name}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-gray-400" />
                        <div className="text-sm text-gray-600">
                          <span className="font-medium text-blue-600">{t('payment.clickToUpload')}</span>
                          <br />
                          {t('payment.supportedFormats')}
                        </div>
                      </div>
                    )}
                  </div>
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('payment.receiptUploadHelp')}
              </p>
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">
                {t('payment.additionalNotes')} ({t('common.optional')})
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('payment.notesPlaceholder')}
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full"
              disabled={loading || isUploading}
              size="lg"
            >
              {loading ? t('payment.processing') : t('payment.confirmBankTransfer')}
            </Button>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {t('payment.bankTransferNote')}
              </AlertDescription>
            </Alert>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};