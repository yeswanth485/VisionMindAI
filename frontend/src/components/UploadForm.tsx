import { useState, useRef } from 'react';

interface UploadFormProps {
  onUpload?: (file: File) => Promise<void>;
  loading?: boolean;
}

const UploadForm = ({ onUpload, loading }: UploadFormProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isUploading = loading;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setErrorMessage('');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setErrorMessage('');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
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
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setErrorMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="glass-card p-8 border-primary/20 bg-primary/5 animate-fade-in">
      <h2 className="text-2xl font-bold mb-6 text-white tracking-tight flex items-center gap-3">
        <span className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center text-sm">📁</span>
        Upload Document
      </h2>
      
      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 mb-6 rounded-xl transition-all">
          <p className="text-red-400 text-sm flex items-center gap-2">
            <span className="text-lg">⚠️</span> {errorMessage}
          </p>
        </div>
      )}

      <form onSubmit={handleUpload} className="space-y-6">
        <div 
          className={`relative group cursor-pointer transition-all duration-300 ${
            dragActive ? 'scale-[1.02] border-primary shadow-[0_0_20px_rgba(59,130,246,0.3)]' : ''
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.tiff,.bmp,.txt,.doc,.docx"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          
          <div className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-4 transition-all ${
            selectedFile ? 'border-primary/50 bg-primary/10' : 'border-white/10 hover:border-primary/30 hover:bg-white/5'
          }`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl transition-transform duration-500 ${
              selectedFile ? 'bg-primary text-white scale-110 shadow-lg' : 'bg-white/5 text-white/30 group-hover:scale-110'
            }`}>
              {selectedFile ? '📄' : '☁️'}
            </div>
            
            <div className="text-center">
              <p className="text-white font-bold mb-1">
                {selectedFile ? selectedFile.name : 'Click or drag file to upload'}
              </p>
              <p className="text-textMuted text-xs">
                {selectedFile 
                  ? `${Math.round(selectedFile.size / 1024)} KB • Ready for synthesis` 
                  : 'PDF, PNG, JPG, JPEG, TIFF, BMP, TXT'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isUploading || !selectedFile}
            className="flex-1 py-4 bg-primary text-white font-bold rounded-xl hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2 group overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
            {isUploading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Analyzing...
              </>
            ) : (
              <>Synthesize Knowledge <span className="text-xl group-hover:translate-x-1 transition-transform">→</span></>
            )}
          </button>

          {selectedFile && !isUploading && (
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all"
            >
              Reset
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default UploadForm;