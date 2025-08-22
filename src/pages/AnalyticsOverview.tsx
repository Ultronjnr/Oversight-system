import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import DashboardStats from '../components/DashboardStats';
import AdvancedAnalytics from '../components/AdvancedAnalytics';
import { useAuth } from '../contexts/AuthContext';
import { useRoleBasedAccess } from '../hooks/useRoleBasedAccess';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp } from 'lucide-react';

const AnalyticsOverview = () => {
  const { user } = useAuth();
  const { userRole } = useRoleBasedAccess();
  const [allQuotes, setAllQuotes] = useState<any[]>([]);

  useEffect(() => {
    loadQuotes();
  }, [user]);

  const loadQuotes = () => {
    const savedQuotes = localStorage.getItem('quotes');
    if (savedQuotes) {
      const quotesData = JSON.parse(savedQuotes);
      setAllQuotes(quotesData);
    }
  };

  return (
    <Layout title="Analytics">
      <div className="space-y-8">
        <div className="animate-fade-in">
          <p className="text-muted-foreground">
            Comprehensive insights and statistics for procurement management with advanced filtering and analysis
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Advanced Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="animate-fade-in-up">
              <DashboardStats
                quotes={userRole === 'Finance' ? allQuotes : allQuotes.filter(quote => quote.requestedBy === user?.id)}
                userRole={userRole || 'Employee'}
              />
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <div className="animate-fade-in-up">
              <AdvancedAnalytics
                quotes={userRole === 'Finance' ? allQuotes : allQuotes.filter(quote => quote.requestedBy === user?.id)}
                userRole={userRole || 'Employee'}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AnalyticsOverview;
