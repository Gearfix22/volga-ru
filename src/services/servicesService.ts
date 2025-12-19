import { supabase } from '@/integrations/supabase/client';

// Service types - single source of truth
export type ServiceType = 'Driver' | 'Accommodation' | 'Events';

export interface ServiceData {
  id: ServiceType;
  category: ServiceType;
  title: string;
  description: string;
  features: string[];
  pricing: string;
  hasFixedPrice: boolean;
  minPrice: number; // Minimum price (admin only for Accommodation/Events)
  image: string;
}

// Default services configuration - loaded once, then synced with Supabase
const DEFAULT_SERVICES: ServiceData[] = [
  {
    id: 'Driver',
    category: 'Driver',
    title: 'Transportation (Driver)',
    description: 'Professional driver service for one-way or round trips. Airport transfers, city transportation, and more.',
    features: ['One-way or Round Trip', 'Professional Drivers', 'Airport Transfers', 'City Transportation'],
    pricing: 'From $50 USD',
    hasFixedPrice: true,
    minPrice: 50,
    image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop'
  },
  {
    id: 'Accommodation',
    category: 'Accommodation',
    title: 'Accommodation Booking',
    description: 'Hotels, apartments, and lodging reservations. Submit your requirements and receive a custom quote from admin.',
    features: ['Hotels & Resorts', 'Apartments', 'Guest Houses', 'Custom Requests'],
    pricing: 'Quote by admin',
    hasFixedPrice: false,
    minPrice: 1000, // Admin minimum starting value
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop'
  },
  {
    id: 'Events',
    category: 'Events',
    title: 'Activities & Events',
    description: 'Tickets and experiences for attractions, shows, and entertainment. Circus, museums, city tours, and more.',
    features: ['Circus & Shows', 'Museums & Parks', 'City Tours', 'Opera & Theater'],
    pricing: 'Quote by admin',
    hasFixedPrice: false,
    minPrice: 100, // Admin minimum starting value
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop'
  }
];

// Cache for services
let servicesCache: ServiceData[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60000; // 1 minute cache

// Get all services - from cache or default
export const getServices = async (): Promise<ServiceData[]> => {
  const now = Date.now();
  
  // Return cached if valid
  if (servicesCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return servicesCache;
  }
  
  // Try to fetch from Supabase services table
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .in('type', ['Driver', 'Accommodation', 'Events']);
    
    if (!error && data && data.length > 0) {
      // Map database services to our format
      servicesCache = data.map(s => {
        const defaultService = DEFAULT_SERVICES.find(d => d.id === s.type);
        return {
          id: s.type as ServiceType,
          category: s.type as ServiceType,
          title: s.name,
          description: s.description || defaultService?.description || '',
          features: defaultService?.features || [],
          pricing: s.type === 'Driver' ? `From $${s.base_price || 50} USD` : 'Quote by admin',
          hasFixedPrice: s.type === 'Driver',
          minPrice: s.base_price || defaultService?.minPrice || 0,
          image: defaultService?.image || ''
        };
      });
    } else {
      // Use defaults
      servicesCache = DEFAULT_SERVICES;
    }
  } catch (err) {
    console.error('Error fetching services:', err);
    servicesCache = DEFAULT_SERVICES;
  }
  
  cacheTimestamp = now;
  return servicesCache;
};

// Invalidate cache (call after admin updates)
export const invalidateServicesCache = () => {
  servicesCache = null;
  cacheTimestamp = 0;
};

// Get single service by ID
export const getServiceById = async (id: ServiceType): Promise<ServiceData | null> => {
  const services = await getServices();
  return services.find(s => s.id === id) || null;
};

// Get service categories for tabs
export const getServiceCategories = (): { id: string; label: string }[] => {
  return [
    { id: 'all', label: 'All Services' },
    { id: 'Driver', label: 'Transportation' },
    { id: 'Accommodation', label: 'Accommodation' },
    { id: 'Events', label: 'Activities & Events' }
  ];
};
