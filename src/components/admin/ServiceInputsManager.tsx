import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2, Loader2, GripVertical, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ServiceInput {
  id: string;
  service_id: string;
  input_key: string;
  label: string;
  label_en: string | null;
  label_ar: string | null;
  label_ru: string | null;
  input_type: string;
  is_required: boolean;
  display_order: number;
  placeholder: string | null;
  placeholder_en: string | null;
  placeholder_ar: string | null;
  placeholder_ru: string | null;
  default_value: string | null;
  options: any;
  validation_rules: any;
  is_active: boolean;
}

interface ServiceInputsManagerProps {
  serviceId: string;
  serviceName: string;
  onClose: () => void;
}

const INPUT_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'time', label: 'Time' },
  { value: 'datetime', label: 'Date & Time' },
  { value: 'select', label: 'Dropdown Select' },
  { value: 'textarea', label: 'Multi-line Text' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
];

const DEFAULT_INPUT: Partial<ServiceInput> = {
  input_key: '',
  label: '',
  label_en: '',
  label_ar: '',
  label_ru: '',
  input_type: 'text',
  is_required: false,
  display_order: 0,
  placeholder: '',
  placeholder_en: '',
  placeholder_ar: '',
  placeholder_ru: '',
  default_value: '',
  options: null,
  validation_rules: null,
  is_active: true,
};

