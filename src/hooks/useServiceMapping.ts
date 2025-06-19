
import { useEffect, useState } from 'react';

export const useServiceMapping = (serviceFromUrl?: string | null) => {
  const [serviceType, setServiceType] = useState('');

  useEffect(() => {
    if (serviceFromUrl) {
      const serviceMap: { [key: string]: string } = {
        'transportation': 'Transportation',
        'hotel': 'Hotels',
        'hotels': 'Hotels',
        'event': 'Events',
        'events': 'Events',
        'trip': 'Custom Trips',
        'trips': 'Custom Trips'
      };
      
      const mappedService = serviceMap[serviceFromUrl.toLowerCase()] || 
                           serviceFromUrl.charAt(0).toUpperCase() + serviceFromUrl.slice(1);
      
      setServiceType(mappedService);
      console.log(`Pre-selecting service type: ${mappedService}`);
    }
  }, [serviceFromUrl]);

  return { serviceType, setServiceType };
};
