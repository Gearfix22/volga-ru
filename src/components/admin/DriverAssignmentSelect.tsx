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
import { getAvailableDrivers, assignDriverToBooking, autoAssignDriver, Driver } from '@/services/driverService';
import { useToast } from '@/hooks/use-toast';

interface DriverAssignmentSelectProps {
  bookingId: string;
  currentDriverId: string | null;
  onAssigned: () => void;
  disabled?: boolean;
}

export const DriverAssignmentSelect: React.FC<DriverAssignmentSelectProps> = ({
  bookingId,
  currentDriverId,
  onAssigned,
  disabled = false,
}) => {
  const { toast } = useToast();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoAssigning, setAutoAssigning] = useState(false);

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    const available = await getAvailableDrivers();
    setDrivers(available);
  };

  const handleAssign = async (driverId: string) => {
    if (driverId === currentDriverId) return;
    
    setLoading(true);
    try {
      const result = await assignDriverToBooking(bookingId, driverId === 'unassign' ? null : driverId);
      
      if (result.success) {
        toast({
          title: driverId === 'unassign' ? 'Driver Unassigned' : 'Driver Assigned',
          description: driverId === 'unassign' 
            ? 'Driver has been removed from this booking'
            : 'Driver has been notified of the assignment',
        });
        onAssigned();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to assign driver',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to assign driver',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAutoAssign = async () => {
    setAutoAssigning(true);
    try {
      const result = await autoAssignDriver(bookingId);
      
      if (result.success) {
        toast({
          title: 'Driver Auto-Assigned',
          description: `${result.driverName} has been assigned and notified`,
        });
        onAssigned();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'No available drivers',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to auto-assign driver',
        variant: 'destructive',
      });
    } finally {
      setAutoAssigning(false);
    }
  };

  const currentDriver = drivers.find(d => d.id === currentDriverId);

  return (
    <div className="flex items-center gap-2">
      <Select
        value={currentDriverId || 'none'}
        onValueChange={handleAssign}
        disabled={disabled || loading}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Assign Driver">
            {currentDriver ? (
              <span className="flex items-center gap-1">
                <UserCheck className="h-3 w-3 text-green-600" />
                <span className="truncate">{currentDriver.full_name}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-muted-foreground">
                <User className="h-3 w-3" />
                No Driver
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {currentDriverId && (
            <SelectItem value="unassign">
              <span className="text-muted-foreground">Unassign Driver</span>
            </SelectItem>
          )}
          {drivers.length === 0 ? (
            <SelectItem value="none" disabled>No available drivers</SelectItem>
          ) : (
            drivers.map((driver) => (
              <SelectItem key={driver.id} value={driver.id}>
                <span className="flex items-center gap-2">
                  <User className="h-3 w-3" />
                  {driver.full_name}
                </span>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      
      {!currentDriverId && drivers.length > 0 && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleAutoAssign}
          disabled={disabled || autoAssigning}
          title="Auto-assign best available driver"
        >
          <Wand2 className={`h-3 w-3 ${autoAssigning ? 'animate-spin' : ''}`} />
        </Button>
      )}
    </div>
  );
};
