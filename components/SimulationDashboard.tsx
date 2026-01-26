
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
  // Hardware Fingerprinting (New in v10)
  webglVendor: string;
  canvasHash: string;
  hwConcurrency: number;
  deviceMemory: number;
  platform: string;
  // Cookie Linkers
  gadsId: string;
  gclAuId: string;
  gpiId: string;
}

const SimulationDashboard: React.FC<SimulationDashboardProps> = ({ targetUrl, analysis, onStop }) => {
  const [manualId, setManualId] = useState(analysis?.trackingId || 'G-XG650JREK7');
  const [isEditingId, setIsEditingId] = useState(false);
  const [stats, setStats] = useState<SimulationStats>({
    totalRequests: 0,
    successRate: 100,
    avgLatency: 4,
    activeNodes: 1250,
    requestsPerSecond: 0
  });

  const [activeHumans, setActiveHumans] = useState(0);
  const [estRevenue, setEstRevenue] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [mapNodes, setMapNodes] = useState<TrafficNode[]>([]);
  
  const sessionsRef = useRef<Map<string, HumanSession>>(new Map());
  const revenueAccRef = useRef(0);

  // Expanded Tier-1 Hardware-Realistic IP Ranges
  const tier1Locations = [
    { name: 'USA', lat: 37, lng: -95, rpm: 112.40, lang: 'en-US', ips: ['172.217.', '142.250.', '104.16.', '66.249.', '8.8.8.'], platforms: ['Win32', 'MacIntel', 'iPhone'] },
    { name: 'United Kingdom', lat: 55, lng: -3, rpm: 88.20, lang: 'en-GB', ips: ['31.50.', '2.24.', '81.130.', '194.223.'], platforms: ['Win32', 'MacIntel'] },
    { name: 'Germany', lat: 51, lng: 10, rpm: 75.60, lang: 'de-DE', ips: ['5.9.', '37.120.', '176.9.', '88.99.'], platforms: ['Win32', 'Linux x86_64'] },
    { name: 'Canada', lat: 56, lng: -106, rpm: 74.30, lang: 'en-CA', ips: ['99.224.', '184.150.', '204.101.'], platforms: ['MacIntel', 'Win32'] }
  ];

  const webglVendors = ['Google Inc. (NVIDIA)', 'Google Inc. (Intel)', 'Apple Inc. (Apple M1)', 'AMD (Radeon)'];
  const highIntentReferrers = [
    'https://www.google.com/search?q=apply+for+government+grants+himachal+2025',
    'https://www.google.com/search?q=business+loan+schemes+himachal+pradesh',
    'https://www.google.com/search?q=himachal+govt+official+tender+bid+login',
    'https://www.bing.com/search?q=official+announcements+himachal+pradesh+portal',
    'https://duckduckgo.com/?q=himachal+pradesh+government+direct+links'
  ];

  const commonPaths = ['/', '/news', '/tenders', '/services', '/notifications', '/downloads', '/contact-us'];

  const generateIP = (loc: typeof tier1Locations[0]) => {
    const prefix = loc.ips[Math.floor(Math.random() * loc.ips.length)];
    return prefix + Math.floor(Math.random() * 254) + '.' + Math.floor(Math.random() * 254);
  };

  const sendNetworkPing = async (session: HumanSession, endpoint: 'ga' | 'ads' | 'dc', event: string, extra = {}) => {
    const urls = {
      ga: 'https://www.google-analytics.com/g/collect',
      ads: 'https://googleads.g.doubleclick.net/pagead/adview',
      dc: 'https://stats.g.doubleclick.net/g/collect'
    };

    const payload: Record<string, string> = {
      v: '2',
      tid: manualId,
      gtm: '45je41v0',
      _p: Math.floor(Math.random() * 1e9).toString(),
      cid: session.cid,
      ul: session.language.toLowerCase(),
      sr: session.screenRes,
      vp: session.viewport,
      sid: session.sid,
      sct: session.pagesVisited.toString(),
      seg: '1', 
      en: event,
      dl: targetUrl + session.currentPath,
      dr: session.referrer,
      dt: `${analysis?.title || 'Official Portal'} | HW: ${session.platform}`,
      uip: session.ip,
      uaa: session.platform,
      uab: '64',
      uafvl: 'Chromium;122.0.6261.129|Not(A:Brand;24.0.0.0|Google%20Chrome;122.0.6261.129',
      uamb: '0',
      uam: '',
      uap: 'Windows',
      uapv: '15.0.0',
      _et: session.totalEngagementMs.toString(),
      // Advanced Hardware Simulation
      'ep.webgl_vendor': session.webglVendor,
      'ep.canvas_hash': session.canvasHash,
      'ep.hw_concurrency': session.hwConcurrency.toString(),
      'ep.device_memory': session.deviceMemory.toString(),
      // AdSense Identification Handshake
      '_gads': session.gadsId,
      '_gcl_au': session.gclAuId,
      '_gpi': session.gpiId,
      'ep.ad_unit_id': `ca-pub-${Math.floor(Math.random() * 1e16)}`,
      'ep.active_view': '1',
      'epn.exposure_time': '10000',
      ...extra
    };

    const qs = Object.entries(payload).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
    
    try {
      await fetch(`${urls[endpoint]}?${qs}`, { 
        mode: 'no-cors',
        keepalive: true,
        headers: { 'User-Agent': session.ua }
      });
      
      setStats(prev => ({ ...prev, totalRequests: prev.totalRequests + 1 }));
      
      if (event === 'ad_click') {
        revenueAccRef.current += (2.45 + Math.random() * 4.10); // Premium CPC
      } else if (event === 'ad_impression') {
        revenueAccRef.current += (session.rpm / 400); // Optimized RPM
      }
    } catch (e) {
      console.error("Traffic Blocked by Firewall", e);
    }
  };

  useEffect(() => {
    const engine = setInterval(() => {
      const now = Date.now();
      
      // 1. Session Disposal with Attention Heartbeat
      sessionsRef.current.forEach((session, id) => {
        if (now - session.startTime > session.minDwellMs) {
          sendNetworkPing(session, 'ga', 'user_engagement', { _et: session.totalEngagementMs.toString() });
          sessionsRef.current.delete(id);
        }
      });

      // 2. Ultra-Realistic Device Injection (32k+ nodes)
      const targetCount = 32500;
      if (sessionsRef.current.size < targetCount) {
        const batchSize = 1000;
        for (let i = 0; i < batchSize; i++) {
          const loc = tier1Locations[Math.floor(Math.random() * tier1Locations.length)];
          const platform = loc.platforms[Math.floor(Math.random() * loc.platforms.length)];
          const ip = generateIP(loc);
          const dwell = 180000 + (Math.random() * 300000); // 3-8 minutes (High Quality Session)
          
          const newSession: HumanSession = {
            id: `hw_${Math.random().toString(36).substr(2, 9)}`,
            cid: `${Math.floor(Math.random() * 1e9)}.${Math.floor(now/1000)}`,
            sid: Math.floor(now / 1000).toString(),
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
            screenRes: '1920x1080',
            viewport: '1920x937',
            hasClickedAd: false,
            // Hardware Specs
            webglVendor: webglVendors[Math.floor(Math.random() * webglVendors.length)],
            canvasHash: Math.random().toString(16).substr(2, 12),
            hwConcurrency: [4, 8, 12, 16][Math.floor(Math.random() * 4)],
            deviceMemory: [4, 8, 16, 32][Math.floor(Math.random() * 4)],
            platform: platform,
            // Identifiers
            gadsId: `ID=${Math.random().toString(16).substr(2, 16)}:T=${Math.floor(now/1000)}:S=ALNI_${Math.random().toString(36).substr(2, 20)}`,
            gclAuId: `1.1.${Math.floor(Math.random() * 1e9)}.${Math.floor(now/1000)}`,
            gpiId: `UID=${Math.random().toString(36).substr(2, 24)}`
          };
          
          sessionsRef.current.set(newSession.id, newSession);
          // Initial Chain
          sendNetworkPing(newSession, 'ga', 'page_view', { _fv: '1', _ss: '1' });
          sendNetworkPing(newSession, 'dc', 'ad_impression'); // Link to DoubleClick immediately
        }
      }

      // 3. Attention Drip & Heatmap Scroll Loop
      sessionsRef.current.forEach(session => {
        const timeSince = now - session.lastEngagementTime;
        if (timeSince > (4000 + Math.random() * 8000)) {
          session.totalEngagementMs += timeSince;
          session.lastEngagementTime = now;
          session.hits++;
          
          const dice = Math.random();
          
          // Heatmap Scroll (mimics reading speed)
          if (dice > 0.05) sendNetworkPing(session, 'ga', 'scroll', { 'epn.percent_scrolled': (20 + (session.hits * 5)).toString() });

          // AD CLICK BEHAVIOR (Realistic CPC Logic)
          if (dice > 0.982 && !session.hasClickedAd) {
             session.hasClickedAd = true;
             sendNetworkPing(session, 'ga', 'ad_click', { 'ep.gclid': `Cj0KCQi${Math.random().toString(36).substr(2, 30)}` });
             sendNetworkPing(session, 'ads', 'click_v2'); 
          }

          // Active View Verification (DoubleClick Heartbeat)
          if (dice > 0.2) {
             sendNetworkPing(session, 'ads', 'view_item');
             sendNetworkPing(session, 'dc', 'user_engagement');
          }

          // Random Navigation
          if (dice > 0.91 && session.pagesVisited < session.targetPages) {
            session.pagesVisited++;
            session.currentPath = commonPaths[Math.floor(Math.random() * commonPaths.length)];
            sendNetworkPing(session, 'ga', 'page_view');
          }
        }
      });

      const count = sessionsRef.current.size;
      setActiveHumans(count);
      setEstRevenue(revenueAccRef.current);
      setStats(prev => ({ ...prev, requestsPerSecond: Math.floor(count / 2.8) }));

      const allSessions: HumanSession[] = Array.from(sessionsRef.current.values());
      setMapNodes(allSessions.slice(0, 220).map(s => ({
        id: s.id, country: s.country, lat: s.lat, lng: s.lng, ip: s.ip, status: 'active'
      })));

      if (Math.random() > 0.2) {
        const s = allSessions[Math.floor(Math.random() * allSessions.length)];
        setLogs(prev => [`[v10.0 ENGINE] ${s?.country} | HW: ${s?.webglVendor.split(' ')[2]} | Mem: ${s?.deviceMemory}GB | CPC: ${s?.hasClickedAd ? 'DETECTED' : 'IDLE'}`, ...prev].slice(0, 10));
      }
    }, 1000);

    return () => clearInterval(engine);
  }, [targetUrl, manualId]);

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-20 animate-in fade-in zoom-in duration-700">
      
      {/* PROFESSIONAL HARDWARE COMMAND HEADER */}
      <div className="bg-slate-900 border-2 border-slate-800 p-8 rounded-[3rem] flex flex-col xl:flex-row items-center justify-between gap-8 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-cyan-300 to-blue-500 shadow-[0_0_20px_#06b6d4]"></div>
        
        <div className="flex items-center gap-8 relative z-10">
          <div className="w-20 h-20 bg-blue-500 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-500/30 group">
             <svg className="w-10 h-10 text-slate-950 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
          </div>
          
          <div>
            <h2 className="text-3xl font-black text-white tracking-tighter flex items-center gap-4">
              {targetUrl.replace(/https?:\/\//, '').split('/')[0].toUpperCase()}
              <span className="bg-blue-500 text-slate-950 text-[10px] px-3 py-1 rounded-lg font-black tracking-widest uppercase italic">HARDWARE SYRINGE v10.0</span>
            </h2>
            
            <div className="flex items-center gap-4 mt-3">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Global Ad Network Sync:</span>
              {isEditingId ? (
                <div className="flex gap-2">
                  <input 
                    className="bg-slate-950 border border-blue-500/50 rounded-lg px-3 py-1 text-blue-400 font-mono text-xs focus:ring-0" 
                    value={manualId} 
                    onChange={e => setManualId(e.target.value)}
                    autoFocus
                  />
                  <button onClick={() => setIsEditingId(false)} className="text-blue-500 text-[10px] font-black uppercase">Initialize</button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingId(true)}>
                  <span className="text-blue-400 font-mono text-xs font-bold border-b border-dashed border-blue-500/50">{manualId}</span>
                  <svg className="w-3 h-3 text-slate-600 group-hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8 bg-slate-950/50 p-6 rounded-[2.5rem] border border-slate-800">
          <div className="flex flex-col border-r border-slate-800 pr-10">
            <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Fingerprint Integrity</span>
            <span className="text-3xl font-mono text-blue-500 font-bold tracking-tighter">100% CLEAN</span>
          </div>
          <button 
            onClick={onStop}
            className="bg-rose-600 hover:bg-rose-500 text-white px-10 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-rose-600/30 active:scale-95 border-b-4 border-rose-900"
          >
            DISCONNECT CLUSTER
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols