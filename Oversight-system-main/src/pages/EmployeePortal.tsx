
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import QuoteForm from '../components/QuoteForm';
import QuoteTable from '../components/QuoteTable';
import { useAuth } from '../contexts/AuthContext';

const EmployeePortal = () => {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<any[]>([]);

  useEffect(() => {
    // Load quotes from localStorage
    const savedQuotes = localStorage.getItem('quotes');
    if (savedQuotes) {
      const allQuotes = JSON.parse(savedQuotes);
      // Filter quotes submitted by this employee
      const employeeQuotes = allQuotes.filter((quote: any) => quote.requestedBy === user?.id);
      setQuotes(employeeQuotes);
    }
  }, [user]);

  const handleSubmitQuote = (newQuote: any) => {
    // Save to localStorage (mock database)
    const savedQuotes = localStorage.getItem('quotes');
    const allQuotes = savedQuotes ? JSON.parse(savedQuotes) : [];
    allQuotes.push(newQuote);
    localStorage.setItem('quotes', JSON.stringify(allQuotes));
    
    // Update local state
    setQuotes(prev => [...prev, newQuote]);
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
