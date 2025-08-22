
import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Filter, Download, ArrowUpDown, Eye } from 'lucide-react';
import { Quote } from '../services/quoteService';

interface QuoteHistoryTableProps {
  quotes: Quote[];
  showEmployeeName?: boolean;
  canExport?: boolean;
  onExport?: () => void;
  onViewDetails?: (quote: Quote) => void;
  title: string;
}

const QuoteHistoryTable = ({ 
  quotes, 
  showEmployeeName = false, 
  canExport = false,
  onExport,
  onViewDetails,
  title 
}: QuoteHistoryTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState<keyof Quote>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const filteredAndSortedQuotes = useMemo(() => {
    let filtered = quotes;

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(quote => 
        quote.item.toLowerCase().includes(term) ||
        quote.requestedByName?.toLowerCase().includes(term) ||
        quote.description.toLowerCase().includes(term) ||
        quote.amount.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(quote => {
        switch (statusFilter) {
          case 'approved':
            return quote.financeStatus === 'Approved';
          case 'declined':
            return quote.financeStatus === 'Declined' || quote.hodStatus === 'Declined';
          case 'pending':
            return quote.financeStatus === 'Pending' && quote.hodStatus !== 'Declined';
          case 'finance-review':
            return quote.hodStatus === 'Approved' && quote.financeStatus === 'Pending';
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      // Handle date sorting
      if (sortField === 'date') {
        aValue = new Date(a[sortField] as string).getTime();
        bValue = new Date(b[sortField] as string).getTime();
      } else if (sortField === 'amount') {
        // Handle amount sorting
        aValue = parseFloat((a[sortField] as string).replace(/[^0-9.-]+/g, ''));
        bValue = parseFloat((b[sortField] as string).replace(/[^0-9.-]+/g, ''));
      } else {
        // Handle string sorting
        aValue = (a[sortField] as string) || '';
        bValue = (b[sortField] as string) || '';
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [quotes, searchTerm, statusFilter, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredAndSortedQuotes.length / itemsPerPage);
  const paginatedQuotes = filteredAndSortedQuotes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: keyof Quote) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: keyof Quote) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return (
      <ArrowUpDown 
        className={`h-4 w-4 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} 
      />
    );
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              {title}
            </div>
            {canExport && (
              <Button onClick={onExport} size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
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
              <SelectTrigger className="w-full md:w-48">
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

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center">
                    Date
                    {getSortIcon('date')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('item')}
                >
                  <div className="flex items-center">
                    Item
                    {getSortIcon('item')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center">
                    Amount
                    {getSortIcon('amount')}
                  </div>
                </TableHead>
                {showEmployeeName && (
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('requestedByName')}
                  >
                    <div className="flex items-center">
                      Employee
                      {getSortIcon('requestedByName')}
                    </div>
                  </TableHead>
                )}
                <TableHead>Status</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedQuotes.map((quote) => (
                <TableRow key={quote.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{quote.date}</TableCell>
                  <TableCell>{quote.item}</TableCell>
                  <TableCell className="font-medium text-green-600">{quote.amount}</TableCell>
                  {showEmployeeName && (
                    <TableCell>
                      <div>
                        <div className="font-medium">{quote.requestedByName}</div>
                        <div className="text-sm text-gray-500">{quote.requestedByRole}</div>
                      </div>
                    </TableCell>
                  )}
                  <TableCell>{getStatusBadge(quote.hodStatus, quote.financeStatus)}</TableCell>
                  <TableCell className="max-w-xs truncate" title={quote.description}>
                    {quote.description}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails?.(quote)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedQuotes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={showEmployeeName ? 7 : 6} className="text-center py-8 text-gray-500">
                    No quotes found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => setCurrentPage(page)}
                    isActive={currentPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Results Summary */}
      <div className="text-sm text-gray-500 text-center">
        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedQuotes.length)} of {filteredAndSortedQuotes.length} quotes
      </div>
    </div>
  );
};

export default QuoteHistoryTable;
