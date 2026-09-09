import React, { useState, useEffect, useRef } from 'react';
import { X, Download, FileText, Loader2 } from 'lucide-react';

const MobilePDFViewer = ({ url }) => {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const loadPdf = async () => {
      try {
        if (!window.pdfjsLib) {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
          });
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }

        const loadingTask = window.pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;
        
        if (!isMounted) return;

        const container = containerRef.current;
        if (!container) return;
        
        container.innerHTML = ''; // Clear previous

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 1.5 });
          
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          canvas.className = 'max-w-full h-auto mb-4 rounded shadow bg-white mx-auto';
          
          container.appendChild(canvas);
          
          await page.render({
            canvasContext: context,
            viewport: viewport
          }).promise;
        }
        
        if (isMounted) setLoading(false);
      } catch (err) {
        console.error('Error rendering PDF:', err);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    };

    loadPdf();

    return () => { isMounted = false; };
  }, [url]);

  if (error) {
    return <div className="text-gray-500 p-4">Error loading PDF preview. Please download the file instead.</div>;
  }

  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar p-2 relative text-center">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 z-10">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      )}
      <div ref={containerRef} className="w-full flex flex-col items-center"></div>
    </div>
  );
};

export function FilePreviewModal({ isOpen, onClose, fileUrl, fileType, fileName }) {
  const [blobUrl, setBlobUrl] = useState(null);

  useEffect(() => {
    if (isOpen && fileUrl) {
      if (fileUrl.startsWith('data:')) {
        try {
          const arr = fileUrl.split(',');
          const mime = arr[0].match(/:(.*?);/)[1];
          const bstr = atob(arr[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          const blob = new Blob([u8arr], { type: mime });
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);
          return () => URL.revokeObjectURL(url);
        } catch (error) {
          console.error("Error creating blob from base64:", error);
          setBlobUrl(fileUrl);
        }
      } else {
        setBlobUrl(fileUrl);
      }
    }
  }, [isOpen, fileUrl]);

  if (!isOpen) return null;

  const isImage = fileType === 'image' || (fileUrl && fileUrl.startsWith('data:image'));
  const isPdf = fileType === 'application/pdf' || (fileUrl && fileUrl.startsWith('data:application/pdf')) || (fileName && fileName.toLowerCase().endsWith('.pdf'));

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 bg-indigo-500/10 rounded-lg shrink-0">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="text-gray-900 font-bold truncate text-lg">
              {fileName || 'File Preview'}
            </h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors ml-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4 relative">
          {isImage ? (
            <img 
              src={blobUrl || fileUrl} 
              alt={fileName || 'Preview'} 
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
            />
          ) : isPdf ? (
            <div className="w-full h-full bg-white rounded-lg shadow-inner overflow-hidden relative">
              <MobilePDFViewer url={blobUrl || fileUrl} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto p-8 bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                <FileText className="w-10 h-10 text-indigo-600" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">No Preview Available</h4>
              <p className="text-gray-500 mb-8">
                This document type ({fileName?.split('.').pop()?.toUpperCase() || 'File'}) cannot be previewed directly in the browser. 
                Please download it to view its contents.
              </p>
              <button 
                onClick={handleDownload}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-1"
              >
                <Download className="w-5 h-5" />
                Download File
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
