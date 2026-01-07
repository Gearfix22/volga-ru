/**
 * FINAL BOOKING WORKFLOW - Strict Status Transitions
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
 * 
 * PRICING: booking_prices.admin_price is the ONLY payable price
 */

import { BookingStatus } from '@/types/booking';

// Valid status transitions map
const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['pending_admin', 'cancelled'],
  pending_admin: ['price_set', 'cancelled', 'rejected'],
  price_set: ['awaiting_payment', 'cancelled', 'rejected'],
  awaiting_payment: ['paid', 'cancelled'],
  paid: ['in_progress'],
  in_progress: ['completed', 'cancelled'],
  completed: [], // Terminal state
  cancelled: [], // Terminal state
  rejected: [], // Terminal state
};

// Human-readable status labels
export const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  pending_admin: 'Pending Admin Review',
  price_set: 'Price Set',
  awaiting_payment: 'Awaiting Payment',
  paid: 'Paid',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
};

// Status colors for UI
export const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-500/20 text-gray-700 dark:text-gray-300',
  pending_admin: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300',
  price_set: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
  awaiting_payment: 'bg-purple-500/20 text-purple-700 dark:text-purple-300',
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
  action: 'submit' | 'set_price' | 'confirm_price' | 'pay' | 'start' | 'complete' | 'cancel' | 'reject'
): string | null {
  const actionToStatus: Record<string, string> = {
    submit: 'pending_admin',
    set_price: 'price_set',
    confirm_price: 'awaiting_payment',
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
 * 1. Status is 'awaiting_payment'
 * 2. booking_prices.admin_price is set
 */
export function canAcceptPayment(status: string, hasAdminPrice: boolean): boolean {
  if (status !== 'awaiting_payment') return false;
  if (!hasAdminPrice) return false;
  return true;
}

/**
 * CRITICAL: Admin can ONLY edit price BEFORE payment
 * (i.e., status is draft, pending_admin, price_set, or awaiting_payment)
 */
export function canEditPrice(status: string): boolean {
  const editableStatuses = ['draft', 'pending_admin', 'price_set', 'awaiting_payment'];
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
