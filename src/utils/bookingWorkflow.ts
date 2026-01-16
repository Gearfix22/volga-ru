/**
 * FINAL BOOKING WORKFLOW - Aligned with Database ENUM
 * 
 * SINGLE SOURCE OF TRUTH FOR BOOKING STATUS (Frontend)
 * 
 * DATABASE ENUM (source of truth):
 * draft, pending, under_review, approved, awaiting_payment, paid,
 * confirmed, assigned, accepted, on_trip, completed, cancelled, rejected
 * 
 * Workflow:
 * 1. draft → Customer selecting service
 * 2. pending/under_review → Customer confirmed, waiting for admin
 * 3. approved/awaiting_payment → Admin set price, waiting for payment
 * 4. paid → Customer paid
 * 5. confirmed → Payment confirmed by admin
 * 6. assigned → Driver/guide assigned
 * 7. accepted → Driver/guide accepted
 * 8. on_trip → Service in progress
 * 9. completed → Service completed
 * 
 * Terminal states: cancelled, rejected
 * 
 * PRICING ARCHITECTURE:
 * - booking_prices.admin_price is the ONLY payable price
 * - v_booking_payment_guard view exposes: can_pay, approved_price, locked
 * - Payment page opens ONLY when can_pay = true (locked = true AND admin_price > 0)
 */

import { BookingStatus } from '@/types/booking';

// All valid booking statuses - ALIGNED WITH DATABASE ENUM
export const BOOKING_STATUSES = [
  'draft',
  'pending',
  'under_review',
  'approved',
  'awaiting_payment',
  'paid',
  'confirmed',
  'assigned',
  'accepted',
  'on_trip',
  'completed',
  'cancelled',
  'rejected',
] as const;

// Statuses that indicate ACTIVE bookings (in progress, not final)
export const ACTIVE_STATUSES = [
  'draft',
  'pending',
  'under_review',
  'approved',
  'awaiting_payment',
  'paid',
  'confirmed',
  'assigned',
  'accepted',
  'on_trip',
];

// Statuses that indicate FINAL/COMPLETED bookings
export const FINAL_STATUSES = ['completed', 'cancelled', 'rejected'];

// Statuses where price can be edited
export const PRICE_EDITABLE_STATUSES = [
  'draft',
  'pending',
  'under_review',
  'approved',
];

// Valid status transitions map - ALIGNED WITH DATABASE ENUM
const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['pending', 'under_review', 'cancelled'],
  pending: ['under_review', 'approved', 'cancelled', 'rejected'],
  under_review: ['approved', 'awaiting_payment', 'cancelled', 'rejected'],
  approved: ['awaiting_payment', 'cancelled'],
  awaiting_payment: ['paid', 'cancelled'],
  paid: ['confirmed'],
  confirmed: ['assigned'],
  assigned: ['accepted', 'cancelled'],
  accepted: ['on_trip', 'cancelled'],
  on_trip: ['completed', 'cancelled'],
  completed: [], // Terminal state
  cancelled: [], // Terminal state
  rejected: [], // Terminal state
};

// Human-readable status labels - ALIGNED WITH DATABASE ENUM
export const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  pending: 'Pending Review',
  under_review: 'Under Review',
  approved: 'Approved',
  awaiting_payment: 'Awaiting Payment',
  paid: 'Paid',
  confirmed: 'Confirmed',
  assigned: 'Assigned',
  accepted: 'Accepted',
  on_trip: 'On Trip',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
};

// Status colors for UI (using semantic colors) - ALIGNED WITH DATABASE ENUM
export const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  pending: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300',
  under_review: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300',
  approved: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
  awaiting_payment: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
  paid: 'bg-green-500/20 text-green-700 dark:text-green-300',
  confirmed: 'bg-green-500/20 text-green-700 dark:text-green-300',
  assigned: 'bg-purple-500/20 text-purple-700 dark:text-purple-300',
  accepted: 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300',
  on_trip: 'bg-orange-500/20 text-orange-700 dark:text-orange-300',
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
  action: 'submit' | 'set_price' | 'approve_price' | 'pay' | 'confirm' | 'assign' | 'accept' | 'start' | 'complete' | 'cancel' | 'reject'
): string | null {
  // Map actions to database status values
  const actionToStatus: Record<string, string> = {
    submit: 'pending',
    set_price: 'approved',
    approve_price: 'awaiting_payment',
    pay: 'paid',
    confirm: 'confirmed',
    assign: 'assigned',
    accept: 'accepted',
    start: 'on_trip',
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
