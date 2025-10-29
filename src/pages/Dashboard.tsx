import React from 'react';
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import PurchaseRequisitionForm from '../components/PurchaseRequisitionForm';
import PurchaseRequisitionTable from '../components/PurchaseRequisitionTable';
import DashboardStats from '../components/DashboardStats';
import { useAuth } from '../contexts/AuthContext';
import { useRoleBasedAccess } from '../hooks/useRoleBasedAccess';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Clock, CheckCircle, BarChart3, FileText, Shield, Settings, ShoppingCart, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as prService from '../services/purchaseRequisitionService';

const Dashboard = () => {
  const { user } = useAuth();
  const { userRole, getPageTitle } = useRoleBasedAccess();
  const navigate = useNavigate();
  const [myPurchaseRequisitions, setMyPurchaseRequisitions] = useState<any[]>([]);
  const [allPurchaseRequisitions, setAllPurchaseRequisitions] = useState<any[]>([]);
  const [pendingEmployeePRs, setPendingEmployeePRs] = useState<any[]>([]);
  const [financeApprovalPRs, setFinanceApprovalPRs] = useState<any[]>([]);
  const [isNewPROpen, setIsNewPROpen] = useState(false);
  const [isPendingPRsOpen, setIsPendingPRsOpen] = useState(false);
  const [isFinancePRsOpen, setIsFinancePRsOpen] = useState(false);
  const [dashboardCleared, setDashboardCleared] = useState(false);
  const [hasOpenDialog, setHasOpenDialog] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadPurchaseRequisitions();

      // Auto-refresh dashboard every 10 seconds, but skip if any dialog is open
      const refreshInterval = setInterval(() => {
        if (!hasOpenDialog && !isPendingPRsOpen && !isFinancePRsOpen) {
          console.log('🔄 Auto-refreshing dashboard...');
          loadPurchaseRequisitions();
        }
      }, 10000);

      return () => clearInterval(refreshInterval);
    }
  }, [user, userRole, hasOpenDialog, isPendingPRsOpen, isFinancePRsOpen]);

  const loadPurchaseRequisitions = async () => {
    try {
      if (!user?.id) return;

      const userPRs = await prService.getUserPurchaseRequisitions(user.id);
      setMyPurchaseRequisitions(userPRs || []);

      if (userRole === 'HOD' && user.department) {
        const hodPRs = await prService.getHODPendingPRs(user.department, user?.organizationId);
        setPendingEmployeePRs(hodPRs || []);
      }

      if (userRole === 'Finance') {
        const financePRs = await prService.getFinancePendingPRs(user?.organizationId);
        setFinanceApprovalPRs(financePRs || []);
      }

      if (userRole === 'Admin' || userRole === 'SuperUser') {
        const allPRs = await prService.getAllPurchaseRequisitions();
        setAllPurchaseRequisitions(allPRs || []);
      }
    } catch (error) {
      console.error('Error loading PRs:', error);
      toast({
        title: "Error Loading Data",
        description: "Failed to load purchase requisitions.",
        variant: "destructive"
      });
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
        organizationId: user?.organizationId,
        hodStatus: 'Pending',
        financeStatus: 'Pending',
        status: 'PENDING_HOD_APPROVAL'
      };

      console.log('📝 Submitting PR:', { transactionId: routedPR.transactionId, userRole });
      const savedPR = await prService.createPurchaseRequisition(routedPR);

      if (savedPR) {
        setMyPurchaseRequisitions(prev => [...prev, savedPR]);
        setIsNewPROpen(false);

        // Reload pending PRs based on user role
        if (userRole === 'HOD' && user?.department) {
          const hodPRs = await prService.getHODPendingPRs(user.department, user?.organizationId);
          setPendingEmployeePRs(hodPRs || []);
        }

        if (userRole === 'Finance') {
          const financePRs = await prService.getFinancePendingPRs(user?.organizationId);
          setFinanceApprovalPRs(financePRs || []);
        }

        toast({
          title: "Purchase Requisition Submitted",
          description: `Your PR (${routedPR.transactionId}) has been submitted for approval.`,
        });
      }
    } catch (error) {
      console.error('Error submitting PR:', error);
      toast({
        title: "Error",
        description: "Failed to submit purchase requisition.",
        variant: "destructive"
      });
    }
  };

  const handleHODFinalize = async (prId: string, finalizationData: any) => {
    try {
      const status = finalizationData.decision === 'approve' ? 'Approved' : 'Declined';
      
      if (finalizationData.decision === 'approve') {
        await prService.approveRequisition(
          prId,
          'HOD',
          user?.name || user?.email || 'Unknown',
          finalizationData.comments
        );

        toast({
          title: "✅ PR Approved by HOD",
          description: `PR ${finalizationData.transactionId} has been approved. Now awaiting Finance approval.`,
        });
      } else {
        await prService.rejectRequisition(
          prId,
          'HOD',
          user?.name || user?.email || 'Unknown',
          finalizationData.comments || 'No reason provided'
        );

        toast({
          title: "❌ PR Declined by HOD",
          description: `PR ${finalizationData.transactionId} has been declined.`,
          variant: "destructive"
        });
      }

      setTimeout(() => {
        loadPurchaseRequisitions();
      }, 500);
    } catch (error) {
      console.error('Error finalizing PR:', error);
      toast({
        title: "Update failed",
        description: "Failed to update PR status.",
        variant: "destructive"
      });
    }
  };

  const handleFinanceFinalize = async (prId: string, finalizationData: any) => {
    try {
      const status = finalizationData.decision === 'approve' ? 'Approved' : 'Declined';
      
      if (finalizationData.decision === 'approve') {
        await prService.approveRequisition(
          prId,
          'Finance',
          user?.name || user?.email || 'Unknown',
          finalizationData.comments
        );

        toast({
          title: "✅ PR Approved by Finance",
          description: `PR ${finalizationData.transactionId} has been given final approval for payment.`,
        });
      } else {
        await prService.rejectRequisition(
          prId,
          'Finance',
          user?.name || user?.email || 'Unknown',
          finalizationData.comments || 'No reason provided'
        );

        toast({
          title: "❌ PR Declined by Finance",
          description: `PR ${finalizationData.transactionId} has been declined.`,
          variant: "destructive"
        });
      }

      setTimeout(() => {
        loadPurchaseRequisitions();
      }, 500);
    } catch (error) {
      console.error('Error finalizing PR:', error);
      toast({
        title: "Update failed",
        description: "Failed to update PR status.",
        variant: "destructive"
      });
    }
  };

  const handleSplitPR = async (prId: string, splitData: any) => {
    try {
      const splitItems = splitData.splitPRs || splitData.splitTransactions || [];
      
      const originalPR = myPurchaseRequisitions.find(pr => pr.id === prId) || 
                        pendingEmployeePRs.find(pr => pr.id === prId) ||
                        financeApprovalPRs.find(pr => pr.id === prId);

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
          description: `Created ${splitItems.length} new transactions automatically.`
        });
      }
    } catch (error) {
      console.error('Error splitting PR:', error);
      toast({
        title: "Split failed",
        description: "Failed to split the purchase requisition.",
        variant: "destructive"
      });
    }
  };

  const handleClearDashboard = () => {
    if (myPurchaseRequisitions.length === 0) {
      toast({
        title: "Nothing to Clear",
        description: "Your dashboard is already clear."
      });
      return;
    }

    setDashboardCleared(true);

    toast({
      title: "Dashboard Cleared",
      description: `Cleared ${myPurchaseRequisitions.length} PRs from dashboard view. All data is saved in the system.`
    });
  };

  const displayedPRs = dashboardCleared ? [] : myPurchaseRequisitions;

  return (
    <Layout title={getPageTitle()}>
      <div className="space-y-8">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Submitted</h3>
            <p className="text-3xl font-bold text-blue-600">{myPurchaseRequisitions.length}</p>
          </div>
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Approved</h3>
            <p className="text-3xl font-bold text-green-600">
              {myPurchaseRequisitions.filter(pr => pr.financeStatus === 'Approved').length}
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Pending</h3>
            <p className="text-3xl font-bold text-orange-600">
              {myPurchaseRequisitions.filter(pr => pr.financeStatus === 'Pending').length}
            </p>
          </div>
        </div>

        {/* Enhanced Action Buttons */}
        <div className="flex flex-wrap gap-4 animate-fade-in">
          <Button
            onClick={() => navigate('/analytics')}
            className="flex items-center gap-2 btn-shimmer hover-lift premium-shadow"
          >
            <BarChart3 className="w-4 h-4" />
            Procurement Analytics
          </Button>

          {(userRole === 'Admin' || userRole === 'SuperUser') && (
            <Button
              onClick={() => navigate(userRole === 'SuperUser' ? '/super-admin' : '/admin/portal')}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white btn-shimmer hover-lift premium-shadow"
            >
              {userRole === 'SuperUser' ? <Settings className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
              {userRole === 'SuperUser' ? 'Super Admin Panel' : 'Admin Portal'}
            </Button>
          )}

          <Dialog open={isNewPROpen} onOpenChange={setIsNewPROpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 hover-lift animate-glow">
                <ShoppingCart className="w-4 h-4" />
                New Purchase Requisition
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto glass-card">
              <DialogHeader>
                <DialogTitle className="gradient-text text-xl">Submit New Purchase Requisition</DialogTitle>
              </DialogHeader>
              <PurchaseRequisitionForm onSubmit={handleSubmitPR} />
            </DialogContent>
          </Dialog>

          {userRole === 'HOD' && pendingEmployeePRs.length > 0 && (
            <Dialog open={isPendingPRsOpen} onOpenChange={setIsPendingPRsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 btn-shimmer hover-lift premium-shadow">
                  <Clock className="w-4 h-4" />
                  Pending Employee PRs
                  <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full px-2 py-0.5 text-xs animate-pulse">
                    {pendingEmployeePRs.length}
                  </span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto glass-card">
                <DialogHeader>
                  <DialogTitle className="gradient-text text-xl">Pending Employee Purchase Requisitions</DialogTitle>
                </DialogHeader>
                <PurchaseRequisitionTable
                  purchaseRequisitions={pendingEmployeePRs}
                  showEmployeeName={true}
                  showActions={true}
                  actionRole="HOD"
                  onFinalize={handleHODFinalize}
                  onSplit={handleSplitPR}
                  onDialogOpenChange={setHasOpenDialog}
                  title=""
                />
              </DialogContent>
            </Dialog>
          )}

          {userRole === 'Finance' && financeApprovalPRs.length > 0 && (
            <Dialog open={isFinancePRsOpen} onOpenChange={setIsFinancePRsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 btn-shimmer hover-lift premium-shadow">
                  <CheckCircle className="w-4 h-4" />
                  PRs For Final Approval
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full px-2 py-0.5 text-xs animate-pulse">
                    {financeApprovalPRs.length}
                  </span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto glass-card">
                <DialogHeader>
                  <DialogTitle className="gradient-text text-xl">Purchase Requisitions for Final Approval</DialogTitle>
                </DialogHeader>
                <PurchaseRequisitionTable
                  purchaseRequisitions={financeApprovalPRs}
                  showEmployeeName={true}
                  showActions={true}
                  actionRole="Finance"
                  onFinalize={handleFinanceFinalize}
                  onSplit={handleSplitPR}
                  onDialogOpenChange={setHasOpenDialog}
                  title=""
                />
              </DialogContent>
            </Dialog>
          )}

          <Button
            onClick={handleClearDashboard}
            variant="outline"
            className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50 hover-lift"
          >
            <X className="w-4 h-4" />
            Clear Dashboard
          </Button>

          {displayedPRs.length === 0 && myPurchaseRequisitions.length === 0 && (
            <Button
              onClick={loadPurchaseRequisitions}
              variant="outline"
              className="flex items-center gap-2 text-green-600 border-green-200 hover:bg-green-50 hover-lift"
            >
              <Plus className="w-4 h-4" />
              Refresh Dashboard
            </Button>
          )}
        </div>

        {/* Main Content - My Purchase Requisitions */}
        <div className="glass-card hover-glow premium-shadow-lg animate-fade-in-up">
          <PurchaseRequisitionTable
            purchaseRequisitions={displayedPRs}
            onDialogOpenChange={setHasOpenDialog}
            title="My Purchase Requisitions"
          />
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
