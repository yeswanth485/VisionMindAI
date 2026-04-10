import ResultCard from '@/components/ResultCard';

export default function HistoryPage() {
  return (
    <div className="flex flex-col min-h-screen p-8 lg:p-12 animate-fade-in">
      <header className="mb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Processing History</h1>
        <p className="text-textMuted text-lg">View your previously uploaded and analyzed documents.</p>
      </header>

      <section className="flex-1 w-full max-w-5xl mx-auto">
        <ResultCard title="Recent Documents" icon="🕒">
          <div className="flex flex-col items-center justify-center p-12 text-center text-textMuted">
            <span className="text-4xl mb-4">📭</span>
            <h3 className="text-xl text-white font-medium mb-2">No History Yet</h3>
            <p>Your processed documents will appear here once the backend saves them permanently.</p>
          </div>
        </ResultCard>
      </section>
    </div>
  );
}
