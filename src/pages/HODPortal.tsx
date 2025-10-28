import React, { useState, useEffect } from 'react';
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import PurchaseRequisitionForm from '../components/PurchaseRequisitionForm';
import PurchaseRequisitionTable from '../components/PurchaseRequisitionTable';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import * as prService from '../services/purchaseRequisitionService';

const HODPortal = () => {
  const { user } = useAuth();
  const [pendingPRs, setPendingPRs] = useState<any[]>([]);
  const [myPRs, setMyPRs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadPurchaseRequisitions();

      // Auto-refresh HOD portal every 30 seconds to show new submissions from employees
      const refreshInterval = setInterval(() => {
        console.log('🔄 Auto-refreshing HOD portal...');
        loadPurchaseRequisitions();
      }, 30000);

      return () => clearInterval(refreshInterval);
    }
  }, [user]);

  const loadPurchaseRequisitions = async () => {
    try {
      setIsLoading(true);
      console.log('📋 Loading HOD portal PRs for department:', user?.department);

      if (user?.department) {
        const hodPendingPRs = await prService.getHODPendingPRs(user.department);
        console.log('✅ Loaded HOD pending PRs:', hodPendingPRs?.length || 0);
        setPendingPRs(hodPendingPRs || []);
      }

      const myPurchaseRequisitions = await prService.getUserPurchaseRequisitions(user!.id);
      setMyPRs(myPurchaseRequisitions || []);
    } catch (error) {
      console.error('Error loading PRs:', error);
      toast({
        title: "Error Loading PRs",
        description: "Failed to load purchase requisitions.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadPurchaseRequisitions();
    setIsRefreshing(false);
    toast({
      title: "Refreshed",
      description: "HOD portal data has been updated.",
    });
  };

  const handleSubmitPR = async (newPR: any) => {
    try {
      const routedPR = {
        ...newPR,
        requestedBy: user?.id,
        requestedByName: user?.name,
        requestedByRole: user?.role,
        requestedByDepartment: user?.department,
        hodStatus: 'Pending',
        financeStatus: 'Pending',
        status: 'PENDING_HOD_APPROVAL'
      };

      const createdPR = await prService.createPurchaseRequisition(routedPR);
      
      if (createdPR) {
        setMyPRs(prev => [...prev, createdPR]);
        toast({
          title: "Purchase Requisition Submitted",
          description: "Your PR has been submitted for approval.",
        });
      }
    } catch (error) {
      console.error('Error submitting PR:', error);
      toast({
        title: "Submission failed",
        description: "Failed to submit PR.",
        variant: "destructive",
      });
    }
  };

  const handleHODFinalize = async (prId: string, finalizationData: any) => {
    try {
      if (finalizationData.decision === 'approve') {
        await prService.approveRequisition(
          prId,
          'HOD',
          user?.name || user?.email || 'Unknown',
          finalizationData.comments
        );

        toast({
          title: "✅ PR Approved",
          description: `PR ${finalizationData.transactionId} has been approved by HOD. Sent to Finance for review. ${finalizationData.comments}`,
        });
      } else {
        await prService.rejectRequisition(
          prId,
          'HOD',
          user?.name || user?.email || 'Unknown',
          finalizationData.comments || 'No reason provided'
        );

        toast({
          title: "❌ PR Declined",
          description: `PR ${finalizationData.transactionId} has been declined by HOD. ${finalizationData.comments}`,
          variant: "destructive"
        });
      }

      // Reload data immediately to show updated status in real-time
      setTimeout(() => {
        loadPurchaseRequisitions();
        console.log('✅ HOD portal refreshed after action');
      }, 500);
    } catch (error) {
      console.error('Error finalizing PR:', error);
      toast({
        title: "Update failed",
        description: "Failed to update PR status.",
        variant: "destructive",
      });
    }
  };

  const handleSplitPR = async (prId: string, splitData: any) => {
    try {
      const splitItems = splitData.splitPRs || splitData.splitTransactions || [];
      
      const originalPR = pendingPRs.find(pr => pr.id === prId);
      if (originalPR) {
        const updatedPR = {
          ...originalPR,
          ...splitData.originalUpdate,
          updated_at: new Date().toISOString()
        };

        await prService.updatePRStatus(prId, undefined, undefined, updatedPR);
        
        for (const splitPR of splitItems) {
          await prService.createPurchaseRequisition(splitPR);
        }

        await loadPurchaseRequisitions();

        toast({
          title: "Transaction Split Successfully",
          description: `Created ${splitItems.length} new PRs.`
        });
      }
    } catch (error) {
      console.error('Error splitting PR:', error);
      toast({
        title: "Split failed",
        description: "Failed to split the purchase requisition.",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout title="Head of Department Portal">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Department Approval Queue</h2>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {pendingPRs.length > 0 && (
          <PurchaseRequisitionTable
            purchaseRequisitions={pendingPRs}
            showEmployeeName={true}
            showActions={true}
            actionRole="HOD"
            onFinalize={handleHODFinalize}
            onSplit={handleSplitPR}
            title="Pending Employee Purchase Requisitions"
          />
        )}
        
        <PurchaseRequisitionForm onSubmit={handleSubmitPR} />
        
        <PurchaseRequisitionTable 
          purchaseRequisitions={myPRs} 
          title="My Purchase Requisitions"
        />
      </div>
    </Layout>
  );
};

export default HODPortal;
