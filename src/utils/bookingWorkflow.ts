/**
 * FINAL BOOKING WORKFLOW - Aligned with Edge Function
 * 
 * 1. draft → Customer selecting service
 * 2. under_review → Customer confirmed, waiting for admin
 * 3. awaiting_customer_confirmation → Admin set price, awaiting customer
 * 4. paid → Customer paid (price LOCKED)
 * 5. in_progress → Driver/guide assigned, service ongoing
 * 6. completed → Service completed
 * 
 * Terminal states: cancelled, rejected
 * 
 * PRICING: booking_prices.admin_price is the ONLY payable price
 */

import { BookingStatus } from '@/types/booking';

// Valid status transitions map - aligned with edge function
const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['under_review', 'cancelled'],
  pending: ['under_review', 'cancelled'], // Legacy support
  under_review: ['awaiting_customer_confirmation', 'cancelled', 'rejected'],
  awaiting_customer_confirmation: ['paid', 'cancelled'],
  paid: ['in_progress'],
  in_progress: ['completed', 'cancelled'],
  completed: [], // Terminal state
  cancelled: [], // Terminal state
  rejected: [], // Terminal state
};

// Human-readable status labels
export const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  pending: 'Pending Review',
  under_review: 'Under Review',
  awaiting_customer_confirmation: 'Awaiting Confirmation',
  paid: 'Paid',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
};

// Status colors for UI
export const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-500/20 text-gray-700 dark:text-gray-300',
  pending: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300',
  under_review: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300',
  awaiting_customer_confirmation: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
  paid: 'bg-green-500/20 text-green-700 dark:text-green-300',
  in_progress: 'bg-orange-500/20 text-orange-700 dark:text-orange-300',
  completed: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
  cancelled: 'bg-red-500/20 text-red-700 dark:text-red-300',
  rejected: 'bg-red-500/20 text-red-700 dark:text-red-300',
};

/**
 * Check if a status transition is valid
 */
export function isValidTransition(currentStatus: string, newStatus: string): boolean {
  const validNext = VALID_TRANSITIONS[currentStatus] || [];
  return validNext.includes(newStatus);
}

/**
 * Get valid next statuses from current status
 */
export function getValidNextStatuses(currentStatus: string): string[] {
  return VALID_TRANSITIONS[currentStatus] || [];
}

/**
 * Validate and get the appropriate next status based on action
 */
export function getNextStatus(
  currentStatus: string, 
  action: 'submit' | 'set_price' | 'pay' | 'start' | 'complete' | 'cancel' | 'reject'
): string | null {
  const actionToStatus: Record<string, string> = {
    submit: 'under_review',
    set_price: 'awaiting_customer_confirmation',
    pay: 'paid',
    start: 'in_progress',
    complete: 'completed',
    cancel: 'cancelled',
    reject: 'rejected',
  };

  const targetStatus = actionToStatus[action];
  if (!targetStatus) return null;

  // Cancel and reject can happen from most states
  if (action === 'cancel' || action === 'reject') {
    const terminalStates = ['completed', 'cancelled', 'rejected'];
    if (terminalStates.includes(currentStatus)) {
      return null; // Can't cancel/reject terminal states
    }
    return targetStatus;
  }

  // Check if transition is valid
  if (isValidTransition(currentStatus, targetStatus)) {
    return targetStatus;
  }

  return null;
}

/**
 * Check if booking requires driver assignment
 */
export function requiresDriverAssignment(serviceType: string): boolean {
  return serviceType === 'Driver' || serviceType === 'Transportation';
}

/**
 * Check if booking requires guide assignment
 */
export function requiresGuideAssignment(serviceType: string): boolean {
  return serviceType === 'Guide' || serviceType === 'tourist_guide';
}

/**
 * CRITICAL: Customer can ONLY pay if:
 * 1. Status is 'awaiting_customer_confirmation'
 * 2. booking_prices.admin_price is set
 */
export function canAcceptPayment(status: string, hasAdminPrice: boolean): boolean {
  if (status !== 'awaiting_customer_confirmation') return false;
  if (!hasAdminPrice) return false;
  return true;
}

/**
 * CRITICAL: Admin can ONLY edit price BEFORE payment
 * (i.e., status is draft, pending, under_review, or awaiting_customer_confirmation)
 */
export function canEditPrice(status: string): boolean {
  const editableStatuses = ['draft', 'pending', 'under_review', 'awaiting_customer_confirmation'];
  return editableStatuses.includes(status);
}

/**
 * Check if price is locked (after payment)
 */
export function isPriceLocked(status: string): boolean {
  const lockedStatuses = ['paid', 'in_progress', 'completed'];
  return lockedStatuses.includes(status);
}

/**
 * Get status badge variant
 */
export function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'completed':
    case 'paid':
      return 'default';
    case 'cancelled':
    case 'rejected':
      return 'destructive';
    case 'draft':
    case 'pending_admin':
      return 'outline';
    default:
      return 'secondary';
  }
}
