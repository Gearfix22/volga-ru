/**
 * BOOKING WORKFLOW - Strict Status Transitions
 * 
 * Normalized booking lifecycle:
 * draft → pending_admin_review → awaiting_payment → paid → in_progress → completed
 * 
 * Any status can transition to: cancelled, rejected
 */

import { BookingStatus } from '@/types/booking';

// Valid status transitions map
const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['pending_admin_review', 'cancelled'],
  pending_admin_review: ['awaiting_payment', 'cancelled', 'rejected'],
  awaiting_payment: ['paid', 'cancelled'],
  paid: ['in_progress'], // Price locked after this point
  in_progress: ['completed', 'cancelled'],
  completed: [], // Terminal state
  cancelled: [], // Terminal state
  rejected: [], // Terminal state
};

// Human-readable status labels
export const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  pending_admin_review: 'Pending Admin Review',
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
  pending_admin_review: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300',
  awaiting_payment: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
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
export function getNextStatus(currentStatus: string, action: 'review' | 'set_price' | 'pay' | 'start' | 'complete' | 'cancel' | 'reject'): string | null {
  const actionToStatus: Record<string, string> = {
    review: 'pending_admin_review',
    set_price: 'awaiting_payment',
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
 * Check if booking can accept payment - only in awaiting_payment status with admin_final_price set
 */
export function canAcceptPayment(status: string, adminFinalPrice: number | null): boolean {
  // Must be in awaiting_payment status with admin price set
  if (status !== 'awaiting_payment') return false;
  if (!adminFinalPrice || adminFinalPrice <= 0) return false;
  return true;
}

/**
 * Check if price can be edited (only before payment)
 */
export function canEditPrice(status: string): boolean {
  const editableStatuses = ['draft', 'pending_admin_review', 'awaiting_payment'];
  return editableStatuses.includes(status);
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
    case 'pending_admin_review':
      return 'outline';
    default:
      return 'secondary';
  }
}
