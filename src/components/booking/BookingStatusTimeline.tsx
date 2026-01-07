import { Check, Clock, FileText, CheckCircle2, DollarSign, CreditCard, Ban, Car } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookingStatusTimelineProps {
  currentStatus: string;
  className?: string;
  compact?: boolean;
}

/**
 * FINAL BOOKING WORKFLOW STATUS TIMELINE:
 * 
 * 1. draft → Customer selecting service
 * 2. pending_admin → Customer confirmed, waiting for admin to set price
 * 3. price_set → Admin set price in booking_prices table
 * 4. awaiting_payment → Customer confirmed price, ready to pay
 * 5. paid → Customer paid (price LOCKED)
 * 6. in_progress → Driver/guide assigned, service ongoing
 * 7. completed → Service completed
 * 
 * Terminal states: cancelled, rejected
 */
const STATUS_FLOW = [
  { key: 'draft', label: 'Draft', icon: FileText, description: 'Booking created' },
  { key: 'pending_admin', label: 'Pending Admin', icon: Clock, description: 'Admin reviewing' },
  { key: 'price_set', label: 'Price Set', icon: DollarSign, description: 'Admin set price' },
  { key: 'awaiting_payment', label: 'Awaiting Payment', icon: CreditCard, description: 'Ready to pay' },
  { key: 'paid', label: 'Paid', icon: CheckCircle2, description: 'Payment confirmed' },
  { key: 'in_progress', label: 'In Progress', icon: Car, description: 'Service in progress' },
  { key: 'completed', label: 'Completed', icon: Check, description: 'Service delivered' },
];

const STATUS_INDEX: Record<string, number> = {
  draft: 0,
  pending_admin: 1,
  price_set: 2,
  awaiting_payment: 3,
  paid: 4,
  in_progress: 5,
  completed: 6,
  // Legacy mappings
  under_review: 1,
  awaiting_customer_confirmation: 2,
  pending: 1,
  confirmed: 2,
  cancelled: -1,
  rejected: -1,
};

export function BookingStatusTimeline({ currentStatus, className, compact = false }: BookingStatusTimelineProps) {
  const normalizedStatus = currentStatus?.toLowerCase() || 'draft';
  const currentIndex = STATUS_INDEX[normalizedStatus] ?? 0;
  const isCancelled = normalizedStatus === 'cancelled' || normalizedStatus === 'rejected';

  if (isCancelled) {
    return (
      <div className={cn("flex items-center gap-2 text-destructive", className)}>
        <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
          <Ban className="w-4 h-4 text-destructive" />
        </div>
        <span className="font-medium capitalize">{currentStatus}</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {STATUS_FLOW.map((status, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const Icon = status.icon;

          return (
            <div key={status.key} className="flex items-center">
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                  isCompleted && "bg-primary text-primary-foreground",
                  isCurrent && "bg-primary text-primary-foreground ring-2 ring-primary/30",
                  !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                )}
                title={status.label}
              >
                <Icon className="w-3 h-3" />
              </div>
              {index < STATUS_FLOW.length - 1 && (
                <div
                  className={cn(
                    "w-4 h-0.5 mx-0.5",
                    index < currentIndex ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("space-y-0", className)}>
      {STATUS_FLOW.map((status, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isPending = index > currentIndex;
        const Icon = status.icon;

        return (
          <div key={status.key} className="flex items-start gap-3">
            {/* Timeline line and dot */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0",
                  isCompleted && "bg-primary text-primary-foreground",
                  isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  isPending && "bg-muted text-muted-foreground border-2 border-dashed border-muted-foreground/30"
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              {index < STATUS_FLOW.length - 1 && (
                <div
                  className={cn(
                    "w-0.5 h-8 my-1",
                    index < currentIndex ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>

            {/* Content */}
            <div className={cn("pt-1 pb-4", index === STATUS_FLOW.length - 1 && "pb-0")}>
              <p
                className={cn(
                  "font-medium text-sm",
                  isCompleted && "text-primary",
                  isCurrent && "text-foreground",
                  isPending && "text-muted-foreground"
                )}
              >
                {status.label}
              </p>
              <p className="text-xs text-muted-foreground">{status.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
