interface ResultCardProps {
  title: string;
  icon: string;
  children: React.ReactNode;
  delay?: number;
}

export default function ResultCard({ title, icon, children, delay = 0 }: ResultCardProps) {
  return (
    <div 
      className="glass-card flex flex-col h-full animate-fade-in"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-center gap-3 mb-4 border-b border-white/5 pb-4">
        <span className="text-2xl">{icon}</span>
        <h3 className="text-lg font-semibold text-white tracking-wide">{title}</h3>
      </div>
      <div className="flex-1 overflow-auto custom-scrollbar">
        {children}
      </div>
    </div>
  );
}
