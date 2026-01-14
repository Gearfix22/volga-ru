/**
 * SINGLE SOURCE OF TRUTH FOR BOOKING STATUS
 * 
 * This module defines all valid booking statuses and transitions.
 * Both frontend and backend MUST use these definitions.
 * 
 * WORKFLOW:
 * draft → under_review → awaiting_customer_confirmation → paid → in_progress → completed
 * 
 * TERMINAL STATES:
 * - completed (success)
 * - cancelled (user cancelled)
 * - rejected (admin rejected)
 */

export const BOOKING_STATUSES = [
  'draft',                          // User created but not submitted
  'under_review',                   // Admin reviewing the request
  'awaiting_customer_confirmation', // Price set, waiting for customer to pay
  'paid',                           // Customer paid, awaiting assignment
  'in_progress',                    // Service being delivered
  'completed',                      // Service completed
  'cancelled',                      // Cancelled by user or admin
  'rejected',                       // Rejected by admin
  // Legacy statuses (for backward compatibility)
  'pending',                        // Legacy: maps to under_review
  'confirmed',                      // Legacy: maps to awaiting_customer_confirmation
] as const

export type BookingStatus = typeof BOOKING_STATUSES[number]

export const PAYMENT_STATUSES = [
  'pending',              // Not paid yet
  'paid',                 // Payment confirmed
  'pending_verification', // Bank transfer uploaded, awaiting verification
  'refunded',             // Payment refunded
  'failed',               // Payment failed
] as const

export type PaymentStatus = typeof PAYMENT_STATUSES[number]

/**
 * Valid status transitions
 * Key = current status, Value = array of allowed next statuses
 */
export const STATUS_TRANSITIONS: Record<string, string[]> = {
  // Normal workflow
  'draft': ['under_review', 'cancelled'],
  'under_review': ['awaiting_customer_confirmation', 'cancelled', 'rejected'],
  'awaiting_customer_confirmation': ['paid', 'cancelled'],
  'paid': ['in_progress', 'cancelled'],
  'in_progress': ['completed', 'cancelled'],
  
  // Terminal states - no transitions allowed
  'completed': [],
  'cancelled': [],
  'rejected': [],
  
  // Legacy status mappings
  'pending': ['confirmed', 'under_review', 'cancelled', 'rejected'],
  'confirmed': ['paid', 'awaiting_customer_confirmation', 'cancelled'],
}

/**
 * Statuses that indicate active/pending bookings (not completed)
 */
export const ACTIVE_STATUSES: BookingStatus[] = [
  'draft',
  'under_review',
  'awaiting_customer_confirmation',
  'paid',
  'in_progress',
  'pending',
  'confirmed',
]

/**
 * Statuses that indicate completed/final bookings
 */
export const FINAL_STATUSES: BookingStatus[] = [
  'completed',
  'cancelled',
  'rejected',
]

/**
 * Statuses where price can still be edited
 */
export const PRICE_EDITABLE_STATUSES: BookingStatus[] = [
  'draft',
  'under_review',
  'awaiting_customer_confirmation',
  'pending',
]

/**
 * Statuses where price is locked (cannot be changed)
 */
export const PRICE_LOCKED_STATUSES: BookingStatus[] = [
  'paid',
  'in_progress',
  'completed',
]

/**
 * Check if a status transition is valid
 */
export function isValidTransition(currentStatus: string, newStatus: string): boolean {
  if (currentStatus === newStatus) return true
  const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || []
  return allowedTransitions.includes(newStatus)
}

/**
 * Get list of valid next statuses from current status
 */
export function getValidNextStatuses(currentStatus: string): string[] {
  return STATUS_TRANSITIONS[currentStatus] || []
}

/**
 * Check if status allows price editing
 */
export function canEditPrice(status: string): boolean {
  return PRICE_EDITABLE_STATUSES.includes(status as BookingStatus)
}

/**
 * Check if status indicates booking is still active (not final)
 */
export function isActiveBooking(status: string): boolean {
  return ACTIVE_STATUSES.includes(status as BookingStatus)
}

/**
 * Check if status is a terminal/final state
 */
export function isFinalStatus(status: string): boolean {
  return FINAL_STATUSES.includes(status as BookingStatus)
}

/**
 * Normalize legacy status to current workflow
 */
export function normalizeStatus(status: string): BookingStatus {
  const mappings: Record<string, BookingStatus> = {
    'pending': 'under_review',
    'confirmed': 'awaiting_customer_confirmation',
  }
  return (mappings[status] || status) as BookingStatus
}

/**
 * Get human-readable label for status
 */
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'draft': 'Draft',
    'under_review': 'Under Review',
    'awaiting_customer_confirmation': 'Awaiting Confirmation',
    'paid': 'Paid',
    'in_progress': 'In Progress',
    'completed': 'Completed',
    'cancelled': 'Cancelled',
    'rejected': 'Rejected',
    // Legacy
    'pending': 'Pending',
    'confirmed': 'Confirmed',
  }
  return labels[status] || status
}
