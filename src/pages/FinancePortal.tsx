import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import QuoteForm from '../components/QuoteForm';
import QuoteTable from '../components/QuoteTable';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { QuoteService } from '../services/quoteService';

const FinancePortal = () => {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [myQuotes, setMyQuotes] = useState<any[]>([]);

  useEffect(() => {
    loadQuotes();
  }, [user]);

  const loadQuotes = () => {
    const savedQuotes = localStorage.getItem('quotes');
    if (savedQuotes) {
      const allQuotes = JSON.parse(savedQuotes);
      
      // Quotes that need Finance review (HOD approved or escalated)
      const pendingQuotes = allQuotes.filter((quote: any) => 
        (quote.hodStatus === 'Approved' || quote.requestedByRole === 'Employee') && 
        quote.financeStatus === 'Pending' &&
        quote.requestedBy !== user?.id
      );
      
      // Quotes submitted by this Finance user
      const financeQuotes = allQuotes.filter((quote: any) => quote.requestedBy === user?.id);
      
      setQuotes(pendingQuotes);
      setMyQuotes(financeQuotes);
    }
  };

  const handleSubmitQuote = (newQuote: any) => {
    const savedQuotes = localStorage.getItem('quotes');
    const allQuotes = savedQuotes ? JSON.parse(savedQuotes) : [];
    
    // Route the quote through the approval process
    const routedQuote = QuoteService.routeQuoteRequest(newQuote, user?.role || 'Finance');
    
    allQuotes.push(routedQuote);
    localStorage.setItem('quotes', JSON.stringify(allQuotes));
    
    setMyQuotes(prev => [...prev, routedQuote]);
    
    toast({
      title: "Quote Submitted",
      description: "Your quote request has been submitted for approval.",
    });
  };

  const handleApprove = (quoteId: string) => {
    updateQuoteStatus(quoteId, 'Approved');
    toast({
      title: "Quote approved",
      description: "The quote has been given final approval.",
    });
  };

  const handleDecline = (quoteId: string) => {
    updateQuoteStatus(quoteId, 'Declined');
    toast({
      title: "Quote declined",
      description: "The quote has been declined by Finance.",
      variant: "destructive",
    });
  };

  const updateQuoteStatus = (quoteId: string, status: 'Approved' | 'Declined') => {
    const savedQuotes = localStorage.getItem('quotes');
    if (savedQuotes) {
      const allQuotes = JSON.parse(savedQuotes);
      const updatedQuotes = allQuotes.map((quote: any) => {
        if (quote.id === quoteId) {
          return {
            ...quote,
            financeStatus: status,
            history: [
              ...quote.history,
              {
                status: `Finance ${status}`,
                date: new Date(),
                by: user?.email,
              }
            ]
          };
        }
        return quote;
      });
      
      localStorage.setItem('quotes', JSON.stringify(updatedQuotes));
      loadQuotes(); // Reload to update the display
    }
  };

  return (
    <Layout title="Finance Portal">
      <div className="space-y-8">
        <QuoteTable 
          quotes={quotes}
          showEmployeeName={true}
          showActions={true}
          actionRole="Finance"
          onApprove={handleApprove}
          onDecline={handleDecline}
          title="Quotes for Final Approval"
        />
        
        <QuoteForm onSubmit={handleSubmitQuote} />
        
        <QuoteTable 
          quotes={myQuotes} 
          title="My Quote Requests"
        />
      </div>
    </Layout>
  );
};

export default FinancePortal;
