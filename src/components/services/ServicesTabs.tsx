
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
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 coastal-glass border-white/20 h-auto p-1">
          {categories.map((category) => (
            <TabsTrigger
              key={category.id}
              value={category.id}
              className="text-white data-[state=active]:bg-coastal-blue data-[state=active]:text-white text-xs sm:text-sm py-2 px-2 sm:px-3 hover:bg-white/10 transition-all duration-200"
            >
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
};
