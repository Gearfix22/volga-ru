import { Check, Clock, FileText, CheckCircle2, Car, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookingStatusTimelineProps {
  currentStatus: string;
  className?: string;
  compact?: boolean;
}

/**
 * NORMALIZED BOOKING LIFECYCLE:
 * REQUESTED → ADMIN_REVIEW → DRIVER_ASSIGNED → DRIVER_CONFIRMED → IN_PROGRESS → COMPLETED → PAID/CLOSED
 * 
 * Status mapping:
 * - pending = REQUESTED (customer submitted booking)
 * - confirmed = ADMIN_REVIEW passed, awaiting driver assignment
 * - assigned = DRIVER_ASSIGNED (admin assigned driver)
 * - accepted = DRIVER_CONFIRMED (driver accepted)
 * - on_trip/active = IN_PROGRESS
 * - completed = COMPLETED
 * - paid = PAID/CLOSED
 */
const STATUS_FLOW = [
  { key: 'pending', label: 'Requested', icon: FileText, description: 'Booking submitted' },
  { key: 'confirmed', label: 'Confirmed', icon: Check, description: 'Admin confirmed' },
  { key: 'assigned', label: 'Driver Assigned', icon: Car, description: 'Driver assigned' },
  { key: 'accepted', label: 'Driver Confirmed', icon: CheckCircle2, description: 'Driver accepted' },
  { key: 'on_trip', label: 'In Progress', icon: Car, description: 'Trip in progress' },
  { key: 'completed', label: 'Completed', icon: CheckCircle2, description: 'Service completed' },
];

const STATUS_INDEX: Record<string, number> = {
  draft: 0,
  pending: 0,
  confirmed: 1,
  assigned: 2,
  accepted: 3,
  active: 4,
  on_trip: 4,
  in_progress: 4,
  completed: 5,
  paid: 5,
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
