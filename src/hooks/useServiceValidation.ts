import { useToast } from '@/hooks/use-toast';
import { 
  driverSchema,
  accommodationSchema,
  eventsSchema,
  // Legacy imports for backward compatibility
  transportationSchema, 
  hotelSchema, 
  customTripSchema 
} from '@/lib/validationSchemas';
import { z } from 'zod';

// Guide service validation schema
const guideSchema = z.object({
  tourArea: z.string().min(2, { message: "Tour area is required" }),
  tourDate: z.string().refine((date) => new Date(date) >= new Date(new Date().setHours(0, 0, 0, 0)), {
    message: "Tour date must be today or in the future",
  }),
  tourStartTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Invalid time format" }),
  tourDurationHours: z.number().min(1).max(12).optional().default(2),
  guideLanguage: z.string().optional().default('en'),
  groupSize: z.number().min(1).max(50).optional().default(1),
  specialInterests: z.string().max(500).optional().or(z.literal('')),
});

export const useServiceValidation = () => {
  const { toast } = useToast();

  const validateServiceDetails = (serviceType: string, details: any): boolean => {
    let schema;
    
    switch (serviceType) {
      // Current service types
      case 'Driver':
        schema = driverSchema;
        break;
      case 'Accommodation':
        schema = accommodationSchema;
        break;
      case 'Events':
        schema = eventsSchema;
        break;
      case 'Guide':
      case 'tourist_guide':
        schema = guideSchema;
        break;
      // Legacy service types (backward compatibility)
      case 'Transportation':
        schema = transportationSchema;
        break;
      case 'Hotels':
        schema = hotelSchema;
        break;
      case 'Custom Trips':
        schema = customTripSchema;
        break;
      default:
        // Allow unknown types to pass (for flexibility)
        return true;
    }

    const validation = schema.safeParse(details);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast({
        title: 'Validation Error',
        description: firstError.message,
        variant: 'destructive'
      });
      return false;
    }

    return true;
  };

  return { validateServiceDetails };
};
