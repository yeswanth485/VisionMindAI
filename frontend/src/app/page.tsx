import UploadForm from '@/components/UploadForm';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            VisionMind AI Document Intelligence
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Upload documents to extract insights, validate data, and make informed decisions
          </p>
        </div>
        
        <div className="grid gap-8 md:grid-cols-[1fr_350px]">
          <div>
            <UploadForm />
          </div>
          <div>
            <Dashboard />
          </div>
        </div>
      </div>
    </div>
  );
}