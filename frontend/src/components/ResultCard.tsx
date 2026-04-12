interface ResultCardProps {
  title?: string;
  icon?: string;
  children?: React.ReactNode;
  delay?: number;
  result?: any;
}

export default function ResultCard({ title, icon, children, delay = 0, result }: ResultCardProps) {
  // If result is provided, we use its data for title, icon and display its content
  const displayTitle = result ? result.summary || 'Analysis Result' : title;
  const displayIcon = result ? (result.input_type === 'video' ? '📹' : '📄') : icon;

  return (
    <div 
      className="glass-card flex flex-col h-full animate-fade-in"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-center gap-3 mb-4 border-b border-white/5 pb-4">
        <span className="text-2xl">{displayIcon}</span>
        <h3 className="text-lg font-semibold text-white tracking-wide">{displayTitle}</h3>
      </div>
      <div className="flex-1 overflow-auto custom-scrollbar">
        {result ? (
          <div className="space-y-4">
            {result.error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {result.error}
              </div>
            )}
            
            {result.structured_data && (
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(result.structured_data).map(([key, value]: [string, any]) => (
                  <div key={key} className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <p className="text-[10px] text-textMuted uppercase font-bold mb-1">{key}</p>
                    <p className="text-sm text-white font-medium">{String(value)}</p>
                  </div>
                ))}
              </div>
            )}
            
            {result.insights && result.insights.length > 0 && (
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2 px-1">Neural Insights</p>
                <div className="space-y-2">
                  {result.insights.map((insight: string, idx: number) => (
                    <div key={idx} className="flex gap-2 items-start text-sm text-textMuted group">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0 group-hover:scale-125 transition-transform"></span>
                      <span>{insight}</span>
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
