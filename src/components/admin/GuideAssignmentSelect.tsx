import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { User, UserCheck, Wand2, Clock, MapPin, Languages } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { findBestAvailableGuide, getAvailableGuides } from '@/services/guideService';

interface Guide {
  id: string;
  full_name: string;
  phone: string;
  status: string;
  languages: string[] | null;
  specialization: string[] | null;
  hourly_rate: number | null;
}

interface GuideWithAvailability extends Guide {
  isAvailable?: boolean;
  matchScore?: number;
}

interface TourDetails {
  tour_date?: string;
  tour_start_time?: string;
  tour_area?: string;
  guide_language?: string;
}

interface GuideAssignmentSelectProps {
  bookingId: string;
  currentGuideId: string | null;
  onAssigned: () => void;
  disabled?: boolean;
  tourDetails?: TourDetails;
}

export const GuideAssignmentSelect: React.FC<GuideAssignmentSelectProps> = ({
  bookingId,
  currentGuideId,
  onAssigned,
  disabled = false,
  tourDetails,
}) => {
  const { toast } = useToast();
  const [guides, setGuides] = useState<GuideWithAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoAssigning, setAutoAssigning] = useState(false);

  useEffect(() => {
    loadGuidesWithAvailability();
  }, [tourDetails]);

  const loadGuidesWithAvailability = async () => {
    try {
      // Get all active guides
      const { data: allGuides, error } = await supabase
        .from('guides')
        .select('*')
        .eq('status', 'active')
        .order('full_name', { ascending: true });

      if (error) throw error;

      if (!tourDetails?.tour_date || !tourDetails?.tour_start_time) {
        setGuides(allGuides || []);
        return;
      }

      // Get available guides for the tour time
      const date = new Date(tourDetails.tour_date);
      const dayOfWeek = date.getDay();
      
      const availableGuides = await getAvailableGuides(
        tourDetails.guide_language,
        tourDetails.tour_area,
        dayOfWeek,
        tourDetails.tour_start_time
      );

      const availableGuideIds = new Set(availableGuides.map(g => g.id));

      // Mark guides with availability status
      const guidesWithStatus: GuideWithAvailability[] = (allGuides || []).map(guide => ({
        ...guide,
        isAvailable: availableGuideIds.has(guide.id),
        matchScore: availableGuides.find(g => g.id === guide.id) ? 1 : 0
      }));

      // Sort: available guides first
      guidesWithStatus.sort((a, b) => {
        if (a.isAvailable && !b.isAvailable) return -1;
        if (!a.isAvailable && b.isAvailable) return 1;
        return a.full_name.localeCompare(b.full_name);
      });

      setGuides(guidesWithStatus);
    } catch (error) {
      console.error('Error loading guides:', error);
    }
  };

  const handleAssign = async (guideId: string) => {
    if (guideId === currentGuideId) return;
    
    setLoading(true);
    try {
      const newGuideId = guideId === 'unassign' ? null : guideId;
      
      const { error } = await supabase
        .from('bookings')
        .update({ 
          assigned_guide_id: newGuideId,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;

      // Log admin action
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('admin_logs').insert({
          admin_id: user.id,
          action_type: guideId === 'unassign' ? 'guide_unassigned' : 'guide_assigned',
          target_id: bookingId,
          target_table: 'bookings',
          payload: { guide_id: newGuideId }
        });
      }

      toast({
        title: guideId === 'unassign' ? 'Guide Unassigned' : 'Guide Assigned',
        description: guideId === 'unassign' 
          ? 'Guide has been removed from this booking'
          : 'Guide has been notified of the assignment',
      });
      onAssigned();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign guide',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAutoAssign = async () => {
    if (guides.length === 0) {
      toast({
        title: 'No Guides Available',
        description: 'There are no active guides to assign',
        variant: 'destructive',
      });
      return;
    }

    setAutoAssigning(true);
    try {
      let selectedGuide: Guide | null = null;

      // Use availability-based selection if tour details are provided
      if (tourDetails?.tour_date && tourDetails?.tour_start_time) {
        selectedGuide = await findBestAvailableGuide(
          tourDetails.tour_date,
          tourDetails.tour_start_time,
          tourDetails.guide_language,
          tourDetails.tour_area
        );
      }

      // Fallback to first available guide
      if (!selectedGuide) {
        const availableGuide = guides.find(g => g.isAvailable);
        selectedGuide = availableGuide || guides[0];
      }

      if (!selectedGuide) {
        toast({
          title: 'No Matching Guide',
          description: 'Could not find a guide matching the tour requirements',
          variant: 'destructive',
        });
        return;
      }
      
      const { error } = await supabase
        .from('bookings')
        .update({ 
          assigned_guide_id: selectedGuide.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;

      // Log admin action
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('admin_logs').insert({
          admin_id: user.id,
          action_type: 'guide_auto_assigned',
          target_id: bookingId,
          target_table: 'bookings',
          payload: { 
            guide_id: selectedGuide.id, 
            guide_name: selectedGuide.full_name,
            matched_criteria: {
              tour_date: tourDetails?.tour_date,
              tour_time: tourDetails?.tour_start_time,
              language: tourDetails?.guide_language,
              area: tourDetails?.tour_area
            }
          }
        });
      }

      toast({
        title: 'Guide Auto-Assigned',
        description: `${selectedGuide.full_name} has been assigned based on availability`,
      });
      onAssigned();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to auto-assign guide',
        variant: 'destructive',
      });
    } finally {
      setAutoAssigning(false);
    }
  };

  const currentGuide = guides.find(g => g.id === currentGuideId);

  return (
    <div className="flex items-center gap-2">
      <Select
        value={currentGuideId || 'none'}
        onValueChange={handleAssign}
        disabled={disabled || loading}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Assign Guide">
            {currentGuide ? (
              <span className="flex items-center gap-1">
                <UserCheck className="h-3 w-3 text-green-600" />
                <span className="truncate">{currentGuide.full_name}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-muted-foreground">
                <User className="h-3 w-3" />
                No Guide
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {currentGuideId && (
            <SelectItem value="unassign">
              <span className="text-muted-foreground">Unassign Guide</span>
            </SelectItem>
          )}
          {guides.length === 0 ? (
            <SelectItem value="none" disabled>No available guides</SelectItem>
          ) : (
            guides.map((guide) => (
              <SelectItem key={guide.id} value={guide.id}>
                <span className="flex items-center gap-2">
                  <User className="h-3 w-3" />
                  <span className={!guide.isAvailable && tourDetails?.tour_date ? 'text-muted-foreground' : ''}>
                    {guide.full_name}
                  </span>
                  {guide.isAvailable && tourDetails?.tour_date && (
                    <Badge variant="outline" className="text-xs px-1 py-0 text-green-600 border-green-300">
                      Available
                    </Badge>
                  )}
                  {!guide.isAvailable && tourDetails?.tour_date && (
                    <Badge variant="outline" className="text-xs px-1 py-0 text-muted-foreground">
                      Busy
                    </Badge>
                  )}
                  {guide.languages && guide.languages.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      ({guide.languages.slice(0, 2).join(', ')})
                    </span>
                  )}
                </span>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      
      {!currentGuideId && guides.length > 0 && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleAutoAssign}
          disabled={disabled || autoAssigning}
          title="Auto-assign best available guide"
        >
          <Wand2 className={`h-3 w-3 ${autoAssigning ? 'animate-spin' : ''}`} />
        </Button>
      )}
    </div>
  );
};
