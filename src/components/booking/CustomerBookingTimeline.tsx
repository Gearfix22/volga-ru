import { Check, Clock, FileText, CheckCircle2, Car, User, CreditCard, Ban, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow, addMinutes, addHours, format } from 'date-fns';

interface CustomerBookingTimelineProps {
  booking: {
    id: string;
    status: string;
    created_at: string;
    updated_at?: string;
    service_type: string;
    total_price?: number;
    payment_status?: string;
    assigned_driver_id?: string;
  };
  className?: string;
  showEstimates?: boolean;
}

/**
 * CUSTOMER BOOKING LIFECYCLE with estimated times:
 * 1. REQUESTED (pending) - Customer submitted booking - Instant
 * 2. CONFIRMED (confirmed) - Admin reviewed and confirmed - ~5-15 min
 * 3. DRIVER_ASSIGNED (assigned) - Driver has been assigned - ~15-30 min
 * 4. DRIVER_CONFIRMED (accepted) - Driver accepted the trip - ~5-10 min
 * 5. IN_PROGRESS (on_trip) - Trip is ongoing - varies
 * 6. COMPLETED (completed) - Service delivered - varies
 * 7. PAID (paid) - Payment confirmed - instant to 24h
 */
const TIMELINE_STAGES = [
  { 
    key: 'pending', 
    label: 'Booking Requested', 
    icon: FileText, 
    description: 'Your booking has been submitted',
    estimatedTime: 'Instant',
    color: 'text-blue-600'
  },
  { 
    key: 'confirmed', 
    label: 'Booking Confirmed', 
    icon: Check, 
    description: 'Admin has confirmed your booking',
    estimatedTime: '5-15 minutes',
    color: 'text-emerald-600'
  },
  { 
    key: 'assigned', 
    label: 'Driver Assigned', 
    icon: User, 
    description: 'A driver has been assigned to your trip',
    estimatedTime: '15-30 minutes',
    color: 'text-violet-600'
  },
  { 
    key: 'accepted', 
    label: 'Driver Confirmed', 
    icon: CheckCircle2, 
    description: 'Driver has accepted your booking',
    estimatedTime: '5-10 minutes',
    color: 'text-indigo-600'
  },
  { 
    key: 'on_trip', 
    label: 'In Progress', 
    icon: Car, 
    description: 'Your trip is currently in progress',
    estimatedTime: 'Varies by service',
    color: 'text-amber-600'
  },
  { 
    key: 'completed', 
    label: 'Completed', 
    icon: CheckCircle2, 
    description: 'Service has been completed',
    estimatedTime: 'Upon arrival',
    color: 'text-green-600'
  },
  { 
    key: 'paid', 
    label: 'Payment Complete', 
    icon: CreditCard, 
    description: 'Payment has been received',
    estimatedTime: 'Instant to 24 hours',
    color: 'text-teal-600'
  },
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
  paid: 6,
  closed: 6,
  cancelled: -1,
  rejected: -1,
};

function getEstimatedCompletionTime(status: string, createdAt: string): string {
  const created = new Date(createdAt);
  const statusIdx = STATUS_INDEX[status] ?? 0;
  
  // Estimate based on current status
  switch (statusIdx) {
    case 0: // pending
      return format(addMinutes(created, 15), 'h:mm a');
    case 1: // confirmed
      return format(addMinutes(created, 45), 'h:mm a');
    case 2: // assigned
      return format(addHours(created, 1), 'h:mm a');
    case 3: // accepted
      return format(addHours(created, 2), 'h:mm a');
    case 4: // on_trip
      return 'In progress';
    case 5: // completed
      return 'Completed';
    case 6: // paid
      return 'Paid';
    default:
      return 'N/A';
  }
}

export function CustomerBookingTimeline({ booking, className, showEstimates = true }: CustomerBookingTimelineProps) {
  const normalizedStatus = booking.status?.toLowerCase() || 'pending';
  const currentIndex = STATUS_INDEX[normalizedStatus] ?? 0;
  const isCancelled = normalizedStatus === 'cancelled' || normalizedStatus === 'rejected';

  if (isCancelled) {
    return (
      <Card className={cn("border-destructive/50", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-destructive text-lg">
            <Ban className="w-5 h-5" />
            Booking {normalizedStatus === 'cancelled' ? 'Cancelled' : 'Rejected'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            This booking has been {normalizedStatus}. Please contact support if you have questions.
          </p>
        </CardContent>
      </Card>
    );
  }

  const timeSinceCreated = formatDistanceToNow(new Date(booking.created_at), { addSuffix: true });

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Booking Progress
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            Created {timeSinceCreated}
          </Badge>
        </div>
        {showEstimates && currentIndex < 5 && (
          <p className="text-sm text-muted-foreground mt-1">
            Estimated next update: <span className="font-medium text-foreground">{getEstimatedCompletionTime(normalizedStatus, booking.created_at)}</span>
          </p>
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
              <div key={stage.key} className="flex items-start gap-4 mb-6 last:mb-0">
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
                  <div className="flex items-center justify-between">
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
                        {isCompleted ? 'Done' : isCurrent ? 'Current' : stage.estimatedTime}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{stage.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{Math.round((currentIndex / (TIMELINE_STAGES.length - 1)) * 100)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
              style={{ width: `${(currentIndex / (TIMELINE_STAGES.length - 1)) * 100}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
