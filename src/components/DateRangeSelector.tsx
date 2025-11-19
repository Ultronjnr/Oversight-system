import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Filter, TrendingUp } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subMonths, subQuarters, subYears } from 'date-fns';

export interface DateRangeFilter {
  startDate: Date;
  endDate: Date;
  preset: string;
}

interface DateRangeSelectorProps {
  onDateRangeChange: (filter: DateRangeFilter) => void;
  currentFilter: DateRangeFilter;
}

const DateRangeSelector = ({ onDateRangeChange, currentFilter }: DateRangeSelectorProps) => {
  const [customStartDate, setCustomStartDate] = useState(format(currentFilter.startDate, 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState(format(currentFilter.endDate, 'yyyy-MM-dd'));

  const presetRanges = [
    { 
      label: 'Month to Date', 
      value: 'mtd',
      getRange: () => ({ startDate: startOfMonth(new Date()), endDate: new Date() })
    },
    { 
      label: 'Quarter to Date', 
      value: 'qtd',
      getRange: () => ({ startDate: startOfQuarter(new Date()), endDate: new Date() })
    },
    { 
      label: 'Year to Date', 
      value: 'ytd',
      getRange: () => ({ startDate: startOfYear(new Date()), endDate: new Date() })
    },
    { 
      label: 'Last Month', 
      value: 'last_month',
      getRange: () => {
        const lastMonth = subMonths(new Date(), 1);
        return { startDate: startOfMonth(lastMonth), endDate: endOfMonth(lastMonth) };
      }
    },
    { 
      label: 'Last Quarter', 
      value: 'last_quarter',
      getRange: () => {
        const lastQuarter = subQuarters(new Date(), 1);
        return { startDate: startOfQuarter(lastQuarter), endDate: endOfQuarter(lastQuarter) };
      }
    },
    { 
      label: 'Last Year', 
      value: 'last_year',
      getRange: () => {
        const lastYear = subYears(new Date(), 1);
        return { startDate: startOfYear(lastYear), endDate: endOfYear(lastYear) };
      }
    },
    { 
      label: 'This Month', 
      value: 'this_month',
      getRange: () => ({ startDate: startOfMonth(new Date()), endDate: endOfMonth(new Date()) })
    },
    { 
      label: 'This Quarter', 
      value: 'this_quarter',
      getRange: () => ({ startDate: startOfQuarter(new Date()), endDate: endOfQuarter(new Date()) })
    },
    { 
      label: 'This Year', 
      value: 'this_year',
      getRange: () => ({ startDate: startOfYear(new Date()), endDate: endOfYear(new Date()) })
    },
    { 
      label: 'All Time', 
      value: 'all',
      getRange: () => ({ startDate: new Date('2020-01-01'), endDate: new Date() })
    },
    { 
      label: 'Custom Range', 
      value: 'custom',
      getRange: () => ({ startDate: new Date(customStartDate), endDate: new Date(customEndDate) })
    }
  ];

  const handlePresetChange = (preset: string) => {
    const range = presetRanges.find(p => p.value === preset);
    if (range) {
      const { startDate, endDate } = range.getRange();
      onDateRangeChange({ startDate, endDate, preset });
    }
  };

  const handleCustomDateChange = () => {
    const startDate = new Date(customStartDate);
    const endDate = new Date(customEndDate);
    onDateRangeChange({ startDate, endDate, preset: 'custom' });
  };

  return (
    <Card className="glass-card hover-glow animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" />
          Date Range Filter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="preset">Select Time Period</Label>
          <Select value={currentFilter.preset} onValueChange={handlePresetChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              {presetRanges.map(range => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {currentFilter.preset === 'custom' && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <Button onClick={handleCustomDateChange} className="w-full">
                <TrendingUp className="h-4 w-4 mr-2" />
                Apply Custom Range
              </Button>
            </div>
          </div>
        )}

        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Current Range: {format(currentFilter.startDate, 'MMM dd, yyyy')} - {format(currentFilter.endDate, 'MMM dd, yyyy')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DateRangeSelector;
