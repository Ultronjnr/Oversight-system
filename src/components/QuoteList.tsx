import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Filter, Download, RotateCcw } from 'lucide-react';
import { Quote } from '../services/quoteService';

interface QuoteListProps {
  quotes: Quote[];
  selectedQuote: Quote | null;
  onQuoteSelect: (quote: Quote) => void;
  showEmployeeName?: boolean;
  canExport?: boolean;
  onExport?: () => void;
  title: string;
}

const QuoteList = ({ 
  quotes, 
  selectedQuote,
  onQuoteSelect,
  showEmployeeName = false, 
  canExport = false,
  onExport,
  title 
}: QuoteListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const getStatusBadge = (hodStatus: string, financeStatus: string) => {
    if (financeStatus === 'Approved') {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
    }
    if (financeStatus === 'Declined' || hodStatus === 'Declined') {
      return <Badge variant="destructive">Declined</Badge>;
    }
    if (hodStatus === 'Approved' && financeStatus === 'Pending') {
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Finance Review</Badge>;
    }
    return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Pending</Badge>;
  };

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = !searchTerm || 
      quote.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.requestedByName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'approved' && quote.financeStatus === 'Approved') ||
      (statusFilter === 'declined' && (quote.financeStatus === 'Declined' || quote.hodStatus === 'Declined')) ||
      (statusFilter === 'pending' && quote.financeStatus === 'Pending' && quote.hodStatus !== 'Declined') ||
      (statusFilter === 'finance-review' && quote.hodStatus === 'Approved' && quote.financeStatus === 'Pending');

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="h-full flex flex-col">
      {/* Controls */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center">
              <RotateCcw className="h-5 w-5 mr-2" />
              <span className="text-sm sm:text-base">{title}</span>
            </div>
            {canExport && (
              <Button onClick={onExport} size="sm" className="self-start sm:self-auto">
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">Export</span>
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search quotes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="finance-review">Finance Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Quote List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {filteredQuotes.map((quote) => (
          <Card 
            key={quote.id} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedQuote?.id === quote.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
            }`}
            onClick={() => onQuoteSelect(quote)}
          >
            <CardContent className="p-3 sm:p-4">
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-base sm:text-lg truncate">{quote.item}</h3>
                  {showEmployeeName && (
                    <p className="text-sm text-gray-600 truncate">{quote.requestedByName}</p>
                  )}
                  <p className="text-sm font-medium text-red-600">{quote.amount}</p>
                </div>
                <div className="flex flex-col items-end flex-shrink-0">
                  <div className="mb-1">
                    {getStatusBadge(quote.hodStatus, quote.financeStatus)}
                  </div>
                  <p className="text-xs text-gray-500 whitespace-nowrap">{quote.date}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredQuotes.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No quotes found
          </div>
        )}
      </div>
    </div>
  );
};

export default QuoteList;
