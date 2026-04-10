import ResultCard from '@/components/ResultCard';

export default function SettingsPage() {
  return (
    <div className="flex flex-col min-h-screen p-8 lg:p-12 animate-fade-in">
      <header className="mb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Settings</h1>
        <p className="text-textMuted text-lg">Configure your VisionMind application.</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl mx-auto">
        <ResultCard title="API Configuration" icon="🔌">
          <div className="space-y-4 p-4 text-sm text-textMuted">
            <div>
              <label className="block text-white mb-1">Backend URL</label>
              <div className="bg-white/5 p-3 rounded-lg border border-white/10 font-mono text-xs">
                 {process.env.NEXT_PUBLIC_API_URL || 'Using default Render backend'}
              </div>
            </div>
          </div>
        </ResultCard>

        <ResultCard title="Account Profile" icon="👤">
          <div className="flex items-center gap-4 p-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xl font-bold font-sans">
              VM
            </div>
            <div>
              <h3 className="text-white font-medium text-lg">Admin User</h3>
              <p className="text-textMuted text-sm">VisionMind Platform</p>
            </div>
          </div>
        </ResultCard>
      </section>
    </div>
  );
}
