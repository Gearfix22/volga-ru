import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { API_ENDPOINTS } from '@/config/api';
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
import { useLanguage } from '@/contexts/LanguageContext';
import { Plus, Pencil, Trash2, Search, RefreshCw, Car, CheckCircle, Ban, Eye, EyeOff, KeyRound } from 'lucide-react';

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
  const { t, isRTL } = useLanguage();
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
      toast.error(`${t('common.error')}: ${error.message}`);
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
      toast.error(t('driversManagement.fillAllFields'));
      return;
    }

    if (formData.password.length < 6) {
      toast.error(t('driversManagement.passwordMinLength'));
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
        throw new Error(data.error || t('driversManagement.createFailed'));
      }

      setDrivers(prev => [data.driver, ...prev]);
      toast.success(t('driversManagement.driverCreated'));
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
      toast.error(t('driversManagement.fillAllFields'));
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
      toast.success(t('driversManagement.driverUpdated'));
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
      toast.success(`${driver.full_name} ${t('driversManagement.hasBeenApproved')}`);
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
      toast.success(`${driver.full_name} ${t('driversManagement.hasBeenBlocked')}`);
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
      toast.success(t('driversManagement.driverDeleted'));
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
      toast.error(t('driversManagement.enterNewPassword'));
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error(t('auth.passwordsDoNotMatch'));
      return;
    }

    if (newPassword.length < 8) {
      toast.error(t('driversManagement.passwordMinLengthReset'));
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

      toast.success(`${t('driversManagement.passwordResetFor')} ${selectedDriver.full_name}`);
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
        return <Badge className="bg-green-100 text-green-800">{t('driversManagement.statusActive')}</Badge>;
      case 'inactive':
        return <Badge variant="secondary">{t('driversManagement.statusInactive')}</Badge>;
      case 'blocked':
        return <Badge variant="destructive">{t('driversManagement.statusBlocked')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <Card>
        <CardHeader>
          <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
            <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Car className="h-5 w-5" />
              {t('driversManagement.title')}
            </CardTitle>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('driversManagement.addDriver')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`flex flex-col sm:flex-row gap-4 mb-6 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
            <div className="relative flex-1">
              <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
              <Input
                placeholder={t('driversManagement.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={isRTL ? 'pr-10' : 'pl-10'}
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder={t('common.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('driversManagement.allStatuses')}</SelectItem>
                <SelectItem value="active">{t('driversManagement.statusActive')}</SelectItem>
                <SelectItem value="inactive">{t('driversManagement.statusInactive')}</SelectItem>
                <SelectItem value="blocked">{t('driversManagement.statusBlocked')}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchDrivers} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} ${loading ? 'animate-spin' : ''}`} />
              {t('common.refresh')}
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">{t('common.loading')}...</div>
          ) : filteredDrivers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {drivers.length === 0 ? t('driversManagement.noDriversYet') : t('driversManagement.noMatchingDrivers')}
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('common.name')}</TableHead>
                    <TableHead>{t('common.phone')}</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                    <TableHead>{t('driversManagement.added')}</TableHead>
                    <TableHead className={isRTL ? 'text-left' : 'text-right'}>{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDrivers.map((driver) => (
                    <TableRow key={driver.id} className={actionLoading === driver.id ? 'opacity-50' : ''}>
                      <TableCell className="font-medium">{driver.full_name}</TableCell>
                      <TableCell className="font-mono">{driver.phone}</TableCell>
                      <TableCell>{getStatusBadge(driver.status)}</TableCell>
                      <TableCell>{new Date(driver.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className={isRTL ? 'text-left' : 'text-right'}>
                        <div className={`flex ${isRTL ? 'justify-start' : 'justify-end'} gap-1`}>
                          {driver.status === 'blocked' ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleApproveDriver(driver)}
                              disabled={actionLoading === driver.id}
                              title={t('driversManagement.approveDriver')}
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleBlockDriver(driver)}
                              disabled={actionLoading === driver.id}
                              title={t('driversManagement.blockDriver')}
                            >
                              <Ban className="h-4 w-4 text-orange-600" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(driver)}
                            disabled={actionLoading === driver.id}
                            title={t('driversManagement.editDriver')}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openResetPasswordDialog(driver)}
                            disabled={actionLoading === driver.id}
                            title={t('driversManagement.resetPassword')}
                          >
                            <KeyRound className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(driver)}
                            disabled={actionLoading === driver.id}
                            className="text-destructive hover:text-destructive"
                            title={t('driversManagement.deleteDriver')}
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
            <DialogTitle>{t('driversManagement.addNewDriver')}</DialogTitle>
            <DialogDescription>
              {t('driversManagement.createDriverAccount')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-name">{t('common.fullName')} *</Label>
              <Input
                id="add-name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder={t('driversManagement.enterDriverName')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-phone">{t('common.phone')} *</Label>
              <Input
                id="add-phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+7 XXX XXX XX XX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-password">{t('auth.password')} *</Label>
              <div className="relative">
                <Input
                  id="add-password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder={t('driversManagement.minSixChars')}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-0`}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('driversManagement.loginCredentialsNote')}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAddDriver} disabled={formLoading}>
              {formLoading ? t('common.creating') : t('driversManagement.createDriver')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Driver Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('driversManagement.editDriver')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">{t('common.fullName')} *</Label>
              <Input
                id="edit-name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">{t('common.phone')} *</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">{t('common.status')}</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}
              >
                <SelectTrigger id="edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t('driversManagement.statusActive')}</SelectItem>
                  <SelectItem value="inactive">{t('driversManagement.statusInactive')}</SelectItem>
                  <SelectItem value="blocked">{t('driversManagement.statusBlocked')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); resetForm(); }}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleEditDriver} disabled={formLoading}>
              {formLoading ? t('common.saving') : t('common.saveChanges')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('driversManagement.deleteDriver')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('driversManagement.deleteConfirmation').replace('{{name}}', selectedDriver?.full_name || '')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={resetForm}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDriver}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {formLoading ? t('common.deleting') : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('driversManagement.resetDriverPassword')}</DialogTitle>
            <DialogDescription>
              {t('driversManagement.setNewPasswordFor').replace('{{name}}', selectedDriver?.full_name || '')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">{t('auth.newPassword')} *</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('driversManagement.minEightChars')}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-0`}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-new-password">{t('auth.confirmNewPassword')} *</Label>
              <Input
                id="confirm-new-password"
                type={showPassword ? 'text' : 'password'}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder={t('driversManagement.confirmNewPassword')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsResetPasswordDialogOpen(false); resetForm(); }}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleResetPassword} disabled={formLoading}>
              {formLoading ? t('driversManagement.resetting') : t('driversManagement.resetPassword')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
