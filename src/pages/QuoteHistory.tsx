import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import QuoteList from '../components/QuoteList';
import QuoteDetailsSidebar from '../components/QuoteDetailsSidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Users, User, Building } from 'lucide-react';
import { QuoteService, Quote } from '../services/quoteService';
import { useRoleBasedAccess } from '../hooks/useRoleBasedAccess';
import { toast } from '@/hooks/use-toast';

const QuoteHistory = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const {
    canViewAllQuotes,
    canExportQuotes,
    canViewDepartmentQuotes,
    getAccessLevel,
    getPageTitle,
    userRole,
    userId,
    userDepartment
  } = useRoleBasedAccess();

  useEffect(() => {
    loadQuotes();
  }, [userRole, userId, userDepartment]);

  const loadQuotes = async () => {
    if (!userRole || !userId) return;
    
    setIsLoading(true);
    try {
      // Show all Purchase Requisitions to all users in history page
      // Load from both possible storage keys for compatibility
      const savedPRs = localStorage.getItem('purchaseRequisitions');
      const savedQuotes = localStorage.getItem('quotes');

      let allQuotes = [];

      if (savedPRs) {
        allQuotes = [...allQuotes, ...JSON.parse(savedPRs)];
      }

      if (savedQuotes) {
        allQuotes = [...allQuotes, ...JSON.parse(savedQuotes)];
      }

      // Remove duplicates based on ID
      const uniqueQuotes = allQuotes.filter((quote, index, self) =>
        index === self.findIndex((q) => q.id === quote.id)
      );

      setQuotes(uniqueQuotes);
    } catch (error) {
      console.error('Error loading quotes:', error);
      toast({
        title: "Error",
        description: "Failed to load quotes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (!canExportQuotes()) {
      toast({
        title: "Access Denied",
        description: "Only Finance users can export quotes.",
        variant: "destructive",
      });
      return;
    }

    QuoteService.exportQuotes(quotes);
    toast({
      title: "Export Successful",
      description: `Exported ${quotes.length} quotes to CSV.`,
    });
  };

  const handleQuoteSelect = (quote: Quote) => {
    setSelectedQuote(quote);
  };

  const handleDownloadQuote = (quote: Quote) => {
    // Create a detailed quote report
    const quoteDetails = {
      item: quote.item,
      amount: quote.amount,
      date: quote.date,
      requestedBy: quote.requestedByName,
      description: quote.description,
      comment: quote.comment,
      hodStatus: quote.hodStatus,
      financeStatus: quote.financeStatus,
      documentName: quote.documentName,
      history: quote.history
    };

    const csvContent = QuoteService.generateQuoteReport(quoteDetails);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `quote_${quote.item}_${quote.date}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Download Successful",
      description: `Quote details for "${quote.item}" downloaded.`,
    });
  };

  const getAccessIcon = () => {
    switch (getAccessLevel()) {
      case 'full':
        return <Building className="h-5 w-5 mr-2 text-blue-600" />;
      case 'department':
        return <Users className="h-5 w-5 mr-2 text-green-600" />;
      case 'own':
        return <User className="h-5 w-5 mr-2 text-purple-600" />;
      default:
        return <User className="h-5 w-5 mr-2 text-gray-600" />;
    }
  };

  const getAccessDescription = () => {
    switch (getAccessLevel()) {
      case 'full':
        return 'Viewing all quotes across all departments';
      case 'department':
        return `Viewing quotes from ${userDepartment} department and your submissions`;
      case 'own':
        return 'Viewing your submitted quotes only';
      default:
        return 'Limited access';
    }
  };

  if (isLoading) {
    return (
      <Layout title={getPageTitle()}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={getPageTitle()}>
      <div className="space-y-6">
        {/* Access Level Info */}
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4">
            <div className="flex items-center">
              {getAccessIcon()}
              <div>
                <p className="font-medium text-gray-900">{getAccessDescription()}</p>
                <p className="text-sm text-gray-500">Access Level: {getAccessLevel().toUpperCase()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Responsive Layout */}
        <div className="flex flex-col xl:grid xl:grid-cols-2 gap-4 sm:gap-6 min-h-0">
          {/* Quote List */}
          <div className="min-h-0 h-[400px] xl:h-[calc(100vh-280px)]">
            <QuoteList
              quotes={quotes}
              selectedQuote={selectedQuote}
              onQuoteSelect={handleQuoteSelect}
              showEmployeeName={canViewDepartmentQuotes()}
              canExport={canExportQuotes()}
              onExport={handleExport}
              title={`All Quotes (${quotes.length})`}
            />
          </div>

          {/* Quote Details */}
          <div className="min-h-0 h-[400px] xl:h-[calc(100vh-280px)] bg-white border rounded-lg">
            <QuoteDetailsSidebar
              quote={selectedQuote}
              showEmployeeName={canViewDepartmentQuotes()}
              onDownload={handleDownloadQuote}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default QuoteHistory;
