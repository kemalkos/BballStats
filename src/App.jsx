import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, RefreshCw, BarChart2, Printer, Undo2, ChevronRight, Activity, 
  Settings, Trash2, CheckCircle2, Shield, RotateCcw, AlertTriangle, X,
  Target, ShieldAlert, Save
} from 'lucide-react';

const STORAGE_KEY = 'bball_tracker_state_v1';

export default function App() {
  // --- Game Config & Teams ---
  const [teamA, setTeamA] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.teamA) return parsed.teamA;
      }
    } catch (e) {
      console.error('Failed to load teamA from localStorage', e);
    }
    return { name: 'Home Team', color: '#3b82f6' }; // Blue default
  });

  const [teamB, setTeamB] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.teamB) return parsed.teamB;
      }
    } catch (e) {
      console.error('Failed to load teamB from localStorage', e);
    }
    return { name: 'Away Team', color: '#ef4444' }; // Red default
  });

  const [showConfig, setShowConfig] = useState(false);

  // --- Quarter State (Q1, Q2, Q3, Q4, OT1, OT2...) ---
  const [quarter, setQuarter] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.quarter) return parsed.quarter;
      }
    } catch (e) {
      console.error('Failed to load quarter from localStorage', e);
    }
    return 1;
  });

  // --- Events / Actions Log ---
  // Event structure: { id, quarter, team: 'A' | 'B', type: 'STEAL'|'TURNOVER'|'OREB'|'DREB'|'FGM'|'FGA', detail, linkedId? }
  const [events, setEvents] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.events)) return parsed.events;
      }
    } catch (e) {
      console.error('Failed to load events from localStorage', e);
    }
    return [];
  });

  const [toast, setToast] = useState(null);
  const [lastSavedTime, setLastSavedTime] = useState(null);
  
  // --- Modal States ---
  const [showResetModal, setShowResetModal] = useState(false);

  // --- Active View Tab & Mobile Team Tab ---
  const [activeTab, setActiveTab] = useState('tracker'); // 'tracker' | 'report'
  const [activeMobileTeam, setActiveMobileTeam] = useState('A'); // 'A' | 'B'

  // --- Touch Swipe State ---
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  // --- Auto-Save Effect ---
  useEffect(() => {
    try {
      const stateToSave = {
        teamA,
        teamB,
        quarter,
        events
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e) {
      console.error('Failed to persist stats to localStorage', e);
    }
  }, [teamA, teamB, quarter, events]);

  const showToastNotification = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => {
      setToast(null);
    }, 2800);
  };

  const quarterLabel = (q) => (q <= 4 ? `Q${q}` : `OT${q - 4}`);

  // Quarter navigation
  const handleNextQuarter = () => {
    const nextQ = quarter + 1;
    setQuarter(nextQ);
    showToastNotification(`Advanced to ${quarterLabel(nextQ)}`, 'info');
  };

  const handlePrevQuarter = () => {
    if (quarter > 1) {
      setQuarter(quarter - 1);
    }
  };

  // --- Touch Swipe Handlers for Mobile ---
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50; // Threshold in px

    if (distance > minSwipeDistance) {
      // Swiped Left -> Switch to Team B
      setActiveMobileTeam('B');
    } else if (distance < -minSwipeDistance) {
      // Swiped Right -> Switch to Team A
      setActiveMobileTeam('A');
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  // --- Action Handlers ---
  const addStat = (team, statType) => {
    const teamName = team === 'A' ? teamA.name : teamB.name;
    const oppTeam = team === 'A' ? 'B' : 'A';
    const oppTeamName = team === 'A' ? teamB.name : teamA.name;

    let newEventsList = [];
    let toastMsg = '';

    if (statType === 'STEAL') {
      // Steal for Team A automatically logs Turnover for Team B
      const stealEventId = Date.now();
      const turnoverEventId = stealEventId + 1;

      const stealEvt = {
        id: stealEventId,
        quarter,
        team,
        type: 'STEAL',
        detail: 'Steal recorded',
        linkedId: turnoverEventId
      };

      const turnoverEvt = {
        id: turnoverEventId,
        quarter,
        team: oppTeam,
        type: 'TURNOVER',
        detail: `Turnover (Stolen by ${teamName})`,
        linkedId: stealEventId
      };

      newEventsList = [stealEvt, turnoverEvt];
      toastMsg = `+1 Steal for ${teamName} (Auto +1 Turnover for ${oppTeamName})`;
    } else if (statType === 'TURNOVER') {
      // Unforced Turnover
      const turnoverEvt = {
        id: Date.now(),
        quarter,
        team,
        type: 'TURNOVER',
        detail: 'Unforced Turnover',
      };
      newEventsList = [turnoverEvt];
      toastMsg = `+1 Unforced Turnover for ${teamName}`;
    } else if (statType === 'OREB') {
      const orebEvt = {
        id: Date.now(),
        quarter,
        team,
        type: 'OREB',
        detail: 'Offensive Rebound',
      };
      newEventsList = [orebEvt];
      toastMsg = `+1 Offensive Rebound for ${teamName}`;
    } else if (statType === 'DREB') {
      const drebEvt = {
        id: Date.now(),
        quarter,
        team,
        type: 'DREB',
        detail: 'Defensive Rebound',
      };
      newEventsList = [drebEvt];
      toastMsg = `+1 Defensive Rebound for ${teamName}`;
    } else if (statType === 'FGM') {
      const fgmEvt = {
        id: Date.now(),
        quarter,
        team,
        type: 'FGM',
        detail: 'Field Goal Made',
      };
      newEventsList = [fgmEvt];
      toastMsg = `+1 Made Shot for ${teamName}`;
    } else if (statType === 'FGA') {
      const fgaEvt = {
        id: Date.now(),
        quarter,
        team,
        type: 'FGA',
        detail: 'Field Goal Missed',
      };
      newEventsList = [fgaEvt];
      toastMsg = `+1 Missed Shot for ${teamName}`;
    }

    setEvents((prev) => [...newEventsList, ...prev]);
    showToastNotification(toastMsg);
  };

  // Quick Undo Last Action
  const handleUndo = () => {
    if (events.length === 0) return;
    const lastEvent = events[0];
    
    if (lastEvent.linkedId) {
      // Remove both linked events (steal + turnover)
      setEvents((prev) => prev.filter((e) => e.id !== lastEvent.id && e.id !== lastEvent.linkedId));
    } else {
      setEvents((prev) => prev.slice(1));
    }
    showToastNotification('Last action undone', 'info');
  };

  // Delete explicit event from feed
  const handleDeleteEvent = (id) => {
    const evtToDelete = events.find((e) => e.id === id);
    if (!evtToDelete) return;

    if (evtToDelete.linkedId) {
      setEvents((prev) => prev.filter((e) => e.id !== id && e.id !== evtToDelete.linkedId));
    } else {
      setEvents((prev) => prev.filter((e) => e.id !== id));
    }
    showToastNotification('Event removed', 'info');
  };

  // Perform full reset of match stats & clear persistence
  const confirmResetMatch = () => {
    setEvents([]);
    setQuarter(1);
    localStorage.removeItem(STORAGE_KEY);
    setShowResetModal(false);
    showToastNotification('All match statistics have been reset', 'info');
  };

  // --- Calculate Aggregated Possession, Rebound & Shooting Stats ---
  const calculateStats = () => {
    const initStats = () => ({
      stl: 0,
      to: 0,
      oreb: 0,
      dreb: 0,
      treb: 0,
      fgm: 0,
      fga: 0,
      byQuarter: {}
    });

    const stats = {
      A: initStats(),
      B: initStats()
    };

    events.forEach((evt) => {
      const t = evt.team;
      const q = evt.quarter;
      if (!stats[t]) return;

      if (!stats[t].byQuarter[q]) {
        stats[t].byQuarter[q] = { stl: 0, to: 0, oreb: 0, dreb: 0, treb: 0, fgm: 0, fga: 0 };
      }

      const qStats = stats[t].byQuarter[q];

      switch (evt.type) {
        case 'STEAL':
          stats[t].stl += 1;
          qStats.stl += 1;
          break;
        case 'TURNOVER':
          stats[t].to += 1;
          qStats.to += 1;
          break;
        case 'OREB':
          stats[t].oreb += 1;
          stats[t].treb += 1;
          qStats.oreb += 1;
          qStats.treb += 1;
          break;
        case 'DREB':
          stats[t].dreb += 1;
          stats[t].treb += 1;
          qStats.dreb += 1;
          qStats.treb += 1;
          break;
        case 'FGM':
          stats[t].fgm += 1;
          qStats.fgm += 1;
          break;
        case 'FGA':
          stats[t].fga += 1;
          qStats.fga += 1;
          break;
        default:
          break;
      }
    });

    return stats;
  };

  const stats = calculateStats();

  // OREB% = Team OREB / (Team OREB + Opponent DREB)
  const orebPctA = (stats.A.oreb + stats.B.dreb) > 0 
    ? Math.round((stats.A.oreb / (stats.A.oreb + stats.B.dreb)) * 100) 
    : 0;
  const orebPctB = (stats.B.oreb + stats.A.dreb) > 0 
    ? Math.round((stats.B.oreb / (stats.B.oreb + stats.A.dreb)) * 100) 
    : 0;

  // Reliable PDF / Print Trigger
  const handlePrint = () => {
    if (activeTab !== 'report') {
      setActiveTab('report');
      setTimeout(() => {
        window.print();
      }, 200);
    } else {
      window.print();
    }
  };

  // Sub-component for Team Card
  const renderTeamCard = (teamKey) => {
    const isTeamA = teamKey === 'A';
    const team = isTeamA ? teamA : teamB;
    const oppTeam = isTeamA ? teamB : teamA;
    const teamStats = isTeamA ? stats.A : stats.B;
    const orebPct = isTeamA ? orebPctA : orebPctB;

    return (
      <div 
        className="bg-slate-900 border-2 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col justify-between"
        style={{ borderColor: team.color + '50' }}
      >
        <div>
          {/* Team Header Banner */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
            <div className="flex items-center gap-3">
              <span className="w-4 h-4 rounded-full shadow" style={{ backgroundColor: team.color }} />
              <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-wide">{team.name}</h2>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-950 text-slate-400 border border-slate-800">
              {quarterLabel(quarter)} Stats
            </span>
          </div>

          {/* Section 1: Shooting (FGM & FGA) */}
          <div className="mb-5">
            <div className="flex justify-between items-center mb-2">
              <label className="text-[11px] font-bold tracking-widest text-slate-400 uppercase flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-amber-400" /> Shots
              </label>
              <span className="text-xs text-slate-400 font-medium">
                Made: <strong className="text-emerald-400 font-bold">{teamStats.fgm}</strong> | Missed: <strong className="text-rose-400 font-bold">{teamStats.fga}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              {/* Made Shot Button */}
              <button
                onClick={() => addStat(teamKey, 'FGM')}
                className="p-3 sm:p-4 bg-emerald-950/40 hover:bg-emerald-900/60 active:scale-95 border border-emerald-600/40 rounded-xl font-extrabold text-emerald-300 text-xs sm:text-sm flex flex-col items-center gap-1 transition shadow-lg"
              >
                <Target className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                <span>+1 MADE SHOT</span>
                <span className="text-[10px] text-emerald-400/70 font-normal text-center">
                  Field Goal Made (FGM)
                </span>
              </button>

              {/* Missed Shot Button */}
              <button
                onClick={() => addStat(teamKey, 'FGA')}
                className="p-3 sm:p-4 bg-rose-950/40 hover:bg-rose-900/60 active:scale-95 border border-rose-600/40 rounded-xl font-extrabold text-rose-300 text-xs sm:text-sm flex flex-col items-center gap-1 transition shadow-lg"
              >
                <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 text-rose-400" />
                <span>+1 MISSED SHOT</span>
                <span className="text-[10px] text-rose-400/70 font-normal text-center">
                  Field Goal Attempt (FGA)
                </span>
              </button>
            </div>
          </div>

          {/* Section 2: Possession (Steals & Turnovers) */}
          <div className="mb-5">
            <div className="flex justify-between items-center mb-2">
              <label className="text-[11px] font-bold tracking-widest text-slate-400 uppercase flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Possessions
              </label>
              <span className="text-xs text-slate-400 font-medium">
                STL: <strong className="text-white font-bold">{teamStats.stl}</strong> | TO: <strong className="text-white font-bold">{teamStats.to}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              {/* Steal Button */}
              <button
                onClick={() => addStat(teamKey, 'STEAL')}
                className="p-3 sm:p-4 bg-amber-950/40 hover:bg-amber-900/60 active:scale-95 border border-amber-600/40 rounded-xl font-extrabold text-amber-300 text-xs sm:text-sm flex flex-col items-center gap-1 transition shadow-lg"
              >
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
                <span>+1 STEAL</span>
                <span className="text-[10px] text-amber-400/70 font-normal text-center">
                  Auto-adds TO to {oppTeam.name}
                </span>
              </button>

              {/* Unforced Turnover Button */}
              <button
                onClick={() => addStat(teamKey, 'TURNOVER')}
                className="p-3 sm:p-4 bg-slate-800/80 hover:bg-slate-700 active:scale-95 border border-slate-700 rounded-xl font-extrabold text-slate-300 text-xs sm:text-sm flex flex-col items-center gap-1 transition shadow-lg"
              >
                <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
                <span>TURNOVER</span>
                <span className="text-[10px] text-slate-400/70 font-normal text-center">
                  Unforced (No Steal)
                </span>
              </button>
            </div>
          </div>

          {/* Section 3: Rebounds (OREB & DREB) */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[11px] font-bold tracking-widest text-slate-400 uppercase flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-amber-400" /> Rebounds
              </label>
              <span className="text-xs text-slate-400 font-medium">
                Total: <strong className="text-amber-400 font-bold">{teamStats.treb}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              {/* Offensive Rebound */}
              <button
                onClick={() => addStat(teamKey, 'OREB')}
                className="py-3 px-2.5 sm:px-3 bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 rounded-xl font-extrabold text-slate-100 text-xs flex items-center justify-between transition shadow"
              >
                <div className="text-left">
                  <div className="text-amber-400 font-black">+1 OREB</div>
                  <div className="text-[10px] text-slate-400 font-normal">Offensive</div>
                </div>
                <span className="bg-slate-950 px-2 py-0.5 rounded-lg text-amber-400 font-black text-xs sm:text-sm">
                  {teamStats.oreb}
                </span>
              </button>

              {/* Defensive Rebound */}
              <button
                onClick={() => addStat(teamKey, 'DREB')}
                className="py-3 px-2.5 sm:px-3 bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 rounded-xl font-extrabold text-slate-100 text-xs flex items-center justify-between transition shadow"
              >
                <div className="text-left">
                  <div className="text-blue-400 font-black">+1 DREB</div>
                  <div className="text-[10px] text-slate-400 font-normal">Defensive</div>
                </div>
                <span className="bg-slate-950 px-2 py-0.5 rounded-lg text-amber-400 font-black text-xs sm:text-sm">
                  {teamStats.dreb}
                </span>
              </button>
            </div>
          </div>

        </div>

        {/* Live Stat Badges */}
        <div className="mt-5 pt-3.5 border-t border-slate-800 grid grid-cols-4 gap-1.5 sm:gap-2 text-center text-xs font-semibold text-slate-400">
          <div className="bg-slate-950 p-1.5 sm:p-2 rounded-lg border border-slate-800">
            <span className="block text-[9px] sm:text-[10px] text-slate-500">MADE</span>
            <span className="text-xs sm:text-sm font-extrabold text-emerald-400">{teamStats.fgm}</span>
          </div>
          <div className="bg-slate-950 p-1.5 sm:p-2 rounded-lg border border-slate-800">
            <span className="block text-[9px] sm:text-[10px] text-slate-500">STEALS</span>
            <span className="text-xs sm:text-sm font-extrabold text-white">{teamStats.stl}</span>
          </div>
          <div className="bg-slate-950 p-1.5 sm:p-2 rounded-lg border border-slate-800">
            <span className="block text-[9px] sm:text-[10px] text-slate-500">TURNOVERS</span>
            <span className="text-xs sm:text-sm font-extrabold text-white">{teamStats.to}</span>
          </div>
          <div className="bg-slate-950 p-1.5 sm:p-2 rounded-lg border border-slate-800">
            <span className="block text-[9px] sm:text-[10px] text-slate-500">OREB %</span>
            <span className="text-xs sm:text-sm font-extrabold text-amber-400">{orebPct}%</span>
          </div>
        </div>

      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-amber-500 selection:text-slate-950">
      
      {/* Toast Notification */}
      {toast && (
        <div className="no-print fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white shadow-2xl animate-bounce">
          <CheckCircle2 className={`w-5 h-5 ${toast.type === 'info' ? 'text-blue-400' : 'text-emerald-400'}`} />
          <span className="text-sm font-semibold">{toast.msg}</span>
        </div>
      )}

      {/* Confirmation Reset Modal */}
      {showResetModal && (
        <div className="no-print fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-base">
                <AlertTriangle className="w-5 h-5" />
                Reset All Match Statistics?
              </div>
              <button 
                onClick={() => setShowResetModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-xs text-slate-300 leading-relaxed">
              This action will permanently erase all tracked steals, turnovers, rebounds, shots, saved local persistence, and event logs. The quarter will be set back to <strong>Q1</strong>.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmResetMatch}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-lg shadow-rose-600/30"
              >
                Yes, Reset Stats
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Navigation Header */}
      <header className="no-print bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-amber-500 to-amber-600 p-2 rounded-xl text-slate-950 shadow-md">
              <Activity className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-sm sm:text-base md:text-lg leading-none bg-gradient-to-r from-amber-400 via-orange-300 to-white bg-clip-text text-transparent">
                  POSSESSION & REBOUND TRACKER
                </h1>
                {/* Auto-Saved Persistence Badge */}
                <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold" title={lastSavedTime ? `Last saved at ${lastSavedTime}` : 'Auto-Saved'}>
                  <Save className="w-3 h-3" />
                  <span>Auto-Saved</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Courtside Basketball Stat Tracker</p>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('tracker')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'tracker'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Live</span> Tracker
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'report'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              Report
            </button>
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Team Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* Team Settings Drawer */}
      {showConfig && (
        <div className="no-print bg-slate-900 border-b border-slate-800 p-4 transition-all">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Team A Settings */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <h3 className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: teamA.color }} />
                Team A Configuration
              </h3>
              <div>
                <label className="text-slate-500 block mb-1">Team Name</label>
                <input
                  type="text"
                  value={teamA.name}
                  onChange={(e) => setTeamA({ ...teamA, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-slate-500 block mb-1">Theme Color</label>
                <input
                  type="color"
                  value={teamA.color}
                  onChange={(e) => setTeamA({ ...teamA, color: e.target.value })}
                  className="w-full h-9 bg-slate-900 border border-slate-700 rounded-lg p-1 cursor-pointer"
                />
              </div>
            </div>

            {/* Team B Settings */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <h3 className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: teamB.color }} />
                Team B Configuration
              </h3>
              <div>
                <label className="text-slate-500 block mb-1">Team Name</label>
                <input
                  type="text"
                  value={teamB.name}
                  onChange={(e) => setTeamB({ ...teamB, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-slate-500 block mb-1">Theme Color</label>
                <input
                  type="color"
                  value={teamB.color}
                  onChange={(e) => setTeamB({ ...teamB, color: e.target.value })}
                  className="w-full h-9 bg-slate-900 border border-slate-700 rounded-lg p-1 cursor-pointer"
                />
              </div>
            </div>
          </div>
          <div className="max-w-4xl mx-auto mt-4 text-right">
            <button
              onClick={() => setShowConfig(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition"
            >
              Done Settings
            </button>
          </div>
        </div>
      )}

      {/* Main Content Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-4 flex flex-col gap-5">

        {/* LIVE TRACKER VIEW */}
        {activeTab === 'tracker' && (
          <div className="no-print space-y-5">

            {/* Quarter Control & Quick Global Actions Header */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-xl">
              
              {/* Quarter Selector */}
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">Active Quarter:</span>
                <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                  <button
                    onClick={handlePrevQuarter}
                    disabled={quarter <= 1}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded text-xs font-bold transition"
                  >
                    &lt;
                  </button>
                  <span className="px-2.5 py-0.5 font-extrabold text-amber-400 text-xs sm:text-sm">
                    {quarterLabel(quarter)}
                  </span>
                  <button
                    onClick={handleNextQuarter}
                    className="flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition"
                  >
                    Next
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Action Buttons: Undo & Reset */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleUndo}
                  disabled={events.length === 0}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 font-semibold text-xs transition"
                  title="Undo last recorded stat"
                >
                  <Undo2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Undo</span>
                </button>

                <button
                  onClick={() => setShowResetModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 text-slate-300 text-xs font-bold transition"
                  title="Reset Match Statistics"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                  <span>Reset</span>
                </button>
              </div>

            </div>

            {/* Mobile Tab Switcher with Swipe Gesture Support */}
            <div className="block md:hidden">
              <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 mb-3">
                <button
                  onClick={() => setActiveMobileTeam('A')}
                  className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition flex items-center justify-center gap-2 ${
                    activeMobileTeam === 'A'
                      ? 'bg-slate-800 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: teamA.color }} />
                  {teamA.name}
                </button>
                <button
                  onClick={() => setActiveMobileTeam('B')}
                  className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition flex items-center justify-center gap-2 ${
                    activeMobileTeam === 'B'
                      ? 'bg-slate-800 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: teamB.color }} />
                  {teamB.name}
                </button>
              </div>
              <p className="text-[10px] text-center text-slate-500 font-medium">
                💡 Swipe left or right anywhere below to switch teams
              </p>
            </div>

            {/* Court Dashboard - Responsive Grid / Swipable View */}
            <div 
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="touch-pan-y"
            >
              {/* Desktop View: Grid side-by-side */}
              <div className="hidden md:grid md:grid-cols-2 gap-6">
                {renderTeamCard('A')}
                {renderTeamCard('B')}
              </div>

              {/* Mobile View: Single active team card */}
              <div className="block md:hidden">
                {activeMobileTeam === 'A' ? renderTeamCard('A') : renderTeamCard('B')}
              </div>
            </div>

            {/* Play-By-Play Live Log Feed */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-400" /> Match Event Log ({events.length})
                </h3>
                {events.length > 0 && (
                  <button
                    onClick={() => setShowResetModal(true)}
                    className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
                  >
                    Reset Stats
                  </button>
                )}
              </div>

              {events.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No stats logged yet. Tap Shot, Steal, Turnover, or Rebound buttons above.
                </div>
              ) : (
                <div className="max-h-52 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {events.map((evt) => {
                    const teamObj = evt.team === 'A' ? teamA : teamB;
                    return (
                      <div
                        key={evt.id}
                        className="flex items-center justify-between bg-slate-950/80 border border-slate-800/80 rounded-xl px-3 sm:px-4 py-2 text-xs transition hover:border-slate-700"
                      >
                        <div className="flex items-center gap-2 sm:gap-3">
                          <span className="font-mono text-slate-500 font-bold w-6 sm:w-8">
                            {quarterLabel(evt.quarter)}
                          </span>
                          <span
                            className="px-2 py-0.5 rounded font-bold text-[10px] sm:text-[11px]"
                            style={{ backgroundColor: teamObj.color + '25', color: teamObj.color }}
                          >
                            {teamObj.name}
                          </span>
                          <span className="font-bold text-slate-200">{evt.type}</span>
                          <span className="text-slate-400 text-[10px] sm:text-[11px] hidden sm:inline">{evt.detail}</span>
                        </div>

                        <button
                          onClick={() => handleDeleteEvent(evt.id)}
                          className="text-slate-600 hover:text-rose-400 p-1 transition"
                          title="Delete stat entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* STATS & REPORT VIEW (PRINTABLE BOX SCORE) */}
        {activeTab === 'report' && (
          <div className="space-y-6">

            {/* Print Control Banner */}
            <div className="no-print bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <h2 className="font-extrabold text-base text-white">Match Possession & Rebound Report</h2>
                <p className="text-xs text-slate-400">Quarter breakdowns and printable statistical comparison.</p>
              </div>

              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black rounded-xl text-xs transition shadow-lg shadow-amber-500/20"
              >
                <Printer className="w-4 h-4" />
                Print / Export PDF
              </button>
            </div>

            {/* PRINTABLE BOX SCORE CONTAINER */}
            <div id="print-area" className="printable-report bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-8 text-slate-100">

              {/* Match Header */}
              <div className="border-b border-slate-800 pb-5 flex flex-wrap items-center justify-between gap-4 print:border-slate-300">
                <div>
                  <div className="text-xs font-bold px-2.5 py-1 rounded bg-amber-500/20 text-amber-400 inline-block print:bg-slate-200 print:text-slate-800">
                    BASKETBALL POSSESSION & REBOUND REPORT
                  </div>
                  <h1 className="text-2xl font-black mt-2 tracking-tight text-white print:text-black">
                    {teamA.name} <span className="text-slate-500 font-normal">vs</span> {teamB.name}
                  </h1>
                </div>

                <div className="text-right text-xs text-slate-400 print:text-slate-600">
                  <div>Date: <strong>{new Date().toLocaleDateString()}</strong></div>
                  <div>Status: <strong>Match Summary</strong></div>
                </div>
              </div>

              {/* Stat Comparison Metric Bars */}
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-4 print:text-slate-700">
                  Head-To-Head Stat Comparison
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Shots Made (FGM)', a: stats.A.fgm, b: stats.B.fgm },
                    { label: 'Shots Missed (FGA)', a: stats.A.fga, b: stats.B.fga },
                    { label: 'Steals', a: stats.A.stl, b: stats.B.stl },
                    { label: 'Turnovers', a: stats.A.to, b: stats.B.to },
                    { label: 'Offensive Rebounds (OREB)', a: stats.A.oreb, b: stats.B.oreb },
                    { label: 'Defensive Rebounds (DREB)', a: stats.A.dreb, b: stats.B.dreb },
                    { label: 'Total Rebounds (TREB)', a: stats.A.treb, b: stats.B.treb },
                    { label: 'Estimated OREB %', a: orebPctA, b: orebPctB, isPct: true },
                  ].map((stat, i) => {
                    const total = stat.isPct ? 100 : (stat.a + stat.b || 1);
                    const pctA = stat.isPct ? stat.a : Math.round((stat.a / total) * 100);
                    const pctB = stat.isPct ? stat.b : Math.round((stat.b / total) * 100);

                    return (
                      <div key={i} className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl print:bg-slate-50 print:border-slate-300">
                        <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                          <span style={{ color: teamA.color }}>{stat.a}{stat.isPct ? '%' : ''}</span>
                          <span className="text-slate-300 print:text-slate-800">{stat.label}</span>
                          <span style={{ color: teamB.color }}>{stat.b}{stat.isPct ? '%' : ''}</span>
                        </div>
                        {/* Visual Progress Bar */}
                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex print:bg-slate-200">
                          <div style={{ width: `${pctA}%`, backgroundColor: teamA.color }} className="h-full transition-all" />
                          <div style={{ width: `${pctB}%`, backgroundColor: teamB.color }} className="h-full transition-all" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quarter-By-Quarter Stat Table Matrix */}
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-4 print:text-slate-700">
                  Quarterly Stat Matrix
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 print:border-slate-300 print:text-slate-700">
                        <th className="py-2.5 px-3 font-bold">Team</th>
                        <th className="py-2.5 px-3 font-bold">Stat</th>
                        <th className="py-2.5 px-3 text-center">Q1</th>
                        <th className="py-2.5 px-3 text-center">Q2</th>
                        <th className="py-2.5 px-3 text-center">Q3</th>
                        <th className="py-2.5 px-3 text-center">Q4</th>
                        {quarter > 4 && <th className="py-2.5 px-3 text-center">OT</th>}
                        <th className="py-2.5 px-3 text-center font-bold text-amber-400 print:text-black">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 print:divide-slate-200">
                      
                      {/* Team A Rows */}
                      <tr className="bg-slate-950/30 print:bg-slate-50">
                        <td rowSpan={6} className="py-3 px-3 font-extrabold border-r border-slate-800 print:border-slate-300">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: teamA.color }} />
                            {teamA.name}
                          </div>
                        </td>
                        <td className="py-2 px-3 font-medium text-emerald-400 print:text-slate-800">Shots Made (FGM)</td>
                        {[1, 2, 3, 4].map(q => <td key={q} className="py-2 px-3 text-center">{stats.A.byQuarter[q]?.fgm || 0}</td>)}
                        {quarter > 4 && <td className="py-2 px-3 text-center">{stats.A.byQuarter[quarter]?.fgm || 0}</td>}
                        <td className="py-2 px-3 text-center font-bold text-white print:text-black">{stats.A.fgm}</td>
                      </tr>
                      <tr className="bg-slate-950/30 print:bg-slate-50">
                        <td className="py-2 px-3 font-medium text-rose-400 print:text-slate-800">Shots Missed (FGA)</td>
                        {[1, 2, 3, 4].map(q => <td key={q} className="py-2 px-3 text-center">{stats.A.byQuarter[q]?.fga || 0}</td>)}
                        {quarter > 4 && <td className="py-2 px-3 text-center">{stats.A.byQuarter[quarter]?.fga || 0}</td>}
                        <td className="py-2 px-3 text-center font-bold text-white print:text-black">{stats.A.fga}</td>
                      </tr>
                      <tr className="bg-slate-950/30 print:bg-slate-50">
                        <td className="py-2 px-3 font-medium text-amber-400 print:text-slate-800">Steals (STL)</td>
                        {[1, 2, 3, 4].map(q => <td key={q} className="py-2 px-3 text-center">{stats.A.byQuarter[q]?.stl || 0}</td>)}
                        {quarter > 4 && <td className="py-2 px-3 text-center">{stats.A.byQuarter[quarter]?.stl || 0}</td>}
                        <td className="py-2 px-3 text-center font-bold text-white print:text-black">{stats.A.stl}</td>
                      </tr>
                      <tr className="bg-slate-950/30 print:bg-slate-50">
                        <td className="py-2 px-3 font-medium text-slate-400 print:text-slate-800">Turnovers (TO)</td>
                        {[1, 2, 3, 4].map(q => <td key={q} className="py-2 px-3 text-center">{stats.A.byQuarter[q]?.to || 0}</td>)}
                        {quarter > 4 && <td className="py-2 px-3 text-center">{stats.A.byQuarter[quarter]?.to || 0}</td>}
                        <td className="py-2 px-3 text-center font-bold text-white print:text-black">{stats.A.to}</td>
                      </tr>
                      <tr className="bg-slate-950/30 print:bg-slate-50">
                        <td className="py-2 px-3 font-medium text-amber-300 print:text-slate-800">Offensive Reb (OREB)</td>
                        {[1, 2, 3, 4].map(q => <td key={q} className="py-2 px-3 text-center">{stats.A.byQuarter[q]?.oreb || 0}</td>)}
                        {quarter > 4 && <td className="py-2 px-3 text-center">{stats.A.byQuarter[quarter]?.oreb || 0}</td>}
                        <td className="py-2 px-3 text-center font-bold text-white print:text-black">{stats.A.oreb}</td>
                      </tr>
                      <tr className="bg-slate-950/30 border-b-2 border-slate-800 print:bg-slate-50 print:border-slate-300">
                        <td className="py-2 px-3 font-medium text-blue-400 print:text-slate-800">Defensive Reb (DREB)</td>
                        {[1, 2, 3, 4].map(q => <td key={q} className="py-2 px-3 text-center">{stats.A.byQuarter[q]?.dreb || 0}</td>)}
                        {quarter > 4 && <td className="py-2 px-3 text-center">{stats.A.byQuarter[quarter]?.dreb || 0}</td>}
                        <td className="py-2 px-3 text-center font-bold text-white print:text-black">{stats.A.dreb}</td>
                      </tr>

                      {/* Team B Rows */}
                      <tr>
                        <td rowSpan={6} className="py-3 px-3 font-extrabold border-r border-slate-800 print:border-slate-300">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: teamB.color }} />
                            {teamB.name}
                          </div>
                        </td>
                        <td className="py-2 px-3 font-medium text-emerald-400 print:text-slate-800">Shots Made (FGM)</td>
                        {[1, 2, 3, 4].map(q => <td key={q} className="py-2 px-3 text-center">{stats.B.byQuarter[q]?.fgm || 0}</td>)}
                        {quarter > 4 && <td className="py-2 px-3 text-center">{stats.B.byQuarter[quarter]?.fgm || 0}</td>}
                        <td className="py-2 px-3 text-center font-bold text-white print:text-black">{stats.B.fgm}</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-medium text-rose-400 print:text-slate-800">Shots Missed (FGA)</td>
                        {[1, 2, 3, 4].map(q => <td key={q} className="py-2 px-3 text-center">{stats.B.byQuarter[q]?.fga || 0}</td>)}
                        {quarter > 4 && <td className="py-2 px-3 text-center">{stats.B.byQuarter[quarter]?.fga || 0}</td>}
                        <td className="py-2 px-3 text-center font-bold text-white print:text-black">{stats.B.fga}</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-medium text-amber-400 print:text-slate-800">Steals (STL)</td>
                        {[1, 2, 3, 4].map(q => <td key={q} className="py-2 px-3 text-center">{stats.B.byQuarter[q]?.stl || 0}</td>)}
                        {quarter > 4 && <td className="py-2 px-3 text-center">{stats.B.byQuarter[quarter]?.stl || 0}</td>}
                        <td className="py-2 px-3 text-center font-bold text-white print:text-black">{stats.B.stl}</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-medium text-slate-400 print:text-slate-800">Turnovers (TO)</td>
                        {[1, 2, 3, 4].map(q => <td key={q} className="py-2 px-3 text-center">{stats.B.byQuarter[q]?.to || 0}</td>)}
                        {quarter > 4 && <td className="py-2 px-3 text-center">{stats.B.byQuarter[quarter]?.to || 0}</td>}
                        <td className="py-2 px-3 text-center font-bold text-white print:text-black">{stats.B.to}</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-medium text-amber-300 print:text-slate-800">Offensive Reb (OREB)</td>
                        {[1, 2, 3, 4].map(q => <td key={q} className="py-2 px-3 text-center">{stats.B.byQuarter[q]?.oreb || 0}</td>)}
                        {quarter > 4 && <td className="py-2 px-3 text-center">{stats.B.byQuarter[quarter]?.oreb || 0}</td>}
                        <td className="py-2 px-3 text-center font-bold text-white print:text-black">{stats.B.oreb}</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-medium text-blue-400 print:text-slate-800">Defensive Reb (DREB)</td>
                        {[1, 2, 3, 4].map(q => <td key={q} className="py-2 px-3 text-center">{stats.B.byQuarter[q]?.dreb || 0}</td>)}
                        {quarter > 4 && <td className="py-2 px-3 text-center">{stats.B.byQuarter[quarter]?.dreb || 0}</td>}
                        <td className="py-2 px-3 text-center font-bold text-white print:text-black">{stats.B.dreb}</td>
                      </tr>

                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="no-print bg-slate-900 border-t border-slate-800 py-4 text-center text-xs text-slate-500 mt-auto">
        Basketball Match Tracker &bull; Possession & Rebounds Stat Tracker
      </footer>

      {/* Global CSS Print & Scrollbar Styles */}
      <style>{`
        @media print {
          /* Hide all UI elements marked as no-print */
          .no-print, header, footer, button, nav {
            display: none !important;
          }
          
          /* Enforce full page visibility and clean light theme for print output */
          body, main {
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .printable-report {
            display: block !important;
            background-color: #ffffff !important;
            color: #000000 !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }

          /* Ensure high contrast tables in PDF print */
          table, th, td {
            color: #000000 !important;
            border-color: #d1d5db !important;
          }
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.6);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(51, 65, 85, 0.8);
          border-radius: 4px;
        }
      `}</style>

    </div>
  );
}