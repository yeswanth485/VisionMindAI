'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import NeuralATSDashboard from '@/components/NeuralATSDashboard';
import Sidebar from '@/components/Sidebar';
import { motion } from 'framer-motion';

function ATSScannerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scanProgress, setScanProgress] = useState(0);

  useEffect(() => {
    const rawData = searchParams.get('data');
    const filename = searchParams.get('filename') || 'Resume';

    if (!rawData) {
      router.push('/');
      return;
    }

    try {
      const parsedData = JSON.parse(decodeURIComponent(rawData));
      
      // Simulate scanning animation
      const interval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setData({ 
                ...parsedData.insights.ats_intelligence, 
                filename 
              });
              setLoading(false);
            }, 500);
            return 100;
          }
          return prev + 2;
        });
      }, 50);

      return () => clearInterval(interval);
    } catch (e) {
      console.error("Failed to parse ATS data", e);
      router.push('/');
    }
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="relative min-h-screen flex flex-col">
          
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 relative overflow-hidden">
              {/* Futuristic Scanner Background */}
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--primary)_0%,_transparent_70%)] opacity-10"></div>
                <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
              </div>

              {/* Scan Line */}
              <div className="neural-scan-line"></div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="z-10 flex flex-col items-center text-center"
              >
                <div className="w-32 h-32 mb-8 relative">
                  <div className="absolute inset-0 border-4 border-primary/20 rounded-2xl animate-spin [animation-duration:8s]"></div>
                  <div className="absolute inset-2 border-2 border-accent/20 rounded-xl animate-reverse-spin [animation-duration:5s]"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl">🧠</span>
                  </div>
                </div>

                <h1 className="text-3xl font-bold mb-4 tracking-tight">
                  NEURAL <span className="text-primary italic">SYNAPSE</span> SCANNING
                </h1>
                <div className="w-64 h-1.5 bg-white/10 rounded-full overflow-hidden mb-4">
                  <motion.div 
                    className="h-full bg-primary shadow-[0_0_10px_var(--primary)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${scanProgress}%` }}
                  ></motion.div>
                </div>
                <div className="text-textMuted text-xs uppercase tracking-[0.3em] font-medium">
                  Deconstructing Professional Matrix... {scanProgress}%
                </div>
                
                <div className="mt-12 grid grid-cols-2 gap-4 opacity-40">
                  <div className="text-[10px] text-primary">LAYER: SEMANTIC_EXTRACTION</div>
                  <div className="text-[10px] text-accent">MODEL: GPT-4O_CORE</div>
                  <div className="text-[10px] text-white/50">STATUS: REASONING</div>
                  <div className="text-[10px] text-white/50">OUTPUT: HIGH_FIDELITY</div>
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="p-8">
              <NeuralATSDashboard data={data} filename={data.filename} />
            </div>
          )}
        </div>
      </main>

      <style jsx>{`
        @keyframes reverse-spin {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .animate-reverse-spin {
          animation: reverse-spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default function ATSScannerPage() {
  return (
    <Suspense fallback={
       <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
       </div>
    }>
       <ATSScannerContent />
    </Suspense>
  );
}
