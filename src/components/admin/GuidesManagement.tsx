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
      toast.error('Failed to fetch guides: ' + error.message);
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
      toast.error('Please fill in all required fields');
      return;
    }

    if (!formData.password || formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setFormLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Not authenticated');
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
        throw new Error(result.error || 'Failed to create guide');
      }

      setGuides(prev => [result.guide, ...prev]);
      toast.success('Guide added successfully with login credentials');
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
      toast.error('Please fill in all required fields');
      return;
    }

    setFormLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Not authenticated');
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
        throw new Error(result.error || 'Failed to update guide');
      }

      setGuides(prev => prev.map(g => g.id === selectedGuide.id ? result.guide : g));
      toast.success('Guide updated successfully');
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
      toast.success(`${guide.full_name} has been ${newStatus === 'active' ? 'activated' : 'blocked'}`);
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
        toast.error('Not authenticated');
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
        throw new Error(result.error || 'Failed to delete guide');
      }

      setGuides(prev => prev.filter(g => g.id !== selectedGuide.id));
      toast.success('Guide deleted successfully');
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
      toast.error('Please enter a new password');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setFormLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Not authenticated');
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
        throw new Error(result.error || 'Failed to reset password');
      }

      toast.success('Password reset successfully');
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
      password: '', // Password not needed for edit
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
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Active</Badge>;
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
              <UserCheck className="h-5 w-5" />
              Guides Management
            </CardTitle>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Guide
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
            <Button variant="outline" onClick={fetchGuides} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredGuides.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {guides.length === 0 ? 'No guides added yet' : 'No guides match your search'}
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Languages</TableHead>
                    <TableHead>Specialization</TableHead>
                    <TableHead>Rate/hr</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                              title="Activate Guide"
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleStatus(guide, 'blocked')}
                              disabled={actionLoading === guide.id}
                              title="Block Guide"
                            >
                              <Ban className="h-4 w-4 text-orange-600" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openResetPasswordDialog(guide)}
                            disabled={actionLoading === guide.id}
                            title="Reset Password"
                          >
                            <Key className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(guide)}
                            disabled={actionLoading === guide.id}
                            title="Edit Guide"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(guide)}
                            disabled={actionLoading === guide.id}
                            className="text-destructive hover:text-destructive"
                            title="Delete Guide"
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
            <DialogTitle>Add New Guide</DialogTitle>
            <DialogDescription>
              Add a new tourist guide to the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-name">Full Name *</Label>
              <Input
                id="add-name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Enter guide's full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-phone">Phone Number *</Label>
              <Input
                id="add-phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+1234567890"
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
                  placeholder="Minimum 8 characters"
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
              <p className="text-xs text-muted-foreground">Guide will use phone number and this password to login</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-rate">Hourly Rate (USD)</Label>
              <Input
                id="add-rate"
                type="number"
                value={formData.hourly_rate}
                onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: parseFloat(e.target.value) || 50 }))}
                placeholder="50"
              />
            </div>
            <div className="space-y-2">
              <Label>Languages</Label>
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
              <Label>Specialization</Label>
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
              Cancel
            </Button>
            <Button onClick={handleAddGuide} disabled={formLoading}>
              {formLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Guide
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Guide Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Guide</DialogTitle>
            <DialogDescription>
              Update guide information
            </DialogDescription>
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
              <Label htmlFor="edit-rate">Hourly Rate (USD)</Label>
              <Input
                id="edit-rate"
                type="number"
                value={formData.hourly_rate}
                onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: parseFloat(e.target.value) || 50 }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Languages</Label>
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
              <Label>Specialization</Label>
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
              Cancel
            </Button>
            <Button onClick={handleEditGuide} disabled={formLoading}>
              {formLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Guide</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedGuide?.full_name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setIsDeleteDialogOpen(false); resetForm(); }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGuide}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {formLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Guide Password</DialogTitle>
            <DialogDescription>
              Set a new password for {selectedGuide?.full_name}
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
                  placeholder="Minimum 8 characters"
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
              Cancel
            </Button>
            <Button onClick={handleResetPassword} disabled={formLoading}>
              {formLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
