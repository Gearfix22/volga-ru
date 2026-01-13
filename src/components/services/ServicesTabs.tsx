import React, { useEffect, useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getServiceCategoriesDynamic, getServiceCategories } from '@/services/servicesService';

interface ServicesTabsProps {
  activeCategory: string;
  setActiveCategory: (category: string) => void;
}

export const ServicesTabs: React.FC<ServicesTabsProps> = ({ activeCategory, setActiveCategory }) => {
  const [categories, setCategories] = useState(getServiceCategories()); // Start with fallback
  
  // Fetch dynamic categories from database
  useEffect(() => {
    const loadCategories = async () => {
      const dynamicCategories = await getServiceCategoriesDynamic();
      if (dynamicCategories.length > 1) {
        setCategories(dynamicCategories);
      }
    };
    loadCategories();
  }, []);
  return (
    <nav className="flex justify-center mb-4 sm:mb-6 lg:mb-8 animate-slide-up animation-delay-200 px-1 sm:px-2" role="navigation" aria-label="Service categories">
      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full max-w-3xl">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 coastal-glass border-white/20 h-auto p-0.5 gap-0.5 sm:gap-1">
          {categories.map((category) => (
            <TabsTrigger
              key={category.id}
              value={category.id}
              className="text-white data-[state=active]:bg-brand-primary data-[state=active]:text-white text-xs sm:text-sm lg:text-base py-1.5 sm:py-2 px-1 sm:px-2 lg:px-3 hover:bg-white/10 transition-all duration-200 rounded min-h-[36px] sm:min-h-[40px] focus:ring-2 focus:ring-coastal-blue focus:outline-none"
              aria-label={`Filter services by ${category.label}`}
            >
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </nav>
  );
};
