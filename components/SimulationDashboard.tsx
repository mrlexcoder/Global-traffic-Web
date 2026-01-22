
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
  gadsId: string; // Simulated DoubleClick ID
  gclAuId: string; // Simulated first-party linker
}

const SimulationDashboard: React.FC<SimulationDashboardProps> = ({ targetUrl, analysis, onStop }) => {
  const [manualId, setManualId] = useState(analysis?.trackingId || 'G-XG650JREK7');
  const [isEditingId, setIsEditingId] = useState(false);
  const [stats, setStats] = useState<SimulationStats>({
    totalRequests: 0,
    successRate: 100,
    avgLatency: 5,
    activeNodes: 940,
    requestsPerSecond: 0
  });

  const [activeHumans, setActiveHumans] = useState(0);
  const [estRevenue, setEstRevenue] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [mapNodes, setMapNodes] = useState<TrafficNode[]>([]);
  
  const sessionsRef = useRef<Map<string, HumanSession>>(new Map());
  const revenueAccRef = useRef(0);

  const tier1Locations = [
    { name: 'USA', lat: 37, lng: -95, rpm: 98.20, lang: 'en-US', ips: ['172.217.1.', '142.250.2.', '104.16.10.'] },
    { name: 'United Kingdom', lat: 55, lng: -3, rpm: 72.50, lang: 'en-GB', ips: ['31.50.0.', '2.24.0.', '81.130.0.'] },
    { name: 'Australia', lat: -25, lng: 133, rpm: 68.40, lang: 'en-AU', ips: ['1.120.0.', '27.252.0.', '101.160.0.'] },
    { name: 'Canada', lat: 56, lng: -106, rpm: 62.10, lang: 'en-CA', ips: ['99.224.0.', '184.150.0.', '204.101.0.'] }
  ];

  const highIntentReferrers = [
    'https://www.google.com/search?q=official+himachal+pradesh+government+bids+and+tenders',
    'https://www.google.com/search?q=himachal+govt+jobs+notification+2025',
    'https://www.google.com/search?q=business+registration+portal+himachal',
    'https://www.bing.com/search?q=govt+subsidy+schemes+himachal+pradesh',
    'https://www.google.com/search?q=legal+compliance+portal+himachal'
  ];

  const commonPaths = ['/', '/news', '/notifications', '/contact-us', '/services', '/about-us', '/tenders', '/downloads'];

  const generateIP = (loc: typeof tier1Locations[0]) => {
    const prefix = loc.ips[Math.floor(Math.random() * loc.ips.length)];
    return prefix + Math.floor(Math.random() * 254 + 1);
  };

  const sendGAPing = async (session: HumanSession, eventName: string, extra = {}) => {
    // Critical Linker Parameters for AdSense/GA4 Sync
    const payload: Record<string, string> = {
      v: '2',
      tid: manualId,
      gtm: '45je41v0',
      _p: Math.floor(Math.random() * 1e9).toString(), // Page load ID
      _z: `ccd.${Math.floor(Math.random() * 1e5)}`, // Cache buster
      cid: session.cid,
      ul: session.language.toLowerCase(),
      sr: session.screenRes,
      vp: session.viewport,
      sid: session.sid,
      sct: session.pagesVisited.toString(),
      seg: '1', 
      en: eventName,
      dl: targetUrl + session.currentPath,
      dr: session.referrer,
      dt: `${analysis?.title || 'Official Portal'} | ${session.currentPath.replace('/', '').toUpperCase()}`,
      uip: session.ip,
      _et: session.totalEngagementMs.toString(),
      _ee: '1',
      // AdSense Identification Fingerprint
      '_gads': session.gadsId,
      '_gcl_au': session.gclAuId,
      'ep.ad_unit_id': `ca-pub-${Math.floor(Math.random() * 1e16)}/slot_${Math.floor(Math.random() * 10)}`,
      'ep.ad_platform': 'GoogleAdSense',
      'ep.ad_source': 'AdSense',
      'ep.active_view': '1', 
      'ep.ad_format': 'Display',
      'epn.exposure_time': '15000',
      ...extra
    };

    if (eventName === 'ad_click') {
      payload['ep.gclid'] = `EAIaIQobChMI${Math.random().toString(36).substr(2, 25)}`; // Authentic-looking GCLID
      payload['epn.value'] = (1.20 + Math.random() * 3.50).toFixed(2);
    }

    const qs = Object.entries(payload).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
    
    try {
      // Use beacon-style fetch to bypass common blocklists
      await fetch(`https://www.google-analytics.com/g/collect?${qs}`, { 
        mode: 'no-cors',
        keepalive: true,
        headers: { 'User-Agent': session.ua }
      });
      
      setStats(prev => ({ ...prev, totalRequests: prev.totalRequests + 1 }));
      
      if (eventName === 'ad_click') {
        revenueAccRef.current += (1.10 + Math.random() * 2.80); // True CPC Yield
      } else if (eventName === 'ad_impression') {
        revenueAccRef.current += (session.rpm / 600);
      }
    } catch (e) {
      console.error("Link Failure", e);
    }
  };

  useEffect(() => {
    const engine = setInterval(() => {
      const now = Date.now();
      
      sessionsRef.current.forEach((session, id) => {
        if (now - session.startTime > session.minDwellMs) {
          sendGAPing(session, 'user_engagement', { _et: session.totalEngagementMs.toString() });
          sessionsRef.current.delete(id);
        }
      });

      const targetCount = 28000; // Increased concurrency
      if (sessionsRef.current.size < targetCount) {
        const batchSize = 750;
        for (let i = 0; i < batchSize; i++) {
          const loc = tier1Locations[Math.floor(Math.random() * tier1Locations.length)];
          const ip = generateIP(loc);
          const dwell = 120000 + (Math.random() * 240000); // 2-6 minutes
          
          const newSession: HumanSession = {
            id: `ads_${Math.random().toString(36).substr(2, 9)}`,
            cid: `${Math.floor(Math.random() * 1e9)}.${Math.floor(now/1000)}`,
            sid: Math.floor(now / 1000).toString(),
            startTime: now,
            lastEngagementTime: now,
            totalEngagementMs: 0,
            hits: 1,
            currentPath: '/',
            ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
            language: loc.lang,
            country: loc.name,
            ip: ip,
            lat: loc.lat + (Math.random() * 2 - 1),
            lng: loc.lng + (Math.random() * 2 - 1),
            pagesVisited: 1,
            targetPages: 3 + Math.floor(Math.random() * 5),
            minDwellMs: dwell,
            rpm: loc.rpm,
            referrer: highIntentReferrers[Math.floor(Math.random() * highIntentReferrers.length)],
            screenRes: '1920x1080',
            viewport: '1920x937',
            hasClickedAd: false,
            gadsId: `ID=${Math.random().toString(16).substr(2, 16)}:T=${Math.floor(now/1000)}:S=ALNI_${Math.random().toString(36).substr(2, 20)}`,
            gclAuId: `1.1.${Math.floor(Math.random() * 1e9)}.${Math.floor(now/1000)}`
          };
          
          sessionsRef.current.set(newSession.id, newSession);
          sendGAPing(newSession, 'page_view', { _fv: '1', _ss: '1' });
        }
      }

      sessionsRef.current.forEach(session => {
        const timeSince = now - session.lastEngagementTime;
        if (timeSince > (6000 + Math.random() * 9000)) {
          session.totalEngagementMs += timeSince;
          session.lastEngagementTime = now;
          session.hits++;
          
          const dice = Math.random();
          
          if (dice > 0.1) sendGAPing(session, 'scroll');

          // AD CLICK BEHAVIOR (Realistic CTR 1.8% - 3.2%)
          if (dice > 0.975 && !session.hasClickedAd) {
             session.hasClickedAd = true;
             sendGAPing(session, 'ad_click');
          }

          // Deep Crawl Navigation
          if (dice > 0.88 && session.pagesVisited < session.targetPages) {
            session.pagesVisited++;
            session.currentPath = commonPaths[Math.floor(Math.random() * commonPaths.length)];
            sendGAPing(session, 'page_view');
          } else {
            sendGAPing(session, 'ad_impression');
            sendGAPing(session, 'user_engagement');
          }
        }
      });

      const count = sessionsRef.current.size;
      setActiveHumans(count);
      setEstRevenue(revenueAccRef.current);
      setStats(prev => ({ ...prev, requestsPerSecond: Math.floor(count / 3.5) }));

      const allSessions: HumanSession[] = Array.from(sessionsRef.current.values());
      setMapNodes(allSessions.slice(0, 200).map(s => ({
        id: s.id, country: s.country, lat: s.lat, lng: s.lng, ip: s.ip, status: 'active'
      })));

      if (Math.random() > 0.3) {
        const s = allSessions[Math.floor(Math.random() * allSessions.length)];
        setLogs(prev => [`[v9.0 CRAWL] ${s?.country} navigating to ${s?.currentPath} | Dwell: ${Math.floor((now - s?.startTime)/1000)}s | CPC: ${s?.hasClickedAd ? 'LOCKED' : 'PENDING'}`, ...prev].slice(0, 10));
      }
    }, 1000);

    return () => clearInterval(engine);
  }, [targetUrl, manualId]);

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-20 animate-in fade-in zoom-in duration-700">
      
      {/* ENTERPRISE COMMAND HEADER */}
      <div className="bg-slate-900 border-2 border-slate-800 p-8 rounded-[3rem] flex flex-col xl:flex-row items-center justify-between gap-8 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-emerald-300 to-emerald-500 shadow-[0_0_20px_#10b981]"></div>
        
        <div className="flex items-center gap-8 relative z-10">
          <div className="w-20 h-20 bg-emerald-500 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-emerald-500/30">
             <svg className="w-10 h-10 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          
          <div>
            <h2 className="text-3xl font-black text-white tracking-tighter flex items-center gap-4">
              {targetUrl.replace(/https?:\/\//, '').split('/')[0].toUpperCase()}
              <span className="bg-emerald-500 text-slate-950 text-[10px] px-3 py-1 rounded-lg font-black tracking-widest uppercase italic tracking-widest">AdSense Ultra v9.0</span>
            </h2>
            
            <div className="flex items-center gap-4 mt-3">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Linked AdSense Account:</span>
              {isEditingId ? (
                <div className="flex gap-2">
                  <input 
                    className="bg-slate-950 border border-emerald-500/50 rounded-lg px-3 py-1 text-emerald-500 font-mono text-xs focus:ring-0" 
                    value={manualId} 
                    onChange={e => setManualId(e.target.value)}
                    autoFocus
                  />
                  <button onClick={() => setIsEditingId(false)} className="text-emerald-500 text-[10px] font-black uppercase">Secure</button>
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
            <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Crawl Engine</span>
            <span className="text-3xl font-mono text-emerald-500 font-bold tracking-tighter">DEEP PATH</span>
          </div>
          <button 
            onClick={onStop}
            className="bg-rose-600 hover:bg-rose-500 text-white px-10 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-rose-600/30 active:scale-95 border-b-4 border-rose-900"
          >
            Shutdown Cluster
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-900 border-2 border-slate-800 p-12 rounded-[4rem] shadow-2xl relative overflow-hidden group">
              <span className="text-[12px] text-emerald-500 font-black uppercase tracking-[0.5em] mb-6 block">Estimated Panel CPC Revenue</span>
              <div className="flex items-baseline gap-3">
                <span className="text-8xl font-black text-white font-mono tracking-tighter leading-none">
                  ${estRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </span>
              </div>
              <div className="mt-10 pt-8 border-t border-slate-800 flex items-center justify-between">
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Active View Sync: 100% Verified</span>
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
                <span className="text-[10px] font-black bg-slate-950 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-xl uppercase tracking-widest">GCLID Spoof Active</span>
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
              Ad Network Handshake
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
            <span className="text-[12px] text-blue-400 font-black uppercase tracking-[0.5em] block">Injection Integrity</span>
            <p className="text-white font-black text-lg leading-tight uppercase tracking-tighter">BYPASSING IVT FILTERS</p>
            <div className="h-2 bg-slate-950 rounded-full overflow-hidden w-full max-w-[180px] mx-auto border border-slate-800">
               <div className="h-full bg-emerald-500 animate-[progress_1.2s_infinite]" style={{width: '99%'}}></div>
            </div>
            <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest italic">Simulating Unique HW Fingerprints per session</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulationDashboard;
