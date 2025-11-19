import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, FileCheck, Calculator, Calendar, User, Split, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { generateTransactionId } from '../lib/transactionUtils';
import SplitPRModal from './SplitPRModal';

interface FinalizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseRequisition: any;
  actionRole: 'HOD' | 'Finance';
  onFinalize: (data: any) => void;
  onSplit?: (data: any) => void;
}

interface SplitItem {
  id: string;
  description: string;
  amount: number;
  vatClassification: 'VAT_APPLICABLE' | 'NO_VAT';
  category: string;
}

const FinalizationModal = ({ isOpen, onClose, purchaseRequisition, actionRole, onFinalize, onSplit }: FinalizationModalProps) => {
  const [decision, setDecision] = useState<'approve' | 'decline' | ''>('');
  const [comments, setComments] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [supplierDetails, setSupplierDetails] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [budgetApproval, setBudgetApproval] = useState('');
  const [riskAssessment, setRiskAssessment] = useState('');
  const [complianceNotes, setComplianceNotes] = useState('');
  const [alternativeOptions, setAlternativeOptions] = useState('');
  const [priority, setPriority] = useState(purchaseRequisition?.urgencyLevel || 'NORMAL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSplitSection, setShowSplitSection] = useState(false);
  const [splitItems, setSplitItems] = useState<SplitItem[]>([]);
  const [splitReason, setSplitReason] = useState('');
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);

  const addSplitItem = () => {
    setSplitItems(prev => [...prev, {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      description: '',
      amount: 0,
      vatClassification: 'VAT_APPLICABLE',
      category: ''
    }]);
  };

  const removeSplitItem = (itemId: string) => {
    if (splitItems.length > 1) {
      setSplitItems(prev => prev.filter(item => item.id !== itemId));
    }
  };

  const updateSplitItem = (itemId: string, field: string, value: any) => {
    setSplitItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, [field]: value } : item
    ));
  };

  const calculateSplitTotal = () => {
    return splitItems.reduce((total, item) => {
      // Amount entered is inclusive of VAT if VAT_APPLICABLE
      const amount = item.amount || 0;
      return total + amount;
    }, 0);
  };

  const getRemainingAmount = () => {
    return purchaseRequisition.totalAmount - calculateSplitTotal();
  };

  const handleAutoSplit = () => {
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

    const timestamp = Date.now();

    // If we found multiple items, split accordingly
    if (itemDescriptions.length > 1) {
      const splitPercentage = 0.8; // Use 80% for actual items
      const amountPerItem = Math.round((originalAmount * splitPercentage / itemDescriptions.length) * 100) / 100;

      const newSplitItems = itemDescriptions.map((desc, index) => ({
        id: `split_${timestamp}_${index + 1}`,
        description: desc.trim(),
        amount: amountPerItem,
        vatClassification: 'VAT_APPLICABLE',
        category: index === 0 ? 'Office Supplies' : 'Equipment'
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
          id: `split_${timestamp}_1`,
          description: `${originalDescription} (Split 1)`,
          amount: firstSplitAmount,
          vatClassification: 'VAT_APPLICABLE',
          category: 'Office Supplies'
        },
        {
          id: `split_${timestamp}_2`,
          description: `${originalDescription} (Split 2)`,
          amount: secondSplitAmount,
          vatClassification: 'VAT_APPLICABLE',
          category: 'Equipment'
        }
      ]);
      setSplitReason('Automatic split for different suppliers/categories - showing remainder');
    }

    setShowSplitSection(true);
  };

  const handleSplitTransaction = async () => {
    if (!splitReason.trim()) {
      toast({
        title: "Split Reason Required",
        description: "Please provide a reason for splitting this transaction.",
        variant: "destructive"
      });
      return;
    }

    if (splitItems.length === 0) {
      toast({
        title: "No Split Items",
        description: "Please add items for the split.",
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

    try {
      // Create split transactions with unique IDs
      const timestamp = Date.now();
      const splitTransactions = splitItems.map((item, index) => ({
        id: `${purchaseRequisition.id}_split_${timestamp}_${index + 1}`,
        transactionId: generateTransactionId('PR'),
        ...purchaseRequisition,
        totalAmount: item.amount,
        description: item.description,
        category: item.category,
        vatClassification: item.vatClassification,
        isSplit: true,
        originalTransactionId: purchaseRequisition.transactionId,
        splitReason,
        splitIndex: index + 1,
        splitTotal: splitItems.length,
        status: 'PENDING_HOD_APPROVAL',
        hodStatus: 'Pending',
        financeStatus: 'Pending',
        history: [
          ...purchaseRequisition.history,
          {
            status: 'Split Created',
            date: new Date(),
            by: 'Finance Manager',
            transactionId: generateTransactionId('PR'),
            action: 'SPLIT_TRANSACTION',
            comments: `Split from ${purchaseRequisition.transactionId}: ${splitReason}`
          }
        ]
      }));

      // Update original with remaining amount
      const remainingAmount = getRemainingAmount();
      const originalUpdate = {
        ...purchaseRequisition,
        totalAmount: remainingAmount,
        description: `${purchaseRequisition.description} (Remaining after split)`,
        isSplit: true,
        splitReason,
        history: [
          ...purchaseRequisition.history,
          {
            status: 'Split Processed',
            date: new Date(),
            by: 'Finance Manager',
            transactionId: purchaseRequisition.transactionId,
            action: 'PROCESS_SPLIT',
            comments: `Transaction split into ${splitItems.length} parts. Reason: ${splitReason}`
          }
        ]
      };

      if (onSplit) {
        onSplit({
          splitTransactions,
          originalUpdate,
          splitReason
        });
      }

      toast({
        title: "Transaction Split Successfully",
        description: `Created ${splitItems.length} new transactions successfully.`
      });

      onClose();
    } catch (error) {
      console.error('Split error:', error);
      toast({
        title: "Split Failed",
        description: "There was an error splitting the transaction.",
        variant: "destructive"
      });
    }
  };

  const handleFinalize = async () => {
    if (!decision) {
      toast({
        title: "Decision Required",
        description: "Please select approve or decline.",
        variant: "destructive"
      });
      return;
    }

    if (!comments.trim()) {
      toast({
        title: "Comments Required",
        description: "Please provide comments for your decision.",
        variant: "destructive"
      });
      return;
    }

    if (decision === 'approve' && actionRole === 'Finance' && !budgetApproval.trim()) {
      toast({
        title: "Budget Approval Required",
        description: "Finance approval requires budget confirmation.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const finalizationData = {
        decision,
        comments,
        paymentTerms: decision === 'approve' ? paymentTerms : '',
        supplierDetails: decision === 'approve' ? supplierDetails : '',
        expectedDeliveryDate: decision === 'approve' ? expectedDeliveryDate : '',
        budgetApproval: decision === 'approve' ? budgetApproval : '',
        riskAssessment,
        complianceNotes,
        alternativeOptions: decision === 'decline' ? alternativeOptions : '',
        priority,
        actionRole,
        finalizedBy: 'Current User', // Replace with actual user
        finalizedAt: new Date(),
        transactionId: purchaseRequisition.transactionId
      };

      onFinalize(finalizationData);

      // Show success notification
      toast({
        title: decision === 'approve' ? '✅ PR Approved' : '❌ PR Declined',
        description: `PR ${purchaseRequisition.transactionId} has been ${decision === 'approve' ? 'approved' : 'declined'} by ${actionRole}. ${comments}`,
        variant: decision === 'approve' ? 'default' : 'destructive'
      });

      toast({
        title: `PR ${decision === 'approve' ? 'Approved' : 'Declined'}`,
        description: `Purchase requisition has been ${decision === 'approve' ? 'approved' : 'declined'} successfully.`
      });
      
      onClose();
    } catch (error) {
      console.error('Finalization error:', error);
      toast({
        title: "Finalization Failed",
        description: "There was an error processing your decision.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `ZAR ${amount?.toLocaleString('en-ZA', { minimumFractionDigits: 2 }) || '0.00'}`;
  };

  const getDecisionIcon = () => {
    switch (decision) {
      case 'approve': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'decline': return <XCircle className="h-5 w-5 text-red-600" />;
      default: return <Clock className="h-5 w-5 text-orange-600" />;
    }
  };

  const getDecisionColor = () => {
    switch (decision) {
      case 'approve': return 'border-green-500 bg-green-50';
      case 'decline': return 'border-red-500 bg-red-50';
      default: return 'border-gray-300 bg-white';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-blue-600" />
            {actionRole === 'HOD' ? 'Finalize Report' : 'Finance Approval'} - {purchaseRequisition?.transactionId}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* PR Summary */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="text-lg">Purchase Requisition Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label>Transaction ID</Label>
                  <p className="font-mono text-sm">{purchaseRequisition?.transactionId}</p>
                </div>
                <div>
                  <Label>Total Amount</Label>
                  <p className="font-bold text-green-600">{formatCurrency(purchaseRequisition?.totalAmount)}</p>
                </div>
                <div>
                  <Label>Requestor</Label>
                  <p>{purchaseRequisition?.requestedByName}</p>
                  <p className="text-sm text-muted-foreground">{purchaseRequisition?.requestedByDepartment}</p>
                </div>
                <div>
                  <Label>Current Priority</Label>
                  <Badge className={
                    purchaseRequisition?.urgencyLevel === 'URGENT' ? 'bg-red-100 text-red-800' :
                    purchaseRequisition?.urgencyLevel === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }>
                    {purchaseRequisition?.urgencyLevel}
                  </Badge>
                </div>
              </div>

              <div className="mt-4">
                <Label>Items Summary</Label>
                <div className="mt-2 space-y-2">
                  {purchaseRequisition?.items?.map((item: any, index: number) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-md">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{item.description}</p>
                          <p className="text-sm text-muted-foreground">
                            Qty: {item.quantity} × {formatCurrency(parseFloat(item.unitPrice))}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(parseFloat(item.totalPrice))}</p>
                          <Badge variant="outline" className="mt-1">
                            {item.vatClassification === 'VAT_APPLICABLE' ? 'VAT Incl.' : 'No VAT'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Decision Section */}
          <Card className={`${getDecisionColor()} transition-all duration-300`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getDecisionIcon()}
                {actionRole === 'HOD' ? 'HOD Decision' : 'Finance Decision'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Decision *</Label>
                  <RadioGroup value={decision} onValueChange={setDecision} className="mt-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="approve" id="approve" />
                      <Label htmlFor="approve" className="flex items-center gap-2 cursor-pointer">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        {actionRole === 'HOD' ? 'Finalize and Approve' : 'Approve for Payment'}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="decline" id="decline" />
                      <Label htmlFor="decline" className="flex items-center gap-2 cursor-pointer">
                        <XCircle className="h-4 w-4 text-red-600" />
                        Decline Request
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor="comments">
                    {decision === 'approve' ? 'Approval Comments' : 'Comments/Reason'} *
                  </Label>
                  <Textarea
                    id="comments"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder={
                      decision === 'approve' 
                        ? "Provide approval comments, any conditions, or next steps..."
                        : "Provide reason for decline and any alternative suggestions..."
                    }
                    rows={3}
                    className="mt-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Approval-specific fields */}
          {decision === 'approve' && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-green-800">Approval Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="paymentTerms">Payment Terms</Label>
                    <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment terms" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NET_30">NET 30 Days</SelectItem>
                        <SelectItem value="NET_60">NET 60 Days</SelectItem>
                        <SelectItem value="NET_90">NET 90 Days</SelectItem>
                        <SelectItem value="PREPAYMENT">Prepayment Required</SelectItem>
                        <SelectItem value="COD">Cash on Delivery</SelectItem>
                        <SelectItem value="CUSTOM">Custom Terms</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="expectedDelivery">Expected Delivery Date</Label>
                    <Input
                      id="expectedDelivery"
                      type="date"
                      value={expectedDeliveryDate}
                      onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="supplierDetails">Preferred/Approved Supplier Details</Label>
                  <Textarea
                    id="supplierDetails"
                    value={supplierDetails}
                    onChange={(e) => setSupplierDetails(e.target.value)}
                    placeholder="Supplier name, contact details, any specific requirements..."
                    rows={2}
                  />
                </div>

                {actionRole === 'Finance' && (
                  <div>
                    <Label htmlFor="budgetApproval">Budget Approval Confirmation *</Label>
                    <Select value={budgetApproval} onValueChange={setBudgetApproval}>
                      <SelectTrigger>
                        <SelectValue placeholder="Confirm budget availability" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BUDGET_CONFIRMED">Budget Confirmed Available</SelectItem>
                        <SelectItem value="BUDGET_ALLOCATED">Budget Specially Allocated</SelectItem>
                        <SelectItem value="BUDGET_APPROVED">Budget Pre-Approved</SelectItem>
                        <SelectItem value="BUDGET_PENDING">Budget Approval Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="priority">Adjust Priority Level</Label>
                  <Select value={priority} onValueChange={setPriority}>
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
              </CardContent>
            </Card>
          )}

          {/* Decline-specific fields */}
          {decision === 'decline' && (
            <Card className="bg-red-50 border-red-200">
              <CardHeader>
                <CardTitle className="text-red-800">Decline Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="alternativeOptions">Alternative Options/Suggestions</Label>
                  <Textarea
                    id="alternativeOptions"
                    value={alternativeOptions}
                    onChange={(e) => setAlternativeOptions(e.target.value)}
                    placeholder="Suggest alternatives, cost-effective options, or process improvements..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Assessment */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="riskAssessment">Risk Assessment</Label>
                <Textarea
                  id="riskAssessment"
                  value={riskAssessment}
                  onChange={(e) => setRiskAssessment(e.target.value)}
                  placeholder="Identify any risks, dependencies, or concerns..."
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="complianceNotes">Compliance & Policy Notes</Label>
                <Textarea
                  id="complianceNotes"
                  value={complianceNotes}
                  onChange={(e) => setComplianceNotes(e.target.value)}
                  placeholder="Any compliance requirements, policy adherence notes..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className={decision ? getDecisionColor() : 'bg-gray-50'}>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {getDecisionIcon()}
                  <span className="font-semibold">
                    {decision ? `${decision.toUpperCase()} by ${actionRole}` : 'Decision Pending'}
                  </span>
                </div>
                {decision && (
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(purchaseRequisition?.totalAmount)} • {purchaseRequisition?.transactionId}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Split Transaction Section - Finance Only */}
          {actionRole === 'Finance' && (
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Split className="h-5 w-5 text-purple-600" />
                  Split Transaction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-800 font-medium mb-2">
                      💡 How Split Works:
                    </p>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Split creates multiple transactions for different suppliers/categories</li>
                      <li>• <strong>Remainder</strong> = Original Amount - Split Total</li>
                      <li>• Always leave a remainder for additional items or adjustments</li>
                      <li>• Each split creates a new transaction row with unique ID</li>
                    </ul>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAutoSplit}
                      className="flex items-center gap-2"
                    >
                      <Split className="h-4 w-4" />
                      Auto Split (Leave Remainder)
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        // Example split: Different amounts with remainder
                        const originalAmount = purchaseRequisition.totalAmount;
                        const timestamp = Date.now();
                        setSplitItems([
                          {
                            id: `example_${timestamp}_1`,
                            description: 'Office Equipment & Furniture',
                            amount: Math.round(originalAmount * 0.6),
                            vatClassification: 'VAT_APPLICABLE',
                            category: 'Equipment'
                          },
                          {
                            id: `example_${timestamp}_2`,
                            description: 'IT Software & Licenses',
                            amount: Math.round(originalAmount * 0.2),
                            vatClassification: 'VAT_APPLICABLE',
                            category: 'Software'
                          }
                        ]);
                        setShowSplitSection(true);
                        setSplitReason('Split by category - Equipment (60%) and Software (20%) with 20% remainder');
                      }}
                      className="flex items-center gap-2 bg-blue-50 text-blue-700 border-blue-200"
                    >
                      <Calculator className="h-4 w-4" />
                      Example Split (60%+20%)
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsSplitModalOpen(true)}
                      className="flex items-center gap-2"
                    >
                      <Calculator className="h-4 w-4" />
                      Custom Split
                    </Button>

                    {showSplitSection && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addSplitItem}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Split Item
                      </Button>
                    )}
                  </div>

                  {showSplitSection && (
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="splitReason">Reason for Split *</Label>
                        <Textarea
                          id="splitReason"
                          value={splitReason}
                          onChange={(e) => setSplitReason(e.target.value)}
                          placeholder="e.g., Different suppliers, separate budget codes, delivery requirements..."
                          rows={2}
                        />
                      </div>

                      {splitItems.map((item, index) => (
                        <Card key={item.id} className="p-4 bg-purple-50">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium">Split Item {index + 1}</h4>
                            {splitItems.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSplitItem(item.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <Label>Preferred Supplier</Label>
                              <Input
                                value={item.description}
                                onChange={(e) => updateSplitItem(item.id, 'description', e.target.value)}
                                placeholder="e.g., Makro, Cashbuild"
                              />
                            </div>

                            <div>
                              <Label>Amount (ZAR)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.amount}
                                onChange={(e) => updateSplitItem(item.id, 'amount', parseFloat(e.target.value) || 0)}
                                placeholder="0.00"
                              />
                            </div>

                            <div>
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

                            <div>
                              <Label>Category</Label>
                              <Input
                                value={item.category}
                                onChange={(e) => updateSplitItem(item.id, 'category', e.target.value)}
                                placeholder="e.g., Office Supplies"
                              />
                            </div>
                          </div>
                        </Card>
                      ))}

                      {/* Split Summary */}
                      <Card className="bg-gray-50">
                        <CardContent className="pt-4">
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <Label>Original Amount</Label>
                              <p className="text-lg font-bold text-blue-600">
                                {formatCurrency(purchaseRequisition?.totalAmount)}
                              </p>
                            </div>
                            <div>
                              <Label>Split Total</Label>
                              <p className="text-lg font-bold text-purple-600">
                                {formatCurrency(calculateSplitTotal())}
                              </p>
                            </div>
                            <div>
                              <Label>Remainder</Label>
                              <p className={`text-lg font-bold ${
                                getRemainingAmount() > 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {formatCurrency(getRemainingAmount())}
                              </p>
                            </div>
                          </div>

                          {getRemainingAmount() <= 0 && (
                            <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-md flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                              <span className="text-red-800 text-sm">
                                Split amounts must be less than the original total and leave a positive remainder.
                              </span>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <Button
                        type="button"
                        onClick={handleSplitTransaction}
                        disabled={getRemainingAmount() <= 0 || !splitReason.trim()}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        Process Split Transaction
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleFinalize}
              disabled={isSubmitting || !decision}
              className={
                decision === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : decision === 'decline'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-gray-400'
              }
            >
              {isSubmitting ? 'Processing...' : `${decision === 'approve' ? 'Approve' : decision === 'decline' ? 'Decline' : 'Finalize'} PR`}
            </Button>
          </div>

          {/* Split PR Modal */}
          <SplitPRModal
            isOpen={isSplitModalOpen}
            onClose={() => setIsSplitModalOpen(false)}
            purchaseRequisition={purchaseRequisition}
            onSplit={(data) => {
              if (onSplit) onSplit(data);
              setIsSplitModalOpen(false);
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};



export default FinalizationModal;
