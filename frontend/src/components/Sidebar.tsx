'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { name: 'Dashboard', href: '/', icon: '📊' },
    { name: 'History', href: '/history', icon: '🕒' },
    { name: 'Chat', href: '/chat', icon: '💬' },
    { name: 'Analytics', href: '/analytics', icon: '📈' },
    { name: 'Batch Upload', href: '/batch', icon: '📤' },
    { name: 'Studio', href: '/studio', icon: '🎥' },
    { name: 'Agent', href: '/agent', icon: '🤖' },
    { name: 'Settings', href: '/settings', icon: '⚙️' },
  ];

  return (
    <aside className="w-64 border-r border-white/5 bg-background/50 backdrop-blur-xl z-20 flex flex-col h-full hidden md:flex">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
          <span className="font-bold text-white text-sm">VM</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight gradient-text">VisionMind AI</h1>
      </div>

      <nav className="flex-1 px-4 mt-6 flex flex-col gap-2">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                isActive
                  ? 'bg-primary/10 text-primary font-medium shadow-inner border border-primary/20'
                  : 'text-textMuted hover:bg-white/5 hover:text-textMain'
              }`}
            >
              <span className="text-xl">{link.icon}</span>
              {link.name}
            </Link>
          );
        })}
      </nav>

       <div className="p-6">
        <div className="glass-card p-4 rounded-xl text-xs text-textMuted text-center">
          <p>VisionMind AI v2.0.0</p>
          <p className="mt-1">© 2026</p>
        </div>
      </div>
    </aside>
  );
}
