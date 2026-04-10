'use client';

import { useEffect, useState } from 'react';

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [timeline, setTimeline] = useState<Array<any>>([]);
  const [vendors, setVendors] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        
        // Fetch all analytics data in parallel
        const [summaryRes, timelineRes, vendorsRes] = await Promise.all([
          fetch('/api/analytics/summary'),
          fetch('/api/analytics/timeline'),
          fetch('/api/analytics/vendors')
        ]);
        
        if (!summaryRes.ok || !timelineRes.ok || !vendorsRes.ok) {
          throw new Error('Failed to fetch analytics data');
        }
        
        const [summaryData, timelineData, vendorsData] = await Promise.all([
          summaryRes.json(),
          timelineRes.json(),
          vendorsRes.json()
        ]);
        
        setSummary(summaryData);
        setTimeline(timelineData);
        setVendors(vendorsData);
        setLoading(false);
      } catch (err) {
        console.error('Analytics error:', err);
        setError('Failed to load analytics data. Please try again.');
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen p-6 lg:p-12 animate-fade-in">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">📊 Analytics Dashboard</h1>
          <p className="text-textMuted text-lg">
            Insights and metrics from your processed documents
          </p>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full border-4 border-primary border-t-transparent h-12 w-12"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen p-6 lg:p-12 animate-fade-in">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">📊 Analytics Dashboard</h1>
          <p className="text-textMuted text-lg">
            Insights and metrics from your processed documents
          </p>
        </header>
        <div className="glass-card p-6 border-red-500/30 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold text-red-400 mb-2">Error Loading Analytics</h3>
          <p className="text-textMuted">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen p-6 lg:p-12 animate-fade-in">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">📊 Analytics Dashboard</h1>
        <p className="text-textMuted text-lg">
          Insights and metrics from your processed documents
        </p>
      </header>

      {!summary && (
        <div className="glass-card p-6 text-center">
          <p className="text-textMuted">No analytics data available yet. Upload some documents to see insights.</p>
        </div>
      )}

      {summary && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="glass-card p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded flex items-center justify-center">
                  <span className="text-2xl">📄</span>
                </div>
                <div>
                  <p className="text-textMuted text-xs uppercase tracking-wider">Total Documents</p>
                  <p className="text-2xl font-bold text-white">{summary.total_documents || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="glass-card p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-secondary/10 text-secondary rounded flex items-center justify-center">
                  <span className="text-2xl">🧾</span>
                </div>
                <div>
                  <p className="text-textMuted text-xs uppercase tracking-wider">Total Invoices</p>
                  <p className="text-2xl font-bold text-white">{summary.total_invoices || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="glass-card p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-accent/10 text-accent rounded flex items-center justify-center">
                  <span className="text-2xl">💰</span>
                </div>
                <div>
                  <p className="text-textMuted text-xs uppercase tracking-wider">Total Amount</p>
                  <p className="text-2xl font-bold text-white">${(summary.total_amount_processed || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="glass-card p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-white/5 rounded flex items-center justify-center">
                  <span className="text-2xl">⚖️</span>
                </div>
                <div>
                  <p className="text-textMuted text-xs uppercase tracking-wider">Avg Risk Level</p>
                  <p className="text-2xl font-bold text-white">
                    {summary.risk_distribution ? 
                      Object.entries(summary.risk_distribution).reduce((acc, [level, count]) => {
                        const weights = { low: 1, medium: 2, high: 3 };
                        return acc + (weights[level as keyof typeof weights] || 0) * count;
                      }, 0) / (summary.total_documents || 1) 
                      : 0
                    }.toFixed(1)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid gap-6 mb-8">
            <div className="glass-card p-6">
              <h3 className="text-white font-semibold mb-4">Risk Distribution</h3>
              <div className="space-y-3">
                {summary.risk_distribution && Object.entries(summary.risk_distribution).map(([level, count]) => (
                  <div key={level} className="flex items-center">
                    <span className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: level === 'high' ? '#ef4444' : level === 'medium' ? '#f59e0b' : '#ec4899' }}></span>
                    <span className="flex-1 text-textMuted">{level}</span>
                    <div className="w-24 bg-white/5 rounded-full relative">
                      <div className={`h-2 bg-${level === 'high' ? '#ef4444' : level === 'medium' ? '#f59e0b' : '#ec4899'} rounded-full` 
                        style={{ width: `${count * 20}%` }}></div>
                    </div>
                    <span className="w-8 text-textMuted text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="glass-card p-6">
              <h3 className="text-white font-semibold mb-4">Processing Timeline</h3>
              {timeline.length > 0 ? (
                <div className="h-48 bg-white/5 rounded-xl overflow-hidden relative">
                  <div className="absolute inset-0 bg-white/10"></div>
                  <div className="h-full w-full relative">
                    {timeline.map((day, index) => {
                      const barHeight = Math.max(4, (day.count / Math.max(1, Math.max(...timeline.map(d => d.count)))) * 80);
                      return (
                        <div 
                          key={index} 
                          className="absolute left-0 bottom-0"
                          style={{
                            width: `${100 / timeline.length}%`,
                            height: `${barHeight}%`,
                            backgroundColor: 'var(--primary)',
                            opacity: '0.8'
                          }}
                        >
                          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs text-textMuted">
                            {new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
                : (
                  <p className="text-textMuted text-center py-8">No timeline data available</p>
                )}
              </div>
          </div>

          {/* Top Vendors */}
          <div className="glass-card p-6">
            <h3 className="text-white font-semibold mb-4">Top Vendors</h3>
            {vendors.length > 0 ? (
              <div className="space-y-3">
                {vendors.map((vendor, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-hover">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 text-primary rounded flex items-center justify-center">
                        <span className="text-xs">{index + 1}</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{vendor.vendor}</p>
                        <p className="text-textMuted text-xs">{vendor.count} documents</p>
                      </div>
                    </div>
                    <div className="text-primary font-semibold">{vendor.count}</div>
                  </div>
                ))
              </div>
            ) : (
              <p className="text-textMuted text-center py-8">No vendor data available</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}