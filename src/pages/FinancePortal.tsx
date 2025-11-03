import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import PurchaseRequisitionForm from '../components/PurchaseRequisitionForm';
import PRListView from '../components/PRListView';
import SupplierManagement from '../components/SupplierManagement';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { RefreshCw, Package } from 'lucide-react';
import * as prService from '../services/purchaseRequisitionService';

const FinancePortal = () => {
  const { user } = useAuth();
  const [financePendingPRs, setFinancePendingPRs] = useState<any[]>([]);
  const [myPRs, setMyPRs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSupplierMgmt, setShowSupplierMgmt] = useState(false);
  const [hasOpenDialog, setHasOpenDialog] = useState(false);

  useEffect(() => {
    if (user?.id) {
      console.log('💰 FinancePortal: Loading purchase requisitions...');
      loadPurchaseRequisitions();

      // Auto-refresh Finance portal every 15 seconds, but skip if dialog is open
      const refreshInterval = setInterval(() => {
        if (!hasOpenDialog) {
          console.log('🔄 FinancePortal: Auto-refreshing...');
          loadPurchaseRequisitions();
        }
      }, 15000);

      return () => clearInterval(refreshInterval);
    }
  }, [user?.id, hasOpenDialog]);

  const loadPurchaseRequisitions = async () => {
    try {
      setIsLoading(true);
      console.log('📋 Loading Finance portal PRs...');

      const pendingPRs = await prService.getFinancePendingPRs(user?.organizationId);
      console.log('✅ Loaded Finance pending PRs:', pendingPRs?.length || 0);
      setFinancePendingPRs(pendingPRs || []);

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
      description: "Finance portal data has been updated.",
    });
  };

  const handleSubmitPR = async (newPR: any) => {
    try {
      if (!user?.organizationId) {
        toast({
          title: "Configuration Error",
          description: "Your user profile is not properly configured with an organization. Please contact your administrator.",
          variant: "destructive"
        });
        return;
      }

      const routedPR = {
        ...newPR,
        requestedBy: user?.id,
        requestedByName: user?.name,
        requestedByRole: user?.role,
        requestedByDepartment: user?.department,
        organizationId: user?.organizationId,
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
    } catch (error: any) {
      console.error('Error submitting PR:', error);
      toast({
        title: "Submission failed",
        description: error?.message || "Failed to submit PR.",
        variant: "destructive",
      });
    }
  };

  const handleFinanceApprove = async (prId: string, finalizationData: any) => {
    try {
      if (finalizationData.decision === 'approve') {
        await prService.approveRequisition(
          prId,
          'Finance',
          user?.name || user?.email || 'Unknown',
          finalizationData.comments
        );

        toast({
          title: "✅ PR Approved",
          description: `PR ${finalizationData.transactionId} has been approved for payment. ${finalizationData.comments}`,
        });
      } else {
        await prService.rejectRequisition(
          prId,
          'Finance',
          user?.name || user?.email || 'Unknown',
          finalizationData.comments || 'No reason provided'
        );

        toast({
          title: "❌ PR Declined",
          description: `PR ${finalizationData.transactionId} has been declined by Finance. ${finalizationData.comments}`,
          variant: "destructive"
        });
      }

      // Reload data immediately to show updated status in real-time
      setTimeout(() => {
        loadPurchaseRequisitions();
        console.log('✅ Finance portal refreshed after action');
      }, 500);
    } catch (error) {
      console.error('Error approving PR:', error);
      toast({
        title: "Update failed",
        description: "Failed to update PR status.",
        variant: "destructive",
      });
    }
  };

  const handleSplitPR = async (prId: string, splitData: any) => {
    try {
      const splitItems = splitData.splitPRs || [];

      if (splitItems.length === 0) {
        toast({
          title: "No Items Selected",
          description: "Please select at least one item to split.",
          variant: "destructive"
        });
        return;
      }

      console.log('📊 Splitting PR:', prId, 'with', splitItems.length, 'split items');

      // Use the proper split service which handles all the logic
      await prService.splitRequisition(
        prId,
        splitItems,
        user?.name || 'Unknown',
        'Finance'
      );

      // Reload data to show new split PRs
      await loadPurchaseRequisitions();

      toast({
        title: "Transaction Split Successfully",
        description: `Created ${splitItems.length} new PR${splitItems.length !== 1 ? 's' : ''}.`
      });
    } catch (error) {
      console.error('❌ Error splitting PR:', error);
      toast({
        title: "Split failed",
        description: error instanceof Error ? error.message : "Failed to split the purchase requisition.",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout title="Finance Portal">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">{showSupplierMgmt ? 'Supplier Management' : 'Finance Approval Queue'}</h2>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowSupplierMgmt(!showSupplierMgmt)}
              variant={showSupplierMgmt ? 'default' : 'outline'}
              size="sm"
              className="flex items-center gap-2"
            >
              <Package className="h-4 w-4" />
              {showSupplierMgmt ? 'Back to PRs' : 'Manage Suppliers'}
            </Button>
            {!showSupplierMgmt && (
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
            )}
          </div>
        </div>

        {showSupplierMgmt ? (
          <SupplierManagement />
        ) : (
          <>
            {financePendingPRs.length > 0 && (
              <PRListView
                purchaseRequisitions={financePendingPRs}
                showActions={true}
                actionRole="Finance"
                onFinalize={handleFinanceApprove}
                onSplit={handleSplitPR}
                onDialogOpenChange={setHasOpenDialog}
                title="Purchase Requisitions for Final Approval"
              />
            )}

            <PurchaseRequisitionForm onSubmit={handleSubmitPR} />
          </>
        )}
      </div>
    </Layout>
  );
};

export default FinancePortal;
