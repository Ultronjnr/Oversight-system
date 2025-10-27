import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import PurchaseRequisitionForm from '../components/PurchaseRequisitionForm';
import PurchaseRequisitionTable from '../components/PurchaseRequisitionTable';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import * as prService from '../services/purchaseRequisitionService';

const EmployeePortal = () => {
  const { user } = useAuth();
  const [purchaseRequisitions, setPurchaseRequisitions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadPurchaseRequisitions();
    }
  }, [user]);

  const loadPurchaseRequisitions = async () => {
    try {
      setIsLoading(true);
      const userPRs = await prService.getUserPurchaseRequisitions(user!.id);
      setPurchaseRequisitions(userPRs || []);
    } catch (error) {
      console.error('Error loading PRs:', error);
      toast({
        title: "Error Loading PRs",
        description: "Failed to load your purchase requisitions.",
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
        setPurchaseRequisitions(prev => [...prev, createdPR]);
        toast({
          title: "Purchase Requisition Submitted",
          description: "Your PR has been submitted for HOD approval.",
        });
      }
    } catch (error) {
      console.error('Error submitting PR:', error);
      toast({
        title: "Submission failed",
        description: "There was an error submitting your PR.",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout title="Employee Portal">
      <div className="space-y-8">
        <PurchaseRequisitionForm onSubmit={handleSubmitPR} />
        <PurchaseRequisitionTable 
          purchaseRequisitions={purchaseRequisitions} 
          title="My Purchase Requisitions"
        />
      </div>
    </Layout>
  );
};

export default EmployeePortal;
