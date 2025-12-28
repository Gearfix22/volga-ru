import React, { useEffect, useState } from 'react';
import { ServiceCard } from './ServiceCard';
import { Car, Building2, Ticket, UserCheck, LucideIcon } from 'lucide-react';
import { getServices, ServiceData } from '@/services/servicesService';
import { Loader2 } from 'lucide-react';

interface ServicesGridProps {
  activeCategory: string;
}

// Icon mapping
const ICONS: Record<string, LucideIcon> = {
  'Driver': Car,
  'Accommodation': Building2,
  'Events': Ticket,
  'Guide': UserCheck
};

export const ServicesGrid: React.FC<ServicesGridProps> = ({ activeCategory }) => {
  const [services, setServices] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadServices = async () => {
      setLoading(true);
      const data = await getServices();
      setServices(data);
      setLoading(false);
    };
    loadServices();
  }, []);

  const filteredServices = activeCategory === 'all' 
    ? services 
    : services.filter(service => service.category === activeCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 animate-slide-up animation-delay-400 px-4 sm:px-0">
      {filteredServices.map((service, index) => (
        <ServiceCard
          key={service.id}
          service={{
            ...service,
            icon: ICONS[service.id] || Car
          }}
          index={index}
        />
      ))}
    </div>
  );
};
