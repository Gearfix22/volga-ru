
import React from 'react';
import { ServiceCard } from './ServiceCard';
import { Car, Building2, Ticket } from 'lucide-react';

interface ServicesGridProps {
  activeCategory: string;
}

// Single source of truth - 3 service types only
const SERVICES = [
  {
    id: 'Driver',
    category: 'Driver',
    title: 'Driver Only Booking',
    description: 'Professional driver service for one-way or round trips. Airport transfers, city transportation, and more.',
    icon: Car,
    image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop',
    features: ['One-way or Round Trip', 'Professional Drivers', 'Airport Transfers', 'City Transportation'],
    pricing: 'From $50 USD',
    hasFixedPrice: true
  },
  {
    id: 'Accommodation',
    category: 'Accommodation',
    title: 'Accommodation Booking',
    description: 'Hotels, apartments, and lodging reservations. Submit your requirements and receive a custom quote.',
    icon: Building2,
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
    features: ['Hotels & Resorts', 'Apartments', 'Guest Houses', 'Custom Requests'],
    pricing: 'Price set by admin',
    hasFixedPrice: false
  },
  {
    id: 'Events',
    category: 'Events',
    title: 'Events & Entertainment',
    description: 'Tickets and experiences for attractions, shows, and entertainment. Circus, museums, city tours, and more.',
    icon: Ticket,
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
    features: ['Circus & Shows', 'Museums & Parks', 'City Tours', 'Opera & Theater'],
    pricing: 'Price set by admin',
    hasFixedPrice: false
  }
];

export const ServicesGrid: React.FC<ServicesGridProps> = ({ activeCategory }) => {
  const filteredServices = activeCategory === 'all' 
    ? SERVICES 
    : SERVICES.filter(service => service.category === activeCategory);

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
