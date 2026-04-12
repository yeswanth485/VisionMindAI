'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import UploadForm from '@/components/UploadForm';
import FileUpload from '@/components/FileUpload';
import ResultCard from '@/components/ResultCard';

function StudioReportContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [documentId, setDocumentId] = useState<string | null>(null);

  useEffect(() => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    if (id) {
      setDocumentId(id);
      // In a real implementation, fetch the document by ID from backend
      // For now, we'll simulate loading
      loadDocumentResults(id);
    }
  }, [params.id]);

  const loadDocumentResults = async (id: string) => {
    setLoading(true);
    try {
      // Simulate fetching document results
      // In reality, this would be: const response = await fetch(`/api/documents/${id}`);
      // For demo, we'll create mock data based on the ID
      const mockResult = {
        id,
        input_type: Math.random() > 0.5 ? 'video' : 'document',
        summary: `Analysis results for document ${id}`,
        structured_data: {
          length: Math.floor(Math.random() * 1000),
          type: Math.random() > 0.5 ? 'video' : 'document'
        },
        insights: ['Insight 1', 'Insight 2', 'Insight 3'].slice(0, Math.floor(Math.random() * 3) + 1),
        video_timeline: [
          { timestamp: '00:00:05', event: 'Introduction', description: 'Opening remarks' },
          { timestamp: '00:00:15', event: 'Main Topic', description: 'Discussion of key concepts' },
          { timestamp: '00:00:30', event: 'Conclusion', description: 'Summary and next steps' }
        ].slice(0, Math.floor(Math.random() * 3)),
        unified_reasoning: {
          unified_summary: `Unified analysis of content showing key themes and patterns`,
          key_entities: ['Entity A', 'Entity B', 'Entity C'],
          relationships: [
            { source: 'Entity A', relation: 'mentions', target: 'Entity B' },
            { source: 'Entity B', relation: 'related to', target: 'Entity C' }
          ]
        },
        agent_result: {
          plan: [
            { step: 1, action: 'Review document', risk: 'low', status: 'done' },
            { step: 2, action: 'Extract key points', risk: 'low', status: 'done' },
            { step: 3, action: 'Generate summary', risk: 'low', status: 'done' }
          ],
          actions_executed: ['review_document', 'extract_key_points', 'generate_summary'],
          status: 'success',
          errors: []
        },
        confidence_score: 0.85
      };
      
      setResults([mockResult]);
    } catch (error) {
      console.error('Error loading document:', error);
      setResults([{
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        input_type: 'error',
        summary: 'Loading failed'
      }]);
    } finally {
      setLoading(false);
    }
  };

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
      // In a real app, we'd redirect to the new document's page
      // For now, we'll just update the current results
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Document Report
          </h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                // In a real app, this would go back to studio
                window.history.back();
              }}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Back to Studio
            </button>
          </div>
        </div>
        
        {documentId && (
          <div className="mb-4 p-4 bg-white rounded-lg shadow">
            <p className="text-sm text-gray-600">
              Document ID: <span className="font-mono">{documentId}</span>
            </p>
          </div>
        )}
        
        <div className="space-y-6">
          <UploadForm onUpload={handleUpload} loading={loading} />
          
          {results.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Analysis Details
              </h2>
              <div className="space-y-4">
                {results.map((result, index) => (
                  <ResultCard key={index} result={result} />
                ))}
              </div>
            </div>
          )}
          
          {results.length === 0 && !loading && (
            <p className="text-gray-500 text-center py-12">
              No results available for this document.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StudioReport() {
  return (
    <Suspense fallback={
       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
       </div>
    }>
       <StudioReportContent />
    </Suspense>
  );
}