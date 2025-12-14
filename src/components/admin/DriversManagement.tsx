import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search, RefreshCw, Car } from 'lucide-react';
import { logAdminAction } from '@/services/adminService';

interface Driver {
  id: string;
  full_name: string;
  phone: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function DriversManagement() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    status: 'active' as string,
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setDrivers(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch drivers: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = 
      driver.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.phone.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || driver.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const resetForm = () => {
    setFormData({ full_name: '', phone: '', status: 'active' });
    setSelectedDriver(null);
  };

  const handleAddDriver = async () => {
    if (!formData.full_name.trim() || !formData.phone.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setFormLoading(true);
    try {
      const { data, error } = await supabase
        .from('drivers')
        .insert({
          full_name: formData.full_name.trim(),
          phone: formData.phone.trim(),
          status: formData.status,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast.error('A driver with this phone number already exists');
          return;
        }
        throw error;
      }

      await logAdminAction('driver_created', data.id, 'drivers', {
        full_name: data.full_name,
        phone: data.phone,
      });

      setDrivers(prev => [data, ...prev]);
      toast.success('Driver added successfully');
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error('Failed to add driver: ' + error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditDriver = async () => {
    if (!selectedDriver || !formData.full_name.trim() || !formData.phone.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setFormLoading(true);
    try {
      const { data, error } = await supabase
        .from('drivers')
        .update({
          full_name: formData.full_name.trim(),
          phone: formData.phone.trim(),
          status: formData.status,
        })
        .eq('id', selectedDriver.id)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast.error('A driver with this phone number already exists');
          return;
        }
        throw error;
      }

      await logAdminAction('driver_updated', data.id, 'drivers', {
        old_data: selectedDriver,
        new_data: data,
      });

      setDrivers(prev => prev.map(d => d.id === data.id ? data : d));
      toast.success('Driver updated successfully');
      setIsEditDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error('Failed to update driver: ' + error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteDriver = async () => {
    if (!selectedDriver) return;

    setFormLoading(true);
    try {
      const { error } = await supabase
        .from('drivers')
        .delete()
        .eq('id', selectedDriver.id);

      if (error) throw error;

      await logAdminAction('driver_deleted', selectedDriver.id, 'drivers', {
        full_name: selectedDriver.full_name,
        phone: selectedDriver.phone,
      });

      setDrivers(prev => prev.filter(d => d.id !== selectedDriver.id));
      toast.success('Driver deleted successfully');
      setIsDeleteDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error('Failed to delete driver: ' + error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const openEditDialog = (driver: Driver) => {
    setSelectedDriver(driver);
    setFormData({
      full_name: driver.full_name,
      phone: driver.phone,
      status: driver.status,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (driver: Driver) => {
    setSelectedDriver(driver);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Drivers Management
            </CardTitle>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Driver
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchDrivers} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading drivers...</div>
          ) : filteredDrivers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {drivers.length === 0 ? 'No drivers added yet' : 'No drivers match your search'}
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDrivers.map((driver) => (
                    <TableRow key={driver.id}>
                      <TableCell className="font-medium">{driver.full_name}</TableCell>
                      <TableCell>{driver.phone}</TableCell>
                      <TableCell>
                        <Badge variant={driver.status === 'active' ? 'default' : 'secondary'}>
                          {driver.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(driver.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(driver)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(driver)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Driver Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Driver</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-name">Full Name *</Label>
              <Input
                id="add-name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Enter driver's full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-phone">Phone Number *</Label>
              <Input
                id="add-phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+7 XXX XXX XX XX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData(prev => ({ ...prev, status: v as any }))}
              >
                <SelectTrigger id="add-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleAddDriver} disabled={formLoading}>
              {formLoading ? 'Adding...' : 'Add Driver'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Driver Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Driver</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name *</Label>
              <Input
                id="edit-name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone Number *</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData(prev => ({ ...prev, status: v as any }))}
              >
                <SelectTrigger id="edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleEditDriver} disabled={formLoading}>
              {formLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Driver</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete driver "{selectedDriver?.full_name}"? 
              This action cannot be undone. Any bookings assigned to this driver will be unassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={resetForm}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDriver}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {formLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
