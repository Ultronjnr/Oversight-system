import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import QuoteForm from '../components/QuoteForm';
import QuoteTable from '../components/QuoteTable';
import { useAuth } from '../contexts/AuthContext';
import { QuoteService } from '../services/quoteService';
import { toast } from '@/hooks/use-toast';

const EmployeePortal = () => {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadQuotes();
    }
  }, [user]);

  const loadQuotes = async () => {
    try {
      setIsLoading(true);
      const employeeQuotes = await QuoteService.getQuotesForEmployee(user!.id);
      setQuotes(employeeQuotes || []);
    } catch (error) {
      console.error('Error loading quotes:', error);
      toast({
        title: "Error Loading Quotes",
        description: "Failed to load your quote requests.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitQuote = async (newQuote: any) => {
    try {
      const createdQuote = await QuoteService.createQuote(newQuote);
      if (createdQuote) {
        setQuotes(prev => [...prev, createdQuote]);
        toast({
          title: "Quote submitted successfully",
          description: "Your quote request has been submitted for review.",
        });
      }
    } catch (error) {
      console.error('Error submitting quote:', error);
      toast({
        title: "Submission failed",
        description: "There was an error submitting your quote request.",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout title="Employee Portal">
      <div className="space-y-8">
        <QuoteForm onSubmit={handleSubmitQuote} />
        <QuoteTable 
          quotes={quotes} 
          title="My Quote Requests"
        />
      </div>
    </Layout>
  );
};

export default EmployeePortal;
