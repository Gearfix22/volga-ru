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

// Service Details Schemas
export const transportationSchema = z.object({
  pickup: z
    .string()
    .trim()
    .min(3, { message: "Pickup location must be at least 3 characters" })
    .max(200, { message: "Pickup location must be less than 200 characters" }),
  dropoff: z
    .string()
    .trim()
    .min(3, { message: "Dropoff location must be at least 3 characters" })
    .max(200, { message: "Dropoff location must be less than 200 characters" }),
  date: z
    .string()
    .refine((date) => new Date(date) >= new Date(new Date().setHours(0, 0, 0, 0)), {
      message: "Date must be today or in the future",
    }),
  time: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Invalid time format" }),
  vehicleType: z
    .enum(['economy', 'comfort', 'business', 'minivan', 'bus'], {
      errorMap: () => ({ message: "Please select a valid vehicle type" }),
    }),
  passengers: z
    .string()
    .refine((val) => {
      const num = parseInt(val);
      return !isNaN(num) && num >= 1 && num <= 50;
    }, { message: "Number of passengers must be between 1 and 50" })
    .optional()
    .or(z.literal('')),
});

export const hotelSchema = z.object({
  city: z
    .string()
    .trim()
    .min(2, { message: "City name must be at least 2 characters" })
    .max(100, { message: "City name must be less than 100 characters" }),
  hotel: z
    .string()
    .trim()
    .max(200, { message: "Hotel name must be less than 200 characters" })
    .optional()
    .or(z.literal('')),
  checkin: z
    .string()
    .refine((date) => new Date(date) >= new Date(new Date().setHours(0, 0, 0, 0)), {
      message: "Check-in date must be today or in the future",
    }),
  checkout: z
    .string()
    .refine((date) => new Date(date) >= new Date(new Date().setHours(0, 0, 0, 0)), {
      message: "Check-out date must be today or in the future",
    }),
  roomType: z
    .enum(['standard', 'deluxe', 'suite', 'family', 'presidential'], {
      errorMap: () => ({ message: "Please select a valid room type" }),
    }),
  guests: z
    .string()
    .refine((val) => {
      const num = parseInt(val);
      return !isNaN(num) && num >= 1 && num <= 20;
    }, { message: "Number of guests must be between 1 and 20" })
    .optional()
    .or(z.literal('')),
  specialRequests: z
    .string()
    .trim()
    .max(500, { message: "Special requests must be less than 500 characters" })
    .optional()
    .or(z.literal('')),
}).refine((data) => new Date(data.checkout) > new Date(data.checkin), {
  message: "Check-out date must be after check-in date",
  path: ["checkout"],
});

export const eventSchema = z.object({
  eventName: z
    .string()
    .trim()
    .min(3, { message: "Event name must be at least 3 characters" })
    .max(200, { message: "Event name must be less than 200 characters" }),
  eventLocation: z
    .string()
    .trim()
    .min(3, { message: "Event location must be at least 3 characters" })
    .max(200, { message: "Event location must be less than 200 characters" }),
  eventDate: z
    .string()
    .refine((date) => new Date(date) >= new Date(new Date().setHours(0, 0, 0, 0)), {
      message: "Event date must be today or in the future",
    }),
  tickets: z
    .string()
    .refine((val) => {
      const num = parseInt(val);
      return !isNaN(num) && num >= 1 && num <= 100;
    }, { message: "Number of tickets must be between 1 and 100" }),
  ticketType: z
    .enum(['general', 'vip', 'premium', 'backstage'], {
      errorMap: () => ({ message: "Please select a valid ticket type" }),
    })
    .optional()
    .or(z.literal('')),
});

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
