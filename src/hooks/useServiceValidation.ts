import { useToast } from '@/hooks/use-toast';
import { 
  driverSchema,
  accommodationSchema,
  eventsSchema,
  guideSchema, // Now exported from central location
  // Legacy imports for backward compatibility
  transportationSchema, 
  hotelSchema, 
  customTripSchema 
} from '@/lib/validationSchemas';

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
