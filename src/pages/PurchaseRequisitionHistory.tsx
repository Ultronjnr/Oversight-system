import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import * as prService from '../services/purchaseRequisitionService';
import PRListView from '../components/PRListView';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

const PurchaseRequisitionHistory = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadHistoryData();
    }
  }, [user]);

  const loadHistoryData = async () => {
    try {
      setIsLoading(true);
      let allPRs: any[] = [];

      if (user?.role === 'Employee') {
        // Employee sees only their own PRs
        allPRs = await prService.getUserPurchaseRequisitions(user.id);
      } else if (user?.role === 'HOD') {
        // HOD sees all PRs from their department + their own PRs
        const departmentPRs = await prService.getHODPendingPRs(user.department, user?.organizationId);
        const myPRs = await prService.getUserPurchaseRequisitions(user.id);
        allPRs = [...departmentPRs, ...myPRs];
        // Remove duplicates by ID
        allPRs = Array.from(new Map(allPRs.map(pr => [pr.id, pr])).values());
      } else if (user?.role === 'Finance' || user?.role === 'Admin' || user?.role === 'SuperUser') {
        // Finance and Admin see all PRs in their organization
        allPRs = await prService.getAllPurchaseRequisitions();
      }

      // Sort by most recent first
      allPRs.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setRecords(allPRs);
      console.log('✅ Loaded PR history:', allPRs.length, 'records');
    } catch (error) {
      console.error('Error loading PR history:', error);
      toast({
        title: "Error Loading History",
        description: "Failed to load purchase requisition history.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadHistoryData();
    setIsRefreshing(false);
    toast({
      title: "History Refreshed",
      description: "Purchase requisition history has been updated.",
    });
  };

  return (
    <Layout title="Purchase Requisition History">
      <div className="space-y-6">
        {/* Header - Refresh button only (PRListView provides the title) */}
        <div className="flex justify-end">
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {/* PR List View */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading purchase requisition history...</div>
        ) : records.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No purchase requisitions found</div>
        ) : (
          <PRListView
            purchaseRequisitions={records}
            title={`All Purchase Requisitions (${records.length})`}
          />
        )}
      </div>
    </Layout>
  );
};

export default PurchaseRequisitionHistory;
