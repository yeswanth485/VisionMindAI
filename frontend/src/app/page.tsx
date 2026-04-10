import FileUpload from '@/components/FileUpload';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen p-8 lg:p-12">
      <header className="mb-12 flex justify-between items-center">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Process Document</h1>
          <p className="text-textMuted text-lg">Upload an invoice, receipt, or ID for instant intelligence extraction.</p>
        </div>
        <div className="hidden md:flex gap-4">
          <div className="glass px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
            API Online
          </div>
        </div>
      </header>

      <section className="flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto w-full relative z-10">
        
        {/* Decorative background elements behind uploader */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-br from-primary/5 to-secondary/5 blur-3xl -z-10 rounded-full pointer-events-none"></div>

        <FileUpload />

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 w-full opacity-80">
          <div className="glass-card p-6 flex flex-col items-center text-center group">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
              <span className="text-2xl">⚡</span>
            </div>
            <h4 className="text-white font-medium mb-1">Instant Extraction</h4>
            <p className="text-sm text-textMuted">Powered by Tesseract OCR and OpenAI GPT-3.5</p>
          </div>
          
          <div className="glass-card p-6 flex flex-col items-center text-center group">
            <div className="w-12 h-12 bg-secondary/10 text-secondary rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
              <span className="text-2xl">🛡️</span>
            </div>
            <h4 className="text-white font-medium mb-1">Auto Validation</h4>
            <p className="text-sm text-textMuted">Cross-checks consistency and flags anomalies automatically</p>
          </div>

          <div className="glass-card p-6 flex flex-col items-center text-center group">
            <div className="w-12 h-12 bg-accent/10 text-accent rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
              <span className="text-2xl">🧠</span>
            </div>
            <h4 className="text-white font-medium mb-1">Smart Decisioning</h4>
            <p className="text-sm text-textMuted">Calculates risk level and recommends actions instantly</p>
          </div>
        </div>
      </section>
    </div>
  );
}