'use client';

import { useState } from 'react';
import UploadForm from '@/components/UploadForm';
import FileUpload from '@/components/FileUpload';
import ResultCard from '@/components/ResultCard';

export default function Studio() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (file: File) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/multimodal/process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setResults(prev => [result, ...prev]);
    } catch (error) {
      console.error('Upload error:', error);
      setResults(prev => [
        {
          error: error.message,
          input_type: 'error',
          summary: 'Processing failed'
        },
        ...prev
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Multimodal Studio
        </h1>
        <p className="text-gray-600 mb-8">
          Upload video, audio, or documents for multimodal AI analysis
        </p>
        
        <div className="space-y-6">
          <UploadForm onUpload={handleUpload} loading={loading} />
          
          {results.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-800">
                Analysis Results
              </h2>
              <div className="grid gap-4">
                {results.map((result, index) => (
                  <ResultCard key={index} result={result} />
                ))}
              </div>
            </div>
          )}
          
          {results.length === 0 && !loading && (
            <p className="text-gray-500 text-center py-12">
              No results yet. Upload a file to get started.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}