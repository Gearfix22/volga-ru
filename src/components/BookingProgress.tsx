
import React from 'react';
import { Check, Lock } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface Step {
  id: string;
  title: string;
  path: string;
  requiresAuth: boolean;
}

const steps: Step[] = [
  { id: 'services', title: 'Select Service', path: '/services', requiresAuth: false },
  { id: 'booking', title: 'Booking Details', path: '/booking', requiresAuth: true },
  { id: 'payment', title: 'Payment', path: '/payment', requiresAuth: true },
  { id: 'confirmation', title: 'Confirmation', path: '/booking-confirmation', requiresAuth: true }
];

export const BookingProgress: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const currentPath = location.pathname;

  const getCurrentStepIndex = () => {
    const currentStep = steps.findIndex(step => step.path === currentPath);
    return currentStep >= 0 ? currentStep : 0;
  };

  const currentStepIndex = getCurrentStepIndex();

  const getStepStatus = (stepIndex: number) => {
    const step = steps[stepIndex];
    
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) {
      if (step.requiresAuth && !user) return 'locked';
      return 'current';
    }
    if (step.requiresAuth && !user) return 'locked';
    return 'upcoming';
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const status = getStepStatus(index);
          
          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    status === 'completed'
                      ? 'bg-green-500 text-white'
                      : status === 'current'
                      ? 'bg-russian-gold text-white'
                      : status === 'locked'
                      ? 'bg-red-500/70 text-white'
                      : 'bg-white/20 text-white/60'
                  }`}
                >
                  {status === 'completed' ? (
                    <Check className="h-4 w-4" />
                  ) : status === 'locked' ? (
                    <Lock className="h-3 w-3" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`text-xs mt-1 text-center ${
                    status === 'completed' || status === 'current' ? 'text-white' : 
                    status === 'locked' ? 'text-red-300' : 'text-white/60'
                  }`}
                >
                  {step.title}
                  {status === 'locked' && (
                    <div className="text-xs text-red-200 mt-1">Login Required</div>
                  )}
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
          );
        })}
      </div>
      
      {!user && currentPath !== '/services' && (
        <div className="mt-4 text-center">
          <p className="text-white/80 text-sm">
            Please sign in to continue with your booking
          </p>
        </div>
      )}
    </div>
  );
};
