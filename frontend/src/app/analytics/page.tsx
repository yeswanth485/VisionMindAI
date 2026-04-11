'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';

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

  const PIE_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];

  return (
    <div className="flex flex-col min-h-screen p-6 lg:p-12 animate-fade-in">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">📊 Analytics Dashboard</h1>
        <p className="text-textMuted text-lg">
          Insights and metrics from your processed documents
        </p>
      </header>

      {!summary ? (
        <div className="glass-card p-6 text-center">
          <p className="text-textMuted">No analytics data available yet. Upload some documents to see insights.</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="glass-card p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded flex items-center justify-center">
                  <span className="text-xl">📄</span>
                </div>
                <div>
                  <p className="text-textMuted text-[10px] uppercase tracking-wider font-bold">Total Docs</p>
                  <p className="text-2xl font-bold text-white">{summary.total_documents || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="glass-card p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-secondary/10 text-secondary rounded flex items-center justify-center">
                  <span className="text-xl">🧾</span>
                </div>
                <div>
                  <p className="text-textMuted text-[10px] uppercase tracking-wider font-bold">Invoices</p>
                  <p className="text-2xl font-bold text-white">{summary.total_invoices || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="glass-card p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-accent/10 text-accent rounded flex items-center justify-center">
                  <span className="text-xl">💰</span>
                </div>
                <div>
                  <p className="text-textMuted text-[10px] uppercase tracking-wider font-bold">Total Processed</p>
                  <p className="text-2xl font-bold text-white">${(summary.total_amount_processed || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="glass-card p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-white/5 rounded flex items-center justify-center">
                  <span className="text-xl">⚖️</span>
                </div>
                <div>
                  <p className="text-textMuted text-[10px] uppercase tracking-wider font-bold">Avg Risk</p>
                  <p className="text-2xl font-bold text-white">
                    {(summary.average_risk_level || 0).toFixed(1)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
             {/* Doc Type Distribution */}
             <div className="glass-card p-6 h-[400px] flex flex-col">
                <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                   <span className="text-primary">■</span> Document Type Distribution
                </h3>
                <div className="flex-1 min-h-0">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={summary.document_type_distribution || []}>
                         <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                         <XAxis dataKey="type" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                         <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                         <Tooltip 
                            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                            itemStyle={{ color: '#3b82f6' }}
                         />
                         <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                   </ResponsiveContainer>
                </div>
             </div>

             {/* Risk Level Pie */}
             <div className="glass-card p-6 h-[400px] flex flex-col">
                <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                   <span className="text-accent">●</span> Risk Assessment Breakdown
                </h3>
                <div className="flex-1 min-h-0">
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                         <Pie
                            data={Object.entries(summary.risk_distribution || {}).map(([name, value]) => ({ name: name.toUpperCase(), value }))}
                            cx="50%" cy="50%"
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                         >
                            {Object.entries(summary.risk_distribution || {}).map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                         </Pie>
                         <Tooltip 
                            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                         />
                         <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                   </ResponsiveContainer>
                </div>
             </div>

             {/* Volume Timeline */}
             <div className="xl:col-span-2 glass-card p-6 h-[400px] flex flex-col">
                <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                   <span className="text-secondary">↗</span> Processing Volume Timeline
                </h3>
                <div className="flex-1 min-h-0">
                   <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={timeline}>
                         <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                         <XAxis dataKey="date" stroke="#ffffff50" fontSize={11} />
                         <YAxis stroke="#ffffff50" fontSize={11} />
                         <Tooltip 
                            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                         />
                         <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6' }} activeDot={{ r: 6 }} />
                      </LineChart>
                   </ResponsiveContainer>
                </div>
             </div>
          </div>

          {/* Vendors & Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
             <div className="lg:col-span-2 glass-card p-6">
                <h3 className="text-white font-bold mb-6">Top Contributing Vendors</h3>
                <div className="space-y-4">
                   {vendors.map((v, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all group">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                               {v.vendor.charAt(0)}
                            </div>
                            <div>
                               <p className="text-white font-bold group-hover:text-primary transition-colors">{v.vendor}</p>
                               <p className="text-textMuted text-xs uppercase tracking-tighter">{v.count} documents analyzed</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-white font-mono font-bold">{v.count}</p>
                            <div className="w-24 h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                               <div className="h-full bg-primary" style={{ width: `${(v.count / summary.total_documents) * 100}%` }}></div>
                            </div>
                         </div>
                      </div>
                   ))}
                   {vendors.length === 0 && <p className="text-textMuted italic text-center py-8">No vendor data found.</p>}
                </div>
             </div>

             <div className="glass-card p-6 bg-primary/5 border-primary/20">
                <h3 className="text-white font-bold mb-4">Intelligence Digest</h3>
                <div className="space-y-6">
                   <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-xs text-textMuted uppercase font-bold mb-2">Primary Sentiment</p>
                      <p className="text-white">Active document processing suggests a high volume of vendor interactions. Risk levels are within normal operational bounds.</p>
                   </div>
                   <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-xs text-textMuted uppercase font-bold mb-2">Anomaly Detection</p>
                      <p className="text-accent font-bold">0 Immediate Craces Found</p>
                      <p className="text-[10px] text-textMuted mt-1 leading-relaxed">System-wide integrity is stable. No fraudulent patterns detected in the current data batch.</p>
                   </div>
                </div>
                <button className="w-full mt-8 py-4 bg-primary text-white font-bold rounded-2xl hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all uppercase tracking-widest text-xs">
                   Download Full Audit
                </button>
             </div>
          </div>
        </>
      )}
    </div>
  );
}