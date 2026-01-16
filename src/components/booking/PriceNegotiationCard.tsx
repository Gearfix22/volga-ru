import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DollarSign, 
  Check, 
  MessageCircle,
  Loader2,
  Lock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import {
  getPriceNegotiationStatus,
  confirmPrice,
  type PriceNegotiationData
} from '@/services/priceNegotiationService';

interface PriceNegotiationCardProps {
  bookingId: string;
  onPriceConfirmed?: () => void;
  currency?: string;
}

const PriceNegotiationCard: React.FC<PriceNegotiationCardProps> = ({ 
  bookingId, 
  onPriceConfirmed,
  currency = 'USD'
}) => {
  const { toast } = useToast();
  const { t, isRTL } = useLanguage();
  const [data, setData] = useState<PriceNegotiationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get currency symbol
  const getCurrencySymbol = (curr: string) => {
    const symbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      RUB: '₽',
      SAR: '﷼',
      EGP: 'E£'
    };
    return symbols[curr] || curr;
  };

  const currencySymbol = getCurrencySymbol(currency);

  useEffect(() => {
    loadStatus();
  }, [bookingId]);

  const loadStatus = async () => {
    setLoading(true);
    const status = await getPriceNegotiationStatus(bookingId);
    setData(status);
    setLoading(false);
  };

  const handleConfirmPrice = async () => {
    setIsSubmitting(true);
    const result = await confirmPrice(bookingId);
    
    if (result.success) {
      toast({
        title: t('priceNegotiation.priceConfirmed'),
        description: t('priceNegotiation.proceedPaymentDesc')
      });
      await loadStatus();
      onPriceConfirmed?.();
    } else {
      toast({
        title: t('common.error'),
        description: result.error || t('priceNegotiation.confirmError'),
        variant: 'destructive'
      });
    }
    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  // Price approved and locked - ready for payment
  if (data.priceLocked && data.priceApproved && data.approvedPrice) {
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
        <CardHeader className="pb-2">
          <CardTitle className={cn("flex items-center gap-2 text-green-700 dark:text-green-300", isRTL && "flex-row-reverse")}>
            <Lock className="h-5 w-5" />
            {t('priceNegotiation.priceApprovedLocked')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={cn("text-2xl font-bold text-green-800 dark:text-green-200", isRTL && "text-right")}>
            {currencySymbol}{data.approvedPrice.toFixed(2)}
          </p>
          {data.approvedAt && (
            <p className={cn("text-sm text-muted-foreground mt-1", isRTL && "text-right")}>
              {t('priceNegotiation.approvedOn', { date: new Date(data.approvedAt).toLocaleString() })}
            </p>
          )}
          <Button 
            onClick={onPriceConfirmed}
            className="w-full mt-4"
          >
            <Check className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
            {t('priceNegotiation.proceedPayment')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Waiting for admin price
  if (!data.proposedPrice) {
    return (
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
        <CardHeader className="pb-2">
          <CardTitle className={cn("flex items-center gap-2 text-amber-700 dark:text-amber-300", isRTL && "flex-row-reverse")}>
            <MessageCircle className="h-5 w-5" />
            {t('priceNegotiation.awaitingQuote')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={cn("text-sm text-muted-foreground", isRTL && "text-right")}>
            {t('priceNegotiation.awaitingQuoteDesc')}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Admin has proposed price, waiting for approval or customer action
  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
          <DollarSign className="h-5 w-5 text-primary" />
          {t('priceNegotiation.quoteAvailable')}
        </CardTitle>
        <CardDescription className={isRTL ? "text-right" : ""}>
          {data.priceApproved 
            ? t('priceNegotiation.approvedProceed')
            : t('priceNegotiation.reviewProposed')
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-4 bg-primary/5 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">
            {data.priceApproved ? t('priceNegotiation.approvedPrice') : t('priceNegotiation.proposedPrice')}
          </p>
          <p className="text-3xl font-bold text-primary">
            {currencySymbol}{(data.approvedPrice || data.proposedPrice || 0).toFixed(2)}
          </p>
          {!data.priceLocked && (
            <p className="text-xs text-muted-foreground mt-1">
              ({t('priceNegotiation.awaitingAdminApproval')})
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {data.priceLocked && data.priceApproved ? (
            <Button 
              onClick={handleConfirmPrice}
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <Loader2 className={cn("h-4 w-4 animate-spin", isRTL ? "ml-2" : "mr-2")} />
              ) : (
                <Check className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
              )}
              {t('priceNegotiation.confirmProceed')}
            </Button>
          ) : (
            <Alert>
              <AlertDescription className="text-sm">
                {t('priceNegotiation.waitingAdminApprove')}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PriceNegotiationCard;
