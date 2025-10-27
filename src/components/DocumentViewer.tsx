import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye, Download, FileText, Image as ImageIcon, FileIcon, AlertCircle, CheckCircle } from 'lucide-react';

interface DocumentViewerProps {
  fileName: string;
  fileUrl?: string;
  fileType?: string;
  quoteId: string;
}

const DocumentViewer = ({ fileName, fileUrl, fileType, quoteId }: DocumentViewerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [downloadError, setDownloadError] = useState(false);
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  const handleDownload = async () => {
    setIsLoading(true);
    setDownloadError(false);

    try {
      if (fileUrl) {
        const response = await fetch(fileUrl, { mode: 'cors' });

        if (!response.ok) {
          throw new Error(`Download failed with status ${response.status}`);
        }

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
        throw new Error('No file URL available');
      }
    } catch (error) {
      console.error('Download failed:', error);
      setDownloadError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const getFileIcon = () => {
    if (fileType?.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (fileType === 'application/pdf') return <FileText className="h-4 w-4" />;
    return <FileIcon className="h-4 w-4" />;
  };

  const getThumbnail = () => {
    if (!fileUrl) return null;

    // For images, show a small thumbnail
    if (fileType?.startsWith('image/')) {
      return (
        <img
          src={fileUrl}
          alt={fileName}
          className="h-10 w-10 object-cover rounded border border-gray-200"
          onLoad={() => setThumbnailLoaded(true)}
          onError={() => setImageLoadFailed(true)}
        />
      );
    }

    // For PDFs and other files, show file icon
    return (
      <div className="h-10 w-10 flex items-center justify-center bg-gray-100 rounded border border-gray-200">
        {getFileIcon()}
      </div>
    );
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
        <div className="flex justify-center items-center bg-gray-50 rounded-md p-4 min-h-[400px]">
          {!imageLoadFailed ? (
            <img
              src={fileUrl}
              alt={fileName}
              className="max-w-full max-h-[500px] object-contain rounded shadow-md"
              onError={() => setImageLoadFailed(true)}
              onLoad={() => setThumbnailLoaded(true)}
            />
          ) : (
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-2 text-red-400" />
              <p className="text-red-500">Failed to load image</p>
              <p className="text-sm text-gray-400 mt-2">Please try downloading the file</p>
            </div>
          )}
        </div>
      );
    }

    if (fileType === 'application/pdf') {
      return (
        <div className="flex items-center justify-center h-96 bg-gradient-to-br from-red-50 to-orange-50 rounded-md p-4">
          <div className="text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 bg-red-100 rounded-full mb-4">
              <FileText className="h-8 w-8 text-red-600" />
            </div>
            <p className="text-lg font-semibold text-gray-800 mb-2">{fileName}</p>
            <p className="text-gray-600 mb-4">PDF Document</p>
            <p className="text-sm text-gray-500">
              Click Download to view the full document
            </p>
          </div>
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
          <Button
            variant="ghost"
            size="sm"
            className="text-blue-600 hover:text-blue-800 p-0 h-10 w-10 flex items-center justify-center"
            title="Preview document"
          >
            {fileUrl && fileType?.startsWith('image/') && !imageLoadFailed ? getThumbnail() : getFileIcon()}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getFileIcon()}
              <span className="truncate">{fileName}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {renderPreview()}
          </div>
          <div className="flex justify-between items-center mt-6 pt-4 border-t">
            {downloadError && (
              <div className="flex items-center text-red-600 text-sm">
                <AlertCircle className="h-4 w-4 mr-2" />
                Download failed. Please try again.
              </div>
            )}
            {!downloadError && thumbnailLoaded && fileType?.startsWith('image/') && (
              <div className="flex items-center text-green-600 text-sm">
                <CheckCircle className="h-4 w-4 mr-2" />
                Image loaded successfully
              </div>
            )}
            <div className="flex-1"></div>
            <Button
              onClick={handleDownload}
              disabled={isLoading}
              className="flex items-center bg-blue-600 hover:bg-blue-700"
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
