import React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye, Download, FileText, Image, FileIcon, AlertCircle } from 'lucide-react';

interface DocumentViewerProps {
  fileName: string;
  fileUrl?: string;
  fileType?: string;
  quoteId: string;
}

const DocumentViewer = ({ fileName, fileUrl, fileType, quoteId }: DocumentViewerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [downloadError, setDownloadError] = useState(false);

  const handleDownload = async () => {
    setIsLoading(true);
    setDownloadError(false);
    
    try {
      if (fileUrl) {
        // For blob URLs (uploaded files), download directly
        const a = document.createElement('a');
        a.href = fileUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        // For server files, make API call
        const response = await fetch(`/api/quotes/${quoteId}/document/download`);
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } else {
          throw new Error('Download failed');
        }
      }
    } catch (error) {
      console.error('Download failed:', error);
      setDownloadError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const getFileIcon = () => {
    if (fileType?.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (fileType === 'application/pdf') return <FileText className="h-4 w-4" />;
    return <FileIcon className="h-4 w-4" />;
  };

  const renderPreview = () => {
    if (!fileUrl) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-100 rounded-md">
          <div className="text-center">
            <FileIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p className="text-gray-500">Preview not available</p>
            <p className="text-sm text-gray-400">File may need to be uploaded to server</p>
          </div>
        </div>
      );
    }

    if (fileType?.startsWith('image/')) {
      return (
        <div className="flex justify-center items-center bg-gray-50 rounded-md p-4">
          <img 
            src={fileUrl} 
            alt={fileName}
            className="max-w-full max-h-96 object-contain rounded shadow-md"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <div className="hidden text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-2 text-red-400" />
            <p className="text-red-500">Failed to load image</p>
          </div>
        </div>
      );
    }

    if (fileType === 'application/pdf') {
      return (
        <div className="bg-gray-50 rounded-md">
          <iframe
            src={fileUrl}
            className="w-full h-96 rounded-md"
            title={fileName}
            onError={() => console.warn('PDF preview failed')}
          />
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-md">
        <div className="text-center">
          {getFileIcon()}
          <p className="text-gray-500 mt-2">Cannot preview this file type</p>
          <p className="text-sm text-gray-400">{fileType || 'Unknown file type'}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex items-center space-x-2">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 p-1">
            {getFileIcon()}
            <Eye className="h-3 w-3 ml-1" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {getFileIcon()}
              <span className="ml-2 truncate">{fileName}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {renderPreview()}
          </div>
          <div className="flex justify-between items-center mt-4">
            {downloadError && (
              <div className="flex items-center text-red-600 text-sm">
                <AlertCircle className="h-4 w-4 mr-1" />
                Download failed. Please try again.
              </div>
            )}
            <div className="flex-1"></div>
            <Button 
              onClick={handleDownload} 
              disabled={isLoading}
              className="flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              {isLoading ? 'Downloading...' : 'Download'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentViewer;
