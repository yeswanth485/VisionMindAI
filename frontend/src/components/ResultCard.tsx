interface ResultCardProps {
  title?: string;
  icon?: string;
  children?: React.ReactNode;
  delay?: number;
  result?: any;
}

export default function ResultCard({ title, icon, children, delay = 0, result }: ResultCardProps) {
  // Defensive checks to prevent UI crashes on partial/error data
  const hasError = result?.error || result?.input_type === 'error' || result?.status === 'failed';
  const errorMessage = result?.error || result?.summary || result?.errors?.[0] || 'Unknown processing error';

  const displayTitle = result ? result.summary || 'Analysis Result' : title;
  const displayIcon = result ? (result.input_type === 'video' ? '📹' : result.input_type === 'audio' ? '🔊' : '📄') : icon;

  return (
    <div 
      className="glass-card flex flex-col h-full animate-fade-in group hover:border-primary/30 transition-all duration-500"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl filter drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">{displayIcon}</span>
          <h3 className="text-lg font-bold text-white tracking-wide truncate max-w-[250px]">{displayTitle}</h3>
        </div>
        {result?.confidence_score !== undefined && (
          <div className="flex items-center gap-2">
            <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary" 
                style={{ width: `${(result.confidence_score / 1.0) * 100}%` }}
              ></div>
            </div>
            <span className="text-[10px] text-textMuted font-mono">{(result.confidence_score * 100).toFixed(0)}%</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        {result ? (
          <div className="space-y-6">
            {hasError && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex flex-col gap-2">
                <div className="flex items-center gap-2 font-bold">
                  <span className="text-lg">⚠️</span> System Alert
                </div>
                <p className="opacity-80 leading-relaxed">{errorMessage}</p>
              </div>
            )}
            
            {/* Unified AI Reasoning */}
            {result.unified_reasoning?.unified_summary && (
              <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                <p className="text-[10px] text-primary uppercase font-black mb-2 tracking-tighter">Neural Synthesis</p>
                <p className="text-sm text-textMuted leading-relaxed italic">
                   "{result.unified_reasoning.unified_summary}"
                </p>
              </div>
            )}

            {/* Structured Metadata */}
            {result.structured_data && (
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(result.structured_data)
                  .filter(([key]) => !['document_text', 'transcript'].includes(key))
                  .map(([key, value]: [string, any]) => (
                  <div key={key} className="bg-white/5 p-3 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                    <p className="text-[9px] text-textMuted uppercase font-bold mb-1 tracking-wider">{key.replace('_', ' ')}</p>
                    <p className="text-xs text-white font-medium truncate">{String(value)}</p>
                  </div>
                ))}
              </div>
            )}
            
            {/* Key Entities */}
            {result.unified_reasoning?.key_entities && result.unified_reasoning.key_entities.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {result.unified_reasoning.key_entities.map((entity: string, idx: number) => (
                  <span key={idx} className="px-2 py-1 bg-white/5 text-[10px] text-primary border border-primary/20 rounded-md">
                    {entity}
                  </span>
                ))}
              </div>
            )}

            {/* Insights */}
            {result.insights && result.insights.length > 0 && (
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-2 border-l-2 border-primary pl-3">Intelligence Insights</p>
                <div className="grid gap-2">
                  {result.insights.map((insight: string, idx: number) => (
                    <div key={idx} className="flex gap-3 items-start text-[13px] text-textMuted group/insight">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0 group-hover/insight:shadow-[0_0_8px_rgba(59,130,246,0.8)] transition-all"></span>
                      <span className="leading-5">{insight}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : children}
      </div>
    </div>
  );
}
