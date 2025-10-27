import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import PurchaseRequisitionForm from '../components/PurchaseRequisitionForm';
import PurchaseRequisitionTable from '../components/PurchaseRequisitionTable';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import * as prService from '../services/purchaseRequisitionService';

const FinancePortal = () => {
  const { user } = useAuth();
  const [financePendingPRs, setFinancePendingPRs] = useState<any[]>([]);
  const [myPRs, setMyPRs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadPurchaseRequisitions();
    }
  }, [user]);

  const loadPurchaseRequisitions = async () => {
    try {
      setIsLoading(true);
      
      const pendingPRs = await prService.getFinancePendingPRs();
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

  const handleFinanceApprove = async (prId: string, finalizationData: any) => {
    try {
      const approveStatus = finalizationData.decision === 'approve' ? 'Approved' : 'Declined';
      
      await prService.updatePRStatus(prId, undefined, approveStatus, {
        history: [{
          status: `Finance ${approveStatus}`,
          date: new Date().toISOString(),
          by: user?.email,
          action: approveStatus === 'Approved' ? 'FINANCE_APPROVE' : 'FINANCE_DECLINE',
          comments: finalizationData.comments
        }]
      });

      await loadPurchaseRequisitions();
      
      toast({
        title: approveStatus === 'Approved' ? "PR Approved" : "PR Declined",
        description: approveStatus === 'Approved'
          ? "The purchase requisition has been given final approval."
          : "The purchase requisition has been declined by Finance.",
        variant: approveStatus === 'Approved' ? "default" : "destructive"
      });
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
      const splitItems = splitData.splitPRs || splitData.splitTransactions || [];
      
      const originalPR = financePendingPRs.find(pr => pr.id === prId);
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
    <Layout title="Finance Portal">
      <div className="space-y-8">
        {financePendingPRs.length > 0 && (
          <PurchaseRequisitionTable 
            purchaseRequisitions={financePendingPRs}
            showEmployeeName={true}
            showActions={true}
            actionRole="Finance"
            onFinalize={handleFinanceApprove}
            onSplit={handleSplitPR}
            title="Purchase Requisitions for Final Approval"
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

export default FinancePortal;
