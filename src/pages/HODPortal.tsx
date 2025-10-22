import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import QuoteForm from '../components/QuoteForm';
import QuoteTable from '../components/QuoteTable';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { QuoteService } from '../services/quoteService';

const HODPortal = () => {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [myQuotes, setMyQuotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadQuotes();
    }
  }, [user]);

  const loadQuotes = async () => {
    try {
      setIsLoading(true);
      // Get quotes pending HOD review from department
      const pendingQuotes = await QuoteService.getQuotesForHOD(user!.id, user?.department);

      // Get HOD's own quotes
      const hodQuotes = await QuoteService.getQuotesForEmployee(user!.id);

      setQuotes(pendingQuotes || []);
      setMyQuotes(hodQuotes || []);
    } catch (error) {
      console.error('Error loading quotes:', error);
      toast({
        title: "Error Loading Quotes",
        description: "Failed to load quotes.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitQuote = async (newQuote: any) => {
    try {
      const routedQuote = QuoteService.routeQuoteRequest(newQuote, user?.role || 'HOD');
      const createdQuote = await QuoteService.createQuote(routedQuote);

      if (createdQuote) {
        setMyQuotes(prev => [...prev, createdQuote]);
        toast({
          title: "Quote Submitted",
          description: "Your quote request has been submitted for approval.",
        });
      }
    } catch (error) {
      console.error('Error submitting quote:', error);
      toast({
        title: "Submission failed",
        description: "Failed to submit quote request.",
        variant: "destructive",
      });
    }
  };

  const handleFinalize = (quoteId: string) => {
    updateQuoteStatus(quoteId, 'Approved');
    toast({
      title: "Report finalized",
      description: "The quote report has been finalized and sent to Finance for final approval.",
    });
  };

  const handleDecline = (quoteId: string) => {
    updateQuoteStatus(quoteId, 'Declined');
    toast({
      title: "Quote declined",
      description: "The quote has been declined.",
      variant: "destructive",
    });
  };

  const updateQuoteStatus = async (quoteId: string, status: 'Approved' | 'Declined') => {
    try {
      const updatedQuote = await QuoteService.updateQuoteStatus(quoteId, status, undefined, {
        history: [
          {
            status: `HOD ${status}`,
            date: new Date().toISOString(),
            by: user?.email,
          }
        ]
      });

      if (updatedQuote) {
        // Reload to update the display
        await loadQuotes();
      }
    } catch (error) {
      console.error('Error updating quote status:', error);
      toast({
        title: "Update failed",
        description: "Failed to update quote status.",
        variant: "destructive",
      });
    }
  };

  const handleQuoteUpdate = async (quoteId: string, updatedData: any) => {
    // Find the quote to update
    const quote = quotes.find(q => q.id === quoteId);
    if (quote) {
      const newStatus = updatedData.hodStatus || quote.hodStatus;
      await updateQuoteStatus(quoteId, newStatus);
    }
  };

  return (
    <Layout title="Head of Department Portal">
      <div className="space-y-8">
        <QuoteTable
          quotes={quotes}
          showEmployeeName={true}
          showActions={true}
          actionRole="HOD"
          onFinalize={handleFinalize}
          onDecline={handleDecline}
          title="Pending Employee Quotes"
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

export default HODPortal;
