/**
 * Review Prompt Provider
 * Manages review prompts at the app level
 */

import { createContext, useContext, ReactNode } from 'react';
import { useReviewPrompts } from '@/hooks/useReviewPrompts';
import { ReviewModal } from './ReviewModal';

interface ReviewPromptContextValue {
  pendingCount: number;
  refetch: () => void;
}

const ReviewPromptContext = createContext<ReviewPromptContextValue>({
  pendingCount: 0,
  refetch: () => {}
});

export const useReviewPromptContext = () => useContext(ReviewPromptContext);

interface ReviewPromptProviderProps {
  children: ReactNode;
}

export function ReviewPromptProvider({ children }: ReviewPromptProviderProps) {
  const {
    pendingPrompts,
    currentPrompt,
    showReviewModal,
    setShowReviewModal,
    dismissCurrent,
    completeCurrentReview,
    refetch
  } = useReviewPrompts();

  return (
    <ReviewPromptContext.Provider 
      value={{ 
        pendingCount: pendingPrompts.length,
        refetch 
      }}
    >
      {children}
      
      {/* Review Modal */}
      {currentPrompt && (
        <ReviewModal
          open={showReviewModal}
          onOpenChange={setShowReviewModal}
          bookingId={currentPrompt.prompt.booking_id}
          serviceType={currentPrompt.booking.service_type}
          hasDriver={!!currentPrompt.booking.assigned_driver_id}
          hasGuide={!!currentPrompt.booking.assigned_guide_id}
          onComplete={completeCurrentReview}
          onDismiss={dismissCurrent}
        />
      )}
    </ReviewPromptContext.Provider>
  );
}
