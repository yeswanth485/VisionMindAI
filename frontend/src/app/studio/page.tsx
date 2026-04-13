'use client';

import { useState } from 'react';
import { multimodalAPI } from '@/services/api';
import UploadForm from '@/components/UploadForm';
import ResultCard from '@/components/ResultCard';

export default function Studio() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (file: File) => {
    setLoading(true);
    try {
      const result = await multimodalAPI.process(file);
      setResults(prev => [result, ...prev]);
    } catch (error) {
      console.error('Upload error:', error);
      setResults(prev => [
        {
          error: error instanceof Error ? error.message : 'An unknown error occurred',
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
    <div className="relative min-h-screen bg-gradient-to-br from-black via-gray-900/50 to-black">
      <div className="container mx-auto px-6 py-12 max-w-6xl">
        <div className="glass-card p-8 mb-8">
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-primary via-blue-400 to-purple-500 bg-clip-text text-transparent mb-6 tracking-tight">
            Multimodal Studio
          </h1>
          <p className="text-xl text-textMuted/80 max-w-2xl leading-relaxed">
            Upload video, audio, images or documents for neural multimodal AI analysis
          </p>
        </div>
        
        <div className="space-y-8">
          <UploadForm onUpload={handleUpload} loading={loading} />
          
          {results.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/20 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl">🎥</span>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white tracking-tight">Neural Analysis</h2>
                  <p className="text-textMuted">{results.length} multimodal processing results</p>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {results.map((result, index) => (
                  <ResultCard key={index} result={result} delay={index * 100} />
                ))}
              </div>
            </div>
          )}
          
          {results.length === 0 && !loading && (
            <div className="glass-card p-16 text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-white/10 rounded-3xl flex items-center justify-center">
                <span className="text-4xl">🎥</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Ready for Multimodal Processing</h3>
              <p className="text-textMuted max-w-md mx-auto mb-8">
                Upload any video, audio, image or document to unlock neural analysis across modalities
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

