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
      <Card className="backdrop-blur-sm bg-white/90 dark:bg-slate-900/90 border-2 border-slate-200 dark:border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl">
            <CheckCircle className="h-6 w-6 text-primary" />
            Confirm Bank Transfer
          </CardTitle>
          <CardDescription>
            Please provide your transfer details after completing the bank transfer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Amount Display */}
            <Alert className="border-primary/50 bg-primary/5">
              <Info className="h-5 w-5 text-primary" />
              <AlertDescription>
                <strong>Transfer Amount:</strong> ${amount.toFixed(2)}
              </AlertDescription>
            </Alert>

            {/* Reference Number */}
            <div className="space-y-2">
              <Label htmlFor="referenceNumber" className="text-base font-semibold">
                Bank Reference Number *
              </Label>
              <Input
                id="referenceNumber"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Enter transaction reference number"
                className="h-12 text-base"
                required
              />
              <p className="text-sm text-muted-foreground">
                The unique reference number from your bank transfer receipt
              </p>
            </div>

            {/* Transfer Date */}
            <div className="space-y-2">
              <Label htmlFor="transferDate" className="text-base font-semibold">
                Transfer Date *
              </Label>
              <Input
                id="transferDate"
                type="date"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="h-12 text-base"
                required
              />
            </div>

            {/* Receipt Upload */}
            <div className="space-y-2">
              <Label htmlFor="receipt" className="text-base font-semibold">
                Upload Receipt (Optional)
              </Label>
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 hover:border-primary/50 transition-colors bg-slate-50 dark:bg-slate-800/50">
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
                        <FileText className="h-6 w-6" />
                        <span className="font-medium">{receiptFile.name}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <Upload className="h-10 w-10 text-slate-400" />
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          <span className="font-medium text-primary cursor-pointer hover:underline">
                            Click to upload
                          </span>
                          {' '}or drag and drop
                          <br />
                          <span className="text-xs">PNG, JPG, PDF up to 5MB</span>
                        </div>
                      </div>
                    )}
                  </div>
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                Uploading your receipt helps us verify your payment faster
              </p>
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-base font-semibold">
                Additional Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional information about your transfer..."
                rows={3}
                className="resize-none text-base"
              />
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold"
              disabled={loading || isUploading}
              size="lg"
            >
              {loading ? 'Submitting Transfer Details...' : 'Confirm Bank Transfer'}
            </Button>

            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
              <Info className="h-5 w-5 text-blue-600" />
              <AlertDescription className="text-sm text-blue-900 dark:text-blue-100">
                Your booking will be confirmed once our team verifies your bank transfer. This usually takes 1-2 business days.
              </AlertDescription>
            </Alert>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};