/**
 * BOOKING WORKFLOW - Strict Status Transitions
 * 
 * Normalized booking lifecycle:
 * pending → confirmed → assigned → accepted → on_trip → completed → paid
 * 
 * Any status can transition to: cancelled, rejected
 */

import { BookingStatus } from '@/types/booking';

// Valid status transitions map
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled', 'rejected'],
  confirmed: ['assigned', 'cancelled', 'rejected'],
  assigned: ['accepted', 'confirmed', 'cancelled', 'rejected'], // Can go back to confirmed if driver rejects
  accepted: ['on_trip', 'cancelled'],
  on_trip: ['completed', 'cancelled'],
  completed: ['paid'],
  paid: [], // Terminal state
  cancelled: [], // Terminal state
  rejected: [], // Terminal state
};

// Human-readable status labels
export const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending Review',
  confirmed: 'Confirmed',
  assigned: 'Driver Assigned',
  accepted: 'Driver Accepted',
  on_trip: 'In Progress',
  completed: 'Completed',
  paid: 'Paid & Closed',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
};

// Status colors for UI
export const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300',
  confirmed: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
  assigned: 'bg-purple-500/20 text-purple-700 dark:text-purple-300',
  accepted: 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300',
  on_trip: 'bg-orange-500/20 text-orange-700 dark:text-orange-300',
  completed: 'bg-green-500/20 text-green-700 dark:text-green-300',
  paid: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
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
export function getNextStatus(currentStatus: string, action: 'confirm' | 'assign' | 'accept' | 'start' | 'complete' | 'pay' | 'cancel' | 'reject'): string | null {
  const actionToStatus: Record<string, string> = {
    confirm: 'confirmed',
    assign: 'assigned',
    accept: 'accepted',
    start: 'on_trip',
    complete: 'completed',
    pay: 'paid',
    cancel: 'cancelled',
    reject: 'rejected',
  };

  const targetStatus = actionToStatus[action];
  if (!targetStatus) return null;

  // Cancel and reject can happen from most states
  if (action === 'cancel' || action === 'reject') {
    const terminalStates = ['completed', 'paid', 'cancelled', 'rejected'];
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
 * Check if booking can accept payment
 */
export function canAcceptPayment(status: string, priceConfirmed: boolean, totalPrice: number | null): boolean {
  // Must have price set and confirmed
  if (!totalPrice || totalPrice <= 0) return false;
  if (!priceConfirmed) return false;
  
  // Can pay in pending or confirmed states
  return ['pending', 'confirmed'].includes(status);
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
    case 'pending':
      return 'outline';
    default:
      return 'secondary';
  }
}
