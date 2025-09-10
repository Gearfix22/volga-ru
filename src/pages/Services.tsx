
import React, { useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { ServicesHeader } from '@/components/services/ServicesHeader';
import { ServicesTabs } from '@/components/services/ServicesTabs';
import { ServicesGrid } from '@/components/services/ServicesGrid';

const Services = () => {
  const [activeCategory, setActiveCategory] = useState('all');

  return (
    <PageContainer>
      <ServicesHeader />
      <ServicesTabs activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
      <ServicesGrid activeCategory={activeCategory} />
    </PageContainer>
  );
};

export default Services;
