
import React, { useState } from 'react';
import SimulationDashboard from './components/SimulationDashboard';
import { HistoryItem } from './types';
import { analyzeTargetUrl, EnhancedTargetAnalysis } from './services/geminiService';

const App: React.FC = () => {
  const [targetUrl, setTargetUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<EnhancedTargetAnalysis | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const handleStartSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUrl) return;

    let cleanUrl = targetUrl;
    if (!cleanUrl.startsWith('http')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyzeTargetUrl(cleanUrl);
      setAnalysis(result);
      setIsSimulating(true);
      
      const newHistory: HistoryItem = {
        timestamp: new Date().toLocaleTimeString(),
        url: cleanUrl,
        requests: 0
      };
      setHistory(prev => [newHistory, ...prev].slice(0, 10));
    } catch (err) {
      console.error("Auto-detection failed, using generic injection patterns");
      setAnalysis({
        title: "Simulation Cluster",
        serverInfo: "Distributed Nodes",
        technologies: ["Standard Analytics Bypass"],
        vulnerabilityScore: 50,
        summary: "Starting injection using randomized crawler patterns.",
        expectedLoadTime: 600
      });
      setIsSimulating(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const stopSimulation = () => {
    setIsSimulating(false);
    setAnalysis(null);
  };

  return (
    <div className="min-h-screen relative bg-slate-950 overflow-hidden flex flex-col">
      <div className="scanline" />
      
      <header className="border-b border-slate-800 p-4 bg-slate-900/50 backdrop-blur-md z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center animate-pulse shadow-lg shadow-emerald-500/20">
              <span className="text-slate-950 font-bold text-xs">AI</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-green-600 bg-clip-text text-transparent">
              GLOBAL TRAFFIC <span className="text-slate-400 font-normal">PRO v6.0</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex gap-6 text-[10px] font-medium text-slate-500 uppercase tracking-widest">
              <span>AUTO-DETECT: <span className="text-green-500">ACTIVE</span></span>
              <span>HUMAN_SPOOF: <span className="text-blue-400">ENABLED</span></span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 z-0">
        {!isSimulating ? (
          <div className="max-w-4xl mx-auto mt-12 md:mt-24 space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-4xl md:text-7xl font-bold text-white tracking-tighter">
                SPOOF REAL HUMAN <br />
                <span className="text-emerald-500 underline decoration-emerald-500/20 underline-offset-8 italic">ANALYTICS DATA.</span>
              </h2>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
                Our AI automatically detects tracking tags on your site and injects 100% genuine-looking 
                behavioral data into Google Analytics & Search Console.
              </p>
            </div>

            <form onSubmit={handleStartSimulation} className="relative group max-w-2xl mx-auto space-y-4">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-green-600 rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-1000"></div>
              <div className="relative bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">Target Website URL</label>
                    <span className="text-[9px] text-emerald-500 font-mono animate-pulse">DETECTING TRACKERS ON-THE-FLY</span>
                  </div>
                  <input
                    type="text"
                    placeholder="https://himachalgovt.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl focus:ring-1 focus:ring-emerald-500 text-xl px-5 py-4 text-white placeholder-slate-700 transition-all"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    disabled={isAnalyzing}
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={isAnalyzing || !targetUrl}
                  className={`w-full py-5 rounded-xl font-black transition-all flex items-center justify-center gap-3 text-lg tracking-wider ${
                    isAnalyzing 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-xl shadow-emerald-500/40'
                  }`}
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-slate-500 border-t-white rounded-full animate-spin"></div>
                      BYPASSING ANALYTICS FILTERS...
                    </>
                  ) : 'INITIATE TRAFFIC SYRINGE'}
                </button>
              </div>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
              {[
                { title: "Zero Setup", desc: "No ID needed. AI detects your GA4 and GTM automatically.", icon: "🎯" },
                { title: "Real Referrers", desc: "Appear as Organic traffic from Google, Bing, and Reddit.", icon: "🌐" },
                { title: "Human Clicks", desc: "Simulates actual internal page navigation and scrolling.", icon: "🖱️" }
              ].map((f, i) => (
                <div key={i} className="bg-slate-900/40 border border-slate-800/50 p-6 rounded-2xl hover:border-emerald-500/30 transition-all group">
                  <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">{f.icon}</div>
                  <h3 className="text-white font-bold mb-2">{f.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <SimulationDashboard 
            targetUrl={targetUrl} 
            analysis={analysis} 
            onStop={stopSimulation} 
          />
        )}
      </main>
    </div>
  );
};

export default App;
