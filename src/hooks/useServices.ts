/**
 * Centralized Services Hook
 * Single source of truth for all service data across the application.
 * Fetches services from Supabase and provides consistent access.
 */

import { useState, useEffect, useMemo } from 'react';
import { getServices, type ServiceData, getLocalizedServiceName, getLocalizedServiceDescription } from '@/services/servicesService';
import { useLanguage } from '@/contexts/LanguageContext';

interface UseServicesReturn {
  services: ServiceData[];
  serviceMap: Map<string, ServiceData>;
  loading: boolean;
  error: string | null;
  getServiceByType: (type: string) => ServiceData | undefined;
  getServiceById: (id: string) => ServiceData | undefined;
  getServiceName: (typeOrId: string) => string;
  getServiceDescription: (typeOrId: string) => string;
  getServicePrice: (typeOrId: string) => number | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for centralized service data access.
 * Use this throughout the application for consistent service resolution.
 */
export function useServices(): UseServicesReturn {
  const { language } = useLanguage();
  const [services, setServices] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create lookup maps for O(1) access
  const { serviceMap, idMap } = useMemo(() => {
    const byType = new Map<string, ServiceData>();
    const byId = new Map<string, ServiceData>();
    
    services.forEach(service => {
      // Primary lookup by type
      if (!byType.has(service.type)) {
        byType.set(service.type, service);
      }
      // Also by ID for direct resolution
      byId.set(service.id, service);
    });
    
    return { serviceMap: byType, idMap: byId };
  }, [services]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getServices();
      setServices(data);
    } catch (err) {
      console.error('Failed to load services:', err);
      setError('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const getServiceByType = (type: string): ServiceData | undefined => {
    return serviceMap.get(type);
  };

  const getServiceById = (id: string): ServiceData | undefined => {
    return idMap.get(id);
  };

  const getServiceName = (typeOrId: string): string => {
    const service = serviceMap.get(typeOrId) || idMap.get(typeOrId);
    if (!service) return typeOrId; // Return raw type if not found
    return getLocalizedServiceName(service, language);
  };

  const getServiceDescription = (typeOrId: string): string => {
    const service = serviceMap.get(typeOrId) || idMap.get(typeOrId);
    if (!service) return '';
    return getLocalizedServiceDescription(service, language);
  };

  const getServicePrice = (typeOrId: string): number | null => {
    const service = serviceMap.get(typeOrId) || idMap.get(typeOrId);
    return service?.base_price ?? null;
  };

  return {
    services,
    serviceMap,
    loading,
    error,
    getServiceByType,
    getServiceById,
    getServiceName,
    getServiceDescription,
    getServicePrice,
    refetch: fetchServices
  };
}

/**
 * Service type translation key mapping.
 * Returns consistent translation keys for service types.
 */
export function getServiceTypeLabel(serviceType: string): string {
  const labelMap: Record<string, string> = {
    'Driver': 'services.transportation',
    'Transportation': 'services.transportation',
    'Accommodation': 'services.accommodation',
    'Hotels': 'services.accommodation',
    'Events': 'services.events',
    'Events & Entertainment': 'services.events',
    'Guide': 'services.guide',
    'Custom Trips': 'services.customTrips'
  };
  
  return labelMap[serviceType] || `services.${serviceType.toLowerCase()}`;
}
