import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Split, Plus, Trash2, Calculator, AlertTriangle } from 'lucide-react';
import { generateTransactionId } from '../lib/transactionUtils';

interface SplitItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: string;
  totalPrice: number;
  vatClassification: 'VAT_APPLICABLE' | 'NO_VAT';
  technicalSpecs: string;
  businessJustification: string;
  supplierPreference: string;
  deliveryLocation: string;
}

interface SplitPRModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseRequisition: any;
  onSplit: (splitData: any) => void;
}

const SplitPRModal = ({ isOpen, onClose, purchaseRequisition, onSplit }: SplitPRModalProps) => {
  const [splitItems, setSplitItems] = useState<SplitItem[]>([
    {
      id: '1',
      description: '',
      quantity: 1,
      unitPrice: '',
      totalPrice: 0,
      vatClassification: 'VAT_APPLICABLE',
      technicalSpecs: '',
      businessJustification: '',
      supplierPreference: '',
      deliveryLocation: purchaseRequisition?.deliveryLocation || ''
    }
  ]);
  const [splitReason, setSplitReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculateItemTotal = (quantity: number, unitPrice: string, vatClassification: string) => {
    const price = parseFloat(unitPrice) || 0;
    const subtotal = quantity * price;
    const vatRate = vatClassification === 'VAT_APPLICABLE' ? 0.15 : 0;
    const vat = subtotal * vatRate;
    return subtotal + vat;
  };

  const calculateSplitTotal = () => {
    return splitItems.reduce((total, item) => {
      return total + calculateItemTotal(item.quantity, item.unitPrice, item.vatClassification);
    }, 0);
  };

  const getRemainingAmount = () => {
    return purchaseRequisition.totalAmount - calculateSplitTotal();
  };

  const addSplitItem = () => {
    setSplitItems(prev => [...prev, {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      description: '',
      quantity: 1,
      unitPrice: '',
      totalPrice: 0,
      vatClassification: 'VAT_APPLICABLE',
      technicalSpecs: '',
      businessJustification: '',
      supplierPreference: '',
      deliveryLocation: purchaseRequisition?.deliveryLocation || ''
    }]);
  };

  const removeSplitItem = (itemId: string) => {
    if (splitItems.length > 1) {
      setSplitItems(prev => prev.filter(item => item.id !== itemId));
    }
  };

  const updateSplitItem = (itemId: string, field: string, value: any) => {
    setSplitItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value };
        
        if (field === 'quantity' || field === 'unitPrice' || field === 'vatClassification') {
          updatedItem.totalPrice = calculateItemTotal(
            field === 'quantity' ? value : updatedItem.quantity,
            field === 'unitPrice' ? value : updatedItem.unitPrice,
            field === 'vatClassification' ? value : updatedItem.vatClassification
          );
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  const handleSplit = async () => {
    if (!splitReason.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a reason for splitting this PR.",
        variant: "destructive"
      });
      return;
    }

    if (splitItems.some(item => !item.description || !item.unitPrice)) {
      toast({
        title: "Incomplete Items",
        description: "Please fill in all item descriptions and prices.",
        variant: "destructive"
      });
      return;
    }

    const splitTotal = calculateSplitTotal();
    if (splitTotal >= purchaseRequisition.totalAmount) {
      toast({
        title: "Invalid Split Amount",
        description: "Split amount cannot equal or exceed the original amount.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create split PRs with unique IDs
      const timestamp = Date.now();
      const splitPRs = splitItems.map((item, index) => ({
        id: `${purchaseRequisition.id}_split_${timestamp}_${index + 1}`,
        transactionId: generateTransactionId('PR'),
        type: 'PURCHASE_REQUISITION',
        requestDate: purchaseRequisition.requestDate,
        dueDate: purchaseRequisition.dueDate,
        paymentDueDate: purchaseRequisition.paymentDueDate,
        items: [{
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice.toString(),
          vatClassification: item.vatClassification,
          technicalSpecs: item.technicalSpecs,
          businessJustification: item.businessJustification
        }],
        urgencyLevel: purchaseRequisition.urgencyLevel,
        department: purchaseRequisition.department,
        budgetCode: purchaseRequisition.budgetCode,
        projectCode: purchaseRequisition.projectCode,
        supplierPreference: item.supplierPreference || purchaseRequisition.supplierPreference,
        deliveryLocation: item.deliveryLocation || purchaseRequisition.deliveryLocation,
        specialInstructions: purchaseRequisition.specialInstructions,
        requestedBy: purchaseRequisition.requestedBy,
        requestedByName: purchaseRequisition.requestedByName,
        requestedByRole: purchaseRequisition.requestedByRole,
        requestedByDepartment: purchaseRequisition.requestedByDepartment,
        status: 'PENDING_HOD_APPROVAL',
        hodStatus: 'Pending',
        financeStatus: 'Pending',
        totalAmount: item.totalPrice,
        currency: purchaseRequisition.currency,
        isSplit: true,
        originalTransactionId: purchaseRequisition.transactionId,
        splitReason,
        history: [
          ...purchaseRequisition.history,
          {
            status: 'Split Created',
            date: new Date(),
            by: 'Current User', // Replace with actual user
            transactionId: generateTransactionId('PR'),
            action: 'SPLIT_PR',
            comments: `Split from ${purchaseRequisition.transactionId}: ${splitReason}`
          }
        ],
        createdAt: new Date()
      }));

      // Update original PR with remaining amount
      const remainingAmount = getRemainingAmount();
      const originalUpdate = {
        ...purchaseRequisition,
        totalAmount: remainingAmount,
        items: [{
          id: 'remaining',
          description: `Remaining amount from split PR ${purchaseRequisition.transactionId}`,
          quantity: 1,
          unitPrice: remainingAmount.toString(),
          totalPrice: remainingAmount.toString(),
          vatClassification: 'VAT_APPLICABLE',
          technicalSpecs: 'Remaining items after split',
          businessJustification: `Original PR split into ${splitPRs.length} separate requisitions`
        }],
        history: [
          ...purchaseRequisition.history,
          {
            status: 'Split Processed',
            date: new Date(),
            by: 'Current User',
            transactionId: purchaseRequisition.transactionId,
            action: 'PROCESS_SPLIT',
            comments: `PR split into ${splitPRs.length} items. Reason: ${splitReason}`
          }
        ]
      };

      onSplit({
        splitPRs,
        originalUpdate,
        splitReason
      });

      toast({
        title: "PR Split Successfully",
        description: `Created ${splitPRs.length} new purchase requisitions.`
      });
      
      onClose();
    } catch (error) {
      console.error('Split error:', error);
      toast({
        title: "Split Failed",
        description: "There was an error splitting the purchase requisition.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `ZAR ${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;
  };

  const isValidSplit = () => {
    const splitTotal = calculateSplitTotal();
    const remaining = getRemainingAmount();
    return splitTotal > 0 && remaining > 0 && remaining < purchaseRequisition.totalAmount;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Split className="h-5 w-5 text-purple-600" />
            Split Purchase Requisition
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Original PR Summary */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="text-lg">Original Purchase Requisition</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Transaction ID</Label>
                  <p className="font-mono text-sm">{purchaseRequisition.transactionId}</p>
                </div>
                <div>
                  <Label>Total Amount</Label>
                  <p className="font-bold text-green-600">{formatCurrency(purchaseRequisition.totalAmount)}</p>
                </div>
                <div>
                  <Label>Items</Label>
                  <p>{purchaseRequisition.items?.length || 0} item(s)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Split Actions */}
          <div className="space-y-4">
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-md">
              <p className="text-sm text-purple-800 font-medium mb-3">
                🚀 Quick Split Options:
              </p>
              <div className="flex gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    // Smart Auto Split - recognizes individual items from description
                    const originalAmount = purchaseRequisition.totalAmount;
                    const originalDescription = purchaseRequisition.items?.[0]?.description || 'Items';

                    // Try to intelligently split description based on common separators
                    const splitKeywords = [' and ', ' & ', ', ', ' + ', ' plus '];
                    let itemDescriptions = [originalDescription];

                    for (const keyword of splitKeywords) {
                      if (originalDescription.toLowerCase().includes(keyword)) {
                        itemDescriptions = originalDescription.split(new RegExp(keyword, 'i')).map(item => item.trim());
                        break;
                      }
                    }

                    // If we found multiple items, split accordingly
                    if (itemDescriptions.length > 1) {
                      const splitPercentage = 0.8; // Use 80% for actual items
                      const amountPerItem = Math.round((originalAmount * splitPercentage / itemDescriptions.length) * 100) / 100;

                      const newSplitItems = itemDescriptions.map((desc, index) => ({
                        id: `auto_${Date.now()}_${index + 1}`,
                        description: desc.trim(),
                        quantity: 1,
                        unitPrice: amountPerItem.toString(),
                        totalPrice: amountPerItem,
                        vatClassification: 'VAT_APPLICABLE',
                        technicalSpecs: '',
                        businessJustification: `Split item: ${desc.trim()}`,
                        supplierPreference: '',
                        deliveryLocation: purchaseRequisition?.deliveryLocation || ''
                      }));

                      setSplitItems(newSplitItems);
                      setSplitReason(`Automatic split detected ${itemDescriptions.length} items from description - showing remainder`);
                    } else {
                      // Default split if no separators found
                      const splitPercentage = 0.7;
                      const firstSplitAmount = Math.round((originalAmount * splitPercentage / 2) * 100) / 100;
                      const secondSplitAmount = Math.round((originalAmount * splitPercentage / 2) * 100) / 100;

                      setSplitItems([
                        {
                          id: `auto_${Date.now()}_1`,
                          description: `${originalDescription} (Split 1)`,
                          quantity: 1,
                          unitPrice: firstSplitAmount.toString(),
                          totalPrice: firstSplitAmount,
                          vatClassification: 'VAT_APPLICABLE',
                          technicalSpecs: '',
                          businessJustification: 'Auto-split for separate processing',
                          supplierPreference: '',
                          deliveryLocation: purchaseRequisition?.deliveryLocation || ''
                        },
                        {
                          id: `auto_${Date.now()}_2`,
                          description: `${originalDescription} (Split 2)`,
                          quantity: 1,
                          unitPrice: secondSplitAmount.toString(),
                          totalPrice: secondSplitAmount,
                          vatClassification: 'VAT_APPLICABLE',
                          technicalSpecs: '',
                          businessJustification: 'Auto-split for separate processing',
                          supplierPreference: '',
                          deliveryLocation: purchaseRequisition?.deliveryLocation || ''
                        }
                      ]);
                      setSplitReason('Automatic split for different suppliers/categories - showing remainder');
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <Split className="h-4 w-4" />
                  Auto Split (Leave Remainder)
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    // Example Split (60% + 20%)
                    const originalAmount = purchaseRequisition.totalAmount;
                    const firstAmount = Math.round(originalAmount * 0.6);
                    const secondAmount = Math.round(originalAmount * 0.2);

                    setSplitItems([
                      {
                        id: `example_${Date.now()}_1`,
                        description: 'Office Equipment & Furniture',
                        quantity: 1,
                        unitPrice: firstAmount.toString(),
                        totalPrice: firstAmount,
                        vatClassification: 'VAT_APPLICABLE',
                        technicalSpecs: 'Office equipment and furniture items',
                        businessJustification: 'Equipment category split',
                        supplierPreference: '',
                        deliveryLocation: purchaseRequisition?.deliveryLocation || ''
                      },
                      {
                        id: `example_${Date.now()}_2`,
                        description: 'IT Software & Licenses',
                        quantity: 1,
                        unitPrice: secondAmount.toString(),
                        totalPrice: secondAmount,
                        vatClassification: 'VAT_APPLICABLE',
                        technicalSpecs: 'Software and licensing',
                        businessJustification: 'Software category split',
                        supplierPreference: '',
                        deliveryLocation: purchaseRequisition?.deliveryLocation || ''
                      }
                    ]);
                    setSplitReason('Split by category - Equipment (60%) and Software (20%) with 20% remainder');
                  }}
                  className="flex items-center gap-2 bg-blue-50 text-blue-700 border-blue-200"
                >
                  <Calculator className="h-4 w-4" />
                  Example Split (60%+20%)
                </Button>
              </div>
            </div>
          </div>

          {/* Split Reason */}
          <div className="space-y-2">
            <Label htmlFor="splitReason">Reason for Split *</Label>
            <Textarea
              id="splitReason"
              value={splitReason}
              onChange={(e) => setSplitReason(e.target.value)}
              placeholder="Explain why this PR needs to be split (e.g., different suppliers, separate delivery requirements, budget allocation...)"
              rows={3}
            />
          </div>

          {/* Split Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Split Items</h3>
              <Button type="button" onClick={addSplitItem} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Split Item
              </Button>
            </div>

            {splitItems.map((item, index) => (
              <Card key={item.id} className="border-l-4 border-l-purple-500">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Split Item {index + 1}</h4>
                    {splitItems.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSplitItem(item.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div className="md:col-span-2 space-y-2">
                      <Label>Description *</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateSplitItem(item.id, 'description', e.target.value)}
                        placeholder="e.g., Dell Laptop Computer"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateSplitItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Unit Price (ZAR) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateSplitItem(item.id, 'unitPrice', e.target.value)}
                        placeholder="0.00"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>VAT Classification</Label>
                      <Select 
                        value={item.vatClassification} 
                        onValueChange={(value: any) => updateSplitItem(item.id, 'vatClassification', value)}
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
                        {formatCurrency(item.totalPrice)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label>Technical Specifications</Label>
                      <Textarea
                        value={item.technicalSpecs}
                        onChange={(e) => updateSplitItem(item.id, 'technicalSpecs', e.target.value)}
                        placeholder="Model, specifications, technical requirements..."
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Business Justification</Label>
                      <Textarea
                        value={item.businessJustification}
                        onChange={(e) => updateSplitItem(item.id, 'businessJustification', e.target.value)}
                        placeholder="Business need, purpose, expected benefits..."
                        rows={2}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label>Preferred Supplier</Label>
                      <Input
                        value={item.supplierPreference}
                        onChange={(e) => updateSplitItem(item.id, 'supplierPreference', e.target.value)}
                        placeholder="Specific supplier for this item"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Delivery Location</Label>
                      <Input
                        value={item.deliveryLocation}
                        onChange={(e) => updateSplitItem(item.id, 'deliveryLocation', e.target.value)}
                        placeholder="Specific delivery location"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Split Summary */}
          <Card className={`${isValidSplit() ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <Label>Original Amount</Label>
                  <p className="text-lg font-bold text-blue-600">
                    {formatCurrency(purchaseRequisition.totalAmount)}
                  </p>
                </div>
                <div className="text-center">
                  <Label>Split Total</Label>
                  <p className="text-lg font-bold text-purple-600">
                    {formatCurrency(calculateSplitTotal())}
                  </p>
                </div>
                <div className="text-center">
                  <Label>Remaining</Label>
                  <p className={`text-lg font-bold ${getRemainingAmount() > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(getRemainingAmount())}
                  </p>
                </div>
              </div>

              {!isValidSplit() && (
                <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-md flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-red-800 text-sm">
                    Split amounts must be less than the original total and leave a positive remainder.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSplit} 
              disabled={isSubmitting || !isValidSplit()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSubmitting ? 'Processing...' : 'Create Split PRs'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};



export default SplitPRModal;
