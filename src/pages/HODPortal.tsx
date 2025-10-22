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

  useEffect(() => {
    loadQuotes();
  }, [user]);

  const loadQuotes = () => {
    const savedQuotes = localStorage.getItem('quotes');
    if (savedQuotes) {
      const allQuotes = JSON.parse(savedQuotes);
      
      // Employee-submitted quotes that need HOD review
      const pendingQuotes = allQuotes.filter((quote: any) => 
        quote.requestedByRole === 'Employee' && quote.hodStatus === 'Pending'
      );
      
      // Quotes submitted by this HOD
      const hodQuotes = allQuotes.filter((quote: any) => quote.requestedBy === user?.id);
      
      setQuotes(pendingQuotes);
      setMyQuotes(hodQuotes);
    }
  };

  const handleSubmitQuote = (newQuote: any) => {
    const savedQuotes = localStorage.getItem('quotes');
    const allQuotes = savedQuotes ? JSON.parse(savedQuotes) : [];
    
    // Route the quote through the approval process
    const routedQuote = QuoteService.routeQuoteRequest(newQuote, user?.role || 'HOD');
    
    allQuotes.push(routedQuote);
    localStorage.setItem('quotes', JSON.stringify(allQuotes));
    
    setMyQuotes(prev => [...prev, routedQuote]);
    
    toast({
      title: "Quote Submitted",
      description: "Your quote request has been submitted for approval.",
    });
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

  const updateQuoteStatus = (quoteId: string, status: 'Approved' | 'Declined') => {
    const savedQuotes = localStorage.getItem('quotes');
    if (savedQuotes) {
      const allQuotes = JSON.parse(savedQuotes);
      const updatedQuotes = allQuotes.map((quote: any) => {
        if (quote.id === quoteId) {
          return {
            ...quote,
            hodStatus: status,
            history: [
              ...quote.history,
              {
                status: `HOD ${status}`,
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
