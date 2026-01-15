import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { API_ENDPOINTS, buildEndpoint } from '@/config/api';
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
  DialogDescription,
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
import { Plus, Pencil, Trash2, Search, RefreshCw, Car, CheckCircle, Ban, Eye, EyeOff, KeyRound } from 'lucide-react';

// Using centralized API configuration - no Netlify dependency
const EDGE_FUNCTION_URL = API_ENDPOINTS.manageDrivers;

interface Driver {
  id: string;
  full_name: string;
  phone: string;
  status: string;
  created_at: string;
  updated_at: string;
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not authenticated');
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

export default function DriversManagement() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'blocked'>('all');
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    password: '',
    status: 'active',
  });
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
    setFormData({ full_name: '', phone: '', password: '', status: 'active' });
    setSelectedDriver(null);
    setShowPassword(false);
    setNewPassword('');
    setConfirmNewPassword('');
  };

  const handleAddDriver = async () => {
    if (!formData.full_name.trim() || !formData.phone.trim() || !formData.password.trim()) {
      toast.error('Please fill in all required fields including password');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setFormLoading(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          full_name: formData.full_name.trim(),
          phone: formData.phone.trim(),
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create driver');
      }

      setDrivers(prev => [data.driver, ...prev]);
      toast.success('Driver created successfully with login credentials');
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message);
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
      const headers = await getAuthHeaders();
      const response = await fetch(`${EDGE_FUNCTION_URL}/${selectedDriver.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          full_name: formData.full_name.trim(),
          phone: formData.phone.trim(),
          status: formData.status,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setDrivers(prev => prev.map(d => d.id === selectedDriver.id ? data.driver : d));
      toast.success('Driver updated successfully');
      setIsEditDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleApproveDriver = async (driver: Driver) => {
    try {
      setActionLoading(driver.id);
      const headers = await getAuthHeaders();
      const response = await fetch(`${EDGE_FUNCTION_URL}/${driver.id}/approve`, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      setDrivers(prev => prev.map(d => d.id === driver.id ? { ...d, status: 'active' } : d));
      toast.success(`${driver.full_name} has been approved`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBlockDriver = async (driver: Driver) => {
    try {
      setActionLoading(driver.id);
      const headers = await getAuthHeaders();
      const response = await fetch(`${EDGE_FUNCTION_URL}/${driver.id}/block`, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      setDrivers(prev => prev.map(d => d.id === driver.id ? { ...d, status: 'blocked' } : d));
      toast.success(`${driver.full_name} has been blocked`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteDriver = async () => {
    if (!selectedDriver) return;

    setFormLoading(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${EDGE_FUNCTION_URL}/${selectedDriver.id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      setDrivers(prev => prev.filter(d => d.id !== selectedDriver.id));
      toast.success('Driver deleted successfully');
      setIsDeleteDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const openEditDialog = (driver: Driver) => {
    setSelectedDriver(driver);
    setFormData({
      full_name: driver.full_name,
      phone: driver.phone,
      password: '',
      status: driver.status,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (driver: Driver) => {
    setSelectedDriver(driver);
    setIsDeleteDialogOpen(true);
  };

  const openResetPasswordDialog = (driver: Driver) => {
    setSelectedDriver(driver);
    setNewPassword('');
    setConfirmNewPassword('');
    setIsResetPasswordDialogOpen(true);
  };

  const handleResetPassword = async () => {
    if (!selectedDriver) return;

    if (!newPassword.trim()) {
      toast.error('Please enter a new password');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setFormLoading(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'reset_driver_password',
          driver_id: selectedDriver.id,
          new_password: newPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast.success(`Password reset for ${selectedDriver.full_name}`);
      setIsResetPasswordDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'blocked':
        return <Badge variant="destructive">Blocked</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
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
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchDrivers} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

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
                    <TableRow key={driver.id} className={actionLoading === driver.id ? 'opacity-50' : ''}>
                      <TableCell className="font-medium">{driver.full_name}</TableCell>
                      <TableCell className="font-mono">{driver.phone}</TableCell>
                      <TableCell>{getStatusBadge(driver.status)}</TableCell>
                      <TableCell>{new Date(driver.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {driver.status === 'blocked' ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleApproveDriver(driver)}
                              disabled={actionLoading === driver.id}
                              title="Approve Driver"
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleBlockDriver(driver)}
                              disabled={actionLoading === driver.id}
                              title="Block Driver"
                            >
                              <Ban className="h-4 w-4 text-orange-600" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(driver)}
                            disabled={actionLoading === driver.id}
                            title="Edit Driver"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openResetPasswordDialog(driver)}
                            disabled={actionLoading === driver.id}
                            title="Reset Password"
                          >
                            <KeyRound className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(driver)}
                            disabled={actionLoading === driver.id}
                            className="text-destructive hover:text-destructive"
                            title="Delete Driver"
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
            <DialogDescription>
              Create a driver account with login credentials
            </DialogDescription>
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
              <Label htmlFor="add-password">Password *</Label>
              <div className="relative">
                <Input
                  id="add-password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Min. 6 characters"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Driver will use their phone number and this password to login
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleAddDriver} disabled={formLoading}>
              {formLoading ? 'Creating...' : 'Create Driver'}
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
                onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}
              >
                <SelectTrigger id="edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
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
              This will remove their account and unassign them from any bookings.
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

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Driver Password</DialogTitle>
            <DialogDescription>
              Set a new password for {selectedDriver?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password *</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-new-password">Confirm Password *</Label>
              <Input
                id="confirm-new-password"
                type={showPassword ? 'text' : 'password'}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsResetPasswordDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleResetPassword} disabled={formLoading}>
              {formLoading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
