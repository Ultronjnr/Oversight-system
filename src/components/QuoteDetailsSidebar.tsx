import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, User, Calendar, DollarSign, MessageSquare, Clock, Download, FileIcon } from 'lucide-react';
import { Quote } from '../services/quoteService';

interface QuoteDetailsSidebarProps {
  quote: Quote | null;
  showEmployeeName?: boolean;
  onDownload?: (quote: Quote) => void;
}

const QuoteDetailsSidebar = ({ quote, showEmployeeName = false, onDownload }: QuoteDetailsSidebarProps) => {
  if (!quote) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
        <Clock className="h-12 w-12 mb-4 text-gray-400" />
        <p className="text-lg font-medium">Select a quote to view details</p>
      </div>
    );
  }

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

  const handleDownload = () => {
    if (onDownload) {
      onDownload(quote);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-3 sm:p-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <h2 className="text-lg sm:text-xl font-semibold">Quote Details</h2>
        <Button onClick={handleDownload} variant="outline" size="sm" className="self-start sm:self-auto">
          <Download className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Download</span>
          <span className="sm:hidden">CSV</span>
        </Button>
      </div>

      {/* Quote Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-base sm:text-lg break-words">{quote.item}</span>
            <div className="flex-shrink-0">
              {getStatusBadge(quote.hodStatus, quote.financeStatus)}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-xl sm:text-2xl font-bold text-green-600 mb-4">{quote.amount}</div>
          
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            <div className="flex items-start text-sm">
              <Calendar className="h-4 w-4 mr-2 text-gray-500 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-gray-500">Date:</p>
                <p className="font-medium break-words">{quote.date}</p>
              </div>
            </div>

            {showEmployeeName && (
              <div className="flex items-start text-sm">
                <User className="h-4 w-4 mr-2 text-gray-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-gray-500">Requested by:</p>
                  <p className="font-medium break-words">{quote.requestedByName}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-base">
            <MessageSquare className="h-4 w-4 mr-2" />
            Description:
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 whitespace-pre-wrap break-words text-sm sm:text-base">{quote.description}</p>
        </CardContent>
      </Card>

      {/* Comment */}
      {quote.comment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <MessageSquare className="h-4 w-4 mr-2" />
              Comment:
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap break-words text-sm sm:text-base">{quote.comment}</p>
          </CardContent>
        </Card>
      )}

      {/* Source Document */}
      {quote.documentName && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <FileIcon className="h-4 w-4 mr-2" />
              Source Document:
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center p-2 bg-gray-50 rounded">
              <FileText className="h-4 w-4 mr-2 text-blue-600 flex-shrink-0" />
              <span className="text-sm font-medium break-words">{quote.documentName}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-base">
            <Clock className="h-4 w-4 mr-2" />
            Current Status:
          </CardTitle>
        </CardHeader>
        <CardContent>
          {getStatusBadge(quote.hodStatus, quote.financeStatus)}
        </CardContent>
      </Card>

      {/* Approval History */}
      {quote.history && quote.history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <Clock className="h-4 w-4 mr-2" />
              Approval History:
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {quote.history.map((entry, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 bg-gray-50 rounded gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm break-words">{entry.status}</p>
                    <p className="text-xs text-gray-500 break-words">{entry.by}</p>
                  </div>
                  <div className="text-xs text-gray-500 sm:text-right flex-shrink-0">
                    <div className="flex flex-col sm:items-end">
                      <span>{new Date(entry.date).toLocaleDateString()}</span>
                      <span>{new Date(entry.date).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QuoteDetailsSidebar;
