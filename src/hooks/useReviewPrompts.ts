/**
 * Hook to manage review prompts for the current user
 */

import { useState, useEffect, useCallback } from 'react';
import { getPendingReviewPrompts, dismissReviewPrompt } from '@/services/reviewService';
import type { ReviewPrompt } from '@/types/review';
import { useAuth } from '@/contexts/AuthContext';

interface BookingInfo {
  id: string;
  service_type: string;
  service_details: Record<string, unknown>;
  assigned_driver_id: string | null;
  assigned_guide_id: string | null;
  created_at: string;
}

interface PendingPromptData {
  prompt: ReviewPrompt;
  booking: BookingInfo;
}

export function useReviewPrompts() {
  const { user } = useAuth();
  const [pendingPrompts, setPendingPrompts] = useState<PendingPromptData[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState<PendingPromptData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Fetch pending prompts
  const fetchPrompts = useCallback(async () => {
    if (!user) {
      setPendingPrompts([]);
      return;
    }

    setIsLoading(true);
    try {
      const prompts = await getPendingReviewPrompts();
      setPendingPrompts(prompts);
      
      // Auto-show first pending prompt
      if (prompts.length > 0 && !currentPrompt) {
        setCurrentPrompt(prompts[0]);
        setShowReviewModal(true);
      }
    } catch (error) {
      console.error('Error fetching review prompts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, currentPrompt]);

  // Initial fetch and periodic check
  useEffect(() => {
    fetchPrompts();
    
    // Check for new prompts every 5 minutes
    const interval = setInterval(fetchPrompts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchPrompts]);

  // Dismiss current prompt
  const dismissCurrent = useCallback(async () => {
    if (!currentPrompt) return;

    try {
      await dismissReviewPrompt(currentPrompt.prompt.id);
      setPendingPrompts(prev => prev.filter(p => p.prompt.id !== currentPrompt.prompt.id));
      setCurrentPrompt(null);
      setShowReviewModal(false);
      
      // Show next prompt if available
      const remaining = pendingPrompts.filter(p => p.prompt.id !== currentPrompt.prompt.id);
      if (remaining.length > 0) {
        setTimeout(() => {
          setCurrentPrompt(remaining[0]);
          setShowReviewModal(true);
        }, 1000);
      }
    } catch (error) {
      console.error('Error dismissing prompt:', error);
    }
  }, [currentPrompt, pendingPrompts]);

  // Mark current prompt as completed
  const completeCurrentReview = useCallback(() => {
    if (!currentPrompt) return;

    setPendingPrompts(prev => prev.filter(p => p.prompt.id !== currentPrompt.prompt.id));
    setCurrentPrompt(null);
    setShowReviewModal(false);

    // Show next prompt if available
    const remaining = pendingPrompts.filter(p => p.prompt.id !== currentPrompt.prompt.id);
    if (remaining.length > 0) {
      setTimeout(() => {
        setCurrentPrompt(remaining[0]);
        setShowReviewModal(true);
      }, 2000);
    }
  }, [currentPrompt, pendingPrompts]);

  // Manually trigger review modal for a specific booking
  const triggerReview = useCallback((prompt: PendingPromptData) => {
    setCurrentPrompt(prompt);
    setShowReviewModal(true);
  }, []);

  return {
    pendingPrompts,
    currentPrompt,
    isLoading,
    showReviewModal,
    setShowReviewModal,
    dismissCurrent,
    completeCurrentReview,
    triggerReview,
    refetch: fetchPrompts
  };
}
