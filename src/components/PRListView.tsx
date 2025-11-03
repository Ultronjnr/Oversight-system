import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Check, Download, Eye, Split, AlertCircle } from 'lucide-react';
import PRHistory from './PRHistory';
import FinalizationModal from './FinalizationModal';
import SimpleItemSplitModal from './SimpleItemSplitModal';
import DocumentViewer from './DocumentViewer';

interface PRListViewProps {
  purchaseRequisitions: any[];
  showActions?: boolean;
  actionRole?: 'HOD' | 'Finance';
  onFinalize?: (prId: string, data: any) => void;
  onSplit?: (prId: string, splitData: any) => void;
  onDialogOpenChange?: (isOpen: boolean) => void;
  title: string;
}

const PRListView = ({
  purchaseRequisitions,
  showActions = false,
  actionRole,
  onFinalize,
  onSplit,
  onDialogOpenChange,
  title
}: PRListViewProps) => {
  const [selectedPR, setSelectedPR] = useState<any | null>(purchaseRequisitions[0] || null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isFinalizationOpen, setIsFinalizationOpen] = useState(false);
  const [isSplitOpen, setIsSplitOpen] = useState(false);
  const [approvedPRs, setApprovedPRs] = useState<Set<string>>(new Set());

  // Notify parent when any dialog state changes
  React.useEffect(() => {
    const hasOpenDialog = isFinalizationOpen || isSplitOpen;
    onDialogOpenChange?.(hasOpenDialog);
  }, [isFinalizationOpen, isSplitOpen, onDialogOpenChange]);

  const filteredPRs = purchaseRequisitions.filter(pr => {
    const matchesSearch = pr.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pr.requestedByName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'approved') return matchesSearch && pr.hodStatus === 'Approved' && pr.financeStatus === 'Approved';
    if (filterStatus === 'pending') return matchesSearch && (pr.hodStatus === 'Pending' || pr.financeStatus === 'Pending');
    if (filterStatus === 'rejected') return matchesSearch && (pr.hodStatus === 'Rejected' || pr.financeStatus === 'Rejected');
    return matchesSearch;
  });

  const getStatusBadge = (pr: any) => {
    if (pr.hodStatus === 'Approved' && pr.financeStatus === 'Approved') {
      return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
    }
    if (pr.hodStatus === 'Rejected' || pr.financeStatus === 'Rejected') {
      return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
    }
    if (actionRole === 'HOD' && pr.hodStatus === 'Pending') {
      return <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>;
    }
    if (actionRole === 'Finance' && pr.financeStatus === 'Pending') {
      return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
  };

  const handleFinalize = (data: any) => {
    if (selectedPR && onFinalize) {
      // Show approved indicator before it disappears
      setApprovedPRs(prev => new Set([...prev, selectedPR.id]));
      
      setTimeout(() => {
        onFinalize(selectedPR.id, data);
        setIsFinalizationOpen(false);
        
        // Select next PR after current one disappears
        const currentIndex = filteredPRs.findIndex(pr => pr.id === selectedPR.id);
        if (currentIndex >= 0 && currentIndex < filteredPRs.length - 1) {
          setSelectedPR(filteredPRs[currentIndex + 1]);
        } else if (currentIndex > 0) {
          setSelectedPR(filteredPRs[currentIndex - 1]);
        }
      }, 500);
    }
  };

  const handleSplit = (splitData: any) => {
    if (selectedPR && onSplit) {
      onSplit(selectedPR.id, splitData);
      setIsSplitOpen(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `ZAR ${(amount || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;
  };

  const downloadPRAsCSV = (pr: any) => {
    try {
      const headers = ['Field', 'Value'];
      const rows = [
        ['Transaction ID', pr.transactionId || ''],
        ['Date', pr.requestDate ? new Date(pr.requestDate).toLocaleDateString() : ''],
        ['Amount', formatCurrency(pr.totalAmount)],
        ['Department', pr.requestedByDepartment || ''],
        ['Requested By', pr.requestedByName || ''],
        ['Urgency', pr.urgencyLevel || ''],
        ['Status', pr.status || ''],
        ['HOD Status', pr.hodStatus || ''],
        ['Finance Status', pr.financeStatus || '']
      ];

      if (pr.items && pr.items.length > 0) {
        rows.push(['', '']);
        rows.push(['Items', '']);
        pr.items.forEach((item: any) => {
          rows.push([
            item.description,
            `Qty: ${item.quantity} × ${formatCurrency(parseFloat(item.unitPrice))} = ${formatCurrency(item.totalPrice)}`
          ]);
        });
      }

      if (pr.history && pr.history.length > 0) {
        rows.push(['', '']);
        rows.push(['Approval History', '']);
        pr.history.forEach((entry: any) => {
          rows.push([
            entry.action || 'Action',
            `${entry.by} - ${entry.timestamp ? new Date(entry.timestamp).toLocaleString() : ''}`
          ]);
        });
      }

      const csvContent = [headers, ...rows].map(row =>
        row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(',')
      ).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `PR_${pr.transactionId}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      console.log('✅ PR downloaded successfully');
    } catch (error: any) {
      console.error('❌ Failed to download PR:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Panel - PR List */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{title}</CardTitle>
            <div className="space-y-3 mt-4">
              <div>
                <Input
                  placeholder="Search by PR ID or requestor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-10"
                />
              </div>
              <div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-gray-600">
                {filteredPRs.length} PR{filteredPRs.length !== 1 ? 's' : ''}
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredPRs.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No PRs found</p>
              ) : (
                filteredPRs.map((pr) => (
                  <div
                    key={pr.id}
                    onClick={() => !approvedPRs.has(pr.id) && setSelectedPR(pr)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedPR?.id === pr.id
                        ? 'bg-blue-50 border-blue-300 shadow-md'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    } ${approvedPRs.has(pr.id) ? 'opacity-50 bg-green-50' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm font-semibold text-gray-900 truncate">
                          {pr.transactionId}
                        </p>
                        <p className="text-sm text-gray-600">{pr.requestedByName}</p>
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {formatCurrency(pr.totalAmount)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {approvedPRs.has(pr.id) && (
                          <Check className="h-5 w-5 text-green-600 animate-pulse" />
                        )}
                        {getStatusBadge(pr)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - PR Details */}
      <div className="lg:col-span-2">
        {selectedPR ? (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Quote Details</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{selectedPR.transactionId}</p>
                </div>
                <div className="flex gap-2">
                  {selectedPR.documentUrl && (
                    <Button size="sm" variant="outline" className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-600 font-semibold">Date</Label>
                    <p className="text-sm font-medium">
                      {selectedPR.requestDate ? new Date(selectedPR.requestDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600 font-semibold">Department</Label>
                    <p className="text-sm font-medium">{selectedPR.requestedByDepartment || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600 font-semibold">Amount</Label>
                    <p className="text-sm font-medium text-green-600">{formatCurrency(selectedPR.totalAmount)}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600 font-semibold">Urgency</Label>
                    <Badge className="mt-1">{selectedPR.urgencyLevel || 'Normal'}</Badge>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <Label className="text-xs text-gray-600 font-semibold mb-3 block">Items</Label>
                <div className="space-y-2">
                  {selectedPR.items?.map((item: any, idx: number) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-sm">{item.description}</p>
                      <p className="text-xs text-gray-600">
                        Qty: {item.quantity} × {formatCurrency(parseFloat(item.unitPrice))} = {formatCurrency(item.totalPrice)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Current Status */}
              <div>
                <Label className="text-xs text-gray-600 font-semibold">Current Status</Label>
                <div className="mt-2 flex gap-2">
                  {getStatusBadge(selectedPR)}
                  {actionRole === 'HOD' && (
                    <span className="text-xs text-gray-600">HOD: {selectedPR.hodStatus || 'Pending'}</span>
                  )}
                  {actionRole === 'Finance' && (
                    <span className="text-xs text-gray-600">Finance: {selectedPR.financeStatus || 'Pending'}</span>
                  )}
                </div>
              </div>

              {/* History */}
              {selectedPR.history && selectedPR.history.length > 0 && (
                <div>
                  <Label className="text-xs text-gray-600 font-semibold mb-3 block">Approval History</Label>
                  <div className="space-y-3">
                    {selectedPR.history.map((entry: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 p-2 bg-gray-50 rounded">
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-900">
                            {entry.action || 'Unknown Action'}
                          </p>
                          <p className="text-xs text-gray-600">{entry.by}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : ''}
                          </p>
                          {entry.comments && (
                            <p className="text-xs text-gray-600 italic mt-1">"{entry.comments}"</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t flex-wrap">
                <Button
                  onClick={() => downloadPRAsCSV(selectedPR)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                {showActions && actionRole && !approvedPRs.has(selectedPR.id) && (
                  <>
                    <Button
                      onClick={() => setIsSplitOpen(true)}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Split className="h-4 w-4" />
                      Split
                    </Button>
                    <Button
                      onClick={() => setIsFinalizationOpen(true)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      Finalize
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-12 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Select a PR to view details</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Finalization Modal */}
      {selectedPR && (
        <>
          <FinalizationModal
            isOpen={isFinalizationOpen}
            onClose={() => setIsFinalizationOpen(false)}
            purchaseRequisition={selectedPR}
            actionRole={actionRole!}
            onFinalize={handleFinalize}
            onSplit={() => setIsSplitOpen(true)}
          />

          <SimpleItemSplitModal
            isOpen={isSplitOpen}
            onClose={() => setIsSplitOpen(false)}
            purchaseRequisition={selectedPR}
            onSplit={handleSplit}
          />
        </>
      )}
    </div>
  );
};

export default PRListView;
