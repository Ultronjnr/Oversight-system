import React from 'react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { FileText, Check, X, Hash, Split, Eye, Calculator, Calendar, Building, History as HistoryIcon } from 'lucide-react';
import DocumentViewer from './DocumentViewer';
import SplitPRModal from './SplitPRModal';
import FinalizationModal from './FinalizationModal';
import PRHistory from './PRHistory';

interface PurchaseRequisition {
  id: string;
  transactionId?: string;
  type: string;
  requestDate: string;
  dueDate: string;
  paymentDueDate: string;
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
    vatClassification: 'VAT_APPLICABLE' | 'NO_VAT';
    technicalSpecs?: string;
    businessJustification?: string;
  }>;
  urgencyLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  department: string;
  budgetCode?: string;
  projectCode?: string;
  supplierPreference?: string;
  deliveryLocation?: string;
  specialInstructions?: string;
  requestedByName?: string;
  requestedByRole?: string;
  requestedByDepartment?: string;
  hodStatus: 'Pending' | 'Approved' | 'Declined';
  financeStatus: 'Pending' | 'Approved' | 'Declined';
  status: string;
  totalAmount: number;
  currency: string;
  history: Array<{
    status: string;
    date: Date;
    by: string;
    transactionId?: string;
    action: string;
    comments?: string;
  }>;
  sourceDocument?: File | null;
  documentUrl?: string;
  documentType?: string;
  documentName?: string;
  isSplit?: boolean;
  originalTransactionId?: string;
  splitItems?: Array<any>;
}

interface PurchaseRequisitionTableProps {
  purchaseRequisitions: PurchaseRequisition[];
  showEmployeeName?: boolean;
  showActions?: boolean;
  actionRole?: 'HOD' | 'Finance';
  onApprove?: (prId: string) => void;
  onDecline?: (prId: string) => void;
  onFinalize?: (prId: string, data: any) => void;
  onSplit?: (prId: string, splitData: any) => void;
  onRefresh?: () => void;
  title: string;
}

