import React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Upload, FileText, X, Hash, Calculator, Clock, Building } from 'lucide-react';
import { generateTransactionId } from '../lib/transactionUtils';
import { supabase } from '../lib/supabaseClient';

interface PurchaseRequisitionFormProps {
  onSubmit: (pr: any) => void;
}

const PurchaseRequisitionForm = ({ onSubmit }: PurchaseRequisitionFormProps) => {
  const { user } = useAuth();
  const [transactionId] = useState(() => generateTransactionId('PR'));
  const [formData, setFormData] = useState({
    requestDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    paymentDueDate: '',
    items: [{
      id: '1',
      description: '',
      quantity: 1,
      unitPrice: '',
      totalPrice: '',
      vatClassification: 'VAT_APPLICABLE' as 'VAT_APPLICABLE' | 'NO_VAT',
      technicalSpecs: '',
      businessJustification: ''
    }],
    urgencyLevel: 'NORMAL' as 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT',
    department: user?.department || '',
    budgetCode: '',
    projectCode: '',
    supplierPreference: '',
    deliveryLocation: '',
    specialInstructions: '',
    sourceDocument: null as File | null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculateItemTotal = (quantity: number, unitPrice: string, vatClassification: string) => {
    const price = parseFloat(unitPrice) || 0;
    const subtotal = quantity * price;
    const vatRate = vatClassification === 'VAT_APPLICABLE' ? 0.15 : 0;
    const vat = subtotal * vatRate;
    return subtotal + vat;
  };

  const calculateGrandTotal = () => {
    return formData.items.reduce((total, item) => {
      return total + calculateItemTotal(item.quantity, item.unitPrice, item.vatClassification);
    }, 0);
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        id: Date.now().toString(),
        itemName: '',
        description: '',
        quantity: 1,
        unitPrice: '',
        totalPrice: '',
        vatClassification: 'VAT_APPLICABLE' as 'VAT_APPLICABLE' | 'NO_VAT',
        technicalSpecs: '',
        businessJustification: ''
      }]
    }));
  };

  const removeItem = (itemId: string) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== itemId)
      }));
    }
  };

  const updateItem = (itemId: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };
          
          // Recalculate total price when quantity or unit price changes
          if (field === 'quantity' || field === 'unitPrice' || field === 'vatClassification') {
            updatedItem.totalPrice = calculateItemTotal(
              field === 'quantity' ? value : updatedItem.quantity,
              field === 'unitPrice' ? value : updatedItem.unitPrice,
              field === 'vatClassification' ? value : updatedItem.vatClassification
            ).toFixed(2);
          }
          
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validation
      if (!formData.dueDate || !formData.paymentDueDate) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required due dates.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      if (formData.items.some(item => !item.itemName || !item.description || !item.unitPrice)) {
        toast({
          title: "Incomplete Items",
          description: "Please fill in all item names, descriptions and prices.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Upload file to Supabase storage if provided
      let documentUrl: string | undefined = undefined;
      if (formData.sourceDocument) {
        try {
          const fileName = `${Date.now()}-${formData.sourceDocument.name}`;
          const storagePath = `purchase-requisitions/${transactionId}/${fileName}`;

          console.log('📤 Uploading document to Supabase:', storagePath);

          const { data, error } = await supabase.storage
            .from('documents')
            .upload(storagePath, formData.sourceDocument);

          if (error) {
            console.error('❌ Upload error:', error);
            throw new Error(`Failed to upload document: ${error.message}`);
          }

          // Get public URL for the uploaded file
          const { data: publicUrlData } = supabase.storage
            .from('documents')
            .getPublicUrl(storagePath);

          documentUrl = publicUrlData?.publicUrl;
          console.log('✅ Document uploaded successfully:', documentUrl);
        } catch (uploadError: any) {
          console.error('❌ Document upload failed:', uploadError);
          toast({
            title: "Upload Failed",
            description: uploadError.message || "Could not upload document. Please try again.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
      }

      const purchaseRequisition = {
        id: Date.now().toString(),
        transactionId,
        type: 'PURCHASE_REQUISITION',
        ...formData,
        requestedBy: user?.id,
        requestedByName: user?.name,
        requestedByRole: user?.role,
        requestedByDepartment: user?.department,
        status: 'PENDING_HOD_APPROVAL',
        hodStatus: 'Pending',
        financeStatus: 'Pending',
        totalAmount: calculateGrandTotal(),
        currency: 'ZAR',
        history: [
          {
            status: 'Submitted',
            date: new Date(),
            by: user?.email,
            transactionId,
            action: 'SUBMIT_PR'
          }
        ],
        createdAt: new Date(),
        documentName: formData.sourceDocument?.name,
        documentType: formData.sourceDocument?.type,
        documentUrl: documentUrl,
      };

      // Await the async onSubmit call
      await onSubmit(purchaseRequisition);

      // Only reset form after successful submission
      setFormData({
        requestDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        paymentDueDate: '',
        items: [{
          id: '1',
          itemName: '',
          description: '',
          quantity: 1,
          unitPrice: '',
          totalPrice: '',
          vatClassification: 'VAT_APPLICABLE',
          technicalSpecs: '',
          businessJustification: ''
        }],
        urgencyLevel: 'NORMAL',
        department: user?.department || '',
        budgetCode: '',
        projectCode: '',
        supplierPreference: '',
        deliveryLocation: '',
        specialInstructions: '',
        sourceDocument: null,
      });
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: "Submission failed",
        description: "There was an error submitting your purchase requisition.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }

      const allowedTypes = ['application/pdf', 'image/png', 'image/jpg', 'image/jpeg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please select a PDF, PNG, JPG, or Word document.",
          variant: "destructive",
        });
        return;
      }

      setFormData({ ...formData, sourceDocument: file });
    }
  };

  const removeFile = () => {
    setFormData({ ...formData, sourceDocument: null });
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'bg-green-100 text-green-800';
      case 'NORMAL': return 'bg-blue-100 text-blue-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'URGENT': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="glass-card premium-shadow">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="h-5 w-5 mr-2 text-blue-600" />
            New Purchase Requisition
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-1 rounded-md">
            <Hash className="h-4 w-4" />
            {transactionId}
          </div>
        </CardTitle>
        <CardDescription>
          Submit a new purchase requisition for approval through the procurement process
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Header Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="requestDate" className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Request Date
              </Label>
              <Input
                id="requestDate"
                type="date"
                value={formData.requestDate}
                onChange={(e) => setFormData({ ...formData, requestDate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate" className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Approval Due Date *
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentDueDate" className="flex items-center">
                <Calculator className="h-4 w-4 mr-2" />
                Payment Due Date *
              </Label>
              <Input
                id="paymentDueDate"
                type="date"
                value={formData.paymentDueDate}
                onChange={(e) => setFormData({ ...formData, paymentDueDate: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Department and Classification */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label htmlFor="department" className="flex items-center">
                <Building className="h-4 w-4 mr-2" />
                Department
              </Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="IT Department"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="urgencyLevel">Urgency Level</Label>
              <Select value={formData.urgencyLevel} onValueChange={(value: any) => setFormData({ ...formData, urgencyLevel: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low Priority</SelectItem>
                  <SelectItem value="NORMAL">Normal Priority</SelectItem>
                  <SelectItem value="HIGH">High Priority</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>

          {/* Items Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Items Required</h3>
              <Button type="button" onClick={addItem} variant="outline" size="sm">
                Add Item
              </Button>
            </div>

            {formData.items.map((item, index) => (
              <Card key={item.id} className="border-l-4 border-l-blue-500">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Item {index + 1}</h4>
                    {formData.items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div className="space-y-2">
                      <Label>Item Name *</Label>
                      <Input
                        value={item.itemName || ''}
                        onChange={(e) => updateItem(item.id, 'itemName', e.target.value)}
                        placeholder="e.g., Laptop"
                        required
                      />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <Label>Description *</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        placeholder="e.g., Dell Laptop Computer with specifications"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Unit Price (ZAR) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)}
                        placeholder="0.00"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>VAT Classification</Label>
                      <Select 
                        value={item.vatClassification} 
                        onValueChange={(value: any) => updateItem(item.id, 'vatClassification', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="VAT_APPLICABLE">VAT Applicable (15%)</SelectItem>
                          <SelectItem value="NO_VAT">No VAT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Total (Inc. VAT)</Label>
                      <div className="p-2 bg-gray-50 rounded-md text-right font-medium">
                        ZAR {calculateItemTotal(item.quantity, item.unitPrice, item.vatClassification).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label>Technical Specifications</Label>
                      <Textarea
                        value={item.technicalSpecs}
                        onChange={(e) => updateItem(item.id, 'technicalSpecs', e.target.value)}
                        placeholder="Model, specifications, technical requirements..."
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Business Justification</Label>
                      <Textarea
                        value={item.businessJustification}
                        onChange={(e) => updateItem(item.id, 'businessJustification', e.target.value)}
                        placeholder="Business need, purpose, expected benefits..."
                        rows={2}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Total Summary */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Grand Total (ZAR):</span>
                  <span className="text-2xl font-bold text-blue-600">
                    ZAR {calculateGrandTotal().toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="supplierPreference">Preferred Supplier (Optional)</Label>
              <Input
                id="supplierPreference"
                value={formData.supplierPreference}
                onChange={(e) => setFormData({ ...formData, supplierPreference: e.target.value })}
                placeholder="Supplier name or requirement"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryLocation">Supplier Address</Label>
              <Input
                id="deliveryLocation"
                value={formData.deliveryLocation}
                onChange={(e) => setFormData({ ...formData, deliveryLocation: e.target.value })}
                placeholder="e.g., 123 Supplier Street, City, Postal Code"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialInstructions">Special Instructions</Label>
            <Textarea
              id="specialInstructions"
              value={formData.specialInstructions}
              onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
              placeholder="Any special requirements, installation needs, training requirements..."
              rows={3}
            />
          </div>

          {/* Document Upload */}
          <div className="space-y-2">
            <Label htmlFor="document" className="flex items-center">
              <Upload className="h-4 w-4 mr-2" />
              Supporting Documents
            </Label>
            <Input
              id="document"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              onChange={handleFileChange}
            />
            {formData.sourceDocument && (
              <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
                <p className="text-sm text-green-600 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  {formData.sourceDocument.name}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  className="text-red-600 hover:text-red-800"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Summary Badge */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-4">
              <Badge className={getUrgencyColor(formData.urgencyLevel)}>
                {formData.urgencyLevel} Priority
              </Badge>
              <span className="text-sm text-muted-foreground">
                {formData.items.length} item(s) • ZAR {calculateGrandTotal().toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Purchase Requisition'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PurchaseRequisitionForm;
