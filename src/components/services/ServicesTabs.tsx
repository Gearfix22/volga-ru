
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ServicesTabsProps {
  activeCategory: string;
  setActiveCategory: (category: string) => void;
}

export const ServicesTabs: React.FC<ServicesTabsProps> = ({ activeCategory, setActiveCategory }) => {
  const { t } = useLanguage();

  const categories = [
    { id: 'all', label: t('allServices') },
    { id: 'transportation', label: t('transportation') },
    { id: 'hotels', label: t('hotels') },
    { id: 'events', label: t('events') },
    { id: 'customTrips', label: t('customTrips') }
  ];

  return (
    <div className="flex justify-center mb-8 sm:mb-12 animate-slide-up animation-delay-200 px-4 sm:px-0">
      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full max-w-4xl">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 glass-effect border-white/20 h-auto p-1 rounded-full">
          {categories.map((category) => (
            <TabsTrigger
              key={category.id}
              value={category.id}
              className="text-white/80 data-[state=active]:bg-ocean-500 data-[state=active]:text-white text-xs sm:text-sm py-3 px-3 sm:px-4 rounded-full transition-all duration-300 hover:text-white hover:bg-white/10"
            >
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
};
