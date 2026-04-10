import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/Sidebar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'VisionMind AI - Document Intelligence',
  description: 'AI-powered document processing and intelligence dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex h-screen overflow-hidden bg-background text-textMain`}>
        {/* Animated Background Gradients */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] animate-pulse-slow"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/20 blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        </div>

        <Sidebar />
        
        <main className="flex-1 relative z-10 overflow-y-auto w-full">
          {children}
        </main>
      </body>
    </html>
  )
}
