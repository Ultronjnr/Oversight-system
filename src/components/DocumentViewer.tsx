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
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  // Log file details for debugging
  React.useEffect(() => {
    if (fileUrl) {
      console.log('📄 Document loaded:', { fileName, fileUrl: fileUrl.substring(0, 100) + '...', fileType });
    }
  }, [fileUrl, fileName, fileType]);

  const handleDownload = async () => {
    setIsLoading(true);
    setDownloadError(false);

    try {
      if (!fileUrl) {
        throw new Error('No file URL available');
      }

      console.log('📥 Starting download:', fileName);

      let blob: Blob;
      let downloadUrl: string;

      // Handle different URL types
      if (fileUrl.startsWith('data:')) {
        // Data URL - convert directly to blob
        console.log('📦 Processing data URL');
        const arr = fileUrl.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
        const bstr = atob(arr[1]);
        const n = bstr.length;
        const u8arr = new Uint8Array(n);
        for (let i = 0; i < n; i++) {
          u8arr[i] = bstr.charCodeAt(i);
        }
        blob = new Blob([u8arr], { type: mime });
      } else if (fileUrl.startsWith('blob:')) {
        // Blob URL - fetch it
        console.log('🔗 Processing blob URL');
        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch blob: ${response.status}`);
        }
        blob = await response.blob();
      } else {
        // Regular URL (Supabase, etc) - fetch with proper headers
        console.log('🌐 Fetching from URL:', fileUrl.substring(0, 100) + '...');
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        try {
          const response = await fetch(fileUrl, {
            mode: 'cors',
            credentials: 'include',
            signal: controller.signal,
            headers: {
              'Accept': fileType || '*/*'
            }
          });

          clearTimeout(timeout);

          if (!response.ok) {
            throw new Error(`Server returned ${response.status} ${response.statusText}`);
          }

          blob = await response.blob();
          console.log('✅ File fetched successfully, size:', blob.size, 'bytes');
        } catch (fetchError: any) {
          clearTimeout(timeout);
          if (fetchError.name === 'AbortError') {
            throw new Error('Download timeout - the file took too long to download');
          }
          throw fetchError;
        }
      }

      // Create download link and trigger download
      downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName || 'document';
      link.style.display = 'none';

      // Append to body, click, and remove
      document.body.appendChild(link);

      // Use setTimeout to ensure browser recognizes the click
      setTimeout(() => {
        link.click();
        console.log('✅ Download triggered:', fileName);

        // Cleanup after a short delay to ensure download starts
        setTimeout(() => {
          if (document.body.contains(link)) {
            document.body.removeChild(link);
          }
          window.URL.revokeObjectURL(downloadUrl);
        }, 100);
      }, 0);

    } catch (error: any) {
      console.error('❌ Download failed:', error);
      setDownloadError(error.message || 'Failed to download the document');
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
            <div className="flex-1">
              {downloadError && (
                <div className="flex items-start text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                  <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Download failed</p>
                    <p className="text-xs mt-1 text-red-700">{downloadError}</p>
                    <p className="text-xs mt-2 text-gray-600">Try clicking the Download button again</p>
                  </div>
                </div>
              )}
              {!downloadError && thumbnailLoaded && fileType?.startsWith('image/') && (
                <div className="flex items-center text-green-600 text-sm">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Image loaded successfully
                </div>
              )}
            </div>
            <Button
              onClick={handleDownload}
              disabled={isLoading}
              className="ml-4 flex items-center bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              {isLoading ? (
                <>
                  <span className="animate-spin inline-block mr-2">⏳</span>
                  Downloading...
                </>
              ) : (
                'Download'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentViewer;