const PurchaseRequisitionTable = ({
  purchaseRequisitions,
  showEmployeeName = false,
  showActions = false,
  actionRole,
  onApprove,
  onDecline,
  onFinalize,
  onSplit,
  title
}: PurchaseRequisitionTableProps) => {
  const [selectedPR, setSelectedPR] = useState<PurchaseRequisition | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isSplitOpen, setIsSplitOpen] = useState(false);
  const [isFinalizationOpen, setIsFinalizationOpen] = useState(false);
  const [detailsTab, setDetailsTab] = useState<'items' | 'history'>('items');
  
  const getStatusBadge = (hodStatus: string, financeStatus: string, urgencyLevel: string) => {
    if (financeStatus === 'Approved') {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">✅ Approved</Badge>;
    }
    if (financeStatus === 'Declined' || hodStatus === 'Declined') {
      return <Badge variant="destructive">❌ Declined</Badge>;
    }
    if (hodStatus === 'Approved' && financeStatus === 'Pending') {
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">🔄 Finance Review</Badge>;
    }
    
    const urgencyClass = urgencyLevel === 'URGENT' ? 'animate-pulse bg-red-100 text-red-800' :
                        urgencyLevel === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800';
    
    return <Badge className={urgencyClass}>⏳ Pending {urgencyLevel !== 'NORMAL' ? `(${urgencyLevel})` : ''}</Badge>;
  };

  const getUrgencyBadge = (level: string) => {
    switch (level) {
      case 'LOW': return <Badge className="bg-green-100 text-green-800">Low</Badge>;
      case 'NORMAL': return <Badge className="bg-blue-100 text-blue-800">Normal</Badge>;
      case 'HIGH': return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
      case 'URGENT': return <Badge className="bg-red-100 text-red-800 animate-pulse">Urgent</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const canShowActions = (pr: PurchaseRequisition) => {
    if (!showActions) return false;
    
    if (actionRole === 'HOD') {
      return pr.hodStatus === 'Pending';
    }
    
    if (actionRole === 'Finance') {
      return (pr.hodStatus === 'Approved' || pr.hodStatus === 'Pending') && pr.financeStatus === 'Pending';
    }
    
    return false;
  };

  const hasDocument = (pr: PurchaseRequisition) => {
    return pr.sourceDocument || pr.documentUrl || pr.documentName;
  };

  const getDocumentInfo = (pr: PurchaseRequisition) => {
    return {
      fileName: pr.documentName || pr.sourceDocument?.name || 'Document',
      fileUrl: pr.documentUrl,
      fileType: pr.documentType || pr.sourceDocument?.type,
    };
  };

  const formatCurrency = (amount: number, currency: string = 'ZAR') => {
    return `${currency} ${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;
  };

  const handleSplitClick = (pr: PurchaseRequisition) => {
    setSelectedPR(pr);
    setIsSplitOpen(true);
  };

  const getDisplayPRs = () => {
    // Flatten split items to show as separate rows
    const displayPRs: (PurchaseRequisition & { isSplitItem?: boolean; splitParentId?: string })[] = [];

    for (const pr of purchaseRequisitions) {
      displayPRs.push(pr);

      // If PR has split items, add them as separate rows
      if (pr.splitItems && pr.splitItems.length > 0) {
        for (const splitItem of pr.splitItems) {
          displayPRs.push({
            ...splitItem,
            id: splitItem.id || `${pr.id}_split_${Math.random()}`,
            isSplitItem: true,
            splitParentId: pr.id,
          } as any);
        }
      }
    }

    return displayPRs;
  };

  const handleFinalizationClick = (pr: PurchaseRequisition) => {
    setSelectedPR(pr);
    setIsFinalizationOpen(true);
  };

  const handleViewDetails = (pr: PurchaseRequisition) => {
    setSelectedPR(pr);
    setIsDetailsOpen(true);
  };

  return (
    <>
      <Card className="glass-card premium-shadow hover-glow animate-fade-in-scale">
        <CardHeader>
          <CardTitle className="flex items-center gradient-text">
            <FileText className="h-5 w-5 mr-2" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {purchaseRequisitions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground animate-fade-in">
              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50 animate-pulse-slow" />
              <p className="text-lg font-medium">
                {title === "My Purchase Requisitions" ? "Dashboard Cleared" : "No purchase requisitions found"}
              </p>
              <p className="text-sm">
                {title === "My Purchase Requisitions"
                  ? "Your dashboard is now clean. All PRs are saved in Purchase Requisition History."
                  : "Submit your first purchase requisition to get started"
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left p-3 font-medium text-gray-700">PR Reference</th>
                    {showEmployeeName && (
                      <th className="text-left p-3 font-medium text-gray-700">Requestor</th>
                    )}
                    <th className="text-left p-3 font-medium text-gray-700">Items</th>
                    <th className="text-left p-3 font-medium text-gray-700">Amount</th>
                    <th className="text-left p-3 font-medium text-gray-700">Urgency</th>
                    <th className="text-left p-3 font-medium text-gray-700">Due Date</th>
                    <th className="text-left p-3 font-medium text-gray-700">Department</th>
                    <th className="text-left p-3 font-medium text-gray-700">Documents</th>
                    <th className="text-left p-3 font-medium text-gray-700">Status</th>
                    {showActions && (
                      <th className="text-left p-3 font-medium text-gray-700">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {getDisplayPRs().map((pr, index) => {
                    const docInfo = getDocumentInfo(pr);
                    
                    return (
                      <tr key={`${pr.id}-${pr.transactionId || index}`} className={`border-b border-border/50 transition-all duration-300 hover-lift ${pr.isSplitItem ? 'bg-purple-50/50 hover:bg-purple-100/50' : 'hover:bg-muted/50'}`}>
                        <td className="p-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 font-mono text-sm">
                              {pr.isSplitItem ? (
                                <Badge className="bg-purple-500">Split</Badge>
                              ) : (
                                <Hash className="h-3 w-3 text-muted-foreground" />
                              )}
                              <span className={`font-medium ${pr.isSplitItem ? 'text-purple-600' : 'text-blue-600'}`}>
                                {pr.transactionId || pr.description || 'N/A'}
                              </span>
                            </div>
                            {pr.isSplit && (
                              <Badge variant="outline" className="text-xs">
                                Split from {pr.originalTransactionId}
                              </Badge>
                            )}
                            {pr.isSplitItem && pr.splitParentId && (
                              <Badge variant="outline" className="text-xs bg-purple-50">
                                Part of split
                              </Badge>
                            )}
                            <div className="text-xs text-muted-foreground">
                              {new Date(pr.requestDate || new Date()).toLocaleDateString()}
                            </div>
                          </div>
                        </td>
                        {showEmployeeName && (
                          <td className="p-3">
                            <div>
                              <div className="font-medium text-foreground">{pr.requestedByName}</div>
                              <div className="text-sm text-muted-foreground">{pr.requestedByRole}</div>
                              <div className="text-xs text-muted-foreground">{pr.requestedByDepartment}</div>
                            </div>
                          </td>
                        )}
                        <td className="p-3">
                          <div className="space-y-1">
                            <div className="font-medium">
                              {pr.items.length === 1 ? pr.items[0].description : `${pr.items.length} items`}
                            </div>
                            {pr.items.length > 1 && (
                              <Button
                                variant="link"
                                size="sm"
                                className="p-0 h-auto text-xs"
                                onClick={() => handleViewDetails(pr)}
                              >
                                View all items
                              </Button>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-foreground">
                            {formatCurrency(pr.totalAmount || pr.amount || 0, pr.currency)}
                          </div>
                          {pr.isSplitItem && (
                            <div className="text-xs text-purple-600 font-semibold">
                              Split Item
                            </div>
                          )}
                          {pr.budgetCode && (
                            <div className="text-xs text-muted-foreground">
                              Budget: {pr.budgetCode}
                            </div>
                          )}
                          {pr.category && (
                            <div className="text-xs text-muted-foreground">
                              Category: {pr.category}
                            </div>
                          )}
                        </td>
                        <td className="p-3">{getUrgencyBadge(pr.urgencyLevel)}</td>
                        <td className="p-3">
                          <div className="text-sm">
                            <div>Approval: {new Date(pr.dueDate).toLocaleDateString()}</div>
                            <div className="text-xs text-muted-foreground">
                              Payment: {new Date(pr.paymentDueDate).toLocaleDateString()}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <Building className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{pr.department}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          {hasDocument(pr) ? (
                            <DocumentViewer
                              fileName={docInfo.fileName}
                              fileUrl={docInfo.fileUrl}
                              fileType={docInfo.fileType}
                              quoteId={pr.id}
                            />
                          ) : (
                            <span className="text-muted-foreground text-sm">No document</span>
                          )}
                        </td>
                        <td className="p-3">{getStatusBadge(pr.hodStatus, pr.financeStatus, pr.urgencyLevel)}</td>
                        {showActions && (
                          <td className="p-3">
                            {canShowActions(pr) ? (
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  className={`${actionRole === 'HOD' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'} text-white hover-scale btn-shimmer`}
                                  onClick={() => handleFinalizationClick(pr)}
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  Finalize
                                </Button>
                                {/* Only show Split for HOD and Finance, not Employee */}
                                {(actionRole === 'HOD' || actionRole === 'Finance') && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-purple-600 border-purple-600 hover:bg-purple-50 hover-scale btn-shimmer"
                                    onClick={() => handleSplitClick(pr)}
                                  >
                                    <Split className="h-3 w-3 mr-1" />
                                    Split
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                {pr.hodStatus === 'Declined' || pr.financeStatus !== 'Pending' ? 'Completed' : 'Processed'}
                              </span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PR Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Purchase Requisition Details</DialogTitle>
          </DialogHeader>
          {selectedPR && (
            <div className="space-y-6">
              {/* Tabs */}
              <div className="flex gap-2 border-b">
                <Button
                  variant={detailsTab === 'items' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDetailsTab('items')}
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Items & Details
                </Button>
                <Button
                  variant={detailsTab === 'history' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDetailsTab('history')}
                  className="gap-2"
                >
                  <HistoryIcon className="h-4 w-4" />
                  History
                </Button>
              </div>

              {/* Items Tab */}
              {detailsTab === 'items' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="font-medium">Transaction ID</Label>
                      <p className="font-mono">{selectedPR.transactionId}</p>
                    </div>
                    <div>
                      <Label className="font-medium">Total Amount</Label>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(selectedPR.totalAmount, selectedPR.currency)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label className="font-medium">Items</Label>
                    <div className="space-y-2 mt-2">
                      {selectedPR.items.map((item, index) => (
                        <Card key={item.id} className="p-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="font-medium">{item.description}</p>
                              <p className="text-sm text-muted-foreground">
                                Qty: {item.quantity} × {formatCurrency(parseFloat(item.unitPrice), selectedPR.currency)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{formatCurrency(parseFloat(item.totalPrice), selectedPR.currency)}</p>
                              <Badge variant="outline" className="mt-1">
                                {item.vatClassification === 'VAT_APPLICABLE' ? 'VAT Incl.' : 'No VAT'}
                              </Badge>
                            </div>
                          </div>
                          {item.technicalSpecs && (
                            <div className="mt-2">
                              <Label className="text-xs">Technical Specs</Label>
                              <p className="text-sm">{item.technicalSpecs}</p>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* History Tab */}
              {detailsTab === 'history' && (
                <PRHistory
                  history={selectedPR.history || []}
                  transactionId={selectedPR.transactionId}
                  status={selectedPR.status}
                  createdAt={selectedPR.createdAt}
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Split Modal */}
      {selectedPR && (
        <SplitPRModal
          isOpen={isSplitOpen}
          onClose={() => setIsSplitOpen(false)}
          purchaseRequisition={selectedPR}
          onSplit={(splitData) => {
            onSplit?.(selectedPR.id, splitData);
            setIsSplitOpen(false);
          }}
        />
      )}

      {/* Finalization Modal */}
      {selectedPR && (
        <FinalizationModal
          isOpen={isFinalizationOpen}
          onClose={() => setIsFinalizationOpen(false)}
          purchaseRequisition={selectedPR}
          actionRole={actionRole || 'HOD'}
          onFinalize={(data) => {
            onFinalize?.(selectedPR.id, data);
            setIsFinalizationOpen(false);
          }}
          onSplit={(splitData) => {
            onSplit?.(selectedPR.id, splitData);
            setIsFinalizationOpen(false);
          }}
        />
      )}
    </>
  );
};



export default PurchaseRequisitionTable;
