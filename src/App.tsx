import React, { useState, useEffect } from "react";
import { 
  BookOpen, Calendar, Target, Award, ArrowRight, RefreshCw, CheckCircle2, 
  AlertCircle, Sparkles, Smile, History, Layers, BarChart3, HelpCircle, 
  Settings, Flame, Compass, ChevronRight, User, GraduationCap, FileText, Check,
  ExternalLink, Globe
} from "lucide-react";
import { PersonalizedStudyPlan, PracticeSession, IELTSModule } from "./types";
import SkillsPractice from "./components/SkillsPractice";
import Flashcards from "./components/Flashcards";
import { PracticeTrendsChart } from "./components/PracticeTrendsChart";
import QuickNotes from "./components/QuickNotes";
import Achievements from "./components/Achievements";

export default function App() {
  const [activeModule, setActiveModule] = useState<IELTSModule | null>(null);
  const [studyPlan, setStudyPlan] = useState<PersonalizedStudyPlan | null>(null);
  const [practiceLogs, setPracticeLogs] = useState<PracticeSession[]>([]);
  const [viewTab, setViewTab] = useState<"dashboard" | "practice" | "history" | "flashcards">("dashboard");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [streakDays, setStreakDays] = useState<number>(() => {
    const saved = localStorage.getItem("ielts_study_streak");
    return saved ? parseInt(saved) : 14;
  });

  // Onboarding parameters if plan doesn't exist
  const [examType, setExamType] = useState<"Academic" | "General Training">("Academic");
  const [targetBand, setTargetBand] = useState<number>(7.5);
  const [daysRemaining, setDaysRemaining] = useState<number>(30);
  const [weaknesses, setWeaknesses] = useState<string>("");
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [errorPlan, setErrorPlan] = useState<string | null>(null);

  useEffect(() => {
    loadLocalData();
  }, []);

  const loadLocalData = () => {
    // 0. Fetch profile photo
    const savedPhoto = localStorage.getItem("ielts_profile_photo");
    if (savedPhoto) {
      setProfilePhoto(savedPhoto);
    }

    // 1. Fetch study plan
    const savedPlan = localStorage.getItem("ielts_study_plan");
    if (savedPlan) {
      try {
        setStudyPlan(JSON.parse(savedPlan));
      } catch (e) {
        console.error("Error parsing local study plan:", e);
      }
    }

    // 2. Fetch practice history logs
    const savedLogs = localStorage.getItem("ielts_practice_sessions");
    if (savedLogs) {
      try {
        setPracticeLogs(JSON.parse(savedLogs));
      } catch (e) {
        console.error("Error parsing practice logs:", e);
      }
    } else {
      // Seed initial dummy diagnostic stats to elevate preview fidelity
      const initialLogs: PracticeSession[] = [
        {
          id: "init_1",
          module: "Reading",
          title: "Academic Passage: Ecosystem Preservation",
          timestamp: "Yesterday, 3:45 PM",
          metrics: { score: "4/5", band: 8.0 },
          feedbackMarkdown: "Exceptional performance in skim-reading headings and matching target phrases."
        },
        {
          id: "init_2",
          module: "Listening",
          title: "Context Lecture: Nanomaterials",
          timestamp: "2 days ago",
          metrics: { score: "3/5", band: 6.5 },
          feedbackMarkdown: "Identified standard academic arguments. Missed final distraction word 'subsequent'."
        }
      ];
      localStorage.setItem("ielts_practice_sessions", JSON.stringify(initialLogs));
      setPracticeLogs(initialLogs);
    }

    // 3. Sync study streak state
    const savedStreak = localStorage.getItem("ielts_study_streak");
    if (savedStreak) {
      setStreakDays(parseInt(savedStreak));
    } else {
      localStorage.setItem("ielts_study_streak", "14");
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfilePhoto(base64String);
        localStorage.setItem("ielts_profile_photo", base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingPlan(true);
    setErrorPlan(null);

    try {
      const response = await fetch("/api/gemini/study-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examType, targetBand, daysRemaining, weaknesses }),
      });

      if (!response.ok) {
        throw new Error("Failed to receive structured program timeline from examiner api.");
      }

      const data = await response.json();
      setStudyPlan(data);
      localStorage.setItem("ielts_study_plan", JSON.stringify(data));
    } catch (err: any) {
      setErrorPlan(err.message || "Failed to organize plan. Ensure backend has verified credentials.");
    } finally {
      setLoadingPlan(false);
    }
  };

  const calculateOverallAverageBand = () => {
    if (practiceLogs.length === 0) return 6.0;
    const total = practiceLogs.reduce((acc, log) => acc + (log.metrics.band || 6.0), 0);
    return Math.round((total / practiceLogs.length) * 10) / 10;
  };

  const handleToggleTask = (day: number) => {
    if (!studyPlan) return;
    const updatedTasks = studyPlan.dailyTasks.map((t) => {
      if (t.day === day) {
        return { ...t, completed: !t.completed };
      }
      return t;
    });

    const updatedPlan = { ...studyPlan, dailyTasks: updatedTasks };
    setStudyPlan(updatedPlan);
    localStorage.setItem("ielts_study_plan", JSON.stringify(updatedPlan));
  };

  const handleResetPlan = () => {
    if (window.confirm("Do you want to reset your IELTS targets and create another dynamic path?")) {
      localStorage.removeItem("ielts_study_plan");
      setStudyPlan(null);
    }
  };

  const handleResetAllLogs = () => {
    if (window.confirm("Clear all historic IELTS evaluations and telemetry logs?")) {
      localStorage.removeItem("ielts_practice_sessions");
      localStorage.removeItem("ielts_study_streak");
      setPracticeLogs([]);
      setStreakDays(0);
    }
  };

  // Extract next/current topic recommendation from program
  const getNextRecommendedTopic = () => {
    if (!studyPlan) return { topic: "IELTS Core Academic Essay Construction", module: "Writing" as IELTSModule, duration: "25 min" };
    const incomplete = studyPlan.dailyTasks.find(t => !t.completed);
    if (incomplete) {
      return { topic: incomplete.topic, module: incomplete.focusModule, duration: incomplete.duration };
    }
    return { topic: "Completed study tasks! Maintain level with practice", module: "Speaking" as IELTSModule, duration: "15 min" };
  };

  const activeFocus = getNextRecommendedTopic();

  // Color classes map for standard bento modules
  const moduleBadgeColors: Record<IELTSModule, { bg: string, text: string, iconBg: string }> = {
    Listening: { bg: "bg-sky-50 border-sky-100", text: "text-sky-700", iconBg: "bg-sky-100 text-sky-600" },
    Reading: { bg: "bg-emerald-50 border-emerald-100", text: "text-emerald-700", iconBg: "bg-emerald-100 text-emerald-600" },
    Speaking: { bg: "bg-amber-50 border-amber-100", text: "text-amber-700", iconBg: "bg-amber-100 text-amber-650" },
    Writing: { bg: "bg-purple-50 border-purple-100", text: "text-purple-700", iconBg: "bg-purple-100 text-purple-600" }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-indigo-50/80 via-pink-50/40 via-amber-50/50 to-emerald-50/75 text-slate-900 font-sans flex flex-col antialiased">
      
      {/* GLOBAL HIGH-CONTRAST BENTO HEADER */}
      <header className="h-16 flex items-center justify-between px-6 bg-white/95 backdrop-blur-md border-b border-indigo-100 sticky top-0 z-20 shrink-0 shadow-sm shadow-indigo-100/20">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => { setActiveModule(null); setViewTab("dashboard"); }}
            className="w-10 h-10 bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 rounded-xl flex items-center justify-center text-white font-extrabold text-xl font-mono shadow-md shadow-indigo-200/30 transition-transform active:scale-95 cursor-pointer"
          >
            I
          </button>
          <div>
            <span className="text-md font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-900 via-purple-800 to-indigo-950 block leading-tight">IELTS Prep AI</span>
            <span className="text-[10px] text-pink-650 font-bold uppercase tracking-wider block flex items-center gap-1.5">Interactive Mastery Suite <span className="text-emerald-600 bg-emerald-50 px-1 py-0.25 rounded text-[7px] font-black tracking-normal border border-emerald-200/50 normal-case">100% FREE NO-PAYWALL AI</span></span>
          </div>
        </div>

        {/* Dynamic header tabs */}
        <nav className="hidden md:flex items-center space-x-1.5 bg-slate-100/85 p-1.5 rounded-xl border border-indigo-50 text-xs font-semibold">
          <button
            id="tab-dashboard"
            onClick={() => { setActiveModule(null); setViewTab("dashboard"); }}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              viewTab === "dashboard" && !activeModule
                ? "bg-white text-indigo-700 shadow-sm border border-slate-200/55"
                : "text-slate-600 hover:text-slate-950 hover:bg-white/40"
            }`}
          >
            Bento Dashboard
          </button>
          <button
            id="tab-practice"
            onClick={() => { setViewTab("practice"); if (!activeModule) setActiveModule("Reading"); }}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeModule || viewTab === "practice"
                ? "bg-white text-indigo-700 shadow-sm border border-slate-200/55"
                : "text-slate-600 hover:text-slate-950 hover:bg-white/40"
            }`}
          >
            Practice Arenas
          </button>
          <button
            id="tab-flashcards"
            onClick={() => { setActiveModule(null); setViewTab("flashcards"); }}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              viewTab === "flashcards" && !activeModule
                ? "bg-white text-indigo-700 shadow-sm border border-slate-200/55"
                : "text-slate-600 hover:text-slate-950 hover:bg-white/40"
            }`}
          >
            Vocab Flashcards
          </button>
          <button
            id="tab-history"
            onClick={() => { setActiveModule(null); setViewTab("history"); }}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              viewTab === "history"
                ? "bg-white text-indigo-700 shadow-sm border border-slate-200/55"
                : "text-slate-600 hover:text-slate-950 hover:bg-white/40"
            }`}
          >
            Evaluations Logs ({practiceLogs.length})
          </button>
        </nav>

        {/* British Council Booking Quick Link */}
        <a 
          href="https://takeielts.britishcouncil.org" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-indigo-900 rounded-xl text-xs font-bold transition-all border border-blue-200 hover:border-indigo-400 shadow-sm"
        >
          <Globe className="w-3.5 h-3.5 text-indigo-600" />
          <span>British Council official</span>
          <ExternalLink className="w-2.5 h-2.5 text-indigo-400" />
        </a>

        {/* Profile Card */}
        <div className="flex items-center space-x-3 border-l border-slate-100 pl-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-800 leading-tight">Mourad Bejaoui</p>
            <p className="text-[10px] text-pink-600 font-bold truncate max-w-[140px] leading-tight mb-0.5">capital.mourad@gmail.com</p>
            
            {/* explicit upload photo link */}
            <label 
              htmlFor="profile-photo-upload-direct" 
              className="text-[10px] text-indigo-600 hover:text-indigo-800 hover:underline font-black cursor-pointer inline-flex items-center gap-1 transition-colors select-none"
            >
              <span>Upload Photo</span>
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </label>
            <input 
              id="profile-photo-upload-direct" 
              type="file" 
              accept="image/*" 
              onChange={handlePhotoUpload} 
              className="hidden" 
            />
          </div>

          <div className="relative group/avatar">
            <label htmlFor="profile-photo-upload-avatar" className="cursor-pointer block relative">
              {profilePhoto ? (
                <img 
                  src={profilePhoto} 
                  alt="Mourad Bejaoui Profile" 
                  className="w-10 h-10 rounded-xl object-cover border border-indigo-200 shadow-xs transition-all group-hover/avatar:brightness-90"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl flex items-center justify-center font-extrabold text-[#4f46e5] text-sm transition-all group-hover/avatar:bg-indigo-100">
                  MB
                </div>
              )}
              {/* Plus indicator on hover */}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-indigo-650 text-white rounded-full flex items-center justify-center border border-white shadow-xs group-hover/avatar:scale-110 transition-all">
                <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </label>
            <input 
              id="profile-photo-upload-avatar" 
              type="file" 
              accept="image/*" 
              onChange={handlePhotoUpload} 
              className="hidden" 
            />
          </div>
        </div>
      </header>

      {/* CORE WORKSPACE PORTALS */}
      <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto" id="applet-viewport">
        
        {/* INTERACTIVE TRAINING ARENA OVERLAY (IF SELECTED) */}
        {activeModule ? (
          <SkillsPractice 
            module={activeModule} 
            onBackToDashboard={() => { setActiveModule(null); setViewTab("dashboard"); }}
            onSessionSaved={loadLocalData}
          />
        ) : (
          <>
            {/* TABVIEW: LEXICAL CORE FLASHCARDS ARENA */}
            {viewTab === "flashcards" && (
              <Flashcards />
            )}

            {/* TABVIEW: EVALUATIONS HISTORY LOG */}
            {viewTab === "history" && (
              <div className="space-y-6 max-w-4xl mx-auto py-4" id="view-evaluations-logs">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <div>
                    <h2 className="text-xl font-bold text-slate-950">Expert Telemetry Evaluations Logs</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Every AI graded mock session is compiled securely to track lexical growth.</p>
                  </div>
                  <button
                    onClick={handleResetAllLogs}
                    className="text-xs font-semibold px-3 py-1.5 border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all cursor-pointer"
                  >
                    Reset Logs
                  </button>
                </div>

                {practiceLogs.length === 0 ? (
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3">
                    <History className="w-10 h-10 text-slate-450 mx-auto animate-pulse" />
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">No Mock Practice Logs Found</h3>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                        Your interactive grading sheets will be cataloged instantly when you complete writing essays, reading drills, or speaking cues.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {practiceLogs.map((log) => (
                      <div key={log.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded border ${
                                moduleBadgeColors[log.module]?.bg || "bg-slate-50"
                              } ${moduleBadgeColors[log.module]?.text || "text-slate-700"}`}>
                                {log.module}
                              </span>
                              <span className="text-[10px] text-slate-400 font-semibold">{log.timestamp}</span>
                            </div>
                            <h3 className="font-bold text-slate-800 text-sm">{log.title}</h3>
                          </div>
                          <div className="bg-slate-100 px-3 py-1.5 rounded-xl text-center">
                            <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Estimated Band</span>
                            <span className="text-lg font-black text-slate-800">{log.metrics.band ? `Band ${log.metrics.band.toFixed(1)}` : log.metrics.score}</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed font-serif pl-1 whitespace-pre-line">{log.feedbackMarkdown}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TABVIEW: PRIMARY BENTO DASHBOARD PORTAL */}
            {viewTab === "dashboard" && (
              <>
                {!studyPlan ? (
                  /* DIAGNOSTIC ONBOARDING FLOW MAPS IF NO PLAN */
                  <div id="onboarding-flow-container" className="max-w-2xl mx-auto py-8 relative">
                    {/* Glowing decorative color anchors */}
                    <div className="absolute top-0 right-1/4 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="text-center mb-8 space-y-2 relative z-10">
                      <span className="px-3.5 py-1.5 bg-gradient-to-r from-pink-100 to-indigo-100 border border-pink-200 text-pink-700 text-xs font-black uppercase tracking-widest rounded-full shadow-sm">
                        ⚡ AI Custom Onboarding
                      </span>
                      <h1 className="text-3xl font-black tracking-tight text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-indigo-900 via-purple-800 to-indigo-950">
                        Tailor Your IELTS Study Path
                      </h1>
                      <p className="text-xs text-indigo-900/80 font-bold max-w-sm mx-auto">
                        State your standard focus details to receive immediate daily preparation tasks backed by examiners syllabus.
                      </p>
                    </div>

                    <div className="bg-white/80 backdrop-blur-md border-2 border-indigo-150 rounded-3xl shadow-xl shadow-indigo-100/40 p-6 md:p-8 relative z-10">
                      <form onSubmit={handleGeneratePlan} className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Syllabus Target Stream */}
                          <div className="col-span-1 space-y-1.5">
                            <label className="block text-xs font-black text-indigo-950 uppercase tracking-wider">Assessment Stream</label>
                            <div className="flex w-full border-2 border-indigo-100 p-1 bg-indigo-50/50 rounded-xl">
                              <button
                                type="button"
                                onClick={() => setExamType("Academic")}
                                className={`flex-1 py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                                  examType === "Academic"
                                    ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md"
                                    : "text-indigo-900/60 hover:text-indigo-950"
                                }`}
                              >
                                Academic
                              </button>
                              <button
                                type="button"
                                onClick={() => setExamType("General Training")}
                                className={`flex-1 py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                                  examType === "General Training"
                                    ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md"
                                    : "text-indigo-900/60 hover:text-indigo-950"
                                }`}
                              >
                                General Training
                              </button>
                            </div>
                          </div>

                          {/* Target Band score */}
                          <div className="space-y-1.5">
                            <label htmlFor="select-app-target-band" className="block text-xs font-black text-indigo-950 uppercase tracking-wider">Target band</label>
                            <select
                              id="select-app-target-band"
                              value={targetBand}
                              onChange={(e) => setTargetBand(parseFloat(e.target.value))}
                              className="w-full h-10 rounded-xl border-2 border-indigo-100 bg-indigo-50/20 px-3 text-xs font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none focus:border-indigo-400"
                            >
                              {[6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0].map((b) => (
                                <option key={b} value={b} className="font-bold">Band {b.toFixed(1)}</option>
                              ))}
                            </select>
                          </div>

                          {/* Remaining duration */}
                          <div className="space-y-1.5">
                            <label htmlFor="input-app-days" className="block text-xs font-black text-indigo-950 uppercase tracking-wider">Days remaining</label>
                            <input
                              id="input-app-days"
                              type="number"
                              min="3"
                              max="180"
                              value={daysRemaining}
                              onChange={(e) => setDaysRemaining(parseInt(e.target.value) || 14)}
                              className="w-full h-10 rounded-xl border-2 border-indigo-100 bg-indigo-50/20 px-3 text-xs font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none focus:border-indigo-400"
                            />
                          </div>

                          {/* Difficulties */}
                          <div className="space-y-1.5 sm:col-span-2">
                            <label htmlFor="textarea-app-weaknesses" className="block text-xs font-black text-indigo-950 uppercase tracking-wider">Key Weakness Areas (Optional)</label>
                            <textarea
                              id="textarea-app-weaknesses"
                              rows={2}
                              value={weaknesses}
                              onChange={(e) => setWeaknesses(e.target.value)}
                              placeholder="e.g., Struggling to build academic cohesive arguments, spelling speed in Listening..."
                              className="w-full rounded-xl border-2 border-indigo-100 bg-indigo-50/20 p-3 text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none focus:border-indigo-400 font-medium"
                            />
                          </div>
                        </div>

                        {errorPlan && (
                          <div className="p-3 bg-rose-50 border border-rose-100 text-rose-850 rounded-xl text-xs font-semibold flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-rose-600" />
                            <span>{errorPlan}</span>
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={loadingPlan}
                          className="w-full h-11 bg-gradient-to-r from-pink-500 via-purple-650 to-indigo-600 hover:opacity-95 text-white font-black text-xs rounded-xl shadow-lg shadow-purple-200 transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          {loadingPlan ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Customizing standard plan timeline...
                            </>
                          ) : (
                            "Build Personal Study Regimen"
                          )}
                        </button>
                      </form>
                    </div>

                    {/* OFFICIAL BOOKING GUIDE */}
                    <div className="mt-5 bg-gradient-to-r from-blue-100/60 to-purple-50 border border-indigo-200 rounded-2xl p-5 flex items-start gap-4 shadow-md shadow-indigo-100/10" id="onboarding-bc-card">
                      <span className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-blue-600 text-white border border-indigo-400 rounded-xl flex items-center justify-center font-black text-xs select-none shrink-0 font-mono shadow-md">
                        BC
                      </span>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wide">Take IELTS with British Council</h4>
                          <span className="px-2 py-0.25 bg-emerald-500 text-emerald-950 text-[9px] uppercase font-black tracking-wider rounded border border-emerald-400 shadow-sm">
                            OFFICIAL EXAM REGISTRATION
                          </span>
                        </div>
                        <p className="text-xs text-indigo-950 leading-relaxed font-serif">
                          Secure your preferred test center, choose test dates, and gain unlockable free resources by registering officially with the British Council. This prep suite aligns fully with their rigorous evaluation rubrics.
                        </p>
                        <div className="pt-2">
                          <a 
                            href="https://takeielts.britishcouncil.org" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-xs text-indigo-700 font-extrabold hover:underline inline-flex items-center gap-1 group"
                          >
                            Book your official exam
                            <ExternalLink className="w-3 h-3 text-indigo-500 transition-transform group-hover:translate-x-0.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  
                  /* ============ BENTO THEMED LAYOUT SYSTEM ============ */
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" id="bento-grid-dashboard">
                    
                    {/* BENTO_CARD 1: DAILY STREAK STATUS (col-span-3, row-span-2) */}
                    <div className="lg:col-span-3 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-orange-200/80 rounded-2xl p-5 shadow-sm shadow-orange-100/10 transition-all duration-300 flex flex-col justify-between hover:border-orange-350 hover:shadow-md hover:scale-[1.01] bg-white">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-xs font-black uppercase tracking-wider text-orange-850">Streak Engine</h3>
                          <span className="text-orange-600 font-extrabold text-xs flex items-center gap-1 bg-gradient-to-r from-orange-100 to-amber-100 px-3 py-1 rounded-full border border-orange-200 shadow-sm animate-pulse">
                            🔥 {streakDays} {streakDays === 1 ? "DAY" : "DAYS"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed font-serif">
                          Consistent practice is standard protocol for high coherence! Complete speaking or listening exercises today to safeguard milestones.
                        </p>
                      </div>

                      <div className="space-y-3 mt-4">
                        <div className="space-y-1.5 border-t border-orange-100/60 pt-3">
                          <div className="flex justify-between text-[10px] font-black text-orange-800 uppercase tracking-widest">
                            <span>DAILY EFFORT GOAL</span>
                            <span>{streakDays >= 7 ? "100%" : "75%"} Met</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-orange-100 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full" style={{ width: streakDays >= 7 ? "100%" : "75%" }}></div>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            const newStreak = streakDays + 1;
                            setStreakDays(newStreak);
                            localStorage.setItem("ielts_study_streak", newStreak.toString());
                          }}
                          className="w-full py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:brightness-105 text-white text-[9px] font-black uppercase tracking-widest rounded-xl cursor-pointer shadow-sm transition-all text-center flex items-center justify-center gap-1.5"
                          id="streak-check-in-btn"
                        >
                          ⚡ Check-in Practice (+1 Streak)
                        </button>
                      </div>
                    </div>

                    {/* BENTO_CARD 2: MAIN LARGE HERO ACT FOCUS (col-span-6, row-span-4) */}
                    <div className="lg:col-span-6 bg-gradient-to-br from-indigo-900 via-purple-900 to-[#1e133c] text-white rounded-2xl p-6 shadow-xl shadow-indigo-950/20 overflow-hidden flex flex-col justify-between relative min-h-[340px] border border-indigo-500/30">
                      {/* Colorful multiple dynamic backdrops */}
                      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-pink-500 to-rose-400 opacity-20 rounded-full blur-3xl -translate-y-12 translate-x-12 pointer-events-none"></div>
                      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-br from-sky-400 to-indigo-500 opacity-20 rounded-full blur-3xl translate-y-20 -translate-x-12 pointer-events-none"></div>

                      <div className="relative z-10 space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="px-3 py-1 bg-gradient-to-r from-pink-500/10 to-[#ec4899]/20 border border-pink-400/40 rounded-full text-[10px] uppercase font-mono font-bold text-pink-300 tracking-wider">
                            ✨ Recommended Daily Priority
                          </span>
                          <span className="text-[10px] text-indigo-200 font-mono bg-indigo-950/50 px-2 py-0.5 rounded-md border border-indigo-800/80">DUR: {activeFocus.duration}</span>
                        </div>
                        
                        <div className="space-y-2">
                          <span className="text-xs uppercase font-extrabold tracking-widest text-[#34d399] font-mono block">
                            🛰️ {activeFocus.module} STREAM FORWARD
                          </span>
                          <h2 className="text-2xl font-black tracking-tight leading-tight max-w-lg bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-pink-100">
                            {activeFocus.topic}
                          </h2>
                          <p className="text-xs text-indigo-200 font-serif max-w-md leading-relaxed opacity-95">
                            Practice structured IELTS elements corresponding precisely to targets. Complete real-time grading with immediate examiners advice.
                          </p>
                        </div>
                      </div>

                      <div className="relative z-10 mt-8 flex flex-wrap gap-2.5">
                        <button
                          id="bento-btn-start-priority"
                          onClick={() => setActiveModule(activeFocus.module)}
                          className="px-6 py-2.5 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-500/20 cursor-pointer flex items-center gap-1.5 transition-transform duration-100 active:scale-95"
                        >
                          Launch Focused Session
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setViewTab("practice")}
                          className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl border border-white/25 cursor-pointer transition-colors"
                        >
                          View Skills Directory
                        </button>
                      </div>
                    </div>

                    {/* BENTO_CARD 3: REAL-TIME AI DIAGNOSTIC PANEL (col-span-3, row-span-4) */}
                    <div className="lg:col-span-3 bg-gradient-to-br from-pink-50/70 via-[#fdf4ff] to-purple-50/70 border border-pink-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between shadow-pink-100/10 hover:border-pink-350 transition-all duration-300">
                      <div className="space-y-4">
                        <div className="flex items-center gap-1.5 border-b border-pink-100 pb-2">
                          <Sparkles className="w-4 h-4 text-pink-600 animate-bounce" />
                          <h3 className="text-xs font-black text-pink-900 uppercase tracking-widest">
                            AI Feedback Assistant
                          </h3>
                        </div>

                        <div className="space-y-3.5">
                          <div className="bg-white/90 p-3.5 border border-pink-100 shadow-sm rounded-xl space-y-1 hover:scale-[1.02] transition-transform">
                            <span className="text-[9px] uppercase font-extrabold text-[#ec4899] bg-pink-50 px-1.5 py-0.5 rounded">LEXICAL PREFERENCE TIP</span>
                            <p className="text-xs text-slate-700 leading-relaxed font-serif">
                              Replace simple temporal terms like "after" with <strong>"subsequent to"</strong> or <strong>"consequently"</strong> to score Band 8.0 Coherence.
                            </p>
                          </div>

                          <div className="bg-white/90 p-3.5 border border-purple-100 shadow-sm rounded-xl space-y-1 hover:scale-[1.02] transition-transform">
                            <span className="text-[9px] uppercase font-extrabold text-[#8b5cf6] bg-purple-50 px-1.5 py-0.5 rounded">CORE SPEAKING LEVEL</span>
                            <p className="text-xs text-slate-700 leading-relaxed font-serif">
                              In Speaking Part 2, focus on lexical pacing. Your pronunciation clarity metrics increased this week.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 mt-4 border-t border-pink-100 text-[10px] text-pink-700 font-extrabold text-center uppercase tracking-wider">
                        ⚡ Personal Study Regimen Refined
                      </div>
                    </div>

                    {/* BENTO_CARD 4: CURRENT ESTIMATED PERFORMANCE (col-span-3, row-span-2) */}
                    <div className="lg:col-span-3 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-200/80 rounded-2xl p-5 shadow-sm transition-all duration-300 flex flex-col justify-between hover:border-emerald-350 hover:scale-[1.01] bg-white">
                      <div>
                        <h3 className="text-[11px] font-black uppercase text-emerald-800 tracking-wider mb-2">Syllabus Progress</h3>
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">{calculateOverallAverageBand().toFixed(1)}</span>
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">↑ 0.5 Band</span>
                        </div>
                      </div>

                      {/* Small mock mini performance bars */}
                      <div className="flex gap-1 items-end h-8 mt-4">
                        {[
                          { val: 5.0, col: "bg-gradient-to-t from-red-400 to-red-500" },
                          { val: 6.0, col: "bg-gradient-to-t from-orange-400 to-orange-500" },
                          { val: 5.5, col: "bg-gradient-to-t from-amber-400 to-amber-500" },
                          { val: 7.0, col: "bg-gradient-to-t from-yellow-400 to-yellow-500" },
                          { val: 7.5, col: "bg-gradient-to-t from-emerald-400 to-emerald-500" },
                          { val: 8.0, col: "bg-gradient-to-t from-sky-400 to-sky-500" },
                          { val: 8.5, col: "bg-gradient-to-t from-purple-500 to-pink-500" }
                        ].map((item, i) => (
                          <div 
                            key={i} 
                            style={{ height: `${(item.val / 9) * 100}%` }}
                            className={`flex-1 rounded-sm ${item.col}`}
                            title={`Practice Point Band ${item.val}`}
                          ></div>
                        ))}
                      </div>
                    </div>

                    {/* BENTO_CARD 4.5: PROGRESS TREND ANALYTICS WITH RECHARTS (col-span-9) */}
                    <div className="lg:col-span-9 bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm transition-all duration-300 hover:border-indigo-200 hover:shadow-md hover:scale-[1.002]">
                      <PracticeTrendsChart practiceLogs={practiceLogs} targetBand={targetBand} />
                    </div>

                    {/* BENTO_CARD 4.7: MILESTONE ACHIEVEMENTS & UNLOCKED BADGES (col-span-12) */}
                    <div className="lg:col-span-12 mt-2">
                      <Achievements 
                        practiceLogs={practiceLogs} 
                        studyPlan={studyPlan} 
                        streakDays={streakDays} 
                      />
                    </div>

                    {/* BENTO_CARD 5: THE FIVE CORE INTERACTIVE STUDY BLOCKS (5 cards) */}
                    <div className="lg:col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-2">
                      
                      {/* LISTENING BENTO DEPT */}
                      <button
                        id="bento-skill-listening"
                        onClick={() => setActiveModule("Listening")}
                        className="bg-gradient-to-br from-sky-500/10 via-sky-500/5 to-transparent border border-sky-200 hover:border-sky-400 hover:shadow-md hover:shadow-sky-100/50 rounded-2xl p-4 flex items-center gap-4 text-left transition-all cursor-pointer group hover:-translate-y-1 bg-white"
                      >
                        <div className="w-11 h-11 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold text-lg shrink-0 group-hover:bg-sky-600 group-hover:text-white transition-all shadow-sm">
                          L
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-sky-700 transition-colors">Listening Arena</h4>
                          <span className="text-[11px] text-sky-700 font-medium block truncate">Next: Multiple Choice Drills</span>
                        </div>
                        <span className="text-[11px] font-bold py-1 px-2.5 bg-sky-100/80 border border-sky-200 rounded text-sky-700 shadow-sm animate-pulse">
                          Active
                        </span>
                      </button>

                      {/* READING BENTO DEPT */}
                      <button
                        id="bento-skill-reading"
                        onClick={() => setActiveModule("Reading")}
                        className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-200 hover:border-emerald-400 hover:shadow-md hover:shadow-emerald-100/50 rounded-2xl p-4 flex items-center gap-4 text-left transition-all cursor-pointer group hover:-translate-y-1 bg-white"
                      >
                        <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-lg shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                          R
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">Reading Arena</h4>
                          <span className="text-[11px] text-emerald-700 font-medium block truncate">Next: True/False/NG Drills</span>
                        </div>
                        <span className="text-[11px] font-bold py-1 px-2.5 bg-emerald-100 border border-emerald-200 rounded text-emerald-700 shadow-sm">
                          New
                        </span>
                      </button>

                      {/* SPEAKING BENTO DEPT */}
                      <button
                        id="bento-skill-speaking"
                        onClick={() => setActiveModule("Speaking")}
                        className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200 hover:border-amber-400 hover:shadow-md hover:shadow-amber-100/50 rounded-2xl p-4 flex items-center gap-4 text-left transition-all cursor-pointer group hover:-translate-y-1 bg-white"
                      >
                        <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-lg shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-all shadow-sm">
                          S
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-amber-700 transition-colors">Speaking Arena</h4>
                          <span className="text-[11px] text-amber-700 font-medium block truncate">Next: Part 2 Cue Cards</span>
                        </div>
                        <span className="text-[10px] font-extrabold py-1 px-2.5 bg-gradient-to-r from-red-100 to-amber-100 text-amber-800 border border-amber-300 rounded shrink-0 shadow-sm animate-pulse">
                          URGENT
                        </span>
                      </button>

                      {/* WRITING BENTO DEPT */}
                      <button
                        id="bento-skill-writing"
                        onClick={() => setActiveModule("Writing")}
                        className="bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border border-purple-200 hover:border-purple-400 hover:shadow-md hover:shadow-purple-100/50 rounded-2xl p-4 flex items-center gap-4 text-left transition-all cursor-pointer group hover:-translate-y-1 bg-white"
                      >
                        <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-lg shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-sm">
                          W
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-purple-700 transition-colors">Writing Arena</h4>
                          <span className="text-[11px] text-purple-700 font-medium block truncate">Next: Academic Task 2 Essays</span>
                        </div>
                        <span className="text-[11px] font-bold py-1 px-2.5 bg-purple-100 border border-purple-200 rounded text-purple-700 shadow-sm">
                          Active
                        </span>
                      </button>

                      {/* VOCABULARY BENTO DEPT */}
                      <button
                        id="bento-skill-vocabulary"
                        onClick={() => { setViewTab("flashcards"); setActiveModule(null); }}
                        className="bg-gradient-to-br from-pink-550/10 via-pink-500/5 to-transparent border border-pink-200 hover:border-pink-400 hover:shadow-md hover:shadow-pink-100/50 rounded-2xl p-4 flex items-center gap-4 text-left transition-all cursor-pointer group hover:-translate-y-1 bg-white"
                      >
                        <div className="w-11 h-11 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-lg shrink-0 group-hover:bg-pink-650 group-hover:text-white transition-all shadow-sm">
                          V
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-pink-700 transition-colors">Vocab & Idioms</h4>
                          <span className="text-[11px] text-pink-700 font-medium block truncate">Next: Band 9.0 Flashcards</span>
                        </div>
                        <span className="text-[11px] font-bold py-1 px-2.5 bg-pink-100 border border-pink-200 rounded text-pink-700 shadow-sm animate-pulse">
                          Active
                        </span>
                      </button>

                    </div>

                    {/* OFFICIAL BRITISH COUNCIL PORTAL */}
                    <div className="lg:col-span-12 bg-gradient-to-br from-indigo-50/40 via-blue-50/20 to-sky-50/40 border-2 border-indigo-200 rounded-2xl p-6 shadow-md space-y-4" id="bento-bc-resources-hub">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-indigo-100 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-blue-600 text-white rounded-xl flex items-center justify-center font-black text-sm select-none shrink-0 font-mono shadow-md">
                            BC
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-900 to-pink-650 tracking-tight flex items-center gap-1.5">
                              Official British Council Hub
                              <span className="bg-emerald-500 text-emerald-800 text-[9px] uppercase font-black border border-emerald-300 px-2 py-0.5 rounded-full select-none shadow-sm animate-pulse">
                                Official Partner Links
                              </span>
                            </h3>
                            <p className="text-xs text-indigo-700 font-medium">Complete your formal IELTS registration and explore official learning syllabuses.</p>
                          </div>
                        </div>
                        <a 
                          href="https://takeielts.britishcouncil.org" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="self-start sm:self-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 shadow hover:from-indigo-700 hover:to-blue-700 text-white font-black text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 hover:scale-[1.02] shadow-indigo-200/50"
                        >
                          Visit Official Site
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      {/* Quick access resources grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                        <a 
                          href="https://ieltsregistration.britishcouncil.org" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="group p-4 bg-gradient-to-br from-blue-50 to-indigo-100/50 border border-blue-200 hover:border-blue-400 hover:bg-white rounded-xl transition-all flex flex-col justify-between space-y-3 cursor-pointer shadow-sm hover:scale-[1.02]"
                        >
                          <div className="space-y-1">
                            <h4 className="text-xs font-black text-blue-900 group-hover:text-blue-700 transition-colors flex items-center gap-1.5">
                              Book IELTS Exam
                              <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                            </h4>
                            <p className="text-[11px] text-slate-600 font-serif leading-relaxed">
                              Select official test dates, find municipal testing venues, and register for Computer vs Paper designs.
                            </p>
                          </div>
                          <span className="text-[10px] uppercase tracking-wider font-extrabold text-blue-600 group-hover:underline inline-flex items-center gap-1">
                            Register now <ArrowRight className="w-2.5 h-2.5 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </a>

                        <a 
                          href="https://takeielts.britishcouncil.org/take-ielts/prepare/free-ielts-practice-tests" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="group p-4 bg-gradient-to-br from-emerald-50 to-teal-100/50 border border-emerald-200 hover:border-emerald-400 hover:bg-white rounded-xl transition-all flex flex-col justify-between space-y-3 cursor-pointer shadow-sm hover:scale-[1.02]"
                        >
                          <div className="space-y-1">
                            <h4 className="text-xs font-black text-emerald-900 group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                              Free Official Simulations
                              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                            </h4>
                            <p className="text-[11px] text-slate-600 font-serif leading-relaxed">
                              Solve mock sample listening blocks, original academic reading worksheets, and review actual graded essay tasks.
                            </p>
                          </div>
                          <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-600 group-hover:underline inline-flex items-center gap-1">
                            Explore papers <ArrowRight className="w-2.5 h-2.5 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </a>

                        <a 
                          href="https://takeielts.britishcouncil.org/take-ielts/prepare/courses/road-ielts" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="group p-4 bg-gradient-to-br from-purple-50 to-fuchsia-100/50 border border-purple-200 hover:border-purple-400 hover:bg-white rounded-xl transition-all flex flex-col justify-between space-y-3 cursor-pointer shadow-sm hover:scale-[1.02]"
                        >
                          <div className="space-y-1">
                            <h4 className="text-xs font-black text-purple-900 group-hover:text-purple-700 transition-colors flex items-center gap-1.5">
                              Road to IELTS Guide
                              <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
                            </h4>
                            <p className="text-[11px] text-slate-600 font-serif leading-relaxed">
                              Unlock 100 hours of interactive study pathways, vocabulary builders, and tutorials prepared by senior coordinators.
                            </p>
                          </div>
                          <span className="text-[10px] uppercase tracking-wider font-extrabold text-purple-600 group-hover:underline inline-flex items-center gap-1">
                            Official course <ArrowRight className="w-2.5 h-2.5 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </a>
                      </div>
                    </div>

                    {/* DETAILED PATH TIMELINE ACCORDION */}
                    <div className="lg:col-span-12 mt-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-md font-extrabold tracking-tight text-indigo-900 flex items-center gap-1.5">
                          <Calendar className="w-5 h-5 text-indigo-600" />
                          Dynamic Syllabus Tasks Schedule
                        </h3>
                        <button
                          onClick={handleResetPlan}
                          className="text-xs text-indigo-700 font-bold hover:text-indigo-900 transition-colors border border-indigo-200 rounded-xl px-3 py-1.5 bg-indigo-50/50 hover:bg-indigo-50"
                        >
                          Modify Parameters
                        </button>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-2xl p-5 divide-y divide-slate-150 shadow-sm">
                        {studyPlan.dailyTasks.map((task, index) => {
                          const badge = moduleBadgeColors[task.focusModule];
                          const accentBorders = {
                            Listening: "border-l-4 border-l-sky-400 pl-4 bg-sky-500/[0.02] hover:bg-sky-500/[0.04]",
                            Reading: "border-l-4 border-l-emerald-400 pl-4 bg-emerald-500/[0.02] hover:bg-emerald-500/[0.04]",
                            Speaking: "border-l-4 border-l-amber-400 pl-4 bg-amber-500/[0.02] hover:bg-amber-500/[0.04]",
                            Writing: "border-l-4 border-l-purple-400 pl-4 bg-purple-500/[0.02] hover:bg-purple-500/[0.04]"
                          };
                          
                          return (
                            <div key={task.day} className={`py-4 flex gap-4 items-center ${index > 0 ? "mt-2" : ""} ${accentBorders[task.focusModule] || ""} rounded-r-xl transition-colors duration-150`}>
                              <button
                                id={`check-main-task-${task.day}`}
                                onClick={() => handleToggleTask(task.day)}
                                className="mt-0.5 text-slate-300 hover:text-indigo-650 transition-colors cursor-pointer shrink-0"
                              >
                                {task.completed ? (
                                  <CheckCircle2 className="w-6 h-6 text-emerald-500 fill-emerald-100" />
                                ) : (
                                  <div className="w-5.5 h-5.5 rounded-full border-2 border-slate-300 bg-white hover:border-indigo-600 hover:scale-105 transition-all"></div>
                                )}
                              </button>

                              <div className="flex-1 min-w-0 space-y-0.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-black text-slate-900">Day {task.day}</span>
                                  <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase rounded border ${badge?.bg || ""} ${badge?.text || ""} shadow-sm`}>
                                    {task.focusModule}
                                  </span>
                                  <span className="text-[10px] text-pink-650 font-bold font-mono">({task.duration})</span>
                                </div>
                                <h4 className={`text-xs font-bold text-slate-800 ${task.completed ? "line-through text-slate-400" : ""}`}>
                                  {task.topic}
                                </h4>
                                <p className={`text-xs text-slate-500 leading-relaxed font-serif ${task.completed ? "text-slate-400" : ""}`}>
                                  {task.details}
                                </p>
                              </div>

                              <button
                                onClick={() => setActiveModule(task.focusModule)}
                                className="self-center px-4 py-1.5 border border-indigo-200 text-indigo-700 hover:bg-indigo-50 bg-white text-[11px] font-extrabold rounded-xl transition-all shadow-sm flex items-center gap-1 cursor-pointer shrink-0 hover:scale-105"
                              >
                                Train
                                <ArrowRight className="w-3 h-3 text-indigo-500" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                )}
              </>
            )}

          </>
        )}

      </main>

      {/* FOOTER METRICS AND METADATA */}
      <footer className="py-8 border-t border-slate-200 text-center text-slate-400 text-xs shrink-0 bg-white mt-12 bg-slate-50/50">
        <p className="font-semibold text-[11px]">© 2026 Mourad Bejaoui. All Rights Reserved. Sole Proprietor, IELTS Prep AI Platform.</p>
        <p className="text-[10px] text-slate-400/95 mt-1">Real-time dynamic rubric evaluation powered by the Gemini-3.5-Flash teacher.</p>
        <div className="flex justify-center flex-wrap gap-x-4 gap-y-1 mt-3 font-semibold text-indigo-600/75 text-[11px]" id="footer-bc-links">
          <a href="https://takeielts.britishcouncil.org" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-850 hover:underline flex items-center gap-1">
            Official British Council IELTS <ExternalLink className="w-2.5 h-2.5" />
          </a>
          <span className="text-slate-300">•</span>
          <a href="https://takeielts.britishcouncil.org/take-ielts/book-ielts" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-850 hover:underline flex items-center gap-1">
            Book Exam Date <ExternalLink className="w-2.5 h-2.5" />
          </a>
          <span className="text-slate-300">•</span>
          <a href="https://takeielts.britishcouncil.org/take-ielts/prepare/free-ielts-practice-tests" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-850 hover:underline flex items-center gap-1">
            BC Free Diagnostics <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </footer>

      {/* FLOATING QUICK STUDY NOTES */}
      <QuickNotes />

    </div>
  );
}
