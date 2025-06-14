
import React from 'react';
import { Check } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface Step {
  id: string;
  title: string;
  path: string;
}

const steps: Step[] = [
  { id: 'services', title: 'Select Service', path: '/services' },
  { id: 'booking', title: 'Booking Details', path: '/booking' },
  { id: 'payment', title: 'Payment', path: '/payment' },
  { id: 'confirmation', title: 'Confirmation', path: '/booking-confirmation' }
];

export const BookingProgress: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const getCurrentStepIndex = () => {
    const currentStep = steps.findIndex(step => step.path === currentPath);
    return currentStep >= 0 ? currentStep : 0;
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index < currentStepIndex
                    ? 'bg-green-500 text-white'
                    : index === currentStepIndex
                    ? 'bg-russian-gold text-white'
                    : 'bg-white/20 text-white/60'
                }`}
              >
                {index < currentStepIndex ? (
                  <Check className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`text-xs mt-1 ${
                  index <= currentStepIndex ? 'text-white' : 'text-white/60'
                }`}
              >
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-0.5 w-12 mx-2 ${
                  index < currentStepIndex ? 'bg-green-500' : 'bg-white/20'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
