
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
    <div className="flex justify-center mb-12 animate-slide-up animation-delay-200">
      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full max-w-4xl">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 bg-white/10 backdrop-blur-sm border-white/20">
          {categories.map((category) => (
            <TabsTrigger
              key={category.id}
              value={category.id}
              className="text-white data-[state=active]:bg-volga-logo-blue data-[state=active]:text-white"
            >
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
};
