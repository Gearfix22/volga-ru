/**
 * Review Modal Component
 * One-screen review flow designed for quick completion (<30 seconds)
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Send, ThumbsUp, AlertCircle, Car, User } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StarRating } from './StarRating';
import { QuickFeedbackChips } from './QuickFeedbackChips';
import { submitReview } from '@/services/reviewService';
import { POSITIVE_ASPECTS, IMPROVEMENT_AREAS } from '@/types/review';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  serviceType: string;
  hasDriver: boolean;
  hasGuide: boolean;
  onComplete: () => void;
  onDismiss: () => void;
}

type ReviewStep = 'rating' | 'feedback' | 'complete';

export function ReviewModal({
  open,
  onOpenChange,
  bookingId,
  serviceType,
  hasDriver,
  hasGuide,
  onComplete,
  onDismiss
}: ReviewModalProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  // Form state
  const [step, setStep] = useState<ReviewStep>('rating');
  const [overallRating, setOverallRating] = useState(0);
  const [driverRating, setDriverRating] = useState(0);
  const [punctualityRating, setPunctualityRating] = useState(0);
  const [positiveAspects, setPositiveAspects] = useState<string[]>([]);
  const [improvementAreas, setImprovementAreas] = useState<string[]>([]);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setStep('rating');
    setOverallRating(0);
    setDriverRating(0);
    setPunctualityRating(0);
    setPositiveAspects([]);
    setImprovementAreas([]);
    setFeedbackText('');
  };

  const handleClose = () => {
    if (step === 'complete') {
      onComplete();
    } else {
      onDismiss();
    }
    resetForm();
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (overallRating === 0) {
      toast({
        title: t('review.ratingRequired'),
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await submitReview({
        booking_id: bookingId,
        overall_rating: overallRating,
        driver_rating: hasDriver ? driverRating || undefined : undefined,
        punctuality_rating: punctualityRating || undefined,
        positive_aspects: positiveAspects.length > 0 ? positiveAspects : undefined,
        improvement_areas: improvementAreas.length > 0 ? improvementAreas : undefined,
        feedback_text: feedbackText || undefined
      });

      setStep('complete');
      toast({
        title: t('review.thankYou'),
        description: t('review.feedbackReceived')
      });
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: t('common.error'),
        description: t('review.submitError'),
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = overallRating > 0;
  const showDriverRating = hasDriver || hasGuide;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="relative">
          <button
            onClick={handleClose}
            className="absolute right-0 top-0 p-1 rounded-full hover:bg-muted transition-colors"
            aria-label={t('common.close')}
          >
            <X className="h-4 w-4" />
          </button>
          <DialogTitle className="text-center pr-6">
            {step === 'complete' 
              ? t('review.thankYou')
              : t('review.howWasService')}
          </DialogTitle>
        </DialogHeader>

        {step === 'rating' && (
          <div className="space-y-6 py-4">
            {/* Service type indicator */}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <div className="px-2 py-1 bg-muted rounded-md capitalize">
                {t(`services.${serviceType}`, serviceType)}
              </div>
            </div>

            {/* Overall rating - most prominent */}
            <div className="text-center space-y-3">
              <p className="text-sm font-medium">{t('review.overallExperience')}</p>
              <div className="flex justify-center">
                <StarRating
                  value={overallRating}
                  onChange={setOverallRating}
                  size="lg"
                />
              </div>
              <p className={cn(
                'text-xs transition-opacity',
                overallRating > 0 ? 'opacity-100' : 'opacity-0'
              )}>
                {overallRating <= 2 && t('review.sorryToHear')}
                {overallRating === 3 && t('review.averageExperience')}
                {overallRating >= 4 && t('review.gladYouEnjoyed')}
              </p>
            </div>

            {/* Driver/Guide rating (if applicable) */}
            {showDriverRating && (
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center gap-2">
                  {hasDriver ? (
                    <Car className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <User className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">
                    {hasDriver ? t('review.rateDriver') : t('review.rateGuide')}
                  </span>
                </div>
                <StarRating
                  value={driverRating}
                  onChange={setDriverRating}
                  size="md"
                />
              </div>
            )}

            {/* Punctuality rating */}
            <div className="space-y-2 pt-2 border-t">
              <span className="text-sm font-medium">{t('review.punctuality')}</span>
              <StarRating
                value={punctualityRating}
                onChange={setPunctualityRating}
                size="sm"
              />
            </div>

            {/* Proceed button */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="ghost"
                onClick={handleClose}
                className="flex-1"
              >
                {t('review.maybeLater')}
              </Button>
              <Button
                onClick={() => setStep('feedback')}
                disabled={!canProceed}
                className="flex-1"
              >
                {t('common.continue')}
              </Button>
            </div>
          </div>
        )}

        {step === 'feedback' && (
          <div className="space-y-5 py-4">
            {/* Quick positive feedback */}
            {overallRating >= 3 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium">{t('review.whatWentWell')}</span>
                </div>
                <QuickFeedbackChips
                  options={POSITIVE_ASPECTS}
                  selected={positiveAspects}
                  onChange={setPositiveAspects}
                  type="positive"
                />
              </div>
            )}

            {/* Improvement areas (show for lower ratings) */}
            {overallRating <= 3 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium">{t('review.whatCouldImprove')}</span>
                </div>
                <QuickFeedbackChips
                  options={IMPROVEMENT_AREAS}
                  selected={improvementAreas}
                  onChange={setImprovementAreas}
                  type="improvement"
                />
              </div>
            )}

            {/* Optional text feedback */}
            <div className="space-y-2">
              <span className="text-sm font-medium">{t('review.additionalComments')}</span>
              <Textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder={t('review.optionalFeedback')}
                className="resize-none h-20"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {feedbackText.length}/500
              </p>
            </div>

            {/* Submit */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => setStep('rating')}
                className="flex-1"
              >
                {t('common.back')}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 gap-2"
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? t('common.submitting') : t('review.submitReview')}
              </Button>
            </div>
          </div>
        )}

        {step === 'complete' && (
          <div className="text-center py-8 space-y-4">
            <div className="h-16 w-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <ThumbsUp className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">{t('review.thankYou')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('review.feedbackHelps')}
              </p>
            </div>
            <Button onClick={handleClose} className="mt-4">
              {t('common.done')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
