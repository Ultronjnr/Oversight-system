import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, ComposedChart, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, BarChart3, PieChart as PieChartIcon, Calendar, Users, DollarSign, Target, ArrowUpDown } from 'lucide-react';
import DateRangeSelector, { DateRangeFilter } from './DateRangeSelector';
import { format, isWithinInterval, parseISO } from 'date-fns';

interface Quote {
  id: string;
  transactionId?: string;
  date: string;
  item: string;
  amount: string;
  description: string;
  comment: string;
  requestedByName?: string;
  requestedByRole?: string;
  hodStatus: 'Pending' | 'Approved' | 'Declined';
  financeStatus: 'Pending' | 'Approved' | 'Declined';
  history: Array<{
    status: string;
    date: Date;
    by: string;
    transactionId?: string;
  }>;
  createdAt?: Date;
}

interface AdvancedAnalyticsProps {
  quotes: Quote[];
  userRole: string;
}

const AdvancedAnalytics = ({ quotes, userRole }: AdvancedAnalyticsProps) => {
  const [dateFilter, setDateFilter] = useState<DateRangeFilter>({
    startDate: new Date(new Date().getFullYear(), 0, 1), // Start of current year
    endDate: new Date(),
    preset: 'ytd'
  });
  const [groupBy, setGroupBy] = useState<'month' | 'quarter' | 'role' | 'status'>('month');
  const [compareWith, setCompareWith] = useState<'previous_period' | 'same_period_last_year' | 'none'>('previous_period');

  // Filter quotes by date range
  const filteredQuotes = useMemo(() => {
    return quotes.filter(quote => {
      const quoteDate = parseISO(quote.date);
      return isWithinInterval(quoteDate, {
        start: dateFilter.startDate,
        end: dateFilter.endDate
      });
    });
  }, [quotes, dateFilter]);

  // Calculate analytics data
  const analytics = useMemo(() => {
    const totalQuotes = filteredQuotes.length;
    const approvedQuotes = filteredQuotes.filter(q => q.financeStatus === 'Approved').length;
    const pendingQuotes = filteredQuotes.filter(q => q.hodStatus === 'Pending' || q.financeStatus === 'Pending').length;
    const declinedQuotes = filteredQuotes.filter(q => q.hodStatus === 'Declined' || q.financeStatus === 'Declined').length;
    
    const approvalRate = totalQuotes > 0 ? (approvedQuotes / totalQuotes) * 100 : 0;
    const pendingRate = totalQuotes > 0 ? (pendingQuotes / totalQuotes) * 100 : 0;
    const declineRate = totalQuotes > 0 ? (declinedQuotes / totalQuotes) * 100 : 0;

    const totalValue = filteredQuotes.reduce((sum, quote) => {
      const amount = parseFloat(quote.amount.replace(/[^0-9.-]+/g, '')) || 0;
      return sum + amount;
    }, 0);

    const averageValue = totalQuotes > 0 ? totalValue / totalQuotes : 0;

    return {
      totalQuotes,
      approvedQuotes,
      pendingQuotes,
      declinedQuotes,
      approvalRate,
      pendingRate,
      declineRate,
      totalValue,
      averageValue
    };
  }, [filteredQuotes]);

  // Group data by selected dimension
  const groupedData = useMemo(() => {
    const groups = new Map();

    filteredQuotes.forEach(quote => {
      let key: string;
      const quoteDate = parseISO(quote.date);

      switch (groupBy) {
        case 'month':
          key = format(quoteDate, 'MMM yyyy');
          break;
        case 'quarter':
          const quarter = Math.floor(quoteDate.getMonth() / 3) + 1;
          key = `Q${quarter} ${quoteDate.getFullYear()}`;
          break;
        case 'role':
          key = quote.requestedByRole || 'Unknown';
          break;
        case 'status':
          if (quote.financeStatus === 'Approved') key = 'Approved';
          else if (quote.hodStatus === 'Declined' || quote.financeStatus === 'Declined') key = 'Declined';
          else key = 'Pending';
          break;
        default:
          key = 'Unknown';
      }

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          total: 0,
          approved: 0,
          pending: 0,
          declined: 0,
          value: 0
        });
      }

      const group = groups.get(key);
      group.total += 1;
      
      if (quote.financeStatus === 'Approved') group.approved += 1;
      else if (quote.hodStatus === 'Declined' || quote.financeStatus === 'Declined') group.declined += 1;
      else group.pending += 1;

      const amount = parseFloat(quote.amount.replace(/[^0-9.-]+/g, '')) || 0;
      group.value += amount;
    });

    return Array.from(groups.values()).map(group => ({
      ...group,
      approvalRate: group.total > 0 ? (group.approved / group.total) * 100 : 0
    }));
  }, [filteredQuotes, groupBy]);

  const chartConfig = {
    approved: { label: "Approved", color: "#10b981" },
    pending: { label: "Pending", color: "#f59e0b" },
    declined: { label: "Declined", color: "#ef4444" },
    approvalRate: { label: "Approval Rate", color: "#3b82f6" },
    value: { label: "Value", color: "#8b5cf6" }
  };

  const statusColors = {
    Approved: '#10b981',
    Pending: '#f59e0b',
    Declined: '#ef4444'
  };

  return (
    <div className="space-y-6">
      {/* Controls Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DateRangeSelector 
          onDateRangeChange={setDateFilter}
          currentFilter={dateFilter}
        />
        
        <Card className="glass-card hover-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Group By
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={groupBy} onValueChange={(value: any) => setGroupBy(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Monthly</SelectItem>
                <SelectItem value="quarter">Quarterly</SelectItem>
                <SelectItem value="role">By Role</SelectItem>
                <SelectItem value="status">By Status</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="glass-card hover-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpDown className="h-5 w-5 text-primary" />
              Compare With
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={compareWith} onValueChange={(value: any) => setCompareWith(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Comparison</SelectItem>
                <SelectItem value="previous_period">Previous Period</SelectItem>
                <SelectItem value="same_period_last_year">Same Period Last Year</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card hover-lift animate-fade-in-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approval Rate</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{analytics.approvalRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              {analytics.approvedQuotes} of {analytics.totalQuotes} quotes
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift animate-fade-in-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">${analytics.totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Avg: ${analytics.averageValue.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift animate-fade-in-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Rate</CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{analytics.pendingRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics.pendingQuotes} pending quotes
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift animate-fade-in-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Decline Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{analytics.declineRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics.declinedQuotes} declined quotes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Approval Rate Trend */}
        <Card className="glass-card hover-glow animate-fade-in-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Approval Rate by {groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80">
              <ComposedChart data={groupedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="key" stroke="hsl(var(--muted-foreground))" />
                <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" />
                <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar yAxisId="left" dataKey="total" fill="#e5e7eb" name="Total Quotes" />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="approvalRate" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                  name="Approval Rate (%)"
                />
              </ComposedChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="glass-card hover-glow animate-fade-in-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-primary" />
              Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Approved', value: analytics.approvedQuotes, color: statusColors.Approved },
                    { name: 'Pending', value: analytics.pendingQuotes, color: statusColors.Pending },
                    { name: 'Declined', value: analytics.declinedQuotes, color: statusColors.Declined }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[
                    { name: 'Approved', value: analytics.approvedQuotes, color: statusColors.Approved },
                    { name: 'Pending', value: analytics.pendingQuotes, color: statusColors.Pending },
                    { name: 'Declined', value: analytics.declinedQuotes, color: statusColors.Declined }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Value Analysis */}
        <Card className="glass-card hover-glow animate-fade-in-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Value Analysis by {groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80">
              <AreaChart data={groupedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="key" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8b5cf6" 
                  fill="#8b5cf6" 
                  fillOpacity={0.3}
                  name="Total Value ($)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Detailed Breakdown */}
        <Card className="glass-card hover-glow animate-fade-in-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Detailed Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {groupedData.slice(0, 5).map((group, index) => (
              <div key={group.key} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="space-y-1">
                  <p className="font-medium text-sm">{group.key}</p>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      {group.total} total
                    </Badge>
                    <Badge className="text-xs bg-green-100 text-green-800">
                      {group.approvalRate.toFixed(1)}% approved
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-600">${group.value.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">
                    {group.approved}A | {group.pending}P | {group.declined}D
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;
