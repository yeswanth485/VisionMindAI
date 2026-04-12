import { useState } from 'react';

interface UploadFormProps {
  onUpload?: (file: File) => Promise<void>;
  loading?: boolean;
}

const UploadForm = ({ onUpload, loading }: UploadFormProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [internalUploadStatus, setInternalUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const isUploading = loading || internalUploadStatus === 'uploading';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setErrorMessage('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorMessage('Please select a file to upload');
      return;
    }

    if (onUpload) {
      try {
        await onUpload(selectedFile);
        setSelectedFile(null);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred');
      }
      return;
    }

    setInternalUploadStatus('uploading');
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const data = await response.json();
      setDocumentId(data.document_id);
      setInternalUploadStatus('success');
    } catch (error) {
      setInternalUploadStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setInternalUploadStatus('idle');
    setDocumentId(null);
    setErrorMessage('');
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Upload Document</h2>
      
      {(internalUploadStatus === 'success') && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
          <p className="text-green-800">Document uploaded successfully! Processing...</p>
          {documentId && (
            <p className="mt-1 text-sm text-green-600">
              Document ID: <code className="bg-green-100 px-2 py-0.5 rounded">{documentId}</code>
            </p>
          )}
        </div>
      )}

      {(internalUploadStatus === 'error' || errorMessage) && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <p className="text-red-800">{errorMessage}</p>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select a document (PDF, PNG, JPG, JPEG, TIFF, BMP)
        </label>
        <div className="flex items-center">
          <input
            type="file"
            id="document-upload"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
            accept=".pdf,.png,.jpg,.jpeg,.tiff,.bmp"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </div>
        {selectedFile && (
          <p className="mt-1 text-xs text-gray-500">
            Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:gap-3">
        <button
          onClick={handleUpload}
          disabled={isUploading || !selectedFile}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? 'Uploading...' : 'Upload Document'}
        </button>

        {selectedFile && (
          <button
            onClick={handleReset}
            disabled={isUploading}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
};

export default UploadForm;