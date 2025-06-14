
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
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 liquid-glass border-0 h-auto p-2 rounded-2xl">
          {categories.map((category) => (
            <TabsTrigger
              key={category.id}
              value={category.id}
              className="text-white data-[state=active]:liquid-glass-button data-[state=active]:text-white text-xs sm:text-sm py-3 px-2 sm:px-3 rounded-xl transition-all duration-300 hover-glass"
            >
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
};
