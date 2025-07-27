
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ServiceCard } from './ServiceCard';
import { Car, Hotel, CalendarDays } from 'lucide-react';

interface ServicesGridProps {
  activeCategory: string;
}

export const ServicesGrid: React.FC<ServicesGridProps> = ({ activeCategory }) => {
  const { t } = useLanguage();

  const services = [
    {
      id: 'luxury-transport',
      category: 'transportation',
      title: t('services.luxuryTransport'),
      description: t('services.luxuryTransportDesc'),
      icon: Car,
      image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop',
      features: [t('services.professionalDrivers'), t('services.premiumVehicles'), t('services.airportTransfers')]
    },
    {
      id: 'luxury-hotels',
      category: 'hotels',
      title: t('services.luxuryHotels'),
      description: t('services.luxuryHotelsDesc'),
      icon: Hotel,
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
      features: [t('services.fiveStarHotels'), t('services.primeLocations'), t('services.conciergeService')]
    },
    {
      id: 'midrange-hotels',
      category: 'hotels',
      title: t('services.midrangeHotels'),
      description: t('services.midrangeHotelsDesc'),
      icon: Hotel,
      image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=300&fit=crop',
      features: [t('services.comfortableStay'), t('services.greatValue'), t('services.modernAmenities')]
    },
    {
      id: 'cultural-events',
      category: 'events',
      title: t('services.culturalEvents'),
      description: t('services.culturalEventsDesc'),
      icon: CalendarDays,
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
      features: [t('services.exclusiveAccess'), t('services.culturalShows'), t('services.expertGuides')]
    },
    {
      id: 'group-transport',
      category: 'transportation',
      title: t('services.groupTransport'),
      description: t('services.groupTransportDesc'),
      icon: Car,
      image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=300&fit=crop',
      features: [t('services.largeGroups'), t('services.comfortableBuses'), t('services.flexibleSchedules')]
    },
    {
      id: 'custom-tours',
      category: 'customTrips',
      title: t('services.customTours'),
      description: t('services.customToursDesc'),
      icon: CalendarDays,
      image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop',
      features: [t('services.personalizedItinerary'), t('services.privateGuide'), t('services.flexibleDuration')]
    }
  ];

  const filteredServices = activeCategory === 'all' 
    ? services 
    : services.filter(service => service.category === activeCategory);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 animate-slide-up animation-delay-400 px-4 sm:px-0">
      {filteredServices.map((service, index) => (
        <ServiceCard
          key={service.id}
          service={service}
          index={index}
        />
      ))}
    </div>
  );
};
