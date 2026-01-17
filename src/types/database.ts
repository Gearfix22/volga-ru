/**
 * Database types for frontend-backend alignment
 * These types represent the actual database schema and ensure consistency
 */

import type { Json } from '@/integrations/supabase/types';

// ============================================
// USER & AUTH TYPES
// ============================================

export type UserRole = 'user' | 'admin' | 'driver' | 'guide';

export interface UserProfile {
  id: string;
  phone: string;
  phone_e164: string | null;
  full_name: string | null;
  country_code: string | null;
  dial_code: string | null;
  phone_verified: boolean | null;
  preferred_currency: string | null;
  preferred_language: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

// ============================================
// BOOKING TYPES
// ============================================

export type BookingStatusEnum = 
  | 'draft'
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'awaiting_payment'
  | 'paid'
  | 'confirmed'
  | 'assigned'
  | 'accepted'
  | 'on_trip'
  | 'on_the_way'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export type PaymentStatusEnum = 
  | 'pending'
  | 'awaiting_payment'
  | 'paid'
  | 'refunded'
  | 'failed';

export type PaymentMethodEnum = 
  | 'visa'
  | 'cash'
  | 'bank_transfer'
  | 'paypal';

// User info stored in bookings.user_info JSON column
export interface BookingUserInfo {
  fullName: string;
  email: string;
  phone: string;
  language?: string;
}

// Service details for Driver service
export interface DriverServiceDetails {
  tripType: 'one-way' | 'round-trip';
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  pickupTime: string;
  returnDate?: string;
  returnTime?: string;
  passengers: string;
  vehicleType: string;
  specialRequests?: string;
}

// Service details for Accommodation
export interface AccommodationServiceDetails {
  location: string;
  checkIn: string;
  checkOut: string;
  guests: string;
  roomPreference?: string;
  specialRequests?: string;
}

// Service details for Events
export interface EventServiceDetails {
  eventType: string;
  eventName?: string;
  location: string;
  date: string;
  numberOfPeople: string;
  specialRequests?: string;
}

// Service details for Tourist Guide
export interface GuideServiceDetails {
  location: string;
  date: string;
  duration: string;
  numberOfPeople: string;
  specialRequests?: string;
}

// Union type for all service details
export type ServiceDetailsUnion = 
  | DriverServiceDetails 
  | AccommodationServiceDetails 
  | EventServiceDetails 
  | GuideServiceDetails 
  | Record<string, unknown>;

// Booking record from database
export interface BookingRecord {
  id: string;
  user_id: string | null;
  service_type: string;
  service_id: string | null;
  status: BookingStatusEnum | string | null;
  payment_status: PaymentStatusEnum | string | null;
  payment_method: PaymentMethodEnum | string | null;
  total_price: number | null;
  final_paid_amount: number | null;
  currency: string | null;
  payment_currency: string | null;
  exchange_rate_used: number | null;
  transaction_id: string | null;
  user_info: BookingUserInfo | Json;
  service_details: ServiceDetailsUnion | Json | null;
  customer_notes: string | null;
  admin_notes: string | null;
  driver_notes: string | null;
  driver_required: boolean | null;
  assigned_driver_id: string | null;
  assigned_guide_id: string | null;
  show_driver_to_customer: boolean | null;
  driver_response: string | null;
  driver_response_at: string | null;
  requires_verification: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

// ============================================
// DRIVER & GUIDE TYPES
// ============================================

export type StaffStatus = 'active' | 'inactive' | 'suspended';

export interface DriverRecord {
  id: string;
  full_name: string;
  phone: string;
  status: StaffStatus | string;
  created_at: string;
  updated_at: string;
}

export interface GuideRecord {
  id: string;
  full_name: string;
  phone: string;
  status: StaffStatus | string;
  languages: string[] | null;
  specialization: string[] | null;
  hourly_rate: number | null;
  created_at: string | null;
  updated_at: string | null;
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export type NotificationRecipientType = 'user' | 'admin' | 'driver' | 'guide';

export interface NotificationRecord {
  id: string;
  recipient_id: string;
  recipient_type: NotificationRecipientType | string;
  booking_id: string | null;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

// ============================================
// PAYMENT TYPES
// ============================================

export interface BookingPriceRecord {
  id: string;
  booking_id: string;
  amount: number;
  admin_price: number | null;
  tax: number;
  currency: string;
  locked: boolean | null;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentGuardView {
  booking_id: string;
  user_id: string | null;
  status: string | null;
  proposed_price: number | null;
  approved_price: number | null;
  price_locked: boolean | null;
  can_pay: boolean | null;
}

// ============================================
// SERVICE TYPES
// ============================================

export type ServiceTypeEnum = 
  | 'driver'
  | 'accommodation'
  | 'events'
  | 'guide'
  | 'transportation'
  | 'hotel'
  | 'custom_trip';

export interface ServiceRecord {
  id: string;
  name: string;
  name_en: string | null;
  name_ar: string | null;
  name_ru: string | null;
  description: string | null;
  description_en: string | null;
  description_ar: string | null;
  description_ru: string | null;
  type: string;
  service_type: ServiceTypeEnum | string | null;
  base_price: number | null;
  currency: string;
  image_url: string | null;
  is_active: boolean | null;
  status: string | null;
  display_order: number | null;
  duration_minutes: number | null;
  features: string[] | null;
  availability_days: number[] | null;
  available_from: string | null;
  available_to: string | null;
  category_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// ============================================
// ADMIN TYPES
// ============================================

export type AdminPermission = 
  | 'manage_users'
  | 'manage_bookings'
  | 'manage_drivers'
  | 'manage_guides'
  | 'manage_services'
  | 'manage_payments'
  | 'view_logs'
  | 'manage_settings';

export interface AdminPermissionRecord {
  id: string;
  user_id: string;
  permissions: AdminPermission[];
  created_at: string;
  updated_at: string;
}

export interface AdminLogRecord {
  id: string;
  admin_id: string;
  action_type: string;
  target_table: string | null;
  target_id: string | null;
  payload: Json | null;
  created_at: string | null;
}

// ============================================
// CURRENCY TYPES
// ============================================

export interface CurrencyRateRecord {
  id: string;
  currency_code: string;
  symbol: string;
  rate_to_usd: number;
  updated_at: string;
  updated_by: string | null;
}

// ============================================
// HELPER TYPE GUARDS
// ============================================

export function isBookingUserInfo(value: unknown): value is BookingUserInfo {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return typeof obj.fullName === 'string' && typeof obj.email === 'string' && typeof obj.phone === 'string';
}

export function isDriverServiceDetails(value: unknown): value is DriverServiceDetails {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return 'pickupLocation' in obj && 'dropoffLocation' in obj && 'pickupDate' in obj;
}

export function isAccommodationServiceDetails(value: unknown): value is AccommodationServiceDetails {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return 'checkIn' in obj && 'checkOut' in obj && 'guests' in obj;
}

export function isEventServiceDetails(value: unknown): value is EventServiceDetails {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return 'eventType' in obj && 'date' in obj && 'numberOfPeople' in obj;
}

export function isGuideServiceDetails(value: unknown): value is GuideServiceDetails {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return 'duration' in obj && 'date' in obj && 'numberOfPeople' in obj && !('eventType' in obj);
}
