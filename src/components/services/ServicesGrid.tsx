import React, { useEffect, useState } from 'react';
import { ServiceCard } from './ServiceCard';
import { Car, Building2, Ticket, UserCheck, LucideIcon, Loader2 } from 'lucide-react';
import { getServices, ServiceData, getPricingText } from '@/services/servicesService';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t, isRTL } = useLanguage();
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
    : services.filter(service => service.type === activeCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (filteredServices.length === 0) {
    return (
      <div className={`text-center py-12 text-muted-foreground ${isRTL ? 'rtl' : ''}`}>
        {t('services.noServicesInCategory')}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 animate-slide-up animation-delay-400 px-4 sm:px-0 ${isRTL ? 'rtl' : ''}`}>
      {filteredServices.map((service, index) => (
        <ServiceCard
          key={service.id}
          service={service}
          icon={ICONS[service.type] || Car}
          pricing={getPricingText(service, t)}
          index={index}
        />
      ))}
    </div>
  );
};
