import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2, Building2, Phone, Mail, MapPin, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import * as supplierService from '../services/supplierService';

interface Supplier {
  id?: string;
  name: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  paymentTerms?: string;
  notes?: string;
}

const SupplierManagement = () => {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Supplier>({
    name: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'South Africa',
    paymentTerms: '',
    notes: ''
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setIsLoading(true);
      const data = await supplierService.getSuppliers();
      setSuppliers(data);
    } catch (error) {
      console.error('Failed to load suppliers:', error);
      toast({
        title: 'Error Loading Suppliers',
        description: 'Failed to load suppliers. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Supplier name is required.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsLoading(true);

      if (editingId) {
        await supplierService.updateSupplier(editingId, formData);
        toast({
          title: 'Success',
          description: 'Supplier updated successfully.'
        });
      } else {
        if (!user?.id) throw new Error('User not authenticated');
        await supplierService.createSupplier(formData, user.id);
        toast({
          title: 'Success',
          description: 'Supplier created successfully.'
        });
      }

      await loadSuppliers();
      resetForm();
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Failed to save supplier:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save supplier.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setFormData(supplier);
    setEditingId(supplier.id || null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return;

    try {
      setIsLoading(true);
      await supplierService.deleteSupplier(id);
      toast({
        title: 'Success',
        description: 'Supplier deleted successfully.'
      });
      await loadSuppliers();
    } catch (error) {
      console.error('Failed to delete supplier:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete supplier.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contactPerson: '',
      contactEmail: '',
      contactPhone: '',
      address: '',
      city: '',
      postalCode: '',
      country: 'South Africa',
      paymentTerms: '',
      notes: ''
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Supplier Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Edit Supplier' : 'Add New Supplier'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSave} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Basic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Supplier Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Makro, Cashbuild"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPerson">Contact Person</Label>
                    <Input
                      id="contactPerson"
                      value={formData.contactPerson || ''}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      placeholder="John Smith"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Contact Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.contactEmail || ''}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      placeholder="supplier@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      value={formData.contactPhone || ''}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      placeholder="+27 (0) 11 xxx xxxx"
                    />
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Address</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Street Address
                  </Label>
                  <Input
                    id="address"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Supplier Street"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city || ''}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Johannesburg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode || ''}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      placeholder="2000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country || 'South Africa'}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="South Africa"
                    />
                  </div>
                </div>
              </div>

              {/* Business Terms */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Business Terms</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="paymentTerms">Payment Terms</Label>
                  <Input
                    id="paymentTerms"
                    value={formData.paymentTerms || ''}
                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                    placeholder="e.g., Net 30, COD, Bank Transfer"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any additional information..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    setIsDialogOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : editingId ? 'Update Supplier' : 'Add Supplier'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Suppliers List */}
      <div className="grid gap-4">
        {isLoading && suppliers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading suppliers...
          </div>
        ) : suppliers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No suppliers added yet. Click "Add Supplier" to get started.
          </div>
        ) : (
          suppliers.map((supplier) => (
            <Card key={supplier.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      <h3 className="font-bold text-lg">{supplier.name}</h3>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                      {supplier.contactPerson && (
                        <div>
                          <p className="font-semibold text-foreground">{supplier.contactPerson}</p>
                          <p className="text-xs">Contact Person</p>
                        </div>
                      )}

                      {supplier.contactEmail && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <div>
                            <p className="font-semibold text-foreground text-xs break-all">{supplier.contactEmail}</p>
                            <p className="text-xs">Email</p>
                          </div>
                        </div>
                      )}

                      {supplier.contactPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <div>
                            <p className="font-semibold text-foreground">{supplier.contactPhone}</p>
                            <p className="text-xs">Phone</p>
                          </div>
                        </div>
                      )}

                      {supplier.address && (
                        <div className="flex items-center gap-2 md:col-span-3">
                          <MapPin className="h-4 w-4" />
                          <div>
                            <p className="font-semibold text-foreground">{supplier.address}, {supplier.city} {supplier.postalCode}</p>
                            <p className="text-xs">Address</p>
                          </div>
                        </div>
                      )}

                      {supplier.paymentTerms && (
                        <div>
                          <Badge variant="outline">{supplier.paymentTerms}</Badge>
                          <p className="text-xs mt-1">Payment Terms</p>
                        </div>
                      )}
                    </div>

                    {supplier.notes && (
                      <div className="mt-3 p-2 bg-muted rounded text-sm italic">
                        {supplier.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(supplier)}
                      disabled={isLoading}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => supplier.id && handleDelete(supplier.id)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default SupplierManagement;
