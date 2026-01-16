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
import { useLanguage } from '@/contexts/LanguageContext';
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
  const { t, isRTL } = useLanguage();
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
      const [servicesData, categoriesData, currencyRates] = await Promise.all([
        getAllServices(),
        getAllCategories(),
        supabase.from('currency_rates').select('currency_code, symbol').order('currency_code')
      ]);
      
      setServices(servicesData);
      setCategories(categoriesData);
      
      if (currencyRates.data && currencyRates.data.length > 0) {
        setCurrencies(currencyRates.data.map(c => ({ code: c.currency_code, symbol: c.symbol })));
      } else {
        setCurrencies([
          { code: 'USD', symbol: '$' },
          { code: 'EUR', symbol: '€' },
          { code: 'RUB', symbol: '₽' },
          { code: 'SAR', symbol: 'ر.س' },
          { code: 'EGP', symbol: '£' }
        ]);
      }
      
      const uniqueTypes = [...new Set(servicesData.map(s => s.type))];
      const defaultTypes = ['Driver', 'Accommodation', 'Events', 'Guide'];
      const allTypes = [...new Set([...defaultTypes, ...uniqueTypes])];
      setServiceTypes(allTypes);
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: t('adminServices.errorLoadingData'),
        description: error instanceof Error ? error.message : t('adminServices.failedToLoadServices'),
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
    
    const validation = validateServicePayload(formData);
    if (!validation.valid) {
      setFormError(validation.errors.join('. '));
      toast({
        title: t('common.error'),
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
          title: t('adminServices.serviceUpdated'),
          description: `${formData.name} ${t('adminServices.hasBeenUpdated')}`
        });
      } else {
        await createService(payload);
        toast({
          title: t('adminServices.serviceCreated'),
          description: `${formData.name} ${t('adminServices.hasBeenCreated')}`
        });
      }

      setIsDialogOpen(false);
      await loadData();
      onRefresh?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('common.error');
      console.error('Service save error:', error);
      setFormError(errorMessage);
      toast({
        title: t('adminServices.failedToSave'),
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm(t('adminServices.confirmDelete'))) return;

    setIsDeleting(serviceId);
    try {
      const result = await deleteService(serviceId);
      if (result.success) {
        toast({
          title: t('adminServices.serviceDeleted'),
          description: t('adminServices.hasBeenRemoved')
        });
        await loadData();
        onRefresh?.();
      } else {
        toast({
          title: t('adminServices.failedToDelete'),
          description: result.error || t('adminServices.checkAdminPermissions'),
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('adminServices.failedToDelete'),
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
          title: service.is_active ? t('adminServices.serviceDeactivated') : t('adminServices.serviceActivated'),
          description: `${service.name} ${service.is_active ? t('adminServices.isNowInactive') : t('adminServices.isNowActive')}`
        });
        await loadData();
        onRefresh?.();
      } else {
        toast({
          title: t('adminServices.failedToUpdate'),
          description: result.error || t('adminServices.checkAdminPermissions'),
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('adminServices.failedToUpdate'),
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
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t('adminServices.title')}</h2>
          <p className="text-muted-foreground">{t('adminServices.subtitle')}</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
          {t('adminServices.addService')}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">{t('adminServices.tableHeaders.order')}</TableHead>
                <TableHead>{t('adminServices.tableHeaders.name')}</TableHead>
                <TableHead>{t('adminServices.tableHeaders.type')}</TableHead>
                <TableHead>{t('adminServices.tableHeaders.basePrice')}</TableHead>
                <TableHead>{t('adminServices.tableHeaders.status')}</TableHead>
                <TableHead className={isRTL ? 'text-left' : 'text-right'}>{t('adminServices.tableHeaders.actions')}</TableHead>
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
                    {service.base_price ? `$${service.base_price}` : t('adminServices.quote')}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={service.is_active}
                      onCheckedChange={() => handleToggleStatus(service)}
                      disabled={isToggling === service.id}
                    />
                  </TableCell>
                  <TableCell className={isRTL ? 'text-left' : 'text-right'}>
                    <div className={`flex items-center gap-2 ${isRTL ? 'justify-start' : 'justify-end'}`}>
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
                    {t('adminServices.noServicesFound')}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>
              {editingService ? t('adminServices.editService') : t('adminServices.addNewService')}
            </DialogTitle>
            <DialogDescription>
              {t('adminServices.formFields.requiredFields')}
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
                <Label htmlFor="name">{t('adminServices.formFields.serviceName')} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('adminServices.formFields.serviceNamePlaceholder')}
                  className={!formData.name.trim() && formError ? 'border-destructive' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">{t('adminServices.formFields.serviceType')} *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger className={!formData.type ? 'border-destructive' : ''}>
                    <SelectValue placeholder={t('adminServices.formFields.selectType')} />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                    <SelectItem value="__custom__" className="text-muted-foreground italic">
                      {t('adminServices.formFields.addCustomType')}
                    </SelectItem>
                  </SelectContent>
                </Select>
                {formData.type === '__custom__' && (
                  <Input
                    placeholder={t('adminServices.formFields.serviceType')}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="mt-2"
                  />
                )}
                {!formData.type && (
                  <p className="text-xs text-destructive">{t('adminServices.formFields.typeRequired')}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('adminServices.formFields.description')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('adminServices.formFields.descriptionPlaceholder')}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="base_price">{t('adminServices.formFields.basePrice')}</Label>
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
                <Label htmlFor="currency">{t('adminServices.formFields.currency')}</Label>
                <Select
                  value={formData.currency || 'USD'}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('adminServices.formFields.selectCurrency')} />
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
                <Label htmlFor="display_order">{t('adminServices.formFields.displayOrder')}</Label>
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
              <Label htmlFor="image_url">{t('adminServices.formFields.imageUrl')}</Label>
              <Input
                id="image_url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder={t('adminServices.formFields.imageUrlPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="features">{t('adminServices.formFields.features')}</Label>
              <Input
                id="features"
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                placeholder={t('adminServices.formFields.featuresPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">{t('adminServices.formFields.category')}</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('adminServices.formFields.selectCategory')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('adminServices.formFields.noCategory')}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.category_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">{t('adminServices.formFields.activeService')}</Label>
            </div>
          </div>

          <div className={`flex gap-2 pt-4 border-t ${isRTL ? 'justify-start' : 'justify-end'}`}>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
              <X className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving || !formData.name.trim() || !formData.type}
            >
              {isSaving ? (
                <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ms-2' : 'me-2'}`} />
              ) : (
                <Save className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
              )}
              {editingService ? t('adminServices.update') : t('adminServices.create')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminServicesManagement;
