import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { AlertCircle, Split } from 'lucide-react';

interface SimpleItemSplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseRequisition: any;
  onSplit: (splitData: any) => void;
}

const SimpleItemSplitModal = ({ isOpen, onClose, purchaseRequisition, onSplit }: SimpleItemSplitModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedItems, setSelectedItems] = useState<number[]>(
    purchaseRequisition?.items?.map((_: any, idx: number) => idx) || []
  );

  if (!purchaseRequisition?.items || purchaseRequisition.items.length < 2) {
    return null; // Don't show if less than 2 items
  }

  const handleItemToggle = (index: number) => {
    setSelectedItems(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleSplit = async () => {
    if (selectedItems.length === 0) {
      toast({
        title: "No Items Selected",
        description: "Please select at least one item to split.",
        variant: "destructive"
      });
      return;
    }

    if (selectedItems.length === purchaseRequisition.items.length) {
      toast({
        title: "Invalid Selection",
        description: "Leave at least one item in the original PR.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const splitData: any[] = [];

      // Create split data for each selected item (using snake_case for database)
      selectedItems.forEach((itemIndex) => {
        const item = purchaseRequisition.items[itemIndex];
        const itemAmount = parseFloat(item.totalPrice) || 0;

        splitData.push({
          items: [{ ...item }],
          totalAmount: itemAmount,
          notes: `Split from original PR: Item "${item.description}"`,
          originalItemIndex: itemIndex // Include index for accurate remaining calculation
        });
      });

      // Pass data in the format expected by the service
      onSplit({
        splitPRs: splitData,
        selectedItemNames: selectedItems.map(idx => purchaseRequisition.items[idx].description),
        selectedItemIndices: selectedItems // Include all selected indices for service
      });

      toast({
        title: "Split Successful",
        description: `Created ${splitData.length} new PR${splitData.length !== 1 ? 's' : ''} from selected items.`
      });

      onClose();
    } catch (error) {
      console.error('Split error:', error);
      toast({
        title: "Split Failed",
        description: "There was an error splitting the PR.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `ZAR ${(amount || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;
  };

  const selectedTotal = selectedItems.reduce((sum, idx) => {
    return sum + (parseFloat(purchaseRequisition.items[idx]?.totalPrice) || 0);
  }, 0);

  const remainingTotal = purchaseRequisition.totalAmount - selectedTotal;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Split className="h-5 w-5 text-purple-600" />
            Split PR by Items
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <p className="text-sm text-blue-800">
                <strong>How it works:</strong> Select items to split into separate purchase requisitions. Each selected item will become a new PR with the same requestor and details.
              </p>
            </CardContent>
          </Card>

          {/* Items Selection */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Select Items to Split</Label>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {purchaseRequisition.items.map((item: any, index: number) => (
                <div
                  key={index}
                  onClick={() => handleItemToggle(index)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedItems.includes(index)
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(index)}
                      onChange={() => {}}
                      className="mt-1 w-5 h-5 cursor-pointer"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.description}</p>
                      <div className="grid grid-cols-3 gap-4 mt-2 text-sm text-gray-600">
                        <div>
                          <span className="text-xs text-gray-500">Quantity</span>
                          <p className="font-medium">{item.quantity}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Unit Price</span>
                          <p className="font-medium">{formatCurrency(parseFloat(item.unitPrice))}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Total</span>
                          <p className="font-medium text-green-600">{formatCurrency(parseFloat(item.totalPrice))}</p>
                        </div>
                      </div>
                      {item.vatClassification === 'VAT_APPLICABLE' && (
                        <Badge className="mt-2" variant="outline">
                          VAT Applied
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <Card className="bg-gray-50">
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-gray-600 font-semibold uppercase">Original Total</p>
                  <p className="text-lg font-bold text-blue-600 mt-1">
                    {formatCurrency(purchaseRequisition.totalAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-semibold uppercase">Selected Items</p>
                  <p className="text-lg font-bold text-purple-600 mt-1">
                    {formatCurrency(selectedTotal)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-semibold uppercase">Remaining in Original</p>
                  <p className={`text-lg font-bold mt-1 ${
                    remainingTotal > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(remainingTotal)}
                  </p>
                </div>
              </div>

              {remainingTotal <= 0 && (
                <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">
                    <strong>Error:</strong> You must leave at least one item in the original PR.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSplit}
              disabled={isSubmitting || selectedItems.length === 0 || remainingTotal <= 0}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSubmitting ? 'Splitting...' : `Split ${selectedItems.length} Item${selectedItems.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SimpleItemSplitModal;
