import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, GripVertical, Image, Loader2, Save, X, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import {
  getAllServices,
  getAllCategories,
  createService,
  updateService,
  deleteService,
  toggleServiceStatus,
} from '@/services/adminServicesManager';
import type { Service, ServiceCategory } from '@/types/service';
import {
  DEFAULT_SERVICE_FORM,
  validateServicePayload,
  formToPayload,
  serviceToForm,
  type ServiceFormData
} from '@/types/service';

interface AdminServicesManagementProps {
  onRefresh?: () => void;
}

const AdminServicesManagement: React.FC<AdminServicesManagementProps> = ({ onRefresh }) => {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [currencies, setCurrencies] = useState<{ code: string; symbol: string }[]>([]);
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isToggling, setIsToggling] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ServiceFormData>(DEFAULT_SERVICE_FORM);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel - services, categories, currencies, and service types
      const [servicesData, categoriesData, currencyRates] = await Promise.all([
        getAllServices(),
        getAllCategories(),
        // Fetch currencies from currency_rates table
        supabase.from('currency_rates').select('currency_code, symbol').order('currency_code')
      ]);
      
      setServices(servicesData);
      setCategories(categoriesData);
      
      // Set currencies from database
      if (currencyRates.data && currencyRates.data.length > 0) {
        setCurrencies(currencyRates.data.map(c => ({ code: c.currency_code, symbol: c.symbol })));
      } else {
        // Fallback currencies if none in DB
        setCurrencies([
          { code: 'USD', symbol: '$' },
          { code: 'EUR', symbol: '€' },
          { code: 'RUB', symbol: '₽' },
          { code: 'SAR', symbol: 'ر.س' },
          { code: 'EGP', symbol: '£' }
        ]);
      }
      
      // Extract unique service types from existing services
      const uniqueTypes = [...new Set(servicesData.map(s => s.type))];
      // Merge with default types
      const defaultTypes = ['Driver', 'Accommodation', 'Events', 'Guide'];
      const allTypes = [...new Set([...defaultTypes, ...uniqueTypes])];
      setServiceTypes(allTypes);
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error Loading Data',
        description: error instanceof Error ? error.message : 'Failed to load services',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (service?: Service) => {
    setFormError(null);
    if (service) {
      setEditingService(service);
      setFormData(serviceToForm(service, services.length));
    } else {
      setEditingService(null);
      setFormData({ ...DEFAULT_SERVICE_FORM, display_order: services.length });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    setFormError(null);
    
    // Validate form data
    const validation = validateServicePayload(formData);
    if (!validation.valid) {
      setFormError(validation.errors.join('. '));
      toast({
        title: 'Validation Error',
        description: validation.errors.join('. '),
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    try {
      const payload = formToPayload(formData);

      if (editingService) {
        await updateService(editingService.id, payload);
        toast({
          title: 'Service Updated',
          description: `${formData.name} has been updated.`
        });
      } else {
        await createService(payload);
        toast({
          title: 'Service Created',
          description: `${formData.name} has been created.`
        });
      }

      setIsDialogOpen(false);
      await loadData();
      onRefresh?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Service save error:', error);
      setFormError(errorMessage);
      toast({
        title: 'Failed to Save Service',
        description: errorMessage,
        variant: 'destructive'
      });
      // Stay on dialog - do NOT close or navigate
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    setIsDeleting(serviceId);
    try {
      const result = await deleteService(serviceId);
      if (result.success) {
        toast({
          title: 'Service Deleted',
          description: 'The service has been removed.'
        });
        await loadData();
        onRefresh?.();
      } else {
        toast({
          title: 'Failed to Delete Service',
          description: result.error || 'Check admin permissions.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete service',
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleToggleStatus = async (service: Service) => {
    setIsToggling(service.id);
    try {
      const result = await toggleServiceStatus(service.id, !service.is_active);
      if (result.success) {
        toast({
          title: service.is_active ? 'Service Deactivated' : 'Service Activated',
          description: `${service.name} is now ${service.is_active ? 'inactive' : 'active'}.`
        });
        await loadData();
        onRefresh?.();
      } else {
        toast({
          title: 'Failed to Update Status',
          description: result.error || 'Check admin permissions.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update status',
        variant: 'destructive'
      });
    } finally {
      setIsToggling(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Services Management</h2>
          <p className="text-muted-foreground">Add, edit, and manage your services</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Service
        </Button>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Base Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {service.image_url ? (
                        <img 
                          src={service.image_url} 
                          alt={service.name}
                          className="h-10 w-10 rounded-md object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                          <Image className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {service.description}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{service.type}</Badge>
                  </TableCell>
                  <TableCell>
                    {service.base_price ? `$${service.base_price}` : 'Quote'}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={service.is_active}
                      onCheckedChange={() => handleToggleStatus(service)}
                      disabled={isToggling === service.id}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(service)}
                        disabled={isSaving}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleDelete(service.id)}
                        disabled={isDeleting === service.id}
                      >
                        {isDeleting === service.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {services.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No services found. Add your first service!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        if (!open) setFormError(null);
        setIsDialogOpen(open);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingService ? 'Edit Service' : 'Add New Service'}
            </DialogTitle>
            <DialogDescription>
              Fill in the details below. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Service Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Premium Transport"
                  className={!formData.name.trim() && formError ? 'border-destructive' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Service Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger className={!formData.type ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select type *" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                    {/* Allow custom type entry */}
                    <SelectItem value="__custom__" className="text-muted-foreground italic">
                      + Add custom type...
                    </SelectItem>
                  </SelectContent>
                </Select>
                {formData.type === '__custom__' && (
                  <Input
                    placeholder="Enter custom service type"
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="mt-2"
                  />
                )}
                {!formData.type && (
                  <p className="text-xs text-destructive">Service type is required</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the service..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="base_price">Base Price</Label>
                <Input
                  id="base_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.base_price}
                  onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.currency || 'USD'}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.symbol} {c.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  min="0"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_url">Image URL</Label>
              <Input
                id="image_url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="features">Features (comma-separated)</Label>
              <Input
                id="features"
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                placeholder="Feature 1, Feature 2, Feature 3"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Category</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.category_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Active (visible to customers)</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving || !formData.name.trim() || !formData.type}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {editingService ? 'Update' : 'Create'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminServicesManagement;
