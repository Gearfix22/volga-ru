import { z } from 'zod';

// Authentication Schemas
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: "Invalid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(128, { message: "Password must be less than 128 characters" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/\d/, { message: "Password must contain at least one number" }),
});

export const signupSchema = loginSchema.extend({
  fullName: z
    .string()
    .trim()
    .min(2, { message: "Full name must be at least 2 characters" })
    .max(100, { message: "Full name must be less than 100 characters" })
    .regex(/^[a-zA-Z\s'-]+$/, { message: "Full name can only contain letters, spaces, hyphens, and apostrophes" }),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[1-9]\d{7,14}$/, { message: "Invalid phone number format. Use international format with country code (e.g., +79521234567)" })
    .min(8, { message: "Phone number must be at least 8 digits" })
    .max(20, { message: "Phone number must be less than 20 characters" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Support & Contact Schemas
export const supportRequestSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(3, { message: "Subject must be at least 3 characters" })
    .max(200, { message: "Subject must be less than 200 characters" }),
  message: z
    .string()
    .trim()
    .min(10, { message: "Message must be at least 10 characters" })
    .max(2000, { message: "Message must be less than 2000 characters" }),
});

// Payment Schemas
export const bankTransferSchema = z.object({
  referenceNumber: z
    .string()
    .trim()
    .min(5, { message: "Reference number must be at least 5 characters" })
    .max(100, { message: "Reference number must be less than 100 characters" })
    .regex(/^[A-Z0-9\-]+$/i, { message: "Reference number can only contain letters, numbers, and hyphens" }),
  transferDate: z
    .string()
    .refine((date) => {
      const d = new Date(date);
      return d <= new Date() && d >= new Date('2020-01-01');
    }, { message: "Invalid transfer date" }),
  notes: z
    .string()
    .trim()
    .max(500, { message: "Notes must be less than 500 characters" })
    .optional()
    .or(z.literal('')),
});

// ========================================
// NEW SERVICE SCHEMAS (3 Services Only)
// ========================================

// SERVICE 1: Driver Only Booking Schema
export const driverSchema = z.object({
  tripType: z
    .enum(['one-way', 'round-trip'], {
      errorMap: () => ({ message: "Please select trip type" }),
    })
    .optional()
    .default('one-way'),
  pickupLocation: z
    .string()
    .trim()
    .min(3, { message: "Pickup location must be at least 3 characters" })
    .max(200, { message: "Pickup location must be less than 200 characters" }),
  dropoffLocation: z
    .string()
    .trim()
    .min(3, { message: "Drop-off location must be at least 3 characters" })
    .max(200, { message: "Drop-off location must be less than 200 characters" }),
  pickupDate: z
    .string()
    .refine((date) => new Date(date) >= new Date(new Date().setHours(0, 0, 0, 0)), {
      message: "Pickup date must be today or in the future",
    }),
  pickupTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Invalid time format" }),
  returnDate: z
    .string()
    .optional()
    .or(z.literal('')),
  returnTime: z
    .string()
    .optional()
    .or(z.literal('')),
  vehicleType: z
    .enum(['economy', 'comfort', 'business', 'suv', 'minivan', 'van', 'bus'], {
      errorMap: () => ({ message: "Please select a valid vehicle type" }),
    }),
  passengers: z
    .string()
    .refine((val) => {
      const num = parseInt(val);
      return !isNaN(num) && num >= 1 && num <= 50;
    }, { message: "Number of passengers must be between 1 and 50" }),
  specialRequests: z
    .string()
    .trim()
    .max(500, { message: "Special requests must be less than 500 characters" })
    .optional()
    .or(z.literal('')),
});

// SERVICE 2: Accommodation Booking Schema
export const accommodationSchema = z.object({
  location: z
    .string()
    .trim()
    .min(2, { message: "Location must be at least 2 characters" })
    .max(200, { message: "Location must be less than 200 characters" }),
  checkIn: z
    .string()
    .refine((date) => new Date(date) >= new Date(new Date().setHours(0, 0, 0, 0)), {
      message: "Check-in date must be today or in the future",
    }),
  checkOut: z
    .string()
    .refine((date) => new Date(date) >= new Date(new Date().setHours(0, 0, 0, 0)), {
      message: "Check-out date must be today or in the future",
    }),
  guests: z
    .string()
    .refine((val) => {
      const num = parseInt(val);
      return !isNaN(num) && num >= 1 && num <= 20;
    }, { message: "Number of guests must be between 1 and 20" }),
  roomPreference: z
    .enum(['standard', 'deluxe', 'suite', 'family', 'apartment', 'any'], {
      errorMap: () => ({ message: "Please select a valid room preference" }),
    })
    .optional()
    .or(z.literal('')),
  specialRequests: z
    .string()
    .trim()
    .max(1000, { message: "Special requests must be less than 1000 characters" })
    .optional()
    .or(z.literal('')),
}).refine((data) => new Date(data.checkOut) > new Date(data.checkIn), {
  message: "Check-out date must be after check-in date",
  path: ["checkOut"],
});

// SERVICE 3: Events & Entertainment Schema
export const eventsSchema = z.object({
  eventType: z
    .enum(['circus', 'balloon', 'museum', 'park', 'cabin', 'city-tour', 'cable-car', 'opera', 'other'], {
      errorMap: () => ({ message: "Please select an event type" }),
    }),
  eventName: z
    .string()
    .trim()
    .max(200, { message: "Event name must be less than 200 characters" })
    .optional()
    .or(z.literal('')),
  location: z
    .string()
    .trim()
    .min(2, { message: "Location must be at least 2 characters" })
    .max(200, { message: "Location must be less than 200 characters" }),
  date: z
    .string()
    .refine((date) => new Date(date) >= new Date(new Date().setHours(0, 0, 0, 0)), {
      message: "Event date must be today or in the future",
    }),
  numberOfPeople: z
    .string()
    .refine((val) => {
      const num = parseInt(val);
      return !isNaN(num) && num >= 1 && num <= 100;
    }, { message: "Number of people must be between 1 and 100" }),
  specialRequests: z
    .string()
    .trim()
    .max(1000, { message: "Special requests must be less than 1000 characters" })
    .optional()
    .or(z.literal('')),
});

// ========================================
// LEGACY SCHEMAS (for backward compatibility)
// ========================================

export const transportationSchema = driverSchema;
export const hotelSchema = accommodationSchema;
export const eventSchema = eventsSchema;
export const customTripSchema = z.object({
  duration: z
    .enum(['1-3-days', '4-7-days', '1-2-weeks', '3-4-weeks', '1-month+'], {
      errorMap: () => ({ message: "Please select a valid duration" }),
    }),
  regions: z
    .string()
    .trim()
    .min(10, { message: "Regions description must be at least 10 characters" })
    .max(1000, { message: "Regions description must be less than 1000 characters" }),
  budget: z
    .enum(['500-1000', '1000-2500', '2500-5000', '5000-10000', '10000+'], {
      errorMap: () => ({ message: "Please select a valid budget range" }),
    })
    .optional()
    .or(z.literal('')),
  interests: z
    .array(z.string())
    .max(12, { message: "Maximum 12 interests can be selected" })
    .optional(),
  additionalInfo: z
    .string()
    .trim()
    .max(1000, { message: "Additional information must be less than 1000 characters" })
    .optional()
    .or(z.literal('')),
});
