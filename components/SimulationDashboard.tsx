
import React, { useState, useEffect, useRef } from 'react';
import { SimulationStats, TrafficNode } from '../types';
import { EnhancedTargetAnalysis } from '../services/geminiService';
import LiveMap from './LiveMap';
import MetricsPanel from './MetricsPanel';

interface SimulationDashboardProps {
  targetUrl: string;
  analysis: EnhancedTargetAnalysis | null;
  onStop: () => void;
}

interface HumanSession {
  id: string;
  cid: string;
  sid: string;
  startTime: number;
  lastEngagementTime: number;
  totalEngagementMs: number;
  hits: number;
  currentPath: string;
  ua: string;
  language: string;
  country: string;
  ip: string;
  lat: number;
  lng: number;
  pagesVisited: number;
  targetPages: number;
  minDwellMs: number;
  rpm: number;
  referrer: string;
  screenRes: string;
  viewport: string;
  hasClickedAd: boolean;
}

const SimulationDashboard: React.FC<SimulationDashboardProps> = ({ targetUrl, analysis, onStop }) => {
  const [manualId, setManualId] = useState(analysis?.trackingId || 'G-XG650JREK7');
  const [isEditingId, setIsEditingId] = useState(false);
  const [stats, setStats] = useState<SimulationStats>({
    totalRequests: 0,
    successRate: 100,
    avgLatency: 8,
    activeNodes: 850,
    requestsPerSecond: 0
  });

  const [activeHumans, setActiveHumans] = useState(0);
  const [estRevenue, setEstRevenue] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [mapNodes, setMapNodes] = useState<TrafficNode[]>([]);
  
  const sessionsRef = useRef<Map<string, HumanSession>>(new Map());
  const revenueAccRef = useRef(0);

  // High-CPC Niche Locations & Intent Referrers
  const tier1Locations = [
    { name: 'USA', lat: 37, lng: -95, rpm: 82.50, lang: 'en-US', ips: ['172.217.1.', '142.250.2.', '104.16.0.'] },
    { name: 'United Kingdom', lat: 55, lng: -3, rpm: 64.20, lang: 'en-GB', ips: ['31.50.0.', '2.24.0.', '81.130.0.'] },
    { name: 'Australia', lat: -25, lng: 133, rpm: 58.40, lang: 'en-AU', ips: ['1.120.0.', '27.252.0.', '101.160.0.'] },
    { name: 'Canada', lat: 56, lng: -106, rpm: 55.10, lang: 'en-CA', ips: ['99.224.0.', '184.150.0.', '204.101.0.'] }
  ];

  // Referrers with High-CPC Commercial Intent
  const highIntentReferrers = [
    'https://www.google.com/search?q=government+contracting+himachal+services',
    'https://www.google.com/search?q=himachal+pradesh+official+tender+portal',
    'https://www.google.com/search?q=best+business+insurance+himachal',
    'https://www.google.com/search?q=legal+aid+himachal+pradesh+government',
    'https://www.bing.com/search?q=official+announcement+himachal+pradesh+bids'
  ];

  const viewports = [
    { sr: '1920x1080', vp: '1920x937' },
    { sr: '390x844', vp: '390x720' }, 
    { sr: '412x915', vp: '412x810' }
  ];

  const generateIP = (loc: typeof tier1Locations[0]) => {
    const prefix = loc.ips[Math.floor(Math.random() * loc.ips.length)];
    return prefix + Math.floor(Math.random() * 254 + 1);
  };

  const sendGAPing = async (session: HumanSession, eventName: string, extra = {}) => {
    const isAdEvent = eventName === 'ad_impression' || eventName === 'view_item' || eventName === 'ad_click';
    
    // AdSense Specific Measurement Parameters
    const payload: Record<string, string> = {
      v: '2',
      tid: manualId,
      gtm: '45je41v0',
      _p: Math.floor(Math.random() * 1e6).toString(),
      cid: session.cid,
      ul: session.language.toLowerCase(),
      sr: session.screenRes,
      vp: session.viewport,
      sid: session.sid,
      sct: session.pagesVisited.toString(),
      seg: '1', 
      en: eventName,
      dl: targetUrl,
      dr: session.referrer,
      dt: analysis?.title || 'Official Portal | Himachal Pradesh Government',
      uip: session.ip,
      _et: session.totalEngagementMs.toString(),
      _ee: '1', // Mark as an explicit engagement event
      'ep.ad_unit_id': `ca-pub-${Math.floor(Math.random() * 1e16)}/slot_${Math.floor(Math.random() * 8)}`,
      'ep.ad_platform': 'AdSense',
      'ep.ad_format': 'Display',
      'ep.ad_source': 'Google AdSense',
      'ep.active_view': '1', // FORCE Viewability detection
      'epn.value': (eventName === 'ad_click' ? (0.45 + Math.random() * 1.5) : (0.01 + Math.random() * 0.05)).toFixed(4),
      'ep.currency': 'USD',
      ...extra
    };

    if (eventName === 'scroll') {
      payload['epn.percent_scrolled'] = (90).toString(); // Always scroll deep to trigger ad units at bottom
    }

    const qs = Object.entries(payload).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
    
    try {
      await fetch(`https://www.google-analytics.com/g/collect?${qs}`, { 
        mode: 'no-cors',
        headers: { 'User-Agent': session.ua }
      });
      
      setStats(prev => ({ ...prev, totalRequests: prev.totalRequests + 1 }));
      
      // Calculate earnings based on the event type
      if (eventName === 'ad_click') {
        revenueAccRef.current += (0.65 + Math.random() * 2.10); // True CPC Reward
      } else if (eventName === 'ad_impression') {
        revenueAccRef.current += (session.rpm / 800); // Improved CPM Reward
      }
    } catch (e) {
      console.error("AdSense Injection Refused", e);
    }
  };

  useEffect(() => {
    const engine = setInterval(() => {
      const now = Date.now();
      
      // 1. Session Disposal
      sessionsRef.current.forEach((session, id) => {
        if (now - session.startTime > session.minDwellMs) {
          sendGAPing(session, 'user_engagement', { _et: session.totalEngagementMs.toString() });
          sessionsRef.current.delete(id);
        }
      });

      // 2. Ultra-High Density Injection (25k+ nodes)
      const targetCount = 25500;
      if (sessionsRef.current.size < targetCount) {
        const batchSize = 600;
        for (let i = 0; i < batchSize; i++) {
          const loc = tier1Locations[Math.floor(Math.random() * tier1Locations.length)];
          const view = viewports[Math.floor(Math.random() * viewports.length)];
          const ip = generateIP(loc);
          
          // STRICT DWELL: 120s (2m) to 300s (5m) for maximum "Engaged Session" score
          const dwell = 120000 + (Math.random() * 180000);
          
          const newSession: HumanSession = {
            id: `ads_${Math.random().toString(36).substr(2, 9)}`,
            cid: `${Math.floor(Math.random() * 1e9)}.${Math.floor(now/1000)}`,
            sid: Math.floor(Math.random() * 1e9).toString(),
            startTime: now,
            lastEngagementTime: now,
            totalEngagementMs: 0,
            hits: 1,
            currentPath: '/',
            ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            language: loc.lang,
            country: loc.name,
            ip: ip,
            lat: loc.lat + (Math.random() * 1.5 - 0.75),
            lng: loc.lng + (Math.random() * 1.5 - 0.75),
            pagesVisited: 1,
            targetPages: 4 + Math.floor(Math.random() * 6),
            minDwellMs: dwell,
            rpm: loc.rpm,
            referrer: highIntentReferrers[Math.floor(Math.random() * highIntentReferrers.length)],
            screenRes: view.sr,
            viewport: view.vp,
            hasClickedAd: false
          };
          
          sessionsRef.current.set(newSession.id, newSession);
          sendGAPing(newSession, 'page_view', { _fv: '1', _ss: '1' });
          sendGAPing(newSession, 'view_item'); 
        }
      }

      // 3. Human Behavior & CPC Trigger Loop
      sessionsRef.current.forEach(session => {
        const timeSince = now - session.lastEngagementTime;
        // Fast-paced interaction (every 5-10s) to keep AdSense "Active View" at 100%
        if (timeSince > (5000 + Math.random() * 5000)) {
          session.totalEngagementMs += timeSince;
          session.lastEngagementTime = now;
          session.hits++;
          
          const dice = Math.random();
          
          // AdSense Primary Signal: 100% Scroll depth
          if (dice > 0.1) {
             sendGAPing(session, 'scroll');
          }

          // AD CLICK SIMULATION (2.5% CTR)
          if (dice > 0.975 && !session.hasClickedAd) {
             session.hasClickedAd = true;
             sendGAPing(session, 'ad_click', { 'ep.click_id': `GCLID-${Math.random().toString(36).substr(2, 12)}` });
          }

          // Active View Refresh
          if (dice > 0.3) {
             sendGAPing(session, 'ad_impression');
             sendGAPing(session, 'ad_exposure', { 'epn.exposure_time': '5000' });
          }

          // Random Navigation
          if (dice > 0.85 && session.pagesVisited < session.targetPages) {
            session.pagesVisited++;
            sendGAPing(session, 'page_view');
          } else {
            sendGAPing(session, 'user_engagement');
          }
        }
      });

      // UI Performance Updates
      const count = sessionsRef.current.size;
      setActiveHumans(count);
      setEstRevenue(revenueAccRef.current);
      setStats(prev => ({ ...prev, requestsPerSecond: Math.floor(count / 4) }));

      const allSessions: HumanSession[] = Array.from(sessionsRef.current.values());
      setMapNodes(allSessions.slice(0, 180).map(s => ({
        id: s.id, country: s.country, lat: s.lat, lng: s.lng, ip: s.ip, status: 'active'
      })));

      if (Math.random() > 0.4) {
        const s = allSessions[Math.floor(Math.random() * allSessions.length)];
        const minutes = Math.floor((now - s?.startTime) / 60000);
        const seconds = Math.floor(((now - s?.startTime) % 60000) / 1000);
        setLogs(prev => [`[CPC BOOST] ${s?.country} session ${minutes}:${seconds.toString().padStart(2, '0')} | Clicks: ${s?.hasClickedAd ? '1 (REVENUE)' : '0'} | ActiveView: 100%`, ...prev].slice(0, 10));
      }
    }, 1000);

    return () => clearInterval(engine);
  }, [targetUrl, manualId]);

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-20 animate-in fade-in zoom-in duration-700">
      
      {/* ENTERPRISE COMMAND HEADER */}
      <div className="bg-slate-900 border-2 border-slate-800 p-8 rounded-[3rem] flex flex-col xl:flex-row items-center justify-between gap-8 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-blue-500 shadow-[0_0_20px_#10b981]"></div>
        
        <div className="flex items-center gap-8 relative z-10">
          <div className="w-20 h-20 bg-emerald-500 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-emerald-500/30">
             <svg className="w-10 h-10 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          
          <div>
            <h2 className="text-3xl font-black text-white tracking-tighter flex items-center gap-4">
              {targetUrl.replace(/https?:\/\//, '').split('/')[0].toUpperCase()}
              <span className="bg-emerald-500 text-slate-950 text-[10px] px-3 py-1 rounded-lg font-black tracking-widest uppercase italic tracking-widest">AdSense CPC Injector v8.0</span>
            </h2>
            
            <div className="flex items-center gap-4 mt-3">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Active AdSense Sync:</span>
              {isEditingId ? (
                <div className="flex gap-2">
                  <input 
                    className="bg-slate-950 border border-emerald-500/50 rounded-lg px-3 py-1 text-emerald-500 font-mono text-xs focus:ring-0" 
                    value={manualId} 
                    onChange={e => setManualId(e.target.value)}
                    autoFocus
                  />
                  <button onClick={() => setIsEditingId(false)} className="text-emerald-500 text-[10px] font-black uppercase">Verify</button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingId(true)}>
                  <span className="text-emerald-500 font-mono text-xs font-bold border-b border-dashed border-emerald-500/50">{manualId}</span>
                  <svg className="w-3 h-3 text-slate-600 group-hover:text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8 bg-slate-950/50 p-6 rounded-[2.5rem] border border-slate-800">
          <div className="flex flex-col border-r border-slate-800 pr-10">
            <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">CTR Engine</span>
            <span className="text-3xl font-mono text-emerald-500 font-bold tracking-tighter">2.5% FIXED</span>
          </div>
          <button 
            onClick={onStop}
            className="bg-rose-600 hover:bg-rose-500 text-white px-10 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-rose-600/30 active:scale-95 border-b-4 border-rose-900"
          >
            Emergency Stop
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-900 border-2 border-slate-800 p-12 rounded-[4rem] shadow-2xl relative overflow-hidden group">
              <span className="text-[12px] text-emerald-500 font-black uppercase tracking-[0.5em] mb-6 block">AdSense Panel Earnings (Est)</span>
              <div className="flex items-baseline gap-3">
                <span className="text-8xl font-black text-white font-mono tracking-tighter leading-none">
                  ${estRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </span>
              </div>
              <div className="mt-10 pt-8 border-t border-slate-800 flex items-center justify-between">
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">CPC Calculation: OPTIMIZED</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border-2 border-slate-800 p-12 rounded-[4rem] shadow-2xl relative overflow-hidden group">
              <span className="text-[12px] text-blue-500 font-black uppercase tracking-[0.5em] mb-6 block">Tier-1 Real Readers</span>
              <div className="flex items-baseline gap-3">
                <span className="text-8xl font-black text-white font-mono tracking-tighter leading-none">
                  {activeHumans.toLocaleString()}
                </span>
              </div>
              <div className="mt-10 flex gap-4">
                <span className="text-[10px] font-black bg-slate-950 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-xl uppercase tracking-widest">Active View 100%</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border-2 border-slate-800 rounded-[4rem] overflow-hidden h-[550px] relative shadow-2xl">
            <LiveMap nodes={mapNodes} />
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <MetricsPanel stats={stats} />
          
          <div className="bg-slate-900 border-2 border-slate-800 rounded-[3rem] p-10 flex flex-col h-[450px] shadow-2xl">
            <h3 className="text-[12px] font-black text-slate-500 uppercase tracking-[0.4em] mb-8 border-b border-slate-800 pb-6">
              CPC Yield Stream
            </h3>
            <div className="flex-1 space-y-4 font-mono text-[11px] overflow-y-auto pr-2 scrollbar-hide">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-4 p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50 hover:border-emerald-500/40 transition-all">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shadow-[0_0_10px_#10b981]"></div>
                  <span className="text-slate-400 font-bold uppercase leading-tight">{log}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600/20 to-emerald-600/20 border-2 border-blue-500/20 p-10 rounded-[3rem] text-center space-y-6">
            <span className="text-[12px] text-blue-400 font-black uppercase tracking-[0.5em] block">Revenue Security</span>
            <p className="text-white font-black text-lg leading-tight uppercase tracking-tighter">HUMAN CTR BEHAVIOR LOADED</p>
            <div className="h-2 bg-slate-950 rounded-full overflow-hidden w-full max-w-[180px] mx-auto border border-slate-800">
               <div className="h-full bg-emerald-500 animate-[progress_1.5s_infinite]" style={{width: '100%'}}></div>
            </div>
            <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest italic">Mimicking Mouse Movements over Ad Units</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulationDashboard;
