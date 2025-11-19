import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Check, X, Hash, CheckSquare } from 'lucide-react';
import DocumentViewer from './DocumentViewer';

interface Quote {
  id: string;
  transactionId?: string;
  date: string;
  item: string;
  amount: string;
  description: string;
  comment: string;
  requestedByName?: string;
  requestedByRole?: string;
  hodStatus: 'Pending' | 'Approved' | 'Declined';
  financeStatus: 'Pending' | 'Approved' | 'Declined';
  history: Array<{
    status: string;
    date: Date;
    by: string;
    transactionId?: string;
  }>;
  sourceDocument?: File | null;
  documentUrl?: string;
  documentType?: string;
  documentName?: string;
}

interface QuoteTableProps {
  quotes: Quote[];
  showEmployeeName?: boolean;
  showActions?: boolean;
  actionRole?: 'HOD' | 'Finance';
  onApprove?: (quoteId: string) => void;
  onDecline?: (quoteId: string) => void;
  onFinalize?: (quoteId: string) => void;
  title: string;
}

const QuoteTable = ({
  quotes,
  showEmployeeName = false,
  showActions = false,
  actionRole,
  onApprove,
  onDecline,
  onFinalize,
  title
}: QuoteTableProps) => {
  
  const getStatusBadge = (hodStatus: string, financeStatus: string) => {
    if (financeStatus === 'Approved') {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">✅ Approved</Badge>;
    }
    if (financeStatus === 'Declined' || hodStatus === 'Declined') {
      return <Badge variant="destructive">❌ Declined</Badge>;
    }
    if (hodStatus === 'Approved' && financeStatus === 'Pending') {
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">🔄 Finance Review</Badge>;
    }
    return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">⏳ Pending</Badge>;
  };

  const canShowActions = (quote: Quote) => {
    if (!showActions) return false;
    
    if (actionRole === 'HOD') {
      return quote.hodStatus === 'Pending';
    }
    
    if (actionRole === 'Finance') {
      return (quote.hodStatus === 'Approved' || quote.hodStatus === 'Pending') && quote.financeStatus === 'Pending';
    }
    
    return false;
  };

  const hasDocument = (quote: Quote) => {
    return quote.sourceDocument || quote.documentUrl || quote.documentName;
  };

  const getDocumentInfo = (quote: Quote) => {
    return {
      fileName: quote.documentName || quote.sourceDocument?.name || 'Document',
      fileUrl: quote.documentUrl,
      fileType: quote.documentType || quote.sourceDocument?.type,
    };
  };

  return (
    <Card className="glass-card premium-shadow hover-glow animate-fade-in-scale">
      <CardHeader>
        <CardTitle className="flex items-center gradient-text">
          <FileText className="h-5 w-5 mr-2" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {quotes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground animate-fade-in">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50 animate-pulse-slow" />
            <p className="text-lg font-medium">No quotes found</p>
            <p className="text-sm">Submit your first quote request to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left p-3 font-medium text-gray-700">Transaction ID</th>
                  {showEmployeeName && (
                    <th className="text-left p-3 font-medium text-gray-700">Employee</th>
                  )}
                  <th className="text-left p-3 font-medium text-gray-700">Date</th>
                  <th className="text-left p-3 font-medium text-gray-700">Item</th>
                  <th className="text-left p-3 font-medium text-gray-700">Amount</th>
                  <th className="text-left p-3 font-medium text-gray-700">Source Document</th>
                  <th className="text-left p-3 font-medium text-gray-700">Description</th>
                  <th className="text-left p-3 font-medium text-gray-700">Status</th>
                  <th className="text-left p-3 font-medium text-gray-700">Comment</th>
                  {showActions && (
                    <th className="text-left p-3 font-medium text-gray-700">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {quotes.map((quote) => {
                  const docInfo = getDocumentInfo(quote);
                  
                  return (
                    <tr key={quote.id} className="border-b border-border/50 hover:bg-muted/50 transition-all duration-300 hover-lift">
                      <td className="p-3">
                        <div className="flex items-center gap-2 font-mono text-sm">
                          <Hash className="h-3 w-3 text-muted-foreground" />
                          <span className="text-blue-600 font-medium">
                            {quote.transactionId || 'N/A'}
                          </span>
                        </div>
                      </td>
                      {showEmployeeName && (
                        <td className="p-3">
                          <div>
                            <div className="font-medium text-foreground">{quote.requestedByName}</div>
                            <div className="text-sm text-muted-foreground">{quote.requestedByRole}</div>
                          </div>
                        </td>
                      )}
                      <td className="p-3 text-foreground">{quote.date}</td>
                      <td className="p-3 text-foreground">{quote.item}</td>
                      <td className="p-3 font-medium text-foreground">{quote.amount}</td>
                      <td className="p-3">
                        {hasDocument(quote) ? (
                          <DocumentViewer
                            fileName={docInfo.fileName}
                            fileUrl={docInfo.fileUrl}
                            fileType={docInfo.fileType}
                            quoteId={quote.id}
                          />
                        ) : (
                          <span className="text-muted-foreground text-sm">No document</span>
                        )}
                      </td>
                      <td className="p-3 text-foreground max-w-xs truncate" title={quote.description}>
                        {quote.description}
                      </td>
                      <td className="p-3">{getStatusBadge(quote.hodStatus, quote.financeStatus)}</td>
                      <td className="p-3 text-muted-foreground max-w-xs truncate" title={quote.comment}>
                        {quote.comment || '-'}
                      </td>
                      {showActions && (
                        <td className="p-3">
                          {canShowActions(quote) ? (
                            <div className="flex space-x-2">
                              {actionRole === 'HOD' ? (
                                <>
                                  <Button
                                    size="sm"
                                    className="bg-blue-600 text-white hover:bg-blue-700 hover-scale btn-shimmer"
                                    onClick={() => onFinalize?.(quote.id)}
                                  >
                                    <CheckSquare className="h-3 w-3 mr-1" />
                                    Finalize Report
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 border-red-600 hover:bg-red-50 hover-scale btn-shimmer"
                                    onClick={() => onDecline?.(quote.id)}
                                  >
                                    <X className="h-3 w-3 mr-1" />
                                    Decline
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-green-600 border-green-600 hover:bg-green-50 hover-scale btn-shimmer"
                                    onClick={() => onApprove?.(quote.id)}
                                  >
                                    <Check className="h-3 w-3 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 border-red-600 hover:bg-red-50 hover-scale btn-shimmer"
                                    onClick={() => onDecline?.(quote.id)}
                                  >
                                    <X className="h-3 w-3 mr-1" />
                                    Decline
                                  </Button>
                                </>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              {quote.hodStatus === 'Declined' || quote.financeStatus !== 'Pending' ? 'Completed' : 'Processed'}
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
  );
};

export default QuoteTable;
