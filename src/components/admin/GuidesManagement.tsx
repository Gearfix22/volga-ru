import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
import { Plus, Pencil, Trash2, Search, RefreshCw, UserCheck, CheckCircle, Ban, Loader2, Key, Eye, EyeOff } from 'lucide-react';

interface Guide {
  id: string;
  full_name: string;
  phone: string;
  status: string;
  languages: string[] | null;
  specialization: string[] | null;
  hourly_rate: number | null;
  created_at: string;
  updated_at: string | null;
}

const AVAILABLE_LANGUAGES = ['English', 'Arabic', 'French', 'Spanish', 'German', 'Russian', 'Chinese', 'Japanese'];
const AVAILABLE_SPECIALIZATIONS = ['City Tours', 'Historical Sites', 'Adventure Tours', 'Cultural Experiences', 'Food Tours', 'Nature & Wildlife', 'Religious Sites', 'Photography Tours'];

export default function GuidesManagement() {
  const { t } = useTranslation('common');
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'blocked'>('all');
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    password: '',
    status: 'active',
    languages: ['English'] as string[],
    specialization: ['City Tours'] as string[],
    hourly_rate: 50,
  });
  const [formLoading, setFormLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchGuides();
  }, []);

  const fetchGuides = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('guides')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setGuides(data || []);
    } catch (error: any) {
      toast.error(t('guidesManagement.failedToFetch') + ': ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredGuides = guides.filter(guide => {
    const matchesSearch = 
      guide.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.phone.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || guide.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const resetForm = () => {
    setFormData({ 
      full_name: '', 
      phone: '', 
      password: '',
      status: 'active',
      languages: ['English'],
      specialization: ['City Tours'],
      hourly_rate: 50,
    });
    setSelectedGuide(null);
    setShowPassword(false);
    setNewPassword('');
  };

  const handleAddGuide = async () => {
    if (!formData.full_name.trim() || !formData.phone.trim()) {
      toast.error(t('guidesManagement.fillRequiredFields'));
      return;
    }

    if (!formData.password || formData.password.length < 8) {
      toast.error(t('guidesManagement.passwordMinLength'));
      return;
    }

    setFormLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error(t('common.notAuthenticated'));
        return;
      }

      const response = await fetch(
        API_ENDPOINTS.manageGuides,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            full_name: formData.full_name.trim(),
            phone: formData.phone.trim(),
            password: formData.password,
            languages: formData.languages,
            specialization: formData.specialization,
            hourly_rate: formData.hourly_rate,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t('guidesManagement.failedToCreate'));
      }

      setGuides(prev => [result.guide, ...prev]);
      toast.success(t('guidesManagement.addedSuccess'));
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditGuide = async () => {
    if (!selectedGuide || !formData.full_name.trim() || !formData.phone.trim()) {
      toast.error(t('guidesManagement.fillRequiredFields'));
      return;
    }

    setFormLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error(t('common.notAuthenticated'));
        return;
      }

      const response = await fetch(
        buildEndpoint(API_ENDPOINTS.manageGuides, selectedGuide.id),
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            full_name: formData.full_name.trim(),
            phone: formData.phone.trim(),
            status: formData.status,
            languages: formData.languages,
            specialization: formData.specialization,
            hourly_rate: formData.hourly_rate,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t('guidesManagement.failedToUpdate'));
      }

      setGuides(prev => prev.map(g => g.id === selectedGuide.id ? result.guide : g));
      toast.success(t('guidesManagement.updatedSuccess'));
      setIsEditDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (guide: Guide, newStatus: 'active' | 'blocked') => {
    try {
      setActionLoading(guide.id);
      const { error } = await supabase
        .from('guides')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', guide.id);

      if (error) throw error;

      setGuides(prev => prev.map(g => g.id === guide.id ? { ...g, status: newStatus } : g));
      const statusMessage = newStatus === 'active' 
        ? t('guidesManagement.activated') 
        : t('guidesManagement.blocked');
      toast.success(`${guide.full_name} ${statusMessage}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteGuide = async () => {
    if (!selectedGuide) return;

    setFormLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error(t('common.notAuthenticated'));
        return;
      }

      const response = await fetch(
        buildEndpoint(API_ENDPOINTS.manageGuides, selectedGuide.id),
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t('guidesManagement.failedToDelete'));
      }

      setGuides(prev => prev.filter(g => g.id !== selectedGuide.id));
      toast.success(t('guidesManagement.deletedSuccess'));
      setIsDeleteDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedGuide || !newPassword) {
      toast.error(t('guidesManagement.enterNewPassword'));
      return;
    }

    if (newPassword.length < 8) {
      toast.error(t('guidesManagement.passwordMinLength'));
      return;
    }

    setFormLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error(t('common.notAuthenticated'));
        return;
      }

      const response = await fetch(
        API_ENDPOINTS.manageGuides,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: 'reset_guide_password',
            guide_id: selectedGuide.id,
            new_password: newPassword,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t('guidesManagement.failedToResetPassword'));
      }

      toast.success(t('guidesManagement.passwordResetSuccess'));
      setIsResetPasswordDialogOpen(false);
      setNewPassword('');
      setSelectedGuide(null);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const openResetPasswordDialog = (guide: Guide) => {
    setSelectedGuide(guide);
    setNewPassword('');
    setIsResetPasswordDialogOpen(true);
  };

  const openEditDialog = (guide: Guide) => {
    setSelectedGuide(guide);
    setFormData({
      full_name: guide.full_name,
      phone: guide.phone,
      password: '',
      status: guide.status,
      languages: guide.languages || ['English'],
      specialization: guide.specialization || ['City Tours'],
      hourly_rate: guide.hourly_rate || 50,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (guide: Guide) => {
    setSelectedGuide(guide);
    setIsDeleteDialogOpen(true);
  };

  const toggleLanguage = (language: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language]
    }));
  };

  const toggleSpecialization = (spec: string) => {
    setFormData(prev => ({
      ...prev,
      specialization: prev.specialization.includes(spec)
        ? prev.specialization.filter(s => s !== spec)
        : [...prev.specialization, spec]
    }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">{t('common.active')}</Badge>;
      case 'inactive':
        return <Badge variant="secondary">{t('common.inactive')}</Badge>;
      case 'blocked':
        return <Badge variant="destructive">{t('common.blocked')}</Badge>;
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
              <UserCheck className="h-5 w-5" />
              {t('guidesManagement.title')}
            </CardTitle>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('guidesManagement.addGuide')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('guidesManagement.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder={t('common.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.allStatus')}</SelectItem>
                <SelectItem value="active">{t('common.active')}</SelectItem>
                <SelectItem value="inactive">{t('common.inactive')}</SelectItem>
                <SelectItem value="blocked">{t('common.blocked')}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchGuides} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {t('common.refresh')}
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredGuides.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {guides.length === 0 ? t('guidesManagement.noGuidesYet') : t('guidesManagement.noMatchingGuides')}
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('common.name')}</TableHead>
                    <TableHead>{t('common.phone')}</TableHead>
                    <TableHead>{t('guidesManagement.languages')}</TableHead>
                    <TableHead>{t('guidesManagement.specialization')}</TableHead>
                    <TableHead>{t('guidesManagement.ratePerHour')}</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGuides.map((guide) => (
                    <TableRow key={guide.id} className={actionLoading === guide.id ? 'opacity-50' : ''}>
                      <TableCell className="font-medium">{guide.full_name}</TableCell>
                      <TableCell className="font-mono">{guide.phone}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {guide.languages?.slice(0, 2).map(lang => (
                            <Badge key={lang} variant="outline" className="text-xs">{lang}</Badge>
                          ))}
                          {(guide.languages?.length || 0) > 2 && (
                            <Badge variant="outline" className="text-xs">+{guide.languages!.length - 2}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {guide.specialization?.slice(0, 1).map(spec => (
                            <Badge key={spec} variant="secondary" className="text-xs">{spec}</Badge>
                          ))}
                          {(guide.specialization?.length || 0) > 1 && (
                            <Badge variant="secondary" className="text-xs">+{guide.specialization!.length - 1}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>${guide.hourly_rate || 50}</TableCell>
                      <TableCell>{getStatusBadge(guide.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {guide.status === 'blocked' ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleStatus(guide, 'active')}
                              disabled={actionLoading === guide.id}
                              title={t('guidesManagement.activateGuide')}
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleStatus(guide, 'blocked')}
                              disabled={actionLoading === guide.id}
                              title={t('guidesManagement.blockGuide')}
                            >
                              <Ban className="h-4 w-4 text-orange-600" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openResetPasswordDialog(guide)}
                            disabled={actionLoading === guide.id}
                            title={t('guidesManagement.resetPassword')}
                          >
                            <Key className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(guide)}
                            disabled={actionLoading === guide.id}
                            title={t('guidesManagement.editGuide')}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(guide)}
                            disabled={actionLoading === guide.id}
                            className="text-destructive hover:text-destructive"
                            title={t('guidesManagement.deleteGuide')}
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

      {/* Add Guide Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('guidesManagement.addNewGuide')}</DialogTitle>
            <DialogDescription>
              {t('guidesManagement.addNewGuideDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-name">{t('common.fullName')} *</Label>
              <Input
                id="add-name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder={t('guidesManagement.enterGuideName')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-phone">{t('common.phoneNumber')} *</Label>
              <Input
                id="add-phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+1234567890"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-password">{t('common.password')} *</Label>
              <div className="relative">
                <Input
                  id="add-password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder={t('guidesManagement.minEightChars')}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{t('guidesManagement.loginCredentialsNote')}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-rate">{t('guidesManagement.hourlyRateUSD')}</Label>
              <Input
                id="add-rate"
                type="number"
                value={formData.hourly_rate}
                onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: parseFloat(e.target.value) || 50 }))}
                placeholder="50"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('guidesManagement.languages')}</Label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_LANGUAGES.map(lang => (
                  <Badge
                    key={lang}
                    variant={formData.languages.includes(lang) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleLanguage(lang)}
                  >
                    {lang}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('guidesManagement.specialization')}</Label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_SPECIALIZATIONS.map(spec => (
                  <Badge
                    key={spec}
                    variant={formData.specialization.includes(spec) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleSpecialization(spec)}
                  >
                    {spec}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAddGuide} disabled={formLoading}>
              {formLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('guidesManagement.addGuide')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Guide Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('guidesManagement.editGuide')}</DialogTitle>
            <DialogDescription>
              {t('guidesManagement.updateGuideInfo')}
            </DialogDescription>
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
              <Label htmlFor="edit-phone">{t('common.phoneNumber')} *</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-rate">{t('guidesManagement.hourlyRateUSD')}</Label>
              <Input
                id="edit-rate"
                type="number"
                value={formData.hourly_rate}
                onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: parseFloat(e.target.value) || 50 }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">{t('common.status')}</Label>
              <Select 
                value={formData.status} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t('common.active')}</SelectItem>
                  <SelectItem value="inactive">{t('common.inactive')}</SelectItem>
                  <SelectItem value="blocked">{t('common.blocked')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('guidesManagement.languages')}</Label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_LANGUAGES.map(lang => (
                  <Badge
                    key={lang}
                    variant={formData.languages.includes(lang) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleLanguage(lang)}
                  >
                    {lang}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('guidesManagement.specialization')}</Label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_SPECIALIZATIONS.map(spec => (
                  <Badge
                    key={spec}
                    variant={formData.specialization.includes(spec) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleSpecialization(spec)}
                  >
                    {spec}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); resetForm(); }}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleEditGuide} disabled={formLoading}>
              {formLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('common.saveChanges')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('guidesManagement.deleteGuide')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('guidesManagement.deleteConfirmation', { name: selectedGuide?.full_name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setIsDeleteDialogOpen(false); resetForm(); }}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGuide}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {formLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('guidesManagement.resetGuidePassword')}</DialogTitle>
            <DialogDescription>
              {t('guidesManagement.setNewPasswordFor', { name: selectedGuide?.full_name })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">{t('guidesManagement.newPassword')} *</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('guidesManagement.minEightChars')}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsResetPasswordDialogOpen(false); setNewPassword(''); setShowPassword(false); }}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleResetPassword} disabled={formLoading}>
              {formLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('guidesManagement.resetPassword')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
