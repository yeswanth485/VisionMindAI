'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { documentAPI } from '@/services/api';

export default function FileUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const processFile = async (file: File) => {
    setIsUploading(true);
    setError(null);
    try {
      const response = await documentAPI.upload(file);
      if (response.document_id) {
        // Redirect to processing page
        router.push(`/document/${response.document_id}`);
      }
    } catch (err: unknown) {
      console.error(err);
      const errorMsg = err instanceof Error ? (err as any).response?.data?.detail || err.message : 'Failed to upload document. Please try again.';
      setError(errorMsg);
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div 
        className={`glass-card relative overflow-hidden transition-all duration-500 ease-out border-2 border-dashed ${
          isDragging 
            ? 'border-primary bg-primary/5 scale-[1.02] shadow-[0_0_30px_rgba(59,130,246,0.3)]' 
            : 'border-white/10 hover:border-primary/50 hover:bg-white/5'
        } rounded-3xl p-12 text-center cursor-pointer group`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleChange} 
          className="hidden" 
          accept=".pdf,.png,.jpg,.jpeg,.tiff,.bmp"
        />

        {isUploading ? (
          <div className="flex flex-col items-center justify-center animate-fade-in py-8">
            <div className="w-16 h-16 relative mb-6">
              <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
            </div>
            <h3 className="text-2xl font-semibold text-white mb-2">Analyzing Document...</h3>
            <p className="text-textMuted">Uploading to VisionMind AI secured servers.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center animate-fade-in">
            <div className={`w-20 h-20 mb-6 rounded-full flex items-center justify-center transition-all duration-500 ${
              isDragging ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/40' : 'bg-white/5 text-primary group-hover:bg-primary/20'
            }`}>
               <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-white mb-3">
              {isDragging ? 'Drop document here' : 'Drag & drop document'}
            </h3>
            <p className="text-textMuted text-lg mb-6 max-w-md">
              or click to browse from your computer. Supports PDF, JPG, PNG, TIFF.
            </p>
            <button className="px-8 py-3 rounded-full bg-primary/20 text-primary border border-primary/30 hover:bg-primary hover:text-white hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-300 font-medium">
              Select File
            </button>
            
            {error && (
              <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 max-w-md w-full animate-fade-in text-sm text-left flex gap-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>{error}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
