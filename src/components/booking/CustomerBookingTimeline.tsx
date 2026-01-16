import { Check, Clock, FileText, CheckCircle2, Car, DollarSign, CreditCard, Ban, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow, format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';

interface CustomerBookingTimelineProps {
  booking: {
    id: string;
    status: string;
    created_at: string;
    updated_at?: string;
    service_type: string;
    total_price?: number;
    admin_final_price?: number;
    payment_status?: string;
    assigned_driver_id?: string;
  };
  className?: string;
  showEstimates?: boolean;
}

const STATUS_INDEX: Record<string, number> = {
  draft: 0,
  under_review: 1,
  awaiting_customer_confirmation: 2,
  paid: 3,
  in_progress: 4,
  completed: 5,
  // Legacy mappings
  pending: 1,
  confirmed: 2,
  cancelled: -1,
  rejected: -1,
};

export function CustomerBookingTimeline({ booking, className, showEstimates = true }: CustomerBookingTimelineProps) {
  const { t, isRTL } = useLanguage();
  
  const TIMELINE_STAGES = [
    { 
      key: 'draft', 
      label: t('timeline.bookingCreated'), 
      icon: FileText, 
      description: t('timeline.bookingCreatedDesc'),
      estimatedTime: t('timeline.now'),
      color: 'text-blue-600'
    },
    { 
      key: 'under_review', 
      label: t('timeline.underReview'), 
      icon: Clock, 
      description: t('timeline.underReviewDesc'),
      estimatedTime: t('timeline.estimatedTime15to30'),
      color: 'text-amber-600'
    },
    { 
      key: 'awaiting_customer_confirmation', 
      label: t('timeline.priceSet'), 
      icon: DollarSign, 
      description: t('timeline.priceSetDesc'),
      estimatedTime: t('timeline.actionRequired'),
      color: 'text-violet-600'
    },
    { 
      key: 'paid', 
      label: t('timeline.paymentComplete'), 
      icon: CreditCard, 
      description: t('timeline.paymentCompleteDesc'),
      estimatedTime: t('timeline.instant'),
      color: 'text-green-600'
    },
    { 
      key: 'in_progress', 
      label: t('timeline.inProgress'), 
      icon: Car, 
      description: t('timeline.inProgressDesc'),
      estimatedTime: t('timeline.varies'),
      color: 'text-indigo-600'
    },
    { 
      key: 'completed', 
      label: t('timeline.completed'), 
      icon: CheckCircle2, 
      description: t('timeline.completedDesc'),
      estimatedTime: t('timeline.uponCompletion'),
      color: 'text-emerald-600'
    },
  ];

  const normalizedStatus = booking.status?.toLowerCase() || 'draft';
  const currentIndex = STATUS_INDEX[normalizedStatus] ?? 0;
  const isCancelled = normalizedStatus === 'cancelled' || normalizedStatus === 'rejected';

  if (isCancelled) {
    return (
      <Card className={cn("border-destructive/50", className)}>
        <CardHeader className="pb-3">
          <CardTitle className={cn("flex items-center gap-2 text-destructive text-lg", isRTL && "flex-row-reverse")}>
            <Ban className="w-5 h-5" />
            {normalizedStatus === 'cancelled' ? t('timeline.bookingCancelled') : t('timeline.bookingRejected')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            {t('timeline.contactSupport', { status: normalizedStatus === 'cancelled' ? t('timeline.cancelled').toLowerCase() : t('timeline.rejected').toLowerCase() })}
          </p>
        </CardContent>
      </Card>
    );
  }

  const timeSinceCreated = formatDistanceToNow(new Date(booking.created_at), { addSuffix: true });

  // Check if customer needs to take action
  const needsCustomerAction = normalizedStatus === 'awaiting_customer_confirmation';
  const hasAdminPrice = booking.admin_final_price && booking.admin_final_price > 0;

  return (
    <Card className={cn("overflow-hidden", needsCustomerAction && "border-primary/50", className)}>
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-primary/10">
        <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
          <CardTitle className={cn("text-lg flex items-center gap-2", isRTL && "flex-row-reverse")}>
            <Clock className="w-5 h-5 text-primary" />
            {t('timeline.bookingProgress')}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {t('timeline.created', { time: timeSinceCreated })}
          </Badge>
        </div>
        {needsCustomerAction && hasAdminPrice && (
          <div className="mt-2 p-2 bg-primary/10 rounded-lg">
            <p className="text-sm font-medium text-primary">
              💰 {t('timeline.adminPriceSet', { price: booking.admin_final_price?.toFixed(2) })}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('timeline.confirmPayment')}
            </p>
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-6">
        <div className="relative">
          {TIMELINE_STAGES.map((stage, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isPending = index > currentIndex;
            const Icon = stage.icon;

            return (
              <div key={stage.key} className={cn("flex items-start gap-4 mb-6 last:mb-0", isRTL && "flex-row-reverse")}>
                {/* Timeline connector */}
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 border-2",
                      isCompleted && "bg-primary border-primary text-primary-foreground",
                      isCurrent && "bg-primary/10 border-primary text-primary animate-pulse",
                      isPending && "bg-muted border-muted-foreground/20 text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : isCurrent ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  {index < TIMELINE_STAGES.length - 1 && (
                    <div
                      className={cn(
                        "w-0.5 h-12 mt-2",
                        index < currentIndex ? "bg-primary" : "bg-muted"
                      )}
                    />
                  )}
                </div>

                {/* Content */}
                <div className={cn("pt-2 flex-1", isPending && "opacity-50")}>
                  <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
                    <p
                      className={cn(
                        "font-semibold",
                        isCompleted && "text-primary",
                        isCurrent && "text-foreground",
                        isPending && "text-muted-foreground"
                      )}
                    >
                      {stage.label}
                    </p>
                    {showEstimates && (
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full",
                        isCompleted && "bg-primary/10 text-primary",
                        isCurrent && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                        isPending && "bg-muted text-muted-foreground"
                      )}>
                        {isCompleted ? t('timeline.done') : isCurrent ? t('timeline.current') : stage.estimatedTime}
                      </span>
                    )}
                  </div>
                  <p className={cn("text-sm text-muted-foreground mt-1", isRTL && "text-right")}>{stage.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="mt-6 pt-4 border-t">
          <div className={cn("flex items-center justify-between text-sm mb-2", isRTL && "flex-row-reverse")}>
            <span className="text-muted-foreground">{t('timeline.overallProgress')}</span>
            <span className="font-medium">{Math.round((currentIndex / (TIMELINE_STAGES.length - 1)) * 100)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500",
                isRTL && "ml-auto"
              )}
              style={{ width: `${(currentIndex / (TIMELINE_STAGES.length - 1)) * 100}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}