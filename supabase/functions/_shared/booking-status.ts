/**
 * SINGLE SOURCE OF TRUTH FOR BOOKING STATUS (Edge Functions)
 * 
 * This module defines all valid booking statuses and transitions.
 * Both frontend and backend MUST use these definitions.
 * 
 * ALIGNED WITH DATABASE ENUM (booking_status):
 * draft, pending, under_review, approved, awaiting_payment, paid, confirmed,
 * assigned, accepted, on_trip, completed, cancelled, rejected
 * 
 * MAIN WORKFLOW:
 * draft → pending → under_review → approved → awaiting_payment → paid → assigned → accepted → on_trip → completed
 * 
 * TERMINAL STATES:
 * - completed (success)
 * - cancelled (user cancelled)
 * - rejected (admin rejected)
 * 
 * PRICING ARCHITECTURE:
 * - booking_prices.admin_price is the ONLY payable amount
 * - booking_prices.locked determines if price can be edited
 * - v_booking_payment_guard view exposes: can_pay, approved_price, locked
 * 
 * CRITICAL: This file is for EDGE FUNCTIONS only.
 * Frontend uses src/utils/bookingWorkflow.ts (mirrored logic)
 */

// ALIGNED WITH DATABASE ENUM - booking_status
export const BOOKING_STATUSES = [
  'draft',           // User created but not submitted
  'pending',         // Submitted, awaiting admin review
  'under_review',    // Admin actively reviewing the request
  'approved',        // Admin approved, price may be set
  'awaiting_payment', // Price set and locked, waiting for payment
  'paid',            // Customer paid
  'confirmed',       // Payment confirmed
  'assigned',        // Driver/Guide assigned
  'accepted',        // Driver/Guide accepted the assignment
  'on_trip',         // Service in progress
  'completed',       // Service completed
  'cancelled',       // Cancelled by user or admin
  'rejected',        // Rejected by admin
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
  'draft': ['pending', 'cancelled'],
  'pending': ['under_review', 'approved', 'cancelled', 'rejected'],
  'under_review': ['approved', 'awaiting_payment', 'cancelled', 'rejected'],
  'approved': ['awaiting_payment', 'cancelled', 'rejected'],
  'awaiting_payment': ['paid', 'cancelled'],
  'paid': ['confirmed', 'assigned'],
  'confirmed': ['assigned', 'on_trip'],
  'assigned': ['accepted', 'on_trip', 'cancelled'],
  'accepted': ['on_trip'],
  'on_trip': ['completed', 'cancelled'],
  
  // Terminal states - no transitions allowed
  'completed': [],
  'cancelled': [],
  'rejected': [],
}

/**
 * Statuses that indicate active/pending bookings (not completed)
 */
export const ACTIVE_STATUSES: BookingStatus[] = [
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
  'pending',
  'under_review',
  'approved',
  'awaiting_payment', // Can unlock and edit before payment
]

/**
 * Statuses where price is locked (cannot be changed without unlock)
 */
export const PRICE_LOCKED_STATUSES: BookingStatus[] = [
  'paid',
  'confirmed',
  'assigned',
  'accepted',
  'on_trip',
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
 * Get human-readable label for status
 */
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'draft': 'Draft',
    'pending': 'Pending',
    'under_review': 'Under Review',
    'approved': 'Approved',
    'awaiting_payment': 'Awaiting Payment',
    'paid': 'Paid',
    'confirmed': 'Confirmed',
    'assigned': 'Assigned',
    'accepted': 'Accepted',
    'on_trip': 'On Trip',
    'completed': 'Completed',
    'cancelled': 'Cancelled',
    'rejected': 'Rejected',
  }
  return labels[status] || status
}

/**
 * Check if cancellation is allowed from current status
 */
export function canCancel(status: string): boolean {
  const nonCancellable = ['completed', 'cancelled', 'rejected', 'on_trip']
  return !nonCancellable.includes(status)
}
