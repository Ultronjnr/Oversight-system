import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, User, Calendar, DollarSign, MessageSquare, Clock } from 'lucide-react';
import { Quote } from '../services/quoteService';

interface QuoteDetailsModalProps {
  quote: Quote | null;
  isOpen: boolean;
  onClose: () => void;
  showEmployeeName?: boolean;
}

const QuoteDetailsModal = ({ quote, isOpen, onClose, showEmployeeName = false }: QuoteDetailsModalProps) => {
  if (!quote) return null;

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Quote Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Quote Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{quote.item}</span>
                {getStatusBadge(quote.hodStatus, quote.financeStatus)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-500">Amount</p>
                    <p className="font-bold text-lg text-green-600">{quote.amount}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-500">Date Requested</p>
                    <p className="font-medium">{quote.date}</p>
                  </div>
                </div>
                {showEmployeeName && (
                  <div className="flex items-center col-span-2">
                    <User className="h-4 w-4 mr-2 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-500">Requested By</p>
                      <p className="font-medium">{quote.requestedByName}</p>
                      <p className="text-sm text-gray-500">{quote.requestedByRole}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-4 w-4 mr-2" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{quote.description}</p>
            </CardContent>
          </Card>

          {/* Comment */}
          {quote.comment && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Comment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{quote.comment}</p>
              </CardContent>
            </Card>
          )}

          {/* Approval Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Approval Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      quote.hodStatus === 'Approved' ? 'bg-green-500' : 
                      quote.hodStatus === 'Declined' ? 'bg-red-500' : 'bg-orange-500'
                    }`}></div>
                    <div>
                      <p className="font-medium">HOD Review</p>
                      <p className="text-sm text-gray-500">Head of Department</p>
                    </div>
                  </div>
                  <Badge variant={quote.hodStatus === 'Approved' ? 'default' : quote.hodStatus === 'Declined' ? 'destructive' : 'secondary'}>
                    {quote.hodStatus}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      quote.financeStatus === 'Approved' ? 'bg-green-500' : 
                      quote.financeStatus === 'Declined' ? 'bg-red-500' : 'bg-orange-500'
                    }`}></div>
                    <div>
                      <p className="font-medium">Finance Review</p>
                      <p className="text-sm text-gray-500">Finance Department</p>
                    </div>
                  </div>
                  <Badge variant={quote.financeStatus === 'Approved' ? 'default' : quote.financeStatus === 'Declined' ? 'destructive' : 'secondary'}>
                    {quote.financeStatus}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* History */}
          {quote.history && quote.history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Activity History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quote.history.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{entry.status}</p>
                        <p className="text-sm text-gray-500">{entry.by}</p>
                      </div>
                      <div className="text-sm text-gray-500 text-right">
                        {new Date(entry.date).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuoteDetailsModal;
