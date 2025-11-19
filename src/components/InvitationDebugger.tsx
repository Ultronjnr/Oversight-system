import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Clock, X } from 'lucide-react';

interface EmailLog {
  id: string;
  timestamp: string;
  email: string;
  role: string;
  status: 'pending' | 'sent' | 'failed';
  message: string;
  error?: string;
}

const InvitationDebugger: React.FC<{ isVisible: boolean; onClose: () => void }> = ({ isVisible, onClose }) => {
  const [logs, setLogs] = useState<EmailLog[]>([]);

  useEffect(() => {
    // Listen for invitation events
    const handleInvitationEvent = (event: CustomEvent) => {
      const log: EmailLog = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        email: event.detail.email,
        role: event.detail.role,
        status: event.detail.status,
        message: event.detail.message,
        error: event.detail.error,
      };
      setLogs(prev => [log, ...prev].slice(0, 20)); // Keep last 20 logs
    };

    window.addEventListener('invitation-email-event', handleInvitationEvent as EventListener);
    return () => window.removeEventListener('invitation-email-event', handleInvitationEvent as EventListener);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 z-50 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
      <Card className="border-0 rounded-lg">
        <CardHeader className="pb-3 border-b bg-gray-50 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold">Email Debug Log</CardTitle>
            <CardDescription className="text-xs">Recent invitation sends</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="p-0 overflow-y-auto max-h-80">
          {logs.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              No invitation events yet
            </div>
          ) : (
            <div className="divide-y">
              {logs.map((log) => (
                <div key={log.id} className="p-3 text-xs border-b hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-gray-600">{log.timestamp}</span>
                    {log.status === 'sent' && (
                      <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Sent
                      </Badge>
                    )}
                    {log.status === 'pending' && (
                      <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                        <Clock className="h-3 w-3 mr-1" /> Pending
                      </Badge>
                    )}
                    {log.status === 'failed' && (
                      <Badge className="bg-red-50 text-red-700 border-red-200 text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" /> Failed
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="text-gray-700">
                      <span className="font-semibold">To:</span> {log.email}
                    </div>
                    <div className="text-gray-700">
                      <span className="font-semibold">Role:</span> {log.role}
                    </div>
                    <div className="text-gray-600">
                      {log.message}
                    </div>
                    {log.error && (
                      <div className="text-red-600 font-mono bg-red-50 p-2 rounded mt-1">
                        Error: {log.error}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Helper function to emit invitation events (call from SuperAdminPanel)
export const emitInvitationEvent = (data: {
  email: string;
  role: string;
  status: 'pending' | 'sent' | 'failed';
  message: string;
  error?: string;
}) => {
  const event = new CustomEvent('invitation-email-event', { detail: data });
  window.dispatchEvent(event);
};

export default InvitationDebugger;
