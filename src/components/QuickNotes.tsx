import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText, X, Trash2, Copy, Check, Sparkles, BookOpen, PenTool, ExternalLink 
} from "lucide-react";

export default function QuickNotes() {
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load saved notes from LocalStorage on mount
  useEffect(() => {
    const savedNotes = localStorage.getItem("ielts_quick_notes");
    if (savedNotes) {
      setNotes(savedNotes);
    }
  }, []);

  // Sync to LocalStorage
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNotes(val);
    localStorage.setItem("ielts_quick_notes", val);
  };

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear your Quick Notes?")) {
      setNotes("");
      localStorage.setItem("ielts_quick_notes", "");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(notes).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Quick insertion helpers for IELTS practice
  const insertTemplate = (templateType: "vocab" | "tips" | "grammar") => {
    let textToInsert = "";
    if (templateType === "vocab") {
      textToInsert = "\n\n📒 [Vocabulary]\n- Term: \n  Definition: \n  Synonyms: \n  Example: ";
    } else if (templateType === "tips") {
      textToInsert = "\n\n💡 [IELTS Tip]\n- Arena (L/R/W/S): \n  Strategy: ";
    } else if (templateType === "grammar") {
      textToInsert = "\n\n✍️ [Grammar/Coherence]\n- Structure: \n  Usage rule: ";
    }

    const updatedNotes = notes + textToInsert;
    setNotes(updatedNotes);
    localStorage.setItem("ielts_quick_notes", updatedNotes);

    // Auto-focus the textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
      }
    }, 50);
  };

  // Word count helper
  const wordCount = notes.trim() === "" ? 0 : notes.trim().split(/\s+/).length;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none" id="quick-notes-container">
      
      {/* Expanded Notes Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="w-[calc(100vw-2rem)] sm:w-96 h-[460px] max-h-[80vh] bg-white/95 border-2 border-indigo-150 backdrop-blur-md rounded-2xl shadow-2xl p-4 flex flex-col pointer-events-auto mb-3"
            id="quick-notes-window"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-indigo-50 pb-2.5">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
                  <PenTool className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#1e1548]">
                    Quick Notes
                  </h3>
                  <p className="text-[10px] text-pink-600 font-bold uppercase tracking-widest mt-0.5">
                    IELTS STUDY COMPANION
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={handleCopy}
                  disabled={notes.trim().length === 0}
                  className="p-1 px-2 text-[10px] font-bold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                  title="Copy to clipboard"
                  id="btn-copy-quick-notes"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 animate-scale" />
                      <span className="text-emerald-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleClear}
                  disabled={notes.trim().length === 0}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                  title="Clear all notes"
                  id="btn-clear-quick-notes"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Close notes panel"
                  id="btn-close-quick-notes"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Helper Presets */}
            <div className="flex flex-wrap gap-1.5 py-2 border-b border-indigo-50/60 select-none">
              <span className="text-[9px] font-black text-indigo-950 uppercase tracking-wider self-center mr-1">
                Presets:
              </span>
              <button
                onClick={() => insertTemplate("vocab")}
                className="px-2 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer"
              >
                + Vocab Term
              </button>
              <button
                onClick={() => insertTemplate("tips")}
                className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer"
              >
                + IELTS Tip
              </button>
              <button
                onClick={() => insertTemplate("grammar")}
                className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer"
              >
                + Coherence Rule
              </button>
            </div>

            {/* Editing Textarea */}
            <div className="flex-1 min-h-0 py-2 relative">
              <textarea
                ref={textareaRef}
                value={notes}
                onChange={handleNotesChange}
                placeholder="💡 Type structure rules, vocabulary words, pronunciation tips, or feedback during practice sessions... Auto-saved instantly."
                className="w-full h-full p-2.5 text-xs text-slate-800 bg-slate-50/50 hover:bg-slate-50 border border-indigo-50 focus:border-indigo-400 focus:bg-white rounded-xl focus:outline-none resize-none font-sans leading-relaxed focus:ring-2 focus:ring-indigo-100 transition-colors"
                id="quick-notes-textarea"
              />
            </div>

            {/* Footer Statistics */}
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 py-1.5 border-t border-indigo-50 select-none bg-white">
              <span className="flex items-center gap-1 font-bold text-slate-500">
                <Sparkles className="w-3 h-3 text-pink-500" />
                <span>Auto-saved locally</span>
              </span>
              <div className="flex items-center gap-3">
                <span>{notes.length} chars</span>
                <span className="font-extrabold text-slate-600">{wordCount} words</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`pointer-events-auto w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl cursor-pointer transition-all ${
          isOpen 
            ? "bg-slate-800 hover:bg-slate-900 border-2 border-slate-700" 
            : "bg-gradient-to-br from-pink-500 via-purple-650 to-indigo-600 hover:brightness-105 border-2 border-white"
        }`}
        title={isOpen ? "Close Quick Notes" : "Open Quick Notes"}
        id="quick-notes-fab"
      >
        {isOpen ? (
          <X className="w-6 h-6 animate-scale" />
        ) : (
          <div className="relative">
            <FileText className="w-6 h-6" />
            
            {/* Notification badge when user currently has some notes text */}
            {notes.trim().length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-emerald-500 border border-white rounded-full flex items-center justify-center overflow-hidden animate-pulse">
                <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
              </span>
            )}
          </div>
        )}
      </motion.button>
      
    </div>
  );
}
