import { useAuth } from '../contexts/AuthContext';

export interface Quote {
  id: string;
  date: string;
  item: string;
  amount: string;
  description: string;
  comment: string;
  requestedBy: string;
  requestedByName: string;
  requestedByRole: string;
  requestedByDepartment?: string;
  hodStatus: 'Pending' | 'Approved' | 'Declined';
  financeStatus: 'Pending' | 'Approved' | 'Declined';
  history: Array<{
    status: string;
    date: Date;
    by: string;
  }>;
  sourceDocument?: File | null;
  documentUrl?: string;
  documentType?: string;
  documentName?: string;
}

export class QuoteService {
  static getAllQuotes(): Quote[] {
    const savedQuotes = localStorage.getItem('quotes');
    return savedQuotes ? JSON.parse(savedQuotes) : [];
  }

  static getQuotesForEmployee(userId: string): Quote[] {
    const allQuotes = this.getAllQuotes();
    return allQuotes.filter(quote => quote.requestedBy === userId);
  }

  static getQuotesForHOD(userId: string, department?: string): Quote[] {
    const allQuotes = this.getAllQuotes();
    // HOD sees quotes from employees in their department + their own quotes
    return allQuotes.filter(quote => {
      const isOwnQuote = quote.requestedBy === userId;
      const isDepartmentQuote = department && 
        quote.requestedByRole === 'Employee' && 
        quote.requestedByDepartment === department;
      return isOwnQuote || isDepartmentQuote;
    });
  }

  static getQuotesForFinance(): Quote[] {
    // Finance has full oversight - sees all quotes
    return this.getAllQuotes();
  }

  static getQuotesByRole(userRole: string, userId: string, department?: string): Quote[] {
    switch (userRole) {
      case 'Employee':
        return this.getQuotesForEmployee(userId);
      case 'HOD':
        return this.getQuotesForHOD(userId, department);
      case 'Finance':
        return this.getQuotesForFinance();
      default:
        return [];
    }
  }

  static searchQuotes(quotes: Quote[], searchTerm: string): Quote[] {
    if (!searchTerm) return quotes;
    
    const term = searchTerm.toLowerCase();
    return quotes.filter(quote => 
      quote.item.toLowerCase().includes(term) ||
      quote.requestedByName.toLowerCase().includes(term) ||
      quote.description.toLowerCase().includes(term) ||
      quote.comment.toLowerCase().includes(term)
    );
  }

  static filterQuotesByStatus(quotes: Quote[], statusFilter: string): Quote[] {
    if (statusFilter === 'all') return quotes;
    
    return quotes.filter(quote => {
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

  static exportQuotes(quotes: Quote[]): void {
    const csvContent = this.quotesToCSV(quotes);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `quotes_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  static generateQuoteReport(quoteDetails: any): string {
    const headers = ['Field', 'Value'];
    const rows = [
      ['Item', quoteDetails.item],
      ['Amount', quoteDetails.amount],
      ['Date', quoteDetails.date],
      ['Requested By', quoteDetails.requestedBy],
      ['Description', quoteDetails.description.replace(/,/g, ';')],
      ['Comment', (quoteDetails.comment || '').replace(/,/g, ';')],
      ['HOD Status', quoteDetails.hodStatus],
      ['Finance Status', quoteDetails.financeStatus],
      ['Document', quoteDetails.documentName || 'None'],
      ['Final Status', this.getQuoteStatus({ hodStatus: quoteDetails.hodStatus, financeStatus: quoteDetails.financeStatus } as Quote)]
    ];

    let csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    
    if (quoteDetails.history && quoteDetails.history.length > 0) {
      csvContent += '\n\nApproval History:\n';
      csvContent += 'Status,Date,By\n';
      quoteDetails.history.forEach((entry: any) => {
        csvContent += `${entry.status},"${new Date(entry.date).toLocaleString()}",${entry.by}\n`;
      });
    }

    return csvContent;
  }

  static checkHODAvailability(): boolean {
    // Mock function - in real implementation, this would check if HOD is available
    // For now, we'll return true (HOD is available)
    return true;
  }

  static routeQuoteRequest(quote: Quote, requestorRole: string): Quote {
    const isHODAvailable = this.checkHODAvailability();
    
    if (requestorRole === 'HOD' || requestorRole === 'Finance') {
      // HOD and Finance requests still go through approval process
      if (isHODAvailable) {
        return {
          ...quote,
          hodStatus: 'Pending',
          financeStatus: 'Pending'
        };
      } else {
        // If HOD is unavailable, route directly to Finance
        return {
          ...quote,
          hodStatus: 'Approved', // Auto-approved due to HOD unavailability
          financeStatus: 'Pending',
          history: [
            ...quote.history,
            {
              status: 'Auto-approved (HOD Unavailable)',
              date: new Date(),
              by: 'System'
            }
          ]
        };
      }
    }

    // Employee requests follow normal flow
    return quote;
  }

  private static quotesToCSV(quotes: Quote[]): string {
    const headers = ['Date', 'Employee', 'Item', 'Amount', 'Description', 'Status', 'Comment'];
    const rows = quotes.map(quote => [
      quote.date,
      quote.requestedByName,
      quote.item,
      quote.amount,
      quote.description.replace(/,/g, ';'), // Replace commas to avoid CSV issues
      this.getQuoteStatus(quote),
      (quote.comment || '').replace(/,/g, ';')
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private static getQuoteStatus(quote: Quote): string {
    if (quote.financeStatus === 'Approved') return 'Approved';
    if (quote.financeStatus === 'Declined' || quote.hodStatus === 'Declined') return 'Declined';
    if (quote.hodStatus === 'Approved' && quote.financeStatus === 'Pending') return 'Finance Review';
    return 'Pending';
  }
}
