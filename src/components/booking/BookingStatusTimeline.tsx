import { Check, Clock, FileText, CheckCircle2, DollarSign, CreditCard, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookingStatusTimelineProps {
  currentStatus: string;
  className?: string;
  compact?: boolean;
}

/**
 * NORMALIZED BOOKING STATUS FLOW:
 * requested → admin_review → priced → payment_pending → paid → completed
 * 
 * Each status represents a clear stage in the booking lifecycle:
 * - requested: Customer submitted booking request
 * - admin_review: Admin is reviewing the request
 * - priced: Admin has set the price, awaiting customer confirmation
 * - payment_pending: Customer confirmed price, payment in progress
 * - paid: Payment confirmed
 * - completed: Service delivered
 * - cancelled: Booking cancelled (terminal state)
 */
const STATUS_FLOW = [
  { key: 'requested', label: 'Requested', icon: FileText, description: 'Booking submitted' },
  { key: 'admin_review', label: 'Under Review', icon: Clock, description: 'Admin reviewing' },
  { key: 'priced', label: 'Price Set', icon: DollarSign, description: 'Price confirmed by admin' },
  { key: 'payment_pending', label: 'Awaiting Payment', icon: CreditCard, description: 'Payment in progress' },
  { key: 'paid', label: 'Paid', icon: CheckCircle2, description: 'Payment confirmed' },
  { key: 'completed', label: 'Completed', icon: Check, description: 'Service delivered' },
];

const STATUS_INDEX: Record<string, number> = {
  draft: 0,
  requested: 0,
  pending: 0, // Legacy mapping
  admin_review: 1,
  confirmed: 1, // Legacy mapping
  priced: 2,
  payment_pending: 3,
  paid: 4,
  completed: 5,
  closed: 5,
  cancelled: -1,
  rejected: -1,
};

export function BookingStatusTimeline({ currentStatus, className, compact = false }: BookingStatusTimelineProps) {
  const normalizedStatus = currentStatus?.toLowerCase() || 'pending';
  const currentIndex = STATUS_INDEX[normalizedStatus] ?? 1; // Default to pending
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