export const ServiceInputsManager: React.FC<ServiceInputsManagerProps> = ({
  serviceId,
  serviceName,
  onClose
}) => {
  const { toast } = useToast();
  const { t, isRTL } = useLanguage();
  const [inputs, setInputs] = useState<ServiceInput[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInput, setEditingInput] = useState<ServiceInput | null>(null);
  const [formData, setFormData] = useState<Partial<ServiceInput>>(DEFAULT_INPUT);
  const [formError, setFormError] = useState<string | null>(null);
  const [optionsText, setOptionsText] = useState('');

  useEffect(() => {
    loadInputs();
  }, [serviceId]);

  const loadInputs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('service_inputs')
        .select('*')
        .eq('service_id', serviceId)
        .order('display_order');

      if (error) throw error;
      setInputs(data || []);
    } catch (error) {
      console.error('Error loading inputs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load service inputs',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (input?: ServiceInput) => {
    setFormError(null);
    if (input) {
      setEditingInput(input);
      setFormData(input);
      // Convert options array to text for editing
      if (input.options && Array.isArray(input.options)) {
        setOptionsText(input.options.map((o: any) => 
          typeof o === 'object' ? `${o.value}:${o.label}` : o
        ).join('\n'));
      } else {
        setOptionsText('');
      }
    } else {
      setEditingInput(null);
      setFormData({ ...DEFAULT_INPUT, display_order: inputs.length });
      setOptionsText('');
    }
    setIsDialogOpen(true);
  };

  const parseOptions = (text: string): any[] | null => {
    if (!text.trim()) return null;
    const lines = text.trim().split('\n').filter(l => l.trim());
    return lines.map(line => {
      if (line.includes(':')) {
        const [value, label] = line.split(':').map(s => s.trim());
        return { value, label };
      }
      return { value: line.trim(), label: line.trim() };
    });
  };

  const handleSave = async () => {
    setFormError(null);

    // Validation
    if (!formData.input_key?.trim()) {
      setFormError('Input key is required');
      return;
    }
    if (!formData.label?.trim()) {
      setFormError('Label is required');
      return;
    }

    // Validate key format (alphanumeric + underscore)
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(formData.input_key)) {
      setFormError('Input key must start with a letter and contain only letters, numbers, and underscores');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        service_id: serviceId,
        input_key: formData.input_key!.trim(),
        label: formData.label!.trim(),
        label_en: formData.label_en?.trim() || formData.label!.trim(),
        label_ar: formData.label_ar?.trim() || null,
        label_ru: formData.label_ru?.trim() || null,
        input_type: formData.input_type || 'text',
        is_required: formData.is_required ?? false,
        display_order: formData.display_order ?? inputs.length,
        placeholder: formData.placeholder?.trim() || null,
        placeholder_en: formData.placeholder_en?.trim() || null,
        placeholder_ar: formData.placeholder_ar?.trim() || null,
        placeholder_ru: formData.placeholder_ru?.trim() || null,
        default_value: formData.default_value?.trim() || null,
        options: formData.input_type === 'select' ? parseOptions(optionsText) : null,
        validation_rules: formData.validation_rules,
        is_active: formData.is_active ?? true,
      };

      if (editingInput) {
        const { error } = await supabase
          .from('service_inputs')
          .update(payload)
          .eq('id', editingInput.id);

        if (error) throw error;
        toast({ title: 'Input updated successfully' });
      } else {
        const { error } = await supabase
          .from('service_inputs')
          .insert(payload);

        if (error) throw error;
        toast({ title: 'Input created successfully' });
      }

      setIsDialogOpen(false);
      await loadInputs();
    } catch (error: any) {
      console.error('Save error:', error);
      setFormError(error.message || 'Failed to save input');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (inputId: string) => {
    if (!confirm('Are you sure you want to delete this input?')) return;

    try {
      const { error } = await supabase
        .from('service_inputs')
        .delete()
        .eq('id', inputId);

      if (error) throw error;
      toast({ title: 'Input deleted' });
      await loadInputs();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete input',
        variant: 'destructive'
      });
    }
  };

  const handleToggleActive = async (input: ServiceInput) => {
    try {
      const { error } = await supabase
        .from('service_inputs')
        .update({ is_active: !input.is_active })
        .eq('id', input.id);

      if (error) throw error;
      await loadInputs();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update input status',
        variant: 'destructive'
      });
    }
  };

  return (
    <Card className="w-full" dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Manage Inputs: {serviceName}</CardTitle>
          <CardDescription>Define the form fields users must fill when booking this service</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleOpenDialog()} size="sm">
            <Plus className="h-4 w-4 me-2" />
            Add Input
          </Button>
          <Button variant="outline" onClick={onClose} size="sm">
            Close
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : inputs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No custom inputs defined for this service.</p>
            <p className="text-sm mt-2">Click "Add Input" to define form fields.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Required</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inputs.map((input, idx) => (
                <TableRow key={input.id}>
                  <TableCell>
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">{input.input_key}</code>
                  </TableCell>
                  <TableCell>{input.label}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{input.input_type}</Badge>
                  </TableCell>
                  <TableCell>
                    {input.is_required ? (
                      <Badge variant="default">Required</Badge>
                    ) : (
                      <Badge variant="secondary">Optional</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={input.is_active}
                      onCheckedChange={() => handleToggleActive(input)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(input)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(input.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingInput ? 'Edit Input' : 'Add New Input'}</DialogTitle>
          </DialogHeader>

          {formError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Input Key *</Label>
                <Input
                  value={formData.input_key || ''}
                  onChange={(e) => setFormData({ ...formData, input_key: e.target.value })}
                  placeholder="e.g., passport_number"
                />
                <p className="text-xs text-muted-foreground">Unique identifier (no spaces)</p>
              </div>
              <div className="space-y-2">
                <Label>Input Type *</Label>
                <Select
                  value={formData.input_type || 'text'}
                  onValueChange={(v) => setFormData({ ...formData, input_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INPUT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Label (Default) *</Label>
              <Input
                value={formData.label || ''}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="e.g., Passport Number"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Label (English)</Label>
                <Input
                  value={formData.label_en || ''}
                  onChange={(e) => setFormData({ ...formData, label_en: e.target.value })}
                  placeholder="English label"
                />
              </div>
              <div className="space-y-2">
                <Label>Label (Arabic)</Label>
                <Input
                  value={formData.label_ar || ''}
                  onChange={(e) => setFormData({ ...formData, label_ar: e.target.value })}
                  placeholder="Arabic label"
                  dir="rtl"
                />
              </div>
              <div className="space-y-2">
                <Label>Label (Russian)</Label>
                <Input
                  value={formData.label_ru || ''}
                  onChange={(e) => setFormData({ ...formData, label_ru: e.target.value })}
                  placeholder="Russian label"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Placeholder</Label>
              <Input
                value={formData.placeholder || ''}
                onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                placeholder="e.g., Enter your passport number"
              />
            </div>

            {formData.input_type === 'select' && (
              <div className="space-y-2">
                <Label>Options (one per line, format: value:label)</Label>
                <Textarea
                  value={optionsText}
                  onChange={(e) => setOptionsText(e.target.value)}
                  placeholder="economy:Economy Class&#10;business:Business Class&#10;first:First Class"
                  rows={5}
                />
                <p className="text-xs text-muted-foreground">
                  Each line is one option. Use "value:label" format or just "value".
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Default Value</Label>
              <Input
                value={formData.default_value || ''}
                onChange={(e) => setFormData({ ...formData, default_value: e.target.value })}
                placeholder="Pre-filled value (optional)"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Display Order</Label>
                <Input
                  type="number"
                  value={formData.display_order ?? 0}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center gap-4 pt-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_required ?? false}
                    onCheckedChange={(v) => setFormData({ ...formData, is_required: v })}
                  />
                  <Label>Required</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active ?? true}
                    onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                  />
                  <Label>Active</Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              {editingInput ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
