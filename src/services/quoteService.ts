import { supabase } from '../lib/supabaseClient';

export interface Quote {
  id?: string;
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
    date: Date | string;
    by: string;
  }>;
  sourceDocument?: File | null;
  documentUrl?: string;
  documentType?: string;
  documentName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export class QuoteService {
  /**
   * Create a new quote in Supabase
   */
  static async createQuote(quote: Quote): Promise<Quote | null> {
    try {
      console.log('📝 Creating quote in Supabase:', { item: quote.item });

      const { data, error } = await supabase
        .from('quotes')
        .insert({
          date: quote.date,
          item: quote.item,
          amount: quote.amount,
          description: quote.description,
          comment: quote.comment,
          requested_by: quote.requestedBy,
          requested_by_name: quote.requestedByName,
          requested_by_role: quote.requestedByRole,
          requested_by_department: quote.requestedByDepartment || null,
          hod_status: quote.hodStatus,
          finance_status: quote.financeStatus,
          history: quote.history || [],
          document_url: quote.documentUrl || null,
          document_type: quote.documentType || null,
          document_name: quote.documentName || null,
        })
        .select();

      if (error) {
        console.error('❌ Error creating quote:', error);
        throw error;
      }

      const createdQuote = data?.[0];
      console.log('✅ Quote created successfully:', createdQuote?.id);
      return this.mapDbQuoteToQuote(createdQuote);
    } catch (error: any) {
      console.error('❌ Failed to create quote:', error.message);
      throw error;
    }
  }

  /**
   * Get all quotes for a specific user
   */
  static async getQuotesForEmployee(userId: string): Promise<Quote[]> {
    try {
      console.log('🔍 Fetching quotes for employee:', userId);

      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('requested_by', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching quotes:', error);
        throw error;
      }

      console.log('✅ Fetched employee quotes:', data?.length || 0);
      return (data || []).map(q => this.mapDbQuoteToQuote(q));
    } catch (error: any) {
      console.error('❌ Failed to fetch quotes:', error.message);
      return [];
    }
  }

  /**
   * Get quotes for HOD review (from their department)
   */
  static async getQuotesForHOD(userId: string, department?: string): Promise<Quote[]> {
    try {
      console.log('🔍 Fetching quotes for HOD:', { userId, department });

      // HOD sees quotes from their department that are pending their approval
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('requested_by_department', department || '')
        .eq('hod_status', 'Pending')
        .neq('requested_by', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching HOD quotes:', error);
        throw error;
      }

      console.log('✅ Fetched HOD pending quotes:', data?.length || 0);
      return (data || []).map(q => this.mapDbQuoteToQuote(q));
    } catch (error: any) {
      console.error('❌ Failed to fetch HOD quotes:', error.message);
      return [];
    }
  }

  /**
   * Get quotes for Finance review (all quotes with pending finance status)
   */
  static async getQuotesForFinance(): Promise<Quote[]> {
    try {
      console.log('🔍 Fetching quotes for Finance');

      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('finance_status', 'Pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching Finance quotes:', error);
        throw error;
      }

      console.log('✅ Fetched Finance pending quotes:', data?.length || 0);
      return (data || []).map(q => this.mapDbQuoteToQuote(q));
    } catch (error: any) {
      console.error('❌ Failed to fetch Finance quotes:', error.message);
      return [];
    }
  }

  /**
   * Get all quotes by role
   */
  static async getQuotesByRole(userRole: string, userId: string, department?: string): Promise<Quote[]> {
    switch (userRole) {
      case 'Employee':
        return this.getQuotesForEmployee(userId);
      case 'HOD':
        return this.getQuotesForHOD(userId, department);
      case 'Finance':
      case 'Admin':
        return this.getAllQuotes();
      default:
        return [];
    }
  }

  /**
   * Get all quotes (admin/finance view)
   */
  static async getAllQuotes(): Promise<Quote[]> {
    try {
      console.log('🔍 Fetching all quotes');

      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching all quotes:', error);
        throw error;
      }

      console.log('✅ Fetched all quotes:', data?.length || 0);
      return (data || []).map(q => this.mapDbQuoteToQuote(q));
    } catch (error: any) {
      console.error('❌ Failed to fetch all quotes:', error.message);
      return [];
    }
  }

  /**
   * Update quote status
   */
  static async updateQuoteStatus(
    quoteId: string,
    hodStatus?: string,
    financeStatus?: string,
    updatedData?: any
  ): Promise<Quote | null> {
    try {
      console.log('📝 Updating quote status:', { quoteId, hodStatus, financeStatus });

      const updateObj: any = {};
      if (hodStatus) updateObj.hod_status = hodStatus;
      if (financeStatus) updateObj.finance_status = financeStatus;
      if (updatedData?.history) updateObj.history = updatedData.history;
      if (updatedData?.comment) updateObj.comment = updatedData.comment;

      updateObj.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('quotes')
        .update(updateObj)
        .eq('id', quoteId)
        .select();

      if (error) {
        console.error('❌ Error updating quote:', error);
        throw error;
      }

      const updated = data?.[0];
      console.log('✅ Quote updated successfully');
      return updated ? this.mapDbQuoteToQuote(updated) : null;
    } catch (error: any) {
      console.error('❌ Failed to update quote:', error.message);
      throw error;
    }
  }

  /**
   * Search quotes
   */
  static async searchQuotes(quotes: Quote[], searchTerm: string): Promise<Quote[]> {
    if (!searchTerm) return quotes;

    const term = searchTerm.toLowerCase();
    return quotes.filter(quote =>
      quote.item.toLowerCase().includes(term) ||
      quote.requestedByName.toLowerCase().includes(term) ||
      quote.description.toLowerCase().includes(term) ||
      quote.comment.toLowerCase().includes(term)
    );
  }

  /**
   * Filter quotes by status
   */
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

  /**
   * Export quotes to CSV
   */
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

  /**
   * Generate quote report
   */
  static generateQuoteReport(quoteDetails: any): string {
    const headers = ['Field', 'Value'];
    const rows = [
      ['Item', quoteDetails.item],
      ['Amount', quoteDetails.amount],
      ['Date', quoteDetails.date],
      ['Requested By', quoteDetails.requestedByName],
      ['Description', quoteDetails.description.replace(/,/g, ';')],
      ['Comment', (quoteDetails.comment || '').replace(/,/g, ';')],
      ['HOD Status', quoteDetails.hodStatus],
      ['Finance Status', quoteDetails.financeStatus],
      ['Document', quoteDetails.documentName || 'None'],
      ['Final Status', this.getQuoteStatus(quoteDetails)]
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

  /**
   * Route quote request through approval process
   */
  static routeQuoteRequest(quote: Quote, requestorRole: string): Quote {
    const isHODAvailable = true; // Assume HOD is available

    if (requestorRole === 'HOD' || requestorRole === 'Finance') {
      if (isHODAvailable) {
        return {
          ...quote,
          hodStatus: 'Pending',
          financeStatus: 'Pending'
        };
      } else {
        return {
          ...quote,
          hodStatus: 'Approved',
          financeStatus: 'Pending',
          history: [
            ...quote.history,
            {
              status: 'Auto-approved (HOD Unavailable)',
              date: new Date().toISOString(),
              by: 'System'
            }
          ]
        };
      }
    }

    return quote;
  }

  /**
   * Helper: Convert DB quote to Quote interface
   */
  private static mapDbQuoteToQuote(dbQuote: any): Quote {
    return {
      id: dbQuote.id,
      date: dbQuote.date,
      item: dbQuote.item,
      amount: dbQuote.amount,
      description: dbQuote.description,
      comment: dbQuote.comment,
      requestedBy: dbQuote.requested_by,
      requestedByName: dbQuote.requested_by_name,
      requestedByRole: dbQuote.requested_by_role,
      requestedByDepartment: dbQuote.requested_by_department,
      hodStatus: dbQuote.hod_status,
      financeStatus: dbQuote.finance_status,
      history: dbQuote.history || [],
      documentUrl: dbQuote.document_url,
      documentType: dbQuote.document_type,
      documentName: dbQuote.document_name,
      createdAt: dbQuote.created_at,
      updatedAt: dbQuote.updated_at,
    };
  }

  private static quotesToCSV(quotes: Quote[]): string {
    const headers = ['Date', 'Employee', 'Item', 'Amount', 'Description', 'Status', 'Comment'];
    const rows = quotes.map(quote => [
      quote.date,
      quote.requestedByName,
      quote.item,
      quote.amount,
      quote.description.replace(/,/g, ';'),
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
