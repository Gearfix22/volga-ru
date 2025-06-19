
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
      title: t('luxuryTransport'),
      description: t('luxuryTransportDesc'),
      icon: Car,
      image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop',
      features: [t('professionalDrivers'), t('premiumVehicles'), t('airportTransfers')]
    },
    {
      id: 'luxury-hotels',
      category: 'hotels',
      title: t('luxuryHotels'),
      description: t('luxuryHotelsDesc'),
      icon: Hotel,
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
      features: [t('fiveStarHotels'), t('primeLocations'), t('conciergeService')]
    },
    {
      id: 'midrange-hotels',
      category: 'hotels',
      title: t('midrangeHotels'),
      description: t('midrangeHotelsDesc'),
      icon: Hotel,
      image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=300&fit=crop',
      features: [t('comfortableStay'), t('greatValue'), t('modernAmenities')]
    },
    {
      id: 'cultural-events',
      category: 'events',
      title: t('culturalEvents'),
      description: t('culturalEventsDesc'),
      icon: CalendarDays,
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
      features: [t('exclusiveAccess'), t('culturalShows'), t('expertGuides')]
    },
    {
      id: 'group-transport',
      category: 'transportation',
      title: t('groupTransport'),
      description: t('groupTransportDesc'),
      icon: Car,
      image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=300&fit=crop',
      features: [t('largeGroups'), t('comfortableBuses'), t('flexibleSchedules')]
    },
    {
      id: 'custom-tours',
      category: 'customTrips',
      title: t('customTours'),
      description: t('customToursDesc'),
      icon: CalendarDays,
      image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop',
      features: [t('personalizedItinerary'), t('privateGuide'), t('flexibleDuration')]
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
