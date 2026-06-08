import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Trophy, Flame, Award, Sparkles, PenTool, BookOpen, CheckCircle, HelpCircle, X, Check, Lock, ChevronRight 
} from "lucide-react";
import { PracticeSession, PersonalizedStudyPlan } from "../types";

interface AchievementsProps {
  practiceLogs: PracticeSession[];
  studyPlan: PersonalizedStudyPlan | null;
  streakDays: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  icon: React.ComponentType<any>;
  requirementText: string;
  targetValue: number;
  currentValue: number;
  isUnlocked: boolean;
  colorTheme: {
    bg: string;
    border: string;
    text: string;
    iconBg: string;
    glow: string;
  };
}

export default function Achievements({ practiceLogs, studyPlan, streakDays }: AchievementsProps) {
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [quickNotesValue, setQuickNotesValue] = useState("");

  useEffect(() => {
    // Read current quick notes to verify Lexical Voyager
    const savedNotes = localStorage.getItem("ielts_quick_notes") || "";
    setQuickNotesValue(savedNotes);
  }, []);

  // Compute metrics
  const totalPracticeSessions = practiceLogs.length;

  const highestSessionBand = practiceLogs.reduce((max, log) => {
    const bandValue = log.metrics.band || 6.0;
    return bandValue > max ? bandValue : max;
  }, 0.0);

  const hasPerfectGrade = practiceLogs.some(
    (log) => log.metrics.score === "5/5" || log.metrics.score === "100%" || (log.metrics.band && log.metrics.band >= 8.5)
  );

  const notesLength = quickNotesValue.trim().length;

  // Badge list with corresponding state metrics
  const badges: Badge[] = [
    {
      id: "streak_7",
      name: "Steady Climber",
      description: "Secure a study streak of 7 days or more.",
      longDescription: "Achieving high IELTS coherence requires dedication. Consistency feeds linguistic memory, helping you score high on coherence, fluency, and structures.",
      icon: Flame,
      requirementText: "7 consecutive days of active revision",
      targetValue: 7,
      currentValue: streakDays,
      isUnlocked: streakDays >= 7,
      colorTheme: {
        bg: "bg-amber-50 from-orange-50 to-amber-100",
        border: "border-amber-200/90 hover:border-amber-405",
        text: "text-amber-950",
        iconBg: "bg-gradient-to-br from-amber-500 to-orange-600 text-white",
        glow: "shadow-amber-100"
      }
    },
    {
      id: "practice_10",
      name: "Prolific Scholar",
      description: "Log at least 10 comprehensive practice reviews.",
      longDescription: "Repetitive simulation adapts your mental processing speed. Ten official evaluations signify a rigorous level of exam readiness.",
      icon: Award,
      requirementText: "10 completed Listening or Reading tests",
      targetValue: 10,
      currentValue: totalPracticeSessions,
      isUnlocked: totalPracticeSessions >= 10,
      colorTheme: {
        bg: "bg-sky-50 from-sky-50 to-indigo-100",
        border: "border-sky-200/90 hover:border-sky-400",
        text: "text-sky-950",
        iconBg: "bg-gradient-to-br from-indigo-505 to-sky-500 text-white",
        glow: "shadow-sky-100"
      }
    },
    {
      id: "band_8",
      name: "Elite Linguist",
      description: "Acheive Band score of 8.0 or higher in a drill.",
      longDescription: "A Band 8.0 estimate represents an 'Very Good User' with fully operational command. Doing so proves you can manage highly complex materials.",
      icon: Sparkles,
      requirementText: "Band 8.0 estimate in any single session",
      targetValue: 8.0,
      currentValue: highestSessionBand,
      isUnlocked: highestSessionBand >= 8.0,
      colorTheme: {
        bg: "bg-purple-50 from-purple-50 to-pink-100",
        border: "border-purple-200 hover:border-purple-400",
        text: "text-purple-950",
        iconBg: "bg-gradient-to-br from-purple-600 to-pink-500 text-white",
        glow: "shadow-purple-100"
      }
    },
    {
      id: "perfect_score",
      name: "Flawless Scorecard",
      description: "Obtain a 5/5 or 100% in Listening/Reading.",
      longDescription: "A fully raw flawless score requires immense attention to detail under tight time limits. This shows outstanding comprehension.",
      icon: CheckCircle,
      requirementText: "5/5 questions correct in a listening score",
      targetValue: 1,
      currentValue: hasPerfectGrade ? 1 : 0,
      isUnlocked: hasPerfectGrade,
      colorTheme: {
        bg: "bg-emerald-50 from-emerald-50 to-teal-100",
        border: "border-emerald-250 hover:border-emerald-400",
        text: "text-emerald-950",
        iconBg: "bg-gradient-to-br from-emerald-600 to-teal-552 text-white",
        glow: "shadow-emerald-100"
      }
    },
    {
      id: "quick_notes",
      name: "Lexical Voyager",
      description: "Write vocabulary items in custom Quick Notes.",
      longDescription: "Jotted structures and vocabulary feed directly into your Active Recalling. Recording vocabulary ensures higher lexical resource scores.",
      icon: PenTool,
      requirementText: "At least 15 characters of study notes saved",
      targetValue: 15,
      currentValue: notesLength,
      isUnlocked: notesLength >= 15,
      colorTheme: {
        bg: "bg-rose-50 from-rose-50 to-red-100",
        border: "border-rose-200 hover:border-rose-400",
        text: "text-rose-950",
        iconBg: "bg-gradient-to-br from-rose-500 to-pink-650 text-white",
        glow: "shadow-rose-100"
      }
    },
    {
      id: "plan_architect",
      name: "Syllabus Architect",
      description: "Tailor a personalized AI preparation plan.",
      longDescription: "By customizing onboarding choices, you have set up a strict daily revision course based closely on the standards.",
      icon: BookOpen,
      requirementText: "AI diagnostic onboarding plan active",
      targetValue: 1,
      currentValue: studyPlan ? 1 : 0,
      isUnlocked: studyPlan !== null,
      colorTheme: {
        bg: "bg-indigo-50 from-indigo-50 to-violet-100",
        border: "border-indigo-150 hover:border-indigo-350",
        text: "text-indigo-950",
        iconBg: "bg-gradient-to-br from-indigo-600 to-purple-600 text-white",
        glow: "shadow-indigo-100"
      }
    }
  ];

  const unlockedCount = badges.filter(b => b.isUnlocked).length;

  // Dynamic status level
  let currentTitle = "Novice Scholar";
  let titleColor = "text-slate-500";
  if (unlockedCount >= 6) {
    currentTitle = "Supreme IELTS Master";
    titleColor = "text-[#db2777] font-black";
  } else if (unlockedCount >= 4) {
    currentTitle = "Expert Practitioner";
    titleColor = "text-indigo-650 font-black";
  } else if (unlockedCount >= 2) {
    currentTitle = "Competent Cadet";
    titleColor = "text-emerald-600 font-bold";
  }

  return (
    <div className="bg-white border border-slate-200/65 rounded-2xl p-5 shadow-sm space-y-4" id="achievements-card-container">
      
      {/* Header and overview metric */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-indigo-50/50 pb-3">
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-[#1e1548] flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-500 fill-amber-100 animate-pulse" />
            Milestone Achievements
          </h3>
          <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
            Unlock exclusive badges as you reinforce your IELTS command.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 px-3 py-1.5 rounded-xl text-xs select-none">
          <span className="text-slate-500 font-bold">Unlocks:</span>
          <span className="font-mono font-black text-indigo-700 bg-indigo-50 py-0.5 px-2 rounded-lg border border-indigo-100">
            {unlockedCount} / {badges.length}
          </span>
          <span className={`text-[10px] uppercase font-black tracking-widest px-1.5 py-0.5 rounded border border-slate-200 bg-white ml-2 ${titleColor}`}>
            {currentTitle}
          </span>
        </div>
      </div>

      {/* Grid of badges */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {badges.map((badge) => {
          const IconComponent = badge.icon;
          const unlockPercent = Math.min((badge.currentValue / badge.targetValue) * 100, 100);

          return (
            <div
              key={badge.id}
              onClick={() => setSelectedBadge(badge)}
              className={`relative flex flex-col items-center justify-between p-3.5 rounded-2xl border text-center transition-all duration-300 group cursor-pointer ${
                badge.isUnlocked
                  ? `bg-gradient-to-b ${badge.colorTheme.bg} ${badge.colorTheme.border} ${badge.colorTheme.glow} shadow-sm hover:shadow-lg hover:-translate-y-1`
                  : "bg-slate-50/60 border-slate-100 opacity-60 hover:opacity-100 hover:bg-slate-50 hover:border-slate-300"
              }`}
              id={`badge-card-${badge.id}`}
            >
              {/* Badge Inner contents */}
              <div className="flex flex-col items-center space-y-2 mt-1">
                {/* Badge ring glow wrapper */}
                <div className={`w-11 h-11 rounded-full flex items-center justify-center relative ${
                  badge.isUnlocked 
                    ? `${badge.colorTheme.iconBg} ring-4 ring-white shadow-md group-hover:scale-110 transition-transform duration-300` 
                    : "bg-slate-200 text-slate-400 ring-2 ring-transparent"
                }`}>
                  <IconComponent className="w-5.5 h-4.5" />
                  
                  {/* Small lock or check symbol overlay badge */}
                  <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border border-white flex items-center justify-center text-[8px] font-black ${
                    badge.isUnlocked 
                      ? "bg-emerald-500 text-white" 
                      : "bg-slate-350 text-white"
                  }`}>
                    {badge.isUnlocked ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : <Lock className="w-2.5 h-2.5" />}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <h4 className={`text-[11px] font-black tracking-tight ${
                    badge.isUnlocked ? badge.colorTheme.text : "text-slate-500"
                  }`}>
                    {badge.name}
                  </h4>
                  <p className="text-[9px] text-slate-400/95 font-medium leading-tight line-clamp-2 px-1">
                    {badge.description}
                  </p>
                </div>
              </div>

              {/* Progress Bar inside for Locked, or Success string for Unlocked */}
              <div className="w-full mt-4 pt-2.5 border-t border-slate-100 font-mono text-[9px] select-none">
                {badge.isUnlocked ? (
                  <span className="text-emerald-600 font-bold block bg-emerald-50 border border-emerald-100 px-1 py-0.5 rounded uppercase tracking-wider">
                    Unlocked
                  </span>
                ) : (
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-400 text-[8px] font-bold">
                      <span>PROGRESS</span>
                      <span>{Math.round(unlockPercent)}%</span>
                    </div>
                    <div className="h-1 bg-slate-200/80 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-slate-400 rounded-full" 
                        style={{ width: `${unlockPercent}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded Modal Interactive Popup window */}
      <AnimatePresence>
        {selectedBadge && (
          <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4 pointer-events-auto">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-white border-2 border-indigo-150 rounded-3xl p-6 shadow-2xl relative"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedBadge(null)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-650 hover:bg-slate-100 rounded-full cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col items-center text-center space-y-4">
                {/* Glowing Core Large icon frame */}
                <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg relative ${
                  selectedBadge.isUnlocked 
                    ? `${selectedBadge.colorTheme.iconBg} ring-4 ring-offset-2 ring-indigo-100` 
                    : "bg-slate-100 text-slate-400 border border-slate-200"
                }`}>
                  {React.createElement(selectedBadge.icon, { className: "w-8 h-8" })}
                </div>

                <div className="space-y-1">
                  <span className={`text-[9px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded border ${
                    selectedBadge.isUnlocked 
                      ? "bg-emerald-50 border-emerald-250 text-emerald-800" 
                      : "bg-slate-50 border-slate-200 text-slate-550"
                  }`}>
                    {selectedBadge.isUnlocked ? "Unlocked Milestone" : "Locked Milestone"}
                  </span>
                  <h3 className="text-sm font-black text-[#1e1548] tracking-tight pt-1">
                    {selectedBadge.name}
                  </h3>
                  <p className="text-[10px] text-indigo-650 font-bold uppercase tracking-wider">
                    Target Criteria: {selectedBadge.requirementText}
                  </p>
                </div>

                <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3 text-xs text-slate-600 leading-relaxed font-serif text-left">
                  {selectedBadge.longDescription}
                </div>

                {/* Progress Details panel */}
                <div className="w-full bg-indigo-50/40 border border-indigo-100/50 rounded-xl p-3 text-xs flex justify-between items-center font-mono">
                  <div className="text-left">
                    <span className="block text-[8px] font-black text-indigo-950 uppercase tracking-widest">Your Metric</span>
                    <span className="font-bold text-indigo-950 text-xs">
                      {selectedBadge.id === "streak_7" && `${selectedBadge.currentValue} days`}
                      {selectedBadge.id === "practice_10" && `${selectedBadge.currentValue} sessions`}
                      {selectedBadge.id === "band_8" && (selectedBadge.currentValue > 0 ? `Band ${selectedBadge.currentValue.toFixed(1)}` : "None yet")}
                      {selectedBadge.id === "perfect_score" && (selectedBadge.isUnlocked ? "Achieved" : "No Perfect Score")}
                      {selectedBadge.id === "quick_notes" && `${selectedBadge.currentValue} notebook characters`}
                      {selectedBadge.id === "plan_architect" && (selectedBadge.isUnlocked ? "Plan Active" : "No active plan")}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="block text-[8px] font-black text-indigo-950 uppercase tracking-widest">Requirement</span>
                    <span className="font-bold text-slate-600 text-xs">
                      {selectedBadge.id === "streak_7" && ">= 7 days streak"}
                      {selectedBadge.id === "practice_10" && ">= 10 practice tests"}
                      {selectedBadge.id === "band_8" && "Band >= 8.0 estimate"}
                      {selectedBadge.id === "perfect_score" && "Grade of 5/5 score"}
                      {selectedBadge.id === "quick_notes" && ">= 15 note chars"}
                      {selectedBadge.id === "plan_architect" && "Diagnostic plan customized"}
                    </span>
                  </div>
                </div>

                {/* Action CTA */}
                <button
                  onClick={() => setSelectedBadge(null)}
                  className="w-full py-2 bg-gradient-to-r from-indigo-650 to-indigo-750 hover:opacity-95 text-white text-xs font-black rounded-xl cursor-pointer"
                >
                  Dismiss Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
