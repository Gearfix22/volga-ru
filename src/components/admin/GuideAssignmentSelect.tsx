import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, UserCheck, Wand2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Guide {
  id: string;
  full_name: string;
  phone: string;
  status: string;
  languages: string[] | null;
  specialization: string[] | null;
  hourly_rate: number | null;
}

interface GuideAssignmentSelectProps {
  bookingId: string;
  currentGuideId: string | null;
  onAssigned: () => void;
  disabled?: boolean;
}

export const GuideAssignmentSelect: React.FC<GuideAssignmentSelectProps> = ({
  bookingId,
  currentGuideId,
  onAssigned,
  disabled = false,
}) => {
  const { toast } = useToast();
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoAssigning, setAutoAssigning] = useState(false);

  useEffect(() => {
    loadGuides();
  }, []);

  const loadGuides = async () => {
    try {
      const { data, error } = await supabase
        .from('guides')
        .select('*')
        .eq('status', 'active')
        .order('full_name', { ascending: true });

      if (error) throw error;
      setGuides(data || []);
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
      // Simple auto-assign: pick the first available guide
      // Could be enhanced with availability checking
      const selectedGuide = guides[0];
      
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
          payload: { guide_id: selectedGuide.id, guide_name: selectedGuide.full_name }
        });
      }

      toast({
        title: 'Guide Auto-Assigned',
        description: `${selectedGuide.full_name} has been assigned and notified`,
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
                  {guide.full_name}
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
