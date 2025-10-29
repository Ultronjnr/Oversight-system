import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import * as prService from '../services/purchaseRequisitionService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface PRHistoryRecord {
  id: string;
  transactionId: string;
  requestedByName: string;
  requestedByRole: string;
  requestedByDepartment: string;
  hodStatus: string;
  financeStatus: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
  requestDate: string;
}

const PurchaseRequisitionHistory = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<PRHistoryRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<PRHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'pending' | 'declined'>('all');

  useEffect(() => {
    if (user?.id) {
      loadHistoryData();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [records, searchTerm, filterStatus]);

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

  const applyFilters = () => {
    let filtered = records;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(pr =>
        pr.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pr.requestedByName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pr.requestedByDepartment?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(pr => {
        if (filterStatus === 'approved') {
          return pr.hodStatus === 'Approved' && pr.financeStatus === 'Approved';
        } else if (filterStatus === 'pending') {
          return pr.hodStatus === 'Pending' || pr.financeStatus === 'Pending';
        } else if (filterStatus === 'declined') {
          return pr.hodStatus === 'Declined' || pr.financeStatus === 'Declined';
        }
        return true;
      });
    }

    // Sort by most recent first
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setFilteredRecords(filtered);
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

  const getStatusBadge = (hodStatus: string, financeStatus: string) => {
    if (financeStatus === 'Approved') {
      return <Badge className="bg-green-100 text-green-800">✅ Fully Approved</Badge>;
    }
    if (financeStatus === 'Declined' || hodStatus === 'Declined') {
      return <Badge variant="destructive">❌ Declined</Badge>;
    }
    if (hodStatus === 'Approved' && financeStatus === 'Pending') {
      return <Badge className="bg-blue-100 text-blue-800">⏳ Awaiting Finance</Badge>;
    }
    if (hodStatus === 'Pending') {
      return <Badge className="bg-yellow-100 text-yellow-800">⏳ Awaiting HOD</Badge>;
    }
    return <Badge variant="outline">Pending</Badge>;
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  return (
    <Layout title="Purchase Requisition History">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold mb-2">Purchase Requisition History</h2>
            <p className="text-gray-600">View all purchase requisitions {user?.role === 'Employee' ? 'you have submitted' : user?.role === 'HOD' ? 'in your department' : 'in your organization'}</p>
          </div>
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

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search PR Reference or Name</label>
                <Input
                  placeholder="Search by PR ID, name, or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Filter by Status</label>
                <div className="flex gap-2 flex-wrap">
                  {['all', 'approved', 'pending', 'declined'].map(status => (
                    <Button
                      key={status}
                      variant={filterStatus === status ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterStatus(status as any)}
                      className="capitalize"
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {isLoading ? 'Loading...' : `${filteredRecords.length} Record${filteredRecords.length !== 1 ? 's' : ''}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading purchase requisition history...</div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No purchase requisitions found</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PR Reference</TableHead>
                      <TableHead>Submitted By</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>HOD Status</TableHead>
                      <TableHead>Finance Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => (
                      <TableRow key={record.id} className="hover:bg-gray-50">
                        <TableCell className="font-mono font-semibold text-blue-600">{record.transactionId}</TableCell>
                        <TableCell>
                          <div className="font-medium">{record.requestedByName}</div>
                          <div className="text-sm text-gray-600">{record.requestedByRole}</div>
                        </TableCell>
                        <TableCell>{record.requestedByDepartment || 'N/A'}</TableCell>
                        <TableCell className="text-right">
                          <div className="font-medium">
                            {record.currency} {typeof record.totalAmount === 'number' ? record.totalAmount.toFixed(2) : '0.00'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={record.hodStatus === 'Approved' ? 'default' : record.hodStatus === 'Declined' ? 'destructive' : 'outline'}>
                            {record.hodStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={record.financeStatus === 'Approved' ? 'default' : record.financeStatus === 'Declined' ? 'destructive' : 'outline'}>
                            {record.financeStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(record.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        {filteredRecords.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total PRs</p>
                <p className="text-2xl font-bold">{filteredRecords.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredRecords.filter(r => r.hodStatus === 'Approved' && r.financeStatus === 'Approved').length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {filteredRecords.filter(r => r.hodStatus === 'Pending' || r.financeStatus === 'Pending').length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Declined</p>
                <p className="text-2xl font-bold text-red-600">
                  {filteredRecords.filter(r => r.hodStatus === 'Declined' || r.financeStatus === 'Declined').length}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default PurchaseRequisitionHistory;
