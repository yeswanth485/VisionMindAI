import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const Dashboard = () => {
  const [documents, setDocuments] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch documents from API
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/document');
        if (!response.ok) {
          throw new Error('Failed to fetch documents');
        }
        const data = await response.json();
        setDocuments(Array.isArray(data) ? data : [data]);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load documents');
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  // Handle document selection
  const handleDocumentSelect = (id: string) => {
    router.push(`/dashboard/${id}`);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Document Dashboard</h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full border-4 border-blue-500 border-t-transparent h-8 w-8"></div>
          <span className="ml-3 text-gray-600">Loading documents...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Document Dashboard</h2>
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Document Dashboard</h2>
        <p className="text-gray-500">No documents uploaded yet. Upload a document to see results here.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Document Dashboard</h2>
      <div className="space-y-4">
        {documents.map((doc) => (
          <div
            key={doc.id}
            onClick={() => handleDocumentSelect(doc.id)}
            className="cursor-pointer border rounded-lg p-4 hover:shadow-md transition-shadow border-gray-200"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded flex items-center justify-center mr-3">
                <span className="text-blue-600 font-medium">{doc.doc_type?.toUpperCase()[0] ?? 'DOC'}</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-800 truncate">
                  {doc.file_url?.split('/').pop() ?? 'Unknown Document'}
                </h3>
                <p className="text-sm text-gray-500">
                  Type: {doc.doc_type ?? 'Unknown'} • 
                  Status: {doc.status ?? 'Unknown'} • 
                  {new Date(doc.created_at || 0).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;