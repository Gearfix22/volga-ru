import { useToast } from '@/hooks/use-toast';
import { 
  transportationSchema, 
  hotelSchema, 
  eventSchema, 
  customTripSchema 
} from '@/lib/validationSchemas';

export const useServiceValidation = () => {
  const { toast } = useToast();

  const validateServiceDetails = (serviceType: string, details: any): boolean => {
    let schema;
    
    switch (serviceType) {
      case 'Transportation':
        schema = transportationSchema;
        break;
      case 'Hotels':
        schema = hotelSchema;
        break;
      case 'Events':
        schema = eventSchema;
        break;
      case 'Custom Trips':
        schema = customTripSchema;
        break;
      default:
        return true; // No validation for unknown service types
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
