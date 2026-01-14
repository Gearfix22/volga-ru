/**
 * FINAL BOOKING WORKFLOW - Aligned with booking_prices table
 * 
 * SINGLE SOURCE OF TRUTH FOR BOOKING STATUS (Frontend)
 * 
 * Workflow:
 * 1. draft → Customer selecting service
 * 2. under_review → Customer confirmed, waiting for admin
 * 3. awaiting_customer_confirmation → Admin approved price (locked = true)
 * 4. paid → Customer paid (price LOCKED)
 * 5. in_progress → Driver/guide assigned, service ongoing
 * 6. completed → Service completed
 * 
 * Terminal states: cancelled, rejected
 * 
 * PRICING ARCHITECTURE:
 * - booking_prices.admin_price is the ONLY payable price
 * - v_booking_payment_guard view exposes: can_pay, approved_price, locked
 * - Payment page opens ONLY when can_pay = true (locked = true AND admin_price > 0)
 */

import { BookingStatus } from '@/types/booking';

// All valid booking statuses
export const BOOKING_STATUSES = [
  'draft',
  'under_review',
  'awaiting_customer_confirmation',
  'paid',
  'in_progress',
  'completed',
  'cancelled',
  'rejected',
  // Legacy statuses (for backward compatibility)
  'pending',
  'confirmed',
] as const;

// Statuses that indicate ACTIVE bookings (in progress, not final)
export const ACTIVE_STATUSES = [
  'draft',
  'under_review',
  'awaiting_customer_confirmation',
  'paid',
  'in_progress',
  'pending',
  'confirmed',
];

// Statuses that indicate FINAL/COMPLETED bookings
export const FINAL_STATUSES = ['completed', 'cancelled', 'rejected'];

// Statuses where price can be edited
export const PRICE_EDITABLE_STATUSES = [
  'draft',
  'under_review',
  'awaiting_customer_confirmation',
  'pending',
];

// Valid status transitions map
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
  confirmed: 'Confirmed', // Legacy
};

// Status colors for UI (using semantic colors)
export const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  pending: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300',
  under_review: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300',
  awaiting_customer_confirmation: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
  paid: 'bg-green-500/20 text-green-700 dark:text-green-300',
  in_progress: 'bg-orange-500/20 text-orange-700 dark:text-orange-300',
  completed: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
  cancelled: 'bg-destructive/20 text-destructive',
  rejected: 'bg-destructive/20 text-destructive',
};

/**
 * Check if a status is considered "active" (not finalized)
 */
export function isActiveBooking(status: string): boolean {
  return ACTIVE_STATUSES.includes(status);
}

/**
 * Check if a status is considered "final" (completed/cancelled/rejected)
 */
export function isFinalStatus(status: string): boolean {
  return FINAL_STATUSES.includes(status);
}

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
  action: 'submit' | 'set_price' | 'approve_price' | 'pay' | 'start' | 'complete' | 'cancel' | 'reject'
): string | null {
  const actionToStatus: Record<string, string> = {
    submit: 'under_review',
    set_price: 'under_review', // Price set but not approved yet
    approve_price: 'awaiting_customer_confirmation', // Price approved and locked
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
 * 2. booking_prices.locked = true AND booking_prices.admin_price > 0
 * 
 * Use paymentGuardService.canPayForBooking() for the authoritative check.
 */
export function canAcceptPayment(status: string, priceApproved: boolean, priceLocked: boolean): boolean {
  if (status !== 'awaiting_customer_confirmation') return false;
  if (!priceApproved) return false;
  if (!priceLocked) return false;
  return true;
}

/**
 * CRITICAL: Admin can ONLY edit price when booking_prices.locked = false
 * Use adminService.setBookingPrice() to set and lock prices.
 */
export function canEditPrice(priceLocked: boolean): boolean {
  return !priceLocked;
}

/**
 * Check if price is locked (after approval)
 */
export function isPriceLocked(priceLocked: boolean): boolean {
  return priceLocked;
}

/**
 * Legacy: Check if price is locked based on booking status
 */
export function isPriceLockedByStatus(status: string): boolean {
  const lockedStatuses = ['paid', 'in_progress', 'completed'];
  return lockedStatuses.includes(status);
}

/**
 * Check if price can be edited based on status
 */
export function canEditPriceByStatus(status: string): boolean {
  return PRICE_EDITABLE_STATUSES.includes(status);
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

/**
 * Normalize legacy status to current workflow
 */
export function normalizeStatus(status: string): string {
  const mappings: Record<string, string> = {
    pending: 'under_review',
    confirmed: 'awaiting_customer_confirmation',
  };
  return mappings[status] || status;
}
