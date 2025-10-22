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
import { cleanupDuplicateIds } from '../utils/dataCleanup';
import * as prService from '../services/purchaseRequisitionService';

const Dashboard = () => {
  const { user } = useAuth();
  const { userRole, getPageTitle } = useRoleBasedAccess();
  const navigate = useNavigate();
  const [myPurchaseRequisitions, setMyPurchaseRequisitions] = useState<any[]>([]);
  const [myOriginalPRs, setMyOriginalPRs] = useState<any[]>([]); // For stats calculation
  const [allPurchaseRequisitions, setAllPurchaseRequisitions] = useState<any[]>([]);
  const [pendingEmployeePRs, setPendingEmployeePRs] = useState<any[]>([]);
  const [financeApprovalPRs, setFinanceApprovalPRs] = useState<any[]>([]);
  const [isNewPROpen, setIsNewPROpen] = useState(false);
  const [isPendingPRsOpen, setIsPendingPRsOpen] = useState(false);
  const [isFinancePRsOpen, setIsFinancePRsOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadPurchaseRequisitions();
    }
  }, [user, userRole]);

  const loadPurchaseRequisitions = async () => {
    try {
      if (!user?.id) return;

      // Load user's own PRs
      const userPRs = await prService.getUserPurchaseRequisitions(user.id);
      setMyPurchaseRequisitions(userPRs || []);
      setMyOriginalPRs(userPRs || []);

      // Load role-specific PRs
      if (userRole === 'HOD' && user.department) {
        const hodPRs = await prService.getHODPendingPRs(user.department);
        setPendingEmployeePRs(hodPRs || []);
      }

      if (userRole === 'Finance') {
        const financePRs = await prService.getFinancePendingPRs();
        setFinanceApprovalPRs(financePRs || []);
      }

      // Load all PRs for stats/admin view
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
      const savedPRs = localStorage.getItem('purchaseRequisitions');
      const allPRs = savedPRs ? JSON.parse(savedPRs) : [];

      // Route the PR through proper procurement workflow
      const routedPR = {
        ...newPR,
        requestedBy: user?.id,
        requestedByName: user?.name,
        requestedByRole: user?.role,
        requestedByDepartment: user?.department,
        hodStatus: userRole === 'HOD' ? 'Approved' : 'Pending',
        financeStatus: userRole === 'Finance' ? 'Approved' : 'Pending',
        status: userRole === 'Finance' ? 'APPROVED' : userRole === 'HOD' ? 'PENDING_FINANCE_APPROVAL' : 'PENDING_HOD_APPROVAL'
      };

      // Save to Supabase
      if (user?.id) {
        prService.createPurchaseRequisition(routedPR).catch(err => {
          console.warn('Background save to Supabase failed:', err);
        });
      }

      allPRs.push(routedPR);
      localStorage.setItem('purchaseRequisitions', JSON.stringify(allPRs));

      setMyPurchaseRequisitions(prev => [...prev, routedPR]);
      setIsNewPROpen(false);

      toast({
        title: "Purchase Requisition Submitted",
        description: "Your purchase requisition has been submitted for approval.",
      });
    } catch (error) {
      console.error('Error submitting PR:', error);
      toast({
        title: "Error",
        description: "Failed to submit purchase requisition.",
        variant: "destructive"
      });
    }
  };

  const handleHODFinalize = (prId: string, finalizationData: any) => {
    updatePRStatus(prId, finalizationData.decision === 'approve' ? 'Approved' : 'Declined', 'HOD', finalizationData);
    toast({
      title: finalizationData.decision === 'approve' ? "PR Finalized" : "PR Declined",
      description: finalizationData.decision === 'approve'
        ? "The purchase requisition has been finalized and sent to Finance for final approval."
        : "The purchase requisition has been declined.",
      variant: finalizationData.decision === 'approve' ? "default" : "destructive"
    });
  };

  const handleHODDecline = (prId: string) => {
    updatePRStatus(prId, 'Declined', 'HOD');
    toast({
      title: "PR Declined",
      description: "The purchase requisition has been declined.",
      variant: "destructive",
    });
  };

  const handleFinanceFinalize = (prId: string, finalizationData: any) => {
    updatePRStatus(prId, finalizationData.decision === 'approve' ? 'Approved' : 'Declined', 'Finance', finalizationData);
    toast({
      title: finalizationData.decision === 'approve' ? "PR Approved" : "PR Declined",
      description: finalizationData.decision === 'approve'
        ? "The purchase requisition has been given final approval."
        : "The purchase requisition has been declined by Finance.",
      variant: finalizationData.decision === 'approve' ? "default" : "destructive"
    });
  };

  const handleFinanceDecline = (prId: string) => {
    updatePRStatus(prId, 'Declined', 'Finance');
    toast({
      title: "PR Declined",
      description: "The purchase requisition has been declined by Finance.",
      variant: "destructive",
    });
  };

  const handleSplitPR = (prId: string, splitData: any) => {
    const savedPRs = localStorage.getItem('purchaseRequisitions');
    if (savedPRs) {
      const allPRs = JSON.parse(savedPRs);

      // Handle both old splitPRs format and new splitTransactions format
      const splitItems = splitData.splitPRs || splitData.splitTransactions || [];

      const updatedPRs = allPRs.map((pr: any) =>
        pr.id === prId ? splitData.originalUpdate : pr
      );

      // Add new split PRs/transactions
      updatedPRs.push(...splitItems);

      localStorage.setItem('purchaseRequisitions', JSON.stringify(updatedPRs));
      loadPurchaseRequisitions();

      toast({
        title: "Transaction Split Successfully",
        description: `Created ${splitItems.length} new transactions automatically.`
      });
    }
  };

  const updatePRStatus = (prId: string, status: 'Approved' | 'Declined', role: 'HOD' | 'Finance', finalizationData?: any) => {
    const savedPRs = localStorage.getItem('purchaseRequisitions');
    if (savedPRs) {
      const allPRs = JSON.parse(savedPRs);
      const updatedPRs = allPRs.map((pr: any) => {
        if (pr.id === prId) {
          const statusField = role === 'HOD' ? 'hodStatus' : 'financeStatus';
          const newStatus = status === 'Approved'
            ? (role === 'Finance' ? 'APPROVED' : 'PENDING_FINANCE_APPROVAL')
            : 'DECLINED';

          const updatedPR = {
            ...pr,
            [statusField]: status,
            status: newStatus,
            urgencyLevel: finalizationData?.priority || pr.urgencyLevel,
            paymentTerms: finalizationData?.paymentTerms,
            supplierDetails: finalizationData?.supplierDetails,
            expectedDeliveryDate: finalizationData?.expectedDeliveryDate,
            budgetApproval: finalizationData?.budgetApproval,
            history: [
              ...(pr.history || []),
              {
                status: `${role} ${status}`,
                date: new Date(),
                by: user?.email,
                transactionId: pr.transactionId,
                action: status === 'Approved' ? (role === 'HOD' ? 'HOD_FINALIZE' : 'FINANCE_APPROVE') : 'DECLINE_PR',
                comments: finalizationData?.comments,
                riskAssessment: finalizationData?.riskAssessment,
                complianceNotes: finalizationData?.complianceNotes,
                alternativeOptions: finalizationData?.alternativeOptions
              }
            ]
          };

          // Save to Supabase in background
          prService.updatePRStatus(pr.id || prId,
            role === 'HOD' ? status : undefined,
            role === 'Finance' ? status : undefined,
            { history: updatedPR.history, status: newStatus }
          ).catch(err => {
            console.warn('Background save to Supabase failed:', err);
          });

          return updatedPR;
        }
        return pr;
      });

      localStorage.setItem('purchaseRequisitions', JSON.stringify(updatedPRs));
      loadPurchaseRequisitions();
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

    // Clear dashboard view but keep original data for stats and history
    const clearedCount = myPurchaseRequisitions.length;
    setMyPurchaseRequisitions([]); // Clear dashboard display only

    toast({
      title: "Dashboard Cleared",
      description: `Cleared ${clearedCount} PRs from dashboard view. All data and stats preserved.`
    });
  };

  return (
    <Layout title={getPageTitle()}>
      <div className="space-y-8">
        {/* Dashboard Stats at Top - Uses original data, not dashboard display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Submitted</h3>
            <p className="text-3xl font-bold text-blue-600">{myOriginalPRs.length}</p>
          </div>
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Approved</h3>
            <p className="text-3xl font-bold text-green-600">
              {myOriginalPRs.filter(pr => pr.financeStatus === 'Approved').length}
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Pending</h3>
            <p className="text-3xl font-bold text-orange-600">
              {myOriginalPRs.filter(pr => pr.financeStatus === 'Pending').length}
            </p>
          </div>
        </div>

        {/* Enhanced Action Buttons */}
        <div className="flex flex-wrap gap-4 animate-fade-in">
          {/* Analytics Button - All Users */}
          <Button
            onClick={() => navigate('/analytics')}
            className="flex items-center gap-2 btn-shimmer hover-lift premium-shadow"
          >
            <BarChart3 className="w-4 h-4" />
            Procurement Analytics
          </Button>

          {/* Admin Portal Button - Admin/SuperUser Only */}
          {(userRole === 'Admin' || userRole === 'SuperUser') && (
            <Button
              onClick={() => navigate(userRole === 'SuperUser' ? '/super-admin' : '/admin/portal')}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white btn-shimmer hover-lift premium-shadow"
            >
              {userRole === 'SuperUser' ? <Settings className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
              {userRole === 'SuperUser' ? 'Super Admin Panel' : 'Admin Portal'}
            </Button>
          )}

          {/* New Purchase Requisition Button - All Users */}
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

          {/* Pending Employee PRs Button - HOD Only */}
          {userRole === 'HOD' && (
            <Dialog open={isPendingPRsOpen} onOpenChange={setIsPendingPRsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 btn-shimmer hover-lift premium-shadow">
                  <Clock className="w-4 h-4" />
                  Pending Employee PRs
                  {pendingEmployeePRs.length > 0 && (
                    <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full px-2 py-0.5 text-xs animate-pulse">
                      {pendingEmployeePRs.length}
                    </span>
                  )}
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
                  onDecline={handleHODDecline}
                  title=""
                />
              </DialogContent>
            </Dialog>
          )}

          {/* PRs for Final Approval Button - Finance Only */}
          {userRole === 'Finance' && (
            <Dialog open={isFinancePRsOpen} onOpenChange={setIsFinancePRsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 btn-shimmer hover-lift premium-shadow">
                  <CheckCircle className="w-4 h-4" />
                  Purchase Requisitions For Final Approval
                  {financeApprovalPRs.length > 0 && (
                    <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full px-2 py-0.5 text-xs animate-pulse">
                      {financeApprovalPRs.length}
                    </span>
                  )}
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
                  onDecline={handleFinanceDecline}
                  title=""
                />
              </DialogContent>
            </Dialog>
          )}

          {/* Clear Dashboard Button - All Users */}
          <Button
            onClick={handleClearDashboard}
            variant="outline"
            className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50 hover-lift"
          >
            <X className="w-4 h-4" />
            Clear Dashboard
          </Button>

          {/* Refresh Dashboard Button - All Users */}
          {myPurchaseRequisitions.length === 0 && (
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
            purchaseRequisitions={myPurchaseRequisitions}
            title="My Purchase Requisitions"
          />
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
