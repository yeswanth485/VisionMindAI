'use client';

import { useState, useEffect } from 'react';
import { documentAPI } from '@/services/api';
import axios from 'axios';

export default function AgentCommandCenter() {
  const [goal, setGoal] = useState('');
  const [contextItems, setContextItems] = useState<any[]>([]);
  const [selectedContextId, setSelectedContextId] = useState<string>('');
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);

  // Load available documents as context
  useEffect(() => {
    async function fetchContexts() {
      try {
        const history = await documentAPI.getHistory();
        setContextItems(history);
        if (history.length > 0) {
          setSelectedContextId(history[0].id);
        }
      } catch (err) {
        console.error('Failed to load contexts:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchContexts();
  }, []);

  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) return;
    
    setExecuting(true);
    try {
      // Call the real backend agent execution endpoint
      const response = await axios.post('/api/agent/execute', {
        goal: goal,
        document_id: selectedContextId || null
      });
      
      setPlan(response.data);
    } catch (error) {
      console.error('Agent error:', error);
      setPlan({
        status: 'failed',
        errors: ['Failed to connect to Neural Agent. Please ensure the backend is online.'],
        plan: []
      });
    } finally {
      setExecuting(false);
    }
  };

  const handleConfirmAction = async (stepIndex: number) => {
    if (!plan?.plan?.[stepIndex]) return;
    
    // In a real system, this would trigger a specific sub-action
    // For now we simulate the resolution of a pending step
    const updatedPlanSteps = [...plan.plan];
    updatedPlanSteps[stepIndex].status = "done";
    
    setPlan({
      ...plan,
      plan: updatedPlanSteps,
      status: updatedPlanSteps.every((s: any) => s.status === 'done') ? 'success' : 'pending_confirmation'
    });
  };

  const selectedContext = contextItems.find(item => item.id === selectedContextId);

  return (
    <div className="flex flex-col min-h-screen p-8 lg:p-12 animate-fade-in">
      <header className="mb-12">
        <h1 className="text-3xl md:text-5xl font-black mb-3 text-white tracking-tighter">
          Neural <span className="text-primary italic">Agent</span>
        </h1>
        <p className="text-textMuted text-lg max-w-2xl">
          Assign complex goals to the autonomous intelligence system. It will analyze your context and build an executable roadmap.
        </p>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left: Input & Context */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6 border-primary/20 bg-primary/5">
            <h3 className="text-sm font-bold text-white uppercase mb-4 tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span> Mission Parameters
            </h3>
            
            <form onSubmit={handleGoalSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-textMuted uppercase mb-2 tracking-widest">
                  Intelligence Goal
                </label>
                <textarea
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="e.g., Extract all financial risks and draft a mitigation summary"
                  className="w-full h-32 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all resize-none custom-scrollbar"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-textMuted uppercase mb-2 tracking-widest">
                  Active Context
                </label>
                {loading ? (
                  <div className="h-12 bg-white/5 rounded-xl animate-pulse"></div>
                ) : (
                  <select 
                    value={selectedContextId}
                    onChange={(e) => setSelectedContextId(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary/50 transition-all appearance-none"
                  >
                    <option value="" className="bg-background">General Intelligence (No File)</option>
                    {contextItems.map((item) => (
                      <option key={item.id} value={item.id} className="bg-background">
                        {item.doc_type?.toUpperCase()} - {item.id.substring(0, 8)}...
                      </option>
                    ))}
                  </select>
                )}
                <p className="mt-2 text-[10px] text-textMuted italic">
                  {selectedContextId ? 'Document metadata auto-synced from Studio.' : 'No context selected. Using base model knowledge.'}
                </p>
              </div>
              
              <button
                type="submit"
                disabled={executing || !goal.trim()}
                className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2 group"
              >
                {executing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Synthesizing Plan...
                  </>
                ) : (
                  <>
                    Deploy Neural Agent <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {selectedContext && (
            <div className="glass-card p-6 border-white/5">
              <p className="text-[10px] font-black text-textMuted uppercase mb-3">Context Preview</p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-textMuted">Type:</span>
                  <span className="text-white capitalize">{selectedContext.doc_type}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-textMuted">ID:</span>
                  <span className="text-white font-mono">{selectedContext.id.substring(0, 12)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Execution Plan */}
        <div className="lg:col-span-2">
          {plan ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
                  Autonomous Roadmap
                  <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-black ${
                    plan.status === 'success' ? 'bg-accent/20 text-accent' : 
                    plan.status === 'failed' ? 'bg-red-500/20 text-red-400' : 
                    'bg-primary/20 text-primary'
                  }`}>
                    {plan.status}
                  </span>
                </h2>
                {plan.actions_executed?.length > 0 && (
                  <span className="text-[10px] text-textMuted font-mono">
                    Actions: {plan.actions_executed.length} Complete
                  </span>
                )}
              </div>

              <div className="glass-card p-0 border-white/5 overflow-hidden">
                <div className="divide-y divide-white/5">
                  {plan.plan && plan.plan.length > 0 ? (
                    plan.plan.map((step: any, index: number) => (
                      <div 
                        key={index} 
                        className={`p-6 flex items-start gap-4 transition-all duration-500 ${
                          step.status === 'done' ? 'bg-accent/5 opacity-60' : 
                          step.status === 'pending_confirmation' ? 'bg-primary/5 animate-pulse' : 
                          'bg-transparent'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                          step.status === 'done' ? 'bg-accent/20 text-accent' : 'bg-primary/20 text-primary'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className={`text-sm font-bold mb-1 ${step.status === 'done' ? 'text-accent line-through' : 'text-white'}`}>
                            {step.action}
                          </h4>
                          <div className="flex items-center gap-3">
                            <span className={`text-[10px] font-bold uppercase ${
                              step.risk === 'high' ? 'text-red-400' : 'text-textMuted'
                            }`}>
                              Risk: {step.risk}
                            </span>
                            <span className="text-[10px] text-white/20">•</span>
                            <span className="text-[10px] text-textMuted uppercase font-mono">
                              {step.status}
                            </span>
                          </div>
                          
                          {step.status === 'pending_confirmation' && (
                            <button
                              onClick={() => handleConfirmAction(index)}
                              className="mt-4 px-4 py-2 bg-primary/20 border border-primary/30 text-primary text-[10px] font-bold rounded-lg hover:bg-primary hover:text-white transition-all"
                            >
                              Authorize Execution
                            </button>
                          )}
                        </div>
                        {step.status === 'done' && (
                          <div className="text-xl">✅</div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-12 text-center space-y-4">
                      {plan.errors?.map((err: string, i: number) => (
                        <div key={i} className="text-red-400 text-sm p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                          {err}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {plan.status === 'success' && (
                <div className="p-6 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-between animate-bounce-subtle">
                  <div>
                    <h3 className="text-accent font-bold">Goal Achieved</h3>
                    <p className="text-xs text-accent/70">Neural agent has successfully completed all roadmap objectives.</p>
                  </div>
                  <button className="px-6 py-2 bg-accent text-background font-bold rounded-xl text-sm" onClick={() => setPlan(null)}>
                    Next Mission
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full min-h-[400px] glass-card flex flex-col items-center justify-center text-center p-12 border-dashed border-white/10 bg-transparent">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <span className="text-4xl animate-pulse">🧠</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Awaiting Mission Goals</h3>
              <p className="text-sm text-textMuted max-w-sm mb-8">
                Input your instructions on the left to activate the autonomous neural processing engine.
              </p>
              <div className="flex gap-2">
                {['Synthesize', 'Extract', 'Audit', 'Refactor'].map(tag => (
                  <span key={tag} className="px-3 py-1 bg-white/5 border border-white/5 rounded-full text-[10px] text-white/30 uppercase font-black">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}