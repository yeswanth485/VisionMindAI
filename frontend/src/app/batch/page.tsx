'use client';

import { useState, useRef } from 'react';
import { documentAPI } from '@/services/api';

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

  const handleFiles = (files: File[]) => {
    // Limit to 10 files
    const limitedFiles = files.slice(0, 10);
    
    // Initialize progress for each file
    const initialProgress = limitedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      progress: 0,
      status: 'pending' as const
    }));
    
    setUploadProgress(initialProgress);
    setError(null);
  };

  const processBatch = async () => {
    if (uploadProgress.length === 0 || isUploading) return;
    
    setIsUploading(true);
    setError(null);

    // Get the files from the input or from a temporary state
    // For simplicity in this UI, we'll re-fetch from the ref if possible, 
    // but in a real app we'd keep the File objects in state.
    // Let's assume we have them. 
    // Since I can't easily get the original File objects from the 'uploadProgress' state,
    // I will modify handleFiles to store the File objects.
  };

  // Re-writing handleFiles to store File objects for real batch processing
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFilesCorrected = (files: File[]) => {
    const limitedFiles = files.slice(0, 10);
    setSelectedFiles(limitedFiles);
    
    const initialProgress = limitedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      progress: 0,
      status: 'pending' as const
    }));
    
    setUploadProgress(initialProgress);
    setError(null);
  };

  const handleUploadAll = async () => {
    if (selectedFiles.length === 0 || isUploading) return;
    
    setIsUploading(true);
    
    // Update all to uploading
    setUploadProgress(prev => prev.map(p => ({...p, status: 'uploading', progress: 30})));
    
    try {
      // Call the REAL batch upload endpoint
      const response = await documentAPI.batchUpload(selectedFiles);
      
      // Update all to success
      setUploadProgress(prev => prev.map(p => ({...p, status: 'success', progress: 100})));
      setTimeout(() => {
        window.location.href = '/history';
      }, 2000);
      
    } catch (err: any) {
      console.error('Batch upload error:', err);
      setError(err.response?.data?.detail || 'Failed to upload batch. Please try again.');
      setUploadProgress(prev => prev.map(p => ({...p, status: 'error', progress: 0})));
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    setUploadProgress([]);
    setSelectedFiles([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-6 lg:p-12 animate-fade-in relative">
      <header className="mb-12">
        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-2">
           BATCH <span className="text-primary">UPLOAD</span>
        </h1>
        <p className="text-textMuted text-lg max-w-2xl">
          Ingest multiple documents into the VisionMind Neural Engine. Up to 10 files per session.
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 items-start">
        
        {/* Upload Zone */}
        <div className="space-y-6">
          <div 
            className={`glass-card border-2 border-dashed transition-all duration-500 rounded-[2rem] p-16 text-center group ${
              isDragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-white/10 hover:border-primary/40'
            }`}
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
              accept=".pdf,.png,.jpg,.jpeg,.tiff,.bmp,.json"
              className="hidden"
              onChange={(e) => e.target.files && handleFilesCorrected(Array.from(e.target.files))}
            />
            
            <div className="flex flex-col items-center">
              <div className={`w-24 h-24 mb-6 rounded-3xl flex items-center justify-center transition-all duration-500 shadow-xl ${
                isDragging ? 'bg-primary text-white rotate-12 scale-110' : 'bg-white/5 text-primary group-hover:bg-primary/20 group-hover:-translate-y-2'
              }`}>
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                {isDragging ? 'RELEASE TO UPLOAD' : 'DROP FILES HERE'}
              </h3>
              <p className="text-textMuted font-medium mb-8">
                or click to explore files from your system
              </p>
              <div className="flex gap-4">
                 <span className="px-4 py-1.5 bg-white/5 rounded-full text-[10px] font-bold text-textMuted uppercase border border-white/10">PDF</span>
                 <span className="px-4 py-1.5 bg-white/5 rounded-full text-[10px] font-bold text-textMuted uppercase border border-white/10">IMG</span>
                 <span className="px-4 py-1.5 bg-white/5 rounded-full text-[10px] font-bold text-textMuted uppercase border border-white/10">JSON</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-medium animate-shake">
              ⚠️ {error}
            </div>
          )}

          <div className="flex gap-4">
            <button 
              onClick={handleUploadAll}
              disabled={isUploading || selectedFiles.length === 0}
              className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 disabled:opacity-30 transition-all uppercase tracking-widest text-xs"
            >
              {isUploading ? 'Neural Processing...' : `Analyze ${selectedFiles.length} Documents`}
            </button>
            <button 
              onClick={handleClear}
              disabled={isUploading || selectedFiles.length === 0}
              className="px-6 py-4 bg-white/5 text-white border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all uppercase tracking-widest text-xs"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Status Area */}
        <div className="glass-card rounded-[2rem] p-8 border-white/5 min-h-[500px] flex flex-col">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-white">Ingestion Queue</h3>
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-bold">{selectedFiles.length} READY</span>
           </div>

           <div className="flex-1 space-y-4">
              {uploadProgress.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-20">
                   <span className="text-6xl mb-4">📥</span>
                   <p className="font-bold">Queue is currently empty</p>
                </div>
              ) : (
                uploadProgress.map((file) => (
                  <div key={file.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-4 group transition-all hover:bg-white/10">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      file.status === 'success' ? 'bg-accent/20 text-accent' : 
                      file.status === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-textMuted'
                    }`}>
                      {file.status === 'success' ? '✓' : file.status === 'error' ? '!' : '📄'}
                    </div>
                    <div className="flex-1 min-w-0">
                       <div className="flex justify-between items-end mb-2">
                          <p className="text-sm font-bold text-white truncate pr-4">{file.name}</p>
                          <span className="text-[10px] font-mono text-textMuted uppercase">{file.status}</span>
                       </div>
                       <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-1000 ${
                              file.status === 'success' ? 'bg-accent' : 
                              file.status === 'error' ? 'bg-red-500' : 'bg-primary'
                            }`}
                            style={{ width: `${file.progress}%` }}
                          ></div>
                       </div>
                    </div>
                  </div>
                ))
              )}
           </div>

           {isUploading && (
              <div className="mt-8 p-4 bg-primary/10 border border-primary/20 rounded-2xl animate-pulse">
                 <p className="text-xs text-primary font-bold uppercase tracking-widest text-center">Neural Extraction in progress... Please wait.</p>
              </div>
           )}
        </div>

      </div>
    </div>
  );
}