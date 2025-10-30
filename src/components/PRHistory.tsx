import React from 'react';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, Clock, FileText, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface HistoryEntry {
  action: string;
  by: string;
  role?: string;
  timestamp: string;
  comments?: string;
  reason?: string;
  notes?: string;
}

interface PRHistoryProps {
  history: HistoryEntry[];
  transactionId?: string;
  status?: string;
  createdAt?: string;
}

const getActionIcon = (action: string) => {
  switch (action?.toLowerCase()) {
    case 'approved':
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    case 'rejected':
      return <XCircle className="h-5 w-5 text-red-600" />;
    case 'split':
      return <Tag className="h-5 w-5 text-blue-600" />;
    case 'submitted':
    default:
      return <Clock className="h-5 w-5 text-gray-600" />;
  }
};

const getActionBadgeColor = (action: string) => {
  switch (action?.toLowerCase()) {
    case 'approved':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'rejected':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'split':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'submitted':
      return 'bg-gray-100 text-gray-800 border-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const formatTimestamp = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    return format(date, 'MMM d, yyyy • HH:mm:ss');
  } catch (error) {
    return timestamp || 'No timestamp';
  }
};

export const PRHistory: React.FC<PRHistoryProps> = ({
  history,
  transactionId,
  status,
  createdAt
}) => {
  // Combine creation entry with history entries
  const timelineEntries = [
    ...(createdAt
      ? [
          {
            action: 'Submitted',
            by: 'System',
            timestamp: createdAt,
            isCreation: true
          }
        ]
      : []),
    ...(history || [])
  ];

  if (!timelineEntries || timelineEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FileText className="h-12 w-12 text-gray-300 mb-4" />
        <p className="text-gray-500 text-sm font-medium">No activity yet</p>
        <p className="text-gray-400 text-xs">This PR has been submitted but no actions have been recorded</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      {/* Header Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6 pb-4 border-b">
        <div>
          <p className="text-xs text-gray-500 font-semibold uppercase">PR Reference</p>
          <p className="text-sm font-mono font-bold text-gray-900">{transactionId || 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 font-semibold uppercase">Current Status</p>
          <div className="mt-1">
            <Badge className={`${getActionBadgeColor(status || 'Pending')}`}>
              {status || 'Pending'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline vertical line */}
        <div className="absolute left-2.5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-purple-200 to-blue-200" />

        {/* Timeline entries */}
        <div className="space-y-6">
          {timelineEntries.map((entry, index) => (
            <div key={`${entry.timestamp}-${index}`} className="relative pl-12">
              {/* Timeline dot */}
              <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white border-2 border-blue-400 flex items-center justify-center shadow-sm">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
              </div>

              {/* Content card */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                {/* Header with action and timestamp */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3 flex-1">
                    {getActionIcon(entry.action)}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={`${getActionBadgeColor(entry.action)} border`}
                        >
                          {entry.action}
                        </Badge>
                        {entry.role && (
                          <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            {entry.role}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTimestamp(entry.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actor information */}
                <div className="ml-8 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-600">By:</span>
                    <span className="text-sm font-medium text-gray-900">{entry.by || 'Unknown'}</span>
                  </div>

                  {/* Comments/Reason */}
                  {(entry.comments || entry.reason || entry.notes) && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-600 mb-1">
                        {entry.action?.toLowerCase() === 'rejected' ? 'Reason:' : 'Comments:'}
                      </p>
                      <p className="text-sm text-gray-700 italic bg-gray-50 p-2 rounded border-l-2 border-gray-300">
                        "{entry.comments || entry.reason || entry.notes || 'No details provided'}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="mt-8 pt-4 border-t">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase">Total Actions</p>
            <p className="text-lg font-bold text-gray-900 mt-1">{timelineEntries.length}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase">Approvals</p>
            <p className="text-lg font-bold text-green-600 mt-1">
              {timelineEntries.filter(e => e.action?.toLowerCase() === 'approved').length}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase">Rejections</p>
            <p className="text-lg font-bold text-red-600 mt-1">
              {timelineEntries.filter(e => e.action?.toLowerCase() === 'rejected').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PRHistory;
