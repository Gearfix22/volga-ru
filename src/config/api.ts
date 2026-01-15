/**
 * API Configuration
 * 
 * This file centralizes all API endpoint configurations.
 * The backend is entirely Supabase Edge Functions - no Netlify backend dependency.
 */

// Supabase project configuration
export const SUPABASE_PROJECT_ID = 'tujborgbqzmcwolntvas';
export const SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`;
export const SUPABASE_FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

// Edge Function endpoints
export const API_ENDPOINTS = {
  // Authentication
  adminLogin: `${SUPABASE_FUNCTIONS_URL}/admin-login`,
  driverLogin: `${SUPABASE_FUNCTIONS_URL}/driver-login`,
  guideLogin: `${SUPABASE_FUNCTIONS_URL}/guide-login`,
  
  // Admin operations
  adminBookings: `${SUPABASE_FUNCTIONS_URL}/admin-bookings`,
  adminServices: `${SUPABASE_FUNCTIONS_URL}/admin-services`,
  
  // User operations
  userBookings: `${SUPABASE_FUNCTIONS_URL}/user-bookings`,
  createBooking: `${SUPABASE_FUNCTIONS_URL}/create-booking`,
  confirmBooking: `${SUPABASE_FUNCTIONS_URL}/confirm-booking`,
  
  // Payment operations (mobile-compatible, no redirects)
  preparePayment: `${SUPABASE_FUNCTIONS_URL}/prepare-payment`,
  verifyPayment: `${SUPABASE_FUNCTIONS_URL}/verify-payment`,
  
  // Notifications
  notifications: `${SUPABASE_FUNCTIONS_URL}/notifications`,
  
  // Resource management
  manageDrivers: `${SUPABASE_FUNCTIONS_URL}/manage-drivers`,
  manageGuides: `${SUPABASE_FUNCTIONS_URL}/manage-guides`,
  
  // Utilities
  sendBookingEmail: `${SUPABASE_FUNCTIONS_URL}/send-booking-email`,
  getMapboxToken: `${SUPABASE_FUNCTIONS_URL}/get-mapbox-token`,
  aiTouristGuide: `${SUPABASE_FUNCTIONS_URL}/ai-tourist-guide`,
} as const;

// Helper to build endpoint URLs with path parameters
export function buildEndpoint(base: string, ...paths: string[]): string {
  return [base, ...paths].join('/');
}

// Helper to build endpoint URLs with query parameters
export function buildEndpointWithParams(base: string, params: Record<string, string | undefined>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, value);
    }
  });
  const queryString = searchParams.toString();
  return queryString ? `${base}?${queryString}` : base;
}
