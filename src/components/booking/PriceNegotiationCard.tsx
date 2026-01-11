import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DollarSign, 
  Check, 
  X, 
  MessageCircle,
  ArrowRight,
  Loader2,
  Lock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getPriceNegotiationStatus,
  confirmPrice,
  proposePrice,
  type PriceNegotiationData
} from '@/services/priceNegotiationService';

interface PriceNegotiationCardProps {
  bookingId: string;
  onPriceConfirmed?: () => void;
}

const PriceNegotiationCard: React.FC<PriceNegotiationCardProps> = ({ 
  bookingId, 
  onPriceConfirmed 
}) => {
  const { toast } = useToast();
  const [data, setData] = useState<PriceNegotiationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [proposedAmount, setProposedAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showProposal, setShowProposal] = useState(false);

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
        title: 'Price Confirmed',
        description: 'You can now proceed with payment.'
      });
      await loadStatus();
      onPriceConfirmed?.();
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to confirm price.',
        variant: 'destructive'
      });
    }
    setIsSubmitting(false);
  };

  const handleProposePrice = async () => {
    const amount = parseFloat(proposedAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid price.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    const result = await proposePrice(bookingId, amount);
    
    if (result.success) {
      toast({
        title: 'Counter-Proposal Sent',
        description: 'Your price proposal has been sent to the admin for review.'
      });
      setShowProposal(false);
      setProposedAmount('');
      await loadStatus();
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to send proposal.',
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
          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
            <Lock className="h-5 w-5" />
            Price Approved & Locked
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-green-800 dark:text-green-200">
            ${data.approvedPrice.toFixed(2)}
          </p>
          {data.approvedAt && (
            <p className="text-sm text-muted-foreground mt-1">
              Approved on {new Date(data.approvedAt).toLocaleString()}
            </p>
          )}
          <Button 
            onClick={onPriceConfirmed}
            className="w-full mt-4"
          >
            <Check className="h-4 w-4 mr-2" />
            Proceed to Payment
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
          <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
            <MessageCircle className="h-5 w-5" />
            Awaiting Price Quote
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Our team is reviewing your booking and will provide a price quote soon.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Customer has pending proposal
  if (data.customerProposedPrice) {
    return (
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <ArrowRight className="h-5 w-5" />
            Counter-Proposal Pending
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Admin's Proposed Price:</span>
            <span className="font-semibold">${data.proposedPrice.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Your Proposal:</span>
            <span className="font-bold text-blue-700 dark:text-blue-300">
              ${data.customerProposedPrice.toFixed(2)}
            </span>
          </div>
          <Alert>
            <AlertDescription className="text-sm">
              Your price proposal is being reviewed. You'll be notified when there's a response.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Admin has proposed price, waiting for approval or customer action
  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Price Quote Available
        </CardTitle>
        <CardDescription>
          {data.priceApproved 
            ? 'Price has been approved. Proceed to payment.'
            : 'Review the proposed price. Admin will approve before payment.'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-4 bg-primary/5 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">
            {data.priceApproved ? 'Approved Price' : 'Proposed Price'}
          </p>
          <p className="text-3xl font-bold text-primary">
            ${(data.approvedPrice || data.proposedPrice || 0).toFixed(2)}
          </p>
          {!data.priceLocked && (
            <p className="text-xs text-muted-foreground mt-1">
              (Awaiting admin approval)
            </p>
          )}
        </div>

        {!showProposal ? (
          <div className="flex flex-col gap-2">
            {data.priceLocked && data.priceApproved ? (
              <Button 
                onClick={handleConfirmPrice}
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Confirm & Proceed to Payment
              </Button>
            ) : (
              <Alert>
                <AlertDescription className="text-sm">
                  Waiting for admin to approve the price before you can proceed.
                </AlertDescription>
              </Alert>
            )}
            {!data.priceLocked && (
              <Button 
                variant="outline"
                onClick={() => setShowProposal(true)}
                className="w-full"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Propose Different Price
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.01"
                  value={proposedAmount}
                  onChange={(e) => setProposedAmount(e.target.value)}
                  placeholder="Enter your price"
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleProposePrice}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4 mr-2" />
                )}
                Submit Proposal
              </Button>
              <Button 
                variant="ghost"
                onClick={() => {
                  setShowProposal(false);
                  setProposedAmount('');
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PriceNegotiationCard;
