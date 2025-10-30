import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, FileText, DollarSign, Users } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from 'recharts';

interface Quote {
  id: string;
  date: string;
  amount: string;
  hodStatus: 'Pending' | 'Approved' | 'Declined';
  financeStatus: 'Pending' | 'Approved' | 'Declined';
  requestedByRole?: string;
  history: Array<{
    status: string;
    date: Date;
    by: string;
  }>;
}

interface DashboardStatsProps {
  quotes: Quote[];
  userRole: string;
}

const DashboardStats = ({ quotes, userRole }: DashboardStatsProps) => {
  // Calculate statistics
  const totalQuotes = quotes.length;
  const pendingQuotes = quotes.filter(q => q.hodStatus === 'Pending' || q.financeStatus === 'Pending').length;
  const approvedQuotes = quotes.filter(q => q.financeStatus === 'Approved').length;
  const declinedQuotes = quotes.filter(q => q.hodStatus === 'Declined' || q.financeStatus === 'Declined').length;
  
  const totalAmount = quotes.reduce((sum, quote) => {
    const amount = parseFloat(quote.amount.replace(/[^0-9.-]+/g, '')) || 0;
    return sum + amount;
  }, 0);

  const approvalRate = totalQuotes > 0 ? ((approvedQuotes / totalQuotes) * 100).toFixed(1) : '0';

  // Chart data
  const statusData = [
    { name: 'Approved', value: approvedQuotes, color: '#10b981' },
    { name: 'Pending', value: pendingQuotes, color: '#f59e0b' },
    { name: 'Declined', value: declinedQuotes, color: '#ef4444' },
  ];

  const monthlyData = quotes.reduce((acc: any[], quote) => {
    const month = new Date(quote.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    const existingMonth = acc.find(item => item.month === month);
    const amount = parseFloat(quote.amount.replace(/[^0-9.-]+/g, '')) || 0;
    
    if (existingMonth) {
      existingMonth.amount += amount;
      existingMonth.count += 1;
    } else {
      acc.push({ month, amount, count: 1 });
    }
    return acc;
  }, []).slice(-6);

  const roleData = quotes.reduce((acc: any[], quote) => {
    const role = quote.requestedByRole || 'Unknown';
    const existing = acc.find(item => item.role === role);
    
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ role, count: 1 });
    }
    return acc;
  }, []);

  const chartConfig = {
    amount: {
      label: "Amount",
      color: "hsl(var(--primary))",
    },
    count: {
      label: "Count",
      color: "hsl(var(--secondary))",
    },
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card hover-lift animate-fade-in-scale stagger-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Quotes</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold gradient-text">{totalQuotes}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift animate-fade-in-scale stagger-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +8% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift animate-fade-in-scale stagger-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approval Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{approvalRate}%</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +3% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift animate-fade-in-scale stagger-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingQuotes}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 inline mr-1" />
              -5% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends Chart */}
        <Card className="glass-card hover-glow animate-fade-in-up stagger-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Monthly Quote Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Status Distribution Chart */}
        <Card className="glass-card hover-glow animate-fade-in-up stagger-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Quote Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Role Distribution Chart */}
        {userRole === 'Finance' && (
          <Card className="glass-card hover-glow animate-fade-in-up stagger-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Quotes by Role
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-64">
                <BarChart data={roleData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="role" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar 
                    dataKey="count" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="glass-card hover-glow animate-fade-in-up stagger-5">
          <CardHeader>
            <CardTitle>Quick Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Approved Today</span>
              </div>
              <span className="text-lg font-bold text-green-600">
                {quotes.filter(q => {
                  const today = new Date().toDateString();
                  return q.financeStatus === 'Approved' && new Date(q.date).toDateString() === today;
                }).length}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">Awaiting Action</span>
              </div>
              <span className="text-lg font-bold text-orange-600">{pendingQuotes}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Avg Quote Value</span>
              </div>
              <span className="text-lg font-bold text-blue-600">
                ${totalQuotes > 0 ? (totalAmount / totalQuotes).toLocaleString() : '0'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardStats;
