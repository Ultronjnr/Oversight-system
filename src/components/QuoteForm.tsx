import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Upload, FileText, X, Hash } from 'lucide-react';
import { generateTransactionId } from '../lib/transactionUtils';

interface QuoteFormProps {
  onSubmit: (quote: any) => void;
}

const QuoteForm = ({ onSubmit }: QuoteFormProps) => {
  const { user } = useAuth();
  const [transactionId] = useState(() => generateTransactionId());
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    item: '',
    amount: '',
    description: '',
    comment: '',
    sourceDocument: null as File | null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('date', formData.date);
      formDataToSend.append('item', formData.item);
      formDataToSend.append('amount', formData.amount);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('comment', formData.comment);
      formDataToSend.append('requestedBy', user?.id || '');
      formDataToSend.append('requestedByName', user?.name || '');
      formDataToSend.append('requestedByRole', user?.role || '');
      
      if (formData.sourceDocument) {
        formDataToSend.append('sourceDocument', formData.sourceDocument);
      }

      // TODO: Replace with actual API call
      // const result = await apiService.createQuote(formDataToSend);
      
      // For now, use the existing mock logic
      const quote = {
        id: Date.now().toString(),
        transactionId,
        ...formData,
        requestedBy: user?.id,
        requestedByName: user?.name,
        requestedByRole: user?.role,
        hodStatus: 'Pending',
        financeStatus: 'Pending',
        history: [
          {
            status: 'Submitted',
            date: new Date(),
            by: user?.email,
            transactionId,
          }
        ],
        createdAt: new Date(),
        documentName: formData.sourceDocument?.name,
        documentType: formData.sourceDocument?.type,
        documentUrl: formData.sourceDocument ? URL.createObjectURL(formData.sourceDocument) : undefined,
      };
      
      onSubmit(quote);
      
      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        item: '',
        amount: '',
        description: '',
        comment: '',
        sourceDocument: null,
      });
      
      toast({
        title: "Quote submitted successfully",
        description: `Your quote request has been submitted for review. Transaction ID: ${transactionId}`,
      });
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: "Submission failed",
        description: "There was an error submitting your quote request.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'image/png', 'image/jpg', 'image/jpeg'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please select a PDF, PNG, or JPG file.",
          variant: "destructive",
        });
        return;
      }

      setFormData({ ...formData, sourceDocument: file });
    }
  };

  const removeFile = () => {
    setFormData({ ...formData, sourceDocument: null });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="h-5 w-5 mr-2 text-blue-600" />
            New Quote Request
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-1 rounded-md">
            <Hash className="h-4 w-4" />
            {transactionId}
          </div>
        </CardTitle>
        <CardDescription>
          Submit a new quote request for approval
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="item">Item</Label>
              <Input
                id="item"
                placeholder="e.g., Laptops, Office Supplies"
                value={formData.item}
                onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                placeholder="e.g., R300,000"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="document" className="flex items-center">
                <Upload className="h-4 w-4 mr-2" />
                Source Document
              </Label>
              <Input
                id="document"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                required
              />
              {formData.sourceDocument && (
                <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm text-green-600 flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    {formData.sourceDocument.name}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Technical details, model specifications, breakdown..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Comment (Optional)</Label>
            <Textarea
              id="comment"
              placeholder="Purpose or context, e.g., 'for future interns'"
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              rows={2}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Quote Request'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default QuoteForm;
