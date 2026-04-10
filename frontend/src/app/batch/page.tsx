'use client';

import { useState, useRef } from 'react';

export default function BatchUploadPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Array<{id: string; name: string; progress: number; status: 'pending' | 'uploading' | 'success' | 'error'}>>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    // Limit to 10 files
    const limitedFiles = fileArray.slice(0, 10);
    
    // Initialize progress for each file
    const initialProgress = limitedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      progress: 0,
      status: 'pending'
    }));
    
    setUploadProgress(initialProgress);
    setError(null);
    
    // Process each file
    limitedFiles.forEach((file, index) => {
      // Simulate upload progress (in real app, this would be actual upload)
      const fileId = uploadProgress[index].id;
      
      // Update status to uploading
      setUploadProgress(prev => 
        prev.map(p => 
          p.id === fileId ? {...p, status: 'uploading', progress: 10} : p
        )
      );
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          return prev.map(p => {
            if (p.id === fileId) {
              let newProgress = Math.min(p.progress + 10, 90);
              return {...p, progress: newProgress};
            }
            return p;
          });
        });
      }, 200);
      
      // Complete after a delay
      setTimeout(() => {
        clearInterval(progressInterval);
        setUploadProgress(prev => 
          prev.map(p => 
            p.id === fileId ? {...p, progress: 100, status: 'success'} : p
          )
        );
        
        // Check if all files are done
        setTimeout(() => {
          const allDone = uploadProgress.every(p => p.status === 'success' || p.status === 'error');
          if (allDone) {
            setIsUploading(false);
          }
        }, 500);
      }, 2000 + Math.random() * 1000); // Random delay for realism
    });
    
    setIsUploading(true);
  };

  const handleRetry = () => {
    // Reset and retry
    setUploadProgress([]);
    setError(null);
  };

  const handleClear = () => {
    setUploadProgress([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-6 lg:p-12 animate-fade-in">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">📤 Batch Document Upload</h1>
        <p className="text-textMuted text-lg">
          Process up to 10 files at once with AI-powered document intelligence
        </p>
      </header>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          {error}
        </div>
      )}

      <div className={`flex flex-col items-center justify-center ${
        isUploading ? 'opacity-70' : ''
      }`}>
        <div 
          className={`w-full max-w-2xl glass-card relative overflow-hidden transition-all duration-500 ease-out border-2 border-dashed ${
            isDragging 
              ? 'border-primary bg-primary/5 scale-[1.02] shadow-[0_0_30px_rgba(59,130,246,0.3)]' 
              : 'border-white/10 hover:border-primary/50 hover:bg-white/5'
          } rounded-3xl p-12 text-center cursor-pointer`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.tiff,.bmp"
            className="hidden"
          />
          
          {isUploading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 relative mb-6">
                <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-2">Processing Documents...</h3>
              <p className="text-textMuted">Uploading to VisionMind AI secured servers.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <div className={`w-20 h-20 mb-6 rounded-full flex items-center justify-center transition-all duration-500 ${
                isDragging ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/40' : 'bg-white/5 text-primary group-hover:bg-primary/20'
              }`}>
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-3">
                {isDragging ? 'Drop documents here' : 'Drag & drop documents'}
              </h3>
              <p className="text-textMuted text-lg mb-6 max-w-md">
                or click to browse from your computer. Supports PDF, JPG, PNG, TIFF.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <button 
                  className="px-6 py-3 rounded-full bg-primary/20 text-primary border border-primary/30 hover:bg-primary hover:text-white hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-300 font-medium"
                  onClick={handleClear}
                  disabled={isUploading}
                >
                  Clear
                </button>
                <button 
                  className="px-6 py-3 rounded-full bg-primary/20 text-primary border border-primary/30 hover:bg-primary hover:text-white hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-300 font-medium ml-2"
                  onClick={handleRetry}
                  disabled={isUploading || uploadProgress.length === 0}
                >
                  Retry
                </button>
              </div>
              <button 
                className="mt-6 px-8 py-3 rounded-full bg-primary/20 text-primary border border-primary/30 hover:bg-primary hover:text-white hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-300 font-medium"
                disabled={isUploading || uploadProgress.length === 0}
              >
                Process All ({uploadProgress.length} Files)
              </button>
            </div>
          )}
        </div>
      </div>

      {uploadProgress.length > 0 && !isUploading && (
        <div className="mt-8 w-full max-w-2xl">
          <h3 className="text-white font-semibold mb-4">Upload Status</h3>
          <div className="space-y-3">
            {uploadProgress.map((file, index) => (
              <div key={file.id} className="flex items-start p-3 bg-white/5 rounded-hover">
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                  {file.status === 'pending' && (
                    <span className="text-textMuted">⏳</span>
                  )}
                  {file.status === 'uploading' && (
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent animate-spin"></div>
                  )}
                  {file.status === 'success' && (
                    <span className="text-primary">✅</span>
                  )}
                  {file.status === 'error' && (
                    <span className="text-red-400">❌</span>
                  )}
                </div>
                <div className="flex-1 ml-3">
                  <p className="text-white font-medium truncate">{file.name}</p>
                  <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                    <div className={`h-full bg-primary transition-all duration-500 w-${file.progress}%`}></div>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-textMuted">{file.progress}%</span>
                    <span className="text-textMuted">
                      {file.status === 'pending' && 'Pending'}
                      {file.status === 'uploading' && 'Uploading...'}
                      {file.status === 'success' && 'Completed'}
                      {file.status === 'error' && 'Error'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}