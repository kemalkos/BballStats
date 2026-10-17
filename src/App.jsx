import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, RotateCcw, Play, Pause, ChevronRight, ShieldAlert, 
  Flame, Award, ArrowUpRight, CheckCircle2, XCircle, FileText, 
  Zap, BarChart3, RefreshCw, Printer, AlertTriangle, X, Check,
  Target, Crosshair, Users, Activity
} from 'lucide-react';

export default function BasketballTracker() {
  const [activeTab, setActiveTab] = useState('tracker'); // 'tracker' | 'report'
  const [quarter, setQuarter] = useState(1); // 1, 2, 3, 4, 5 (OT)
  const [teamA, setTeamA] = useState({ name: 'Home Team', color: '#3B82F6' });
  const [teamB, setTeamB] = useState({ name: 'Away Team', color: '#EF4444' });
  
  // Events state
  const [events, setEvents] = useState([]);
  const [toast, setToast] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Handle adding stats
  const handleAddEvent = (team, type, detail = '') => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newEvents = [];

    if (type === 'STEAL') {
      const stealEvent = { id: Date.now(), quarter, team, type: 'STEAL', timestamp };
      const oppTeam = team === 'A' ? 'B' : 'A';
      const turnoverEvent = { 
        id: Date.now() + 1, 
        quarter, 
        team: oppTeam, 
        type: 'TURNOVER', 
        detail: `Forced by ${team === 'A' ? teamA.name : teamB.name}`,
        timestamp 
      };
      newEvents.push(stealEvent, turnoverEvent);
      showToast(`${team === 'A' ? teamA.name : teamB.name} Steal! (${team === 'A' ? teamB.name : teamA.name} Turnover logged)`);
    } else if (type === 'TURNOVER') {
      newEvents.push({ id: Date.now(), quarter, team, type: 'TURNOVER', detail: 'Unforced Turnover', timestamp });
      showToast(`Unforced Turnover for ${team === 'A' ? teamA.name : teamB.name}`);
    } else if (type === 'OREB') {
      newEvents.push({ id: Date.now(), quarter, team, type: 'OREB', timestamp });
      showToast(`Offensive Rebound for ${team === 'A' ? teamA.name : teamB.name}`);
    } else if (type === 'DREB') {
      newEvents.push({ id: Date.now(), quarter, team, type: 'DREB', timestamp });
      showToast(`Defensive Rebound for ${team === 'A' ? teamA.name : teamB.name}`);
    } else if (type === 'MADE_SHOT') {
      newEvents.push({ id: Date.now(), quarter, team, type: 'MADE_SHOT', timestamp });
      showToast(`Made Shot for ${team === 'A' ? teamA.name : teamB.name}`);
    } else if (type === 'MISSED_SHOT') {
      newEvents.push({ id: Date.now(), quarter, team, type: 'MISSED_SHOT', timestamp });
      showToast(`Missed Shot for ${team === 'A' ? teamA.name : teamB.name}`);
    }

    setEvents(prev => [...prev, ...newEvents]);
  };

  const showToast = (msg) => {
    setToast(msg);
  };

  const handleUndo = () => {
    if (events.length === 0) return;
    const lastEvent = events[events.length - 1];
    // If last event was part of linked steal/turnover
    if (lastEvent.type === 'TURNOVER' && lastEvent.detail?.startsWith('Forced by')) {
      setEvents(prev => prev.slice(0, -2));
      showToast('Undid Steal & Turnover');
    } else {
      setEvents(prev => prev.slice(0, -1));
      showToast('Undid last event');
    }
  };

  const handleDeleteEvent = (id) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const handleResetMatch = () => {
    setEvents([]);
    setQuarter(1);
    setShowResetModal(false);
    showToast('Match statistics reset');
  };

  const handlePrint = () => {
    setActiveTab('report');
    setTimeout(() => {
      window.print();
    }, 300);
  };

  // Helper calculation functions
  const getStatsForTeam = (teamKey, targetQuarter = null) => {
    const filteredEvents = events.filter(e => {
      const matchTeam = e.team === teamKey;
      const matchQuarter = targetQuarter ? e.quarter === targetQuarter : true;
      return matchTeam && matchQuarter;
    });

    const steals = filteredEvents.filter(e => e.type === 'STEAL').length;
    const turnovers = filteredEvents.filter(e => e.type === 'TURNOVER').length;
    const oreb = filteredEvents.filter(e => e.type === 'OREB').length;
    const dreb = filteredEvents.filter(e => e.type === 'DREB').length;
    const treb = oreb + dreb;
    const madeShots = filteredEvents.filter(e => e.type === 'MADE_SHOT').length;
    const missedShots = filteredEvents.filter(e => e.type === 'MISSED_SHOT').length;
    const totalShots = madeShots + missedShots;
    const fgPct = totalShots > 0 ? ((madeShots / totalShots) * 100).toFixed(1) : '0.0';

    return { steals, turnovers, oreb, dreb, treb, madeShots, missedShots, totalShots, fgPct };
  };

  const statsA = getStatsForTeam('A');
  const statsB = getStatsForTeam('B');

  const getQuarterLabel = (q) => q <= 4 ? `Q${q}` : `OT${q - 4}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Printable CSS */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .printable-report {
            background-color: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          .print-card {
            border: 1px solid #cbd5e1 !important;
            background-color: white !important;
            color: black !important;
          }
          .print-text-dark {
            color: #0f172a !important;
          }
        }
      `}</style>

      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 no-print">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-500/20">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-wide">Bball Match Tracker</h1>
              <p className="text-xs text-slate-400">Possessions, Shots & Rebounds</p>
            </div>
          </div>

          {/* Quarter Selector */}
          <div className="flex items-center bg-slate-800/80 rounded-xl p-1 border border-slate-700">
            {[1, 2, 3, 4, 5].map((q) => (
              <button
                key={q}
                onClick={() => setQuarter(q)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  quarter === q
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {getQuarterLabel(q)}
              </button>
            ))}
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('tracker')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'tracker'
                  ? 'bg-slate-800 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:bg-slate-800/50'
              }`}
            >
              <Zap className="w-4 h-4" />
              Live Tracker
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'report'
                  ? 'bg-slate-800 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:bg-slate-800/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Match Report
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 space-y-6">
        
        {/* LIVE TRACKER TAB */}
        {activeTab === 'tracker' && (
          <div className="space-y-6 no-print">
            
            {/* Quick Action Top Bar */}
            <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Active Quarter:</span>
                <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full font-bold text-sm">
                  {getQuarterLabel(quarter)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleUndo}
                  disabled={events.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all border border-slate-700"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Undo
                </button>
                <button
                  onClick={() => setShowResetModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition-all border border-red-500/20"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reset
                </button>
              </div>
            </div>

            {/* Team Stat Tracking Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* TEAM A TRACKER */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col space-y-5">
                {/* Team Name Input */}
                <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <input
                    type="text"
                    value={teamA.name}
                    onChange={(e) => setTeamA({ ...teamA, name: e.target.value })}
                    className="bg-transparent text-xl font-extrabold text-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 w-full"
                  />
                  <div className="flex gap-2">
                    <span className="text-xs font-semibold px-2.5 py-1 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
                      Team A
                    </span>
                  </div>
                </div>

                {/* Team Quick Stats summary */}
                <div className="grid grid-cols-4 gap-2 text-center bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Shots</div>
                    <div className="text-sm font-bold text-white">{statsA.madeShots}/{statsA.totalShots}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Steals</div>
                    <div className="text-sm font-bold text-emerald-400">{statsA.steals}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">TOs</div>
                    <div className="text-sm font-bold text-rose-400">{statsA.turnovers}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Rebounds</div>
                    <div className="text-sm font-bold text-amber-400">{statsA.treb}</div>
                  </div>
                </div>

                {/* Shooting Buttons */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-blue-400" /> Shots
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleAddEvent('A', 'MADE_SHOT')}
                      className="py-4 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 active:scale-95 border border-emerald-500/40 rounded-2xl flex flex-col items-center justify-center transition-all group"
                    >
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-emerald-300">Made Shot</span>
                    </button>
                    <button
                      onClick={() => handleAddEvent('A', 'MISSED_SHOT')}
                      className="py-4 px-3 bg-slate-800/80 hover:bg-slate-800 active:scale-95 border border-slate-700 rounded-2xl flex flex-col items-center justify-center transition-all group"
                    >
                      <XCircle className="w-6 h-6 text-slate-400 mb-1 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-slate-300">Missed Shot</span>
                    </button>
                  </div>
                </div>

                {/* Possessions (Steal & Turnover) */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> Possessions
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleAddEvent('A', 'STEAL')}
                      className="py-4 px-3 bg-blue-600/20 hover:bg-blue-600/30 active:scale-95 border border-blue-500/40 rounded-2xl flex flex-col items-center justify-center transition-all group"
                    >
                      <Zap className="w-6 h-6 text-blue-400 mb-1 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-blue-300">+1 Steal</span>
                      <span className="text-[10px] text-slate-400">(Triggers Opponent TO)</span>
                    </button>
                    <button
                      onClick={() => handleAddEvent('A', 'TURNOVER')}
                      className="py-4 px-3 bg-rose-600/10 hover:bg-rose-600/20 active:scale-95 border border-rose-500/30 rounded-2xl flex flex-col items-center justify-center transition-all group"
                    >
                      <ShieldAlert className="w-6 h-6 text-rose-400 mb-1 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-rose-300">Unforced TO</span>
                      <span className="text-[10px] text-slate-400">(Self TO only)</span>
                    </button>
                  </div>
                </div>

                {/* Rebound Buttons */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ArrowUpRight className="w-3.5 h-3.5 text-indigo-400" /> Rebounds
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleAddEvent('A', 'OREB')}
                      className="py-3 px-3 bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 rounded-2xl flex flex-col items-center justify-center transition-all"
                    >
                      <span className="text-xs font-bold text-indigo-300">+1 Off Rebound</span>
                      <span className="text-[10px] text-slate-400">(OREB)</span>
                    </button>
                    <button
                      onClick={() => handleAddEvent('A', 'DREB')}
                      className="py-3 px-3 bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 rounded-2xl flex flex-col items-center justify-center transition-all"
                    >
                      <span className="text-xs font-bold text-slate-300">+1 Def Rebound</span>
                      <span className="text-[10px] text-slate-400">(DREB)</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* TEAM B TRACKER */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col space-y-5">
                {/* Team Name Input */}
                <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <input
                    type="text"
                    value={teamB.name}
                    onChange={(e) => setTeamB({ ...teamB, name: e.target.value })}
                    className="bg-transparent text-xl font-extrabold text-red-400 focus:outline-none focus:ring-1 focus:ring-red-500 rounded px-1 w-full"
                  />
                  <div className="flex gap-2">
                    <span className="text-xs font-semibold px-2.5 py-1 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20">
                      Team B
                    </span>
                  </div>
                </div>

                {/* Team Quick Stats summary */}
                <div className="grid grid-cols-4 gap-2 text-center bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Shots</div>
                    <div className="text-sm font-bold text-white">{statsB.madeShots}/{statsB.totalShots}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Steals</div>
                    <div className="text-sm font-bold text-emerald-400">{statsB.steals}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">TOs</div>
                    <div className="text-sm font-bold text-rose-400">{statsB.turnovers}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Rebounds</div>
                    <div className="text-sm font-bold text-amber-400">{statsB.treb}</div>
                  </div>
                </div>

                {/* Shooting Buttons */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-red-400" /> Shots
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleAddEvent('B', 'MADE_SHOT')}
                      className="py-4 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 active:scale-95 border border-emerald-500/40 rounded-2xl flex flex-col items-center justify-center transition-all group"
                    >
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-emerald-300">Made Shot</span>
                    </button>
                    <button
                      onClick={() => handleAddEvent('B', 'MISSED_SHOT')}
                      className="py-4 px-3 bg-slate-800/80 hover:bg-slate-800 active:scale-95 border border-slate-700 rounded-2xl flex flex-col items-center justify-center transition-all group"
                    >
                      <XCircle className="w-6 h-6 text-slate-400 mb-1 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-slate-300">Missed Shot</span>
                    </button>
                  </div>
                </div>

                {/* Possessions (Steal & Turnover) */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> Possessions
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleAddEvent('B', 'STEAL')}
                      className="py-4 px-3 bg-red-600/20 hover:bg-red-600/30 active:scale-95 border border-red-500/40 rounded-2xl flex flex-col items-center justify-center transition-all group"
                    >
                      <Zap className="w-6 h-6 text-red-400 mb-1 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-red-300">+1 Steal</span>
                      <span className="text-[10px] text-slate-400">(Triggers Opponent TO)</span>
                    </button>
                    <button
                      onClick={() => handleAddEvent('B', 'TURNOVER')}
                      className="py-4 px-3 bg-rose-600/10 hover:bg-rose-600/20 active:scale-95 border border-rose-500/30 rounded-2xl flex flex-col items-center justify-center transition-all group"
                    >
                      <ShieldAlert className="w-6 h-6 text-rose-400 mb-1 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-rose-300">Unforced TO</span>
                      <span className="text-[10px] text-slate-400">(Self TO only)</span>
                    </button>
                  </div>
                </div>

                {/* Rebound Buttons */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ArrowUpRight className="w-3.5 h-3.5 text-indigo-400" /> Rebounds
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleAddEvent('B', 'OREB')}
                      className="py-3 px-3 bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 rounded-2xl flex flex-col items-center justify-center transition-all"
                    >
                      <span className="text-xs font-bold text-indigo-300">+1 Off Rebound</span>
                      <span className="text-[10px] text-slate-400">(OREB)</span>
                    </button>
                    <button
                      onClick={() => handleAddEvent('B', 'DREB')}
                      className="py-3 px-3 bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 rounded-2xl flex flex-col items-center justify-center transition-all"
                    >
                      <span className="text-xs font-bold text-slate-300">+1 Def Rebound</span>
                      <span className="text-[10px] text-slate-400">(DREB)</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>

            {/* Play-by-Play Event Feed */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" /> Play-by-Play Log ({events.length})
                </h3>
              </div>

              {events.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No match actions logged yet. Tap any stat button above to begin tracking.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {[...events].reverse().map((ev) => (
                    <div
                      key={ev.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-semibold text-[10px]">
                          {getQuarterLabel(ev.quarter)}
                        </span>
                        <span className={`font-bold ${ev.team === 'A' ? 'text-blue-400' : 'text-red-400'}`}>
                          {ev.team === 'A' ? teamA.name : teamB.name}
                        </span>
                        <span className="text-slate-300 font-medium">
                          {ev.type === 'MADE_SHOT' && ' Made Shot'}
                          {ev.type === 'MISSED_SHOT' && ' Missed Shot'}
                          {ev.type === 'STEAL' && ' Steal'}
                          {ev.type === 'TURNOVER' && ` Turnover ${ev.detail ? `(${ev.detail})` : ''}`}
                          {ev.type === 'OREB' && ' Offensive Rebound'}
                          {ev.type === 'DREB' && ' Defensive Rebound'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500">{ev.timestamp}</span>
                        <button
                          onClick={() => handleDeleteEvent(ev.id)}
                          className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* MATCH REPORT TAB (PRINTABLE) */}
        {activeTab === 'report' && (
          <div className="printable-report space-y-6">
            
            {/* Header & Print Control */}
            <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-5 rounded-3xl no-print">
              <div>
                <h2 className="text-lg font-bold text-white">Match Analytics & Box Score</h2>
                <p className="text-xs text-slate-400">Quarterly breakdown and head-to-head comparison</p>
              </div>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition-all"
              >
                <Printer className="w-4 h-4" /> Print PDF Report
              </button>
            </div>

            {/* Print Header Visible only in PDF */}
            <div className="hidden print-only text-center mb-6 border-b pb-4 border-slate-300">
              <h1 className="text-2xl font-bold text-slate-900">Basketball Match Stats Report</h1>
              <p className="text-sm text-slate-600">{teamA.name} vs {teamB.name}</p>
            </div>

            {/* Head to Head Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Team A Stats Box */}
              <div className="print-card bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
                <div className="border-b border-slate-800 pb-2">
                  <h3 className="font-extrabold text-lg text-blue-400 print-text-dark">{teamA.name}</h3>
                  <span className="text-xs text-slate-400">Overall Match Performance</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                    <div className="text-xs text-slate-400">Shooting (Made/Total)</div>
                    <div className="text-xl font-bold text-white mt-1 print-text-dark">{statsA.madeShots} / {statsA.totalShots} ({statsA.fgPct}%)</div>
                  </div>
                  <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                    <div className="text-xs text-slate-400">Total Rebounds</div>
                    <div className="text-xl font-bold text-amber-400 mt-1 print-text-dark">{statsA.treb} <span className="text-xs font-normal text-slate-400">({statsA.oreb} OFF / {statsA.dreb} DEF)</span></div>
                  </div>
                  <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                    <div className="text-xs text-slate-400">Steals</div>
                    <div className="text-xl font-bold text-emerald-400 mt-1 print-text-dark">{statsA.steals}</div>
                  </div>
                  <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                    <div className="text-xs text-slate-400">Turnovers</div>
                    <div className="text-xl font-bold text-rose-400 mt-1 print-text-dark">{statsA.turnovers}</div>
                  </div>
                </div>
              </div>

              {/* Team B Stats Box */}
              <div className="print-card bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
                <div className="border-b border-slate-800 pb-2">
                  <h3 className="font-extrabold text-lg text-red-400 print-text-dark">{teamB.name}</h3>
                  <span className="text-xs text-slate-400">Overall Match Performance</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                    <div className="text-xs text-slate-400">Shooting (Made/Total)</div>
                    <div className="text-xl font-bold text-white mt-1 print-text-dark">{statsB.madeShots} / {statsB.totalShots} ({statsB.fgPct}%)</div>
                  </div>
                  <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                    <div className="text-xs text-slate-400">Total Rebounds</div>
                    <div className="text-xl font-bold text-amber-400 mt-1 print-text-dark">{statsB.treb} <span className="text-xs font-normal text-slate-400">({statsB.oreb} OFF / {statsB.dreb} DEF)</span></div>
                  </div>
                  <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                    <div className="text-xs text-slate-400">Steals</div>
                    <div className="text-xl font-bold text-emerald-400 mt-1 print-text-dark">{statsB.steals}</div>
                  </div>
                  <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                    <div className="text-xs text-slate-400">Turnovers</div>
                    <div className="text-xl font-bold text-rose-400 mt-1 print-text-dark">{statsB.turnovers}</div>
                  </div>
                </div>
              </div>

            </div>

            {/* Quarter-by-Quarter Matrix Table */}
            <div className="print-card bg-slate-900 border border-slate-800 rounded-3xl p-5 overflow-x-auto">
              <h3 className="font-bold text-sm text-slate-200 mb-4 print-text-dark">Quarterly Breakdown Matrix</h3>
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase">
                    <th className="pb-3 font-semibold">Quarter</th>
                    <th className="pb-3 font-semibold text-blue-400">{teamA.name} (Shots / STL / TO / REB)</th>
                    <th className="pb-3 font-semibold text-red-400">{teamB.name} (Shots / STL / TO / REB)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {[1, 2, 3, 4, 5].map((q) => {
                    const qStatsA = getStatsForTeam('A', q);
                    const qStatsB = getStatsForTeam('B', q);
                    return (
                      <tr key={q} className="hover:bg-slate-800/30">
                        <td className="py-3 font-bold text-slate-300 print-text-dark">{getQuarterLabel(q)}</td>
                        <td className="py-3 text-slate-200 print-text-dark">
                          <span className="font-semibold">{qStatsA.madeShots}/{qStatsA.totalShots}</span> FGM | <span className="text-emerald-400 font-semibold">{qStatsA.steals}</span> STL | <span className="text-rose-400 font-semibold">{qStatsA.turnovers}</span> TO | <span className="text-amber-400 font-semibold">{qStatsA.treb}</span> REB
                        </td>
                        <td className="py-3 text-slate-200 print-text-dark">
                          <span className="font-semibold">{qStatsB.madeShots}/{qStatsB.totalShots}</span> FGM | <span className="text-emerald-400 font-semibold">{qStatsB.steals}</span> STL | <span className="text-rose-400 font-semibold">{qStatsB.turnovers}</span> TO | <span className="text-amber-400 font-semibold">{qStatsB.treb}</span> REB
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        )}

      </main>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-blue-600 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-blue-400/30 animate-bounce no-print">
          <Zap className="w-4 h-4 fill-current" />
          {toast}
        </div>
      )}

      {/* Confirmation Modal for Reset */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-base">Reset Match Statistics?</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              This will permanently delete all tracked steals, turnovers, rebounds, and shot logs. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleResetMatch}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 transition-all"
              >
                Yes, Reset All
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}