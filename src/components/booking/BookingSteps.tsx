
import React from 'react';
import { CheckCircle, Circle, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/EnhancedLanguageContext';

interface BookingStepsProps {
  currentStep: number;
  serviceType: string;
}

export const BookingSteps: React.FC<BookingStepsProps> = ({ currentStep, serviceType }) => {
  const { t } = useLanguage();

  const steps = [
    { id: 1, title: t('selectService'), completed: !!serviceType },
    { id: 2, title: t('serviceDetails'), completed: currentStep > 2 },
    { id: 3, title: t('contactInfo'), completed: currentStep > 3 },
    { id: 4, title: t('payment'), completed: false }
  ];

  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
              step.completed || currentStep >= step.id
                ? 'bg-primary border-primary text-primary-foreground'
                : 'border-slate-300 text-slate-500'
            }`}>
              {step.completed ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <span className="text-sm font-medium">{step.id}</span>
              )}
            </div>
            <span className={`ml-2 text-sm font-medium ${
              step.completed || currentStep >= step.id
                ? 'text-primary'
                : 'text-slate-500'
            }`}>
              {step.title}
            </span>
          </div>
          {index < steps.length - 1 && (
            <ArrowRight className="w-4 h-4 mx-4 text-slate-400" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
