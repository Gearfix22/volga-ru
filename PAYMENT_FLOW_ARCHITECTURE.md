# Payment Flow Architecture
## Single Source of Truth

Last Updated: 2026-01-18

---

## Overview

This document defines the **complete booking-to-payment workflow** for Volga Services. The architecture ensures:

- **No user-side price injection** - All prices come from admin
- **Unified payment page** - All services use `EnhancedPayment.tsx`
- **Mobile-first design** - API-first Edge Functions, no redirects
- **Audit trail** - All changes logged

---

## Flow Diagram (Textual)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BOOKING TO PAYMENT FLOW                            │
└─────────────────────────────────────────────────────────────────────────────┘

STEP 1: BOOKING CREATION
━━━━━━━━━━━━━━━━━━━━━━━━
[User] ──► EnhancedBooking.tsx ──► create-booking Edge Function
                                          │
                                          ▼
                                   ┌──────────────┐
                                   │   bookings   │ status = 'under_review'
                                   │    table     │ payment_status = 'pending'
                                   └──────┬───────┘ total_price = NULL
                                          │
                                          ▼
                                   ┌──────────────┐
                                   │booking_prices│ admin_price = NULL
                                   │    table     │ locked = false
                                   └──────────────┘

STEP 2: ADMIN PRICING
━━━━━━━━━━━━━━━━━━━━━
[Admin] ──► AdminPriceNegotiations.tsx ──► admin-bookings/set-price
                                                    │
                                                    ▼
                                   ┌──────────────────────────────┐
                                   │       booking_prices         │
                                   │  admin_price = $XXX          │
                                   │  locked = true               │
                                   │  ─────────────────────────── │
                                   │       bookings               │
                                   │  status = 'awaiting_payment' │
                                   │  payment_status = 'pending'  │
                                   │  total_price = $XXX          │
                                   └──────────────────────────────┘
                                                    │
                                                    ▼
                                   [Notification sent to user]

STEP 3: PAYMENT ELIGIBILITY CHECK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Frontend] ──► paymentGuardService.canPayForBooking()
                        │
                        ▼
               ┌──────────────────────────────────────┐
               │     v_booking_payment_guard VIEW     │
               │  ─────────────────────────────────── │
               │  can_pay = true WHEN:                │
               │    • locked = true                   │
               │    • admin_price IS NOT NULL         │
               │    • status IN ('awaiting_payment',  │
               │                  'approved')         │
               │    • payment_status <> 'paid'        │
               └──────────────────────────────────────┘

STEP 4: PAYMENT PAGE
━━━━━━━━━━━━━━━━━━━━
[User] ──► EnhancedPayment.tsx
                │
                ├─► Reads price from v_booking_payment_guard (NOT from state)
                │
                └─► Payment Methods:
                        • Cash on Service
                        • Bank Transfer (with receipt upload)
                        • Credit Card (future: Stripe)
                                │
                                ▼
                      verify-payment Edge Function
                                │
                                ▼
                      ┌──────────────────────┐
                      │      bookings        │
                      │ payment_status =     │
                      │  'pending_verification'
                      └──────────────────────┘

STEP 5: PAYMENT VERIFICATION (Admin)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Admin] ──► verify-payment/:id/confirm
                      │
                      ▼
            ┌──────────────────────┐
            │      bookings        │
            │ status = 'paid'      │
            │ payment_status =     │
            │   'paid'             │
            │ final_paid_amount =  │
            │   $XXX               │
            └──────────────────────┘
                      │
                      ▼
            [Notification to user: Payment Confirmed]
```

---

## Database Schema (Relevant Tables)

### `bookings` table
| Column | Type | Purpose |
|--------|------|---------|
| status | text | Workflow state (under_review → awaiting_payment → paid) |
| payment_status | text | Payment state (pending → pending_verification → paid) |
| total_price | numeric | Synced from booking_prices.admin_price |
| final_paid_amount | numeric | Actual amount paid (set on verification) |

### `booking_prices` table (SINGLE SOURCE OF TRUTH for pricing)
| Column | Type | Purpose |
|--------|------|---------|
| admin_price | numeric | **THE PRICE** - Set by admin only |
| locked | boolean | When true, price is final and payment enabled |
| amount | numeric | Legacy - synced with admin_price |

### `v_booking_payment_guard` view (SECURITY GATE)
| Column | Type | Purpose |
|--------|------|---------|
| booking_id | uuid | Reference to booking |
| approved_price | numeric | Mirrors admin_price |
| locked | boolean | Mirrors booking_prices.locked |
| can_pay | boolean | **THE GATE** - Computed eligibility |

---

## Edge Functions

| Function | Method | Purpose |
|----------|--------|---------|
| `create-booking` | POST | Create new booking (status=under_review) |
| `admin-bookings/set-price` | POST | Admin sets/locks price |
| `admin-bookings/unlock-price` | POST | Admin unlocks for editing |
| `prepare-payment` | GET | Get payment details (reads from booking_prices) |
| `verify-payment` | POST | User submits payment |
| `verify-payment/:id/confirm` | POST | Admin confirms payment |

---

## Validation Rules

### 1. Price Validation (admin-bookings/set-price)
- Price must be > 0
- Price must be ≤ $100,000
- Status must be in PRICE_EDITABLE_STATUSES
- Price must not already be locked

### 2. Payment Eligibility (v_booking_payment_guard)
```sql
can_pay = true WHEN:
  locked = true 
  AND admin_price IS NOT NULL 
  AND status IN ('awaiting_payment', 'approved')
  AND payment_status <> 'paid'
```

### 3. User Price Injection Prevention
- User NEVER submits price
- create-booking sets total_price = NULL
- Frontend reads price from v_booking_payment_guard, NOT from state
- prepare-payment reads from booking_prices

---

## Failure Scenarios & Fixes

| Scenario | Cause | Fix |
|----------|-------|-----|
| User sees "Awaiting Price" but price was set | price not locked | Admin must lock price via set-price |
| Payment button disabled | can_pay = false | Check: locked=true, status=awaiting_payment |
| Duplicate payment | Race condition | Check payment_status before processing |
| Price mismatch on payment | Stale state | Frontend reads from view, not cache |
| User tries to bypass price | Direct API call | verify-payment reads from booking_prices |

---

## Security Controls

1. **RLS on booking_prices** - Only admins can write
2. **v_booking_payment_guard** - security_invoker = true
3. **Edge Function auth** - requireAdmin for pricing endpoints
4. **Ownership check** - verify-payment checks user_id

---

## Frontend Components

| Component | Purpose |
|-----------|---------|
| `EnhancedBooking.tsx` | Service selection + booking creation |
| `EnhancedConfirmation.tsx` | Post-booking status display |
| `EnhancedPayment.tsx` | **UNIFIED** payment page for all services |
| `paymentGuardService.ts` | Frontend service to check can_pay |

---

## Status Transitions

```
BOOKING STATUS:
under_review → awaiting_payment → paid → in_progress → completed
             ↘ rejected
             ↘ cancelled

PAYMENT STATUS:
pending → pending_verification → paid
        ↘ failed
```

---

## Mobile Compatibility

- No redirects in Edge Functions
- All responses are JSON
- Real-time updates via Supabase subscriptions
- Currency conversion on client side
