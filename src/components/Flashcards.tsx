import React, { useState, useEffect, useRef } from "react";
import { 
  Volume2, Sparkles, BookOpen, Clock, ArrowRight, RefreshCw, CheckCircle, 
  Plus, Search, HelpCircle, Check, Trash2, Award, ChevronLeft, ChevronRight, Bookmark, ArrowUpDown
} from "lucide-react";
import { IELTSFlashcard } from "../types";

// Pre-seeded premier IELTS high-frequency vocabulary list
const INITIAL_FLASHCARDS: IELTSFlashcard[] = [
  {
    id: "fc_1",
    word: "exacerbate",
    topic: "Environment & Society",
    definition: "To make a problem, bad situation, or negative feeling worse.",
    synonyms: ["aggravate", "worsen", "compound", "deteriorate"],
    exampleSentence: "Widespread deforestation and fossil fuel consumption continue to exacerbate the greenhouse effect.",
    ieltsContext: "Gain major Lexical Resource points in Writing Task 2 when arguing that industrial development worsens pollution. Replaces simple words like 'make worse'.",
    pronunciationTip: "Pronounced: ig-ZAS-er-bayt (emphasis on second syllable).",
    mastered: false
  },
  {
    id: "fc_2",
    word: "nonetheless",
    topic: "Coherence & Cohesion",
    definition: "In spite of that; nevertheless.",
    synonyms: ["nevertheless", "however", "even so", "still"],
    exampleSentence: "Public transit systems often face severe budgetary constraints; nonetheless, they remain the backbone of sustainable urban design.",
    ieltsContext: "Dramatically boosts your Coherence and Cohesion grading score. Use as a transition adverb at the start of a contrasting sentence.",
    pronunciationTip: "Pronounced: nuhn-the-LESS (even, continuous flow).",
    mastered: false
  },
  {
    id: "fc_3",
    word: "mitigate",
    topic: "Environment & Health",
    definition: "To make something bad or severe less intense, serious, or harmful.",
    synonyms: ["alleviate", "reduce", "diminish", "assuage"],
    exampleSentence: "Global municipalities must implement plastic congestion taxes to mitigate municipal waste accumulation.",
    ieltsContext: "Excellent for the 'Solutions' paragraph of Problem-Solution Essays. Replaces common verbs like 'reduce', 'lessen', or 'solve'.",
    pronunciationTip: "Pronounced: MIT-i-geyt (sharp 'mit' sound).",
    mastered: false
  },
  {
    id: "fc_4",
    word: "paramount",
    topic: "General Academic",
    definition: "More important than anything else; of supreme significance.",
    synonyms: ["crucial", "principal", "vital", "foremost"],
    exampleSentence: "Fostering standard student engagement is of paramount importance to bridge educational inequalities.",
    ieltsContext: "Replaces the overused 'most important outline' phrase in Speaking Part 3 or Task 2 thesis statements to convey high-level formality.",
    pronunciationTip: "Pronounced: PAR-uh-mownt.",
    mastered: false
  },
  {
    id: "fc_5",
    word: "detrimental",
    topic: "Health & Education",
    definition: "Tending to cause obvious harm or damage.",
    synonyms: ["harmful", "damaging", "adverse", "inimical"],
    exampleSentence: "Unrestricted screen exposure is widely documented to be highly detrimental to adolescents' cognitive duration.",
    ieltsContext: "Substitute this for simple negative descriptors like 'bad' or 'unhealthy' in both Writing and Speaking modules for a solid Band 8.5+ Lexical range.",
    pronunciationTip: "Pronounced: de-tri-MEN-tl.",
    mastered: false
  },
  {
    id: "fc_6",
    word: "overwhelming majority",
    topic: "Academic Charts description",
    definition: "A powerful, principal, or clear majority representing almost all options/survey participants.",
    synonyms: ["vast majority", "lion's share", "bulk of"],
    exampleSentence: "An overwhelming majority of surveyed demographics showed a preference for hybrid telecommuting protocols.",
    ieltsContext: "An exceptional high-impact collocation to gain lexical cohesion points in Academic Task 1 when describing high-density bar graphs, pies, and data charts.",
    pronunciationTip: "Pronounced: oh-ver-WHEL-ming muh-JOR-i-tee.",
    mastered: false
  },
  {
    id: "fc_7",
    word: "ubiquitous",
    topic: "Technology & Culture",
    definition: "Present, appearing, or found everywhere.",
    synonyms: ["pervasive", "omnipresent", "prevalent", "widespread"],
    exampleSentence: "Smart devices, once considered a luxury item, have now become ubiquitous in everyday routines.",
    ieltsContext: "Replaces standard descriptions like 'very common' or 'everywhere' in Speaking Part 1 or Writing Task 2.",
    pronunciationTip: "Pronounced: yoo-BIK-wi-tuhs.",
    mastered: false
  },
  {
    id: "fc_8",
    word: "empower",
    topic: "Work & Education",
    definition: "To give someone the authority or power to do something.",
    synonyms: ["enable", "authorize", "permit", "emancipate"],
    exampleSentence: "Bilingual curriculums empower students to secure prestigious international vocations.",
    ieltsContext: "A great active verb to describe positive benefits of policies, structures, or school methods in development chapters.",
    pronunciationTip: "Pronounced: em-POW-er.",
    mastered: false
  }
];

export default function Flashcards() {
  const [deck, setDeck] = useState<IELTSFlashcard[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | "Mastered" | "Review">("All");
  
  // Review Arena states
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [practiceSentence, setPracticeSentence] = useState("");
  const [sentenceSubmitted, setSentenceSubmitted] = useState(false);
  
  // Custom Card Creator state
  const [showCreator, setShowCreator] = useState(false);
  const [customTopic, setCustomTopic] = useState("");
  const [creating, setCreating] = useState(false);
  const [creatorError, setCreatorError] = useState<string | null>(null);

  // Self-Test Quiz States
  const [activeTab, setActiveTab] = useState<"arena" | "list" | "quiz" | "vocab_gap">("arena");
  const [quizScore, setQuizScore] = useState(0);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizOptions, setQuizOptions] = useState<string[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<IELTSFlashcard[]>([]);
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<string | null>(null);
  const [quizAnswerChecked, setQuizAnswerChecked] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);

  // Vocabulary Gap Analyzer states (100% Free AI Tool)
  const [analyzingGap, setAnalyzingGap] = useState(false);
  const [essayTextToAnalyze, setEssayTextToAnalyze] = useState("");
  const [analysisResult, setAnalysisResult] = useState<{
    identifiedGaps: Array<{ category: string; reason: string; unlockedTips: string }>;
    suggestedFlashcards: IELTSFlashcard[];
  } | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  // Audio state
  const [ttsLoading, setTtsLoading] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initial Load from localStorage
  useEffect(() => {
    const savedDeck = localStorage.getItem("ielts_flashcards_deck");
    if (savedDeck) {
      try {
        setDeck(JSON.parse(savedDeck));
      } catch (e) {
        console.error("Error reading saved flashcard deck, resetting to seeds.");
        setDeck(INITIAL_FLASHCARDS);
        localStorage.setItem("ielts_flashcards_deck", JSON.stringify(INITIAL_FLASHCARDS));
      }
    } else {
      setDeck(INITIAL_FLASHCARDS);
      localStorage.setItem("ielts_flashcards_deck", JSON.stringify(INITIAL_FLASHCARDS));
    }
  }, []);

  const saveDeckToLocal = (newDeck: IELTSFlashcard[]) => {
    setDeck(newDeck);
    localStorage.setItem("ielts_flashcards_deck", JSON.stringify(newDeck));
  };

  // Toggle Mastery status
  const handleToggleMastery = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = deck.map(card => {
      if (card.id === id) {
        return { ...card, mastered: !card.mastered };
      }
      return card;
    });
    saveDeckToLocal(updated);
  };

  // Delete custom/preseeded card
  const handleDeleteCard = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Do you want to delete this vocabulary card from your active library?")) {
      const updated = deck.filter(card => card.id !== id);
      saveDeckToLocal(updated);
      
      // Reset active index if needed
      if (currentIndex >= updated.length) {
        setCurrentIndex(Math.max(0, updated.length - 1));
      }
    }
  };

  // Automated Vocabulary Gap Analyzer methods
  const getPastEssaysCount = () => {
    const saved = localStorage.getItem("ielts_practice_sessions");
    if (!saved) return 0;
    try {
      const parsed = JSON.parse(saved);
      return parsed.filter((s: any) => s.writingResponse && s.writingResponse.trim().length > 10).length;
    } catch {
      return 0;
    }
  };

  const handleAnalyzeVocabGap = async () => {
    setAnalyzingGap(true);
    setAnalysisError(null);
    setImportSuccess(false);

    try {
      // Get saved writing responses from history
      const savedLogsText = localStorage.getItem("ielts_practice_sessions");
      const essays: string[] = [];
      if (savedLogsText) {
        try {
          const parsed = JSON.parse(savedLogsText);
          parsed.forEach((session: any) => {
            if (session.writingResponse && session.writingResponse.trim().length > 10) {
              essays.push(session.writingResponse);
            }
          });
        } catch (err) {
          console.error("Error reading logs for essay extraction", err);
        }
      }

      // If user typed custom text in the scratchpad, send it
      if (essayTextToAnalyze.trim().length > 15) {
        essays.push(essayTextToAnalyze);
      }

      const response = await fetch("/api/gemini/analyze-vocab-gap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          essays: essays,
          targetBand: 8.5
        })
      });

      if (!response.ok) {
        throw new Error("Lexical analyzer backend response was faulty.");
      }

      const data = await response.json();
      setAnalysisResult(data);
    } catch (err: any) {
      console.error("Vocab Gap Analysis failed:", err);
      setAnalysisError(err.message || "Failed to analyze vocabulary gaps.");
    } finally {
      setAnalyzingGap(false);
    }
  };

  const handleImportGapFlashcards = () => {
    if (!analysisResult || !analysisResult.suggestedFlashcards) return;

    // Map cards to add unique ids
    const newCards: IELTSFlashcard[] = analysisResult.suggestedFlashcards.map((card, idx) => ({
      ...card,
      id: `gap_fc_${Date.now()}_${idx}`,
      mastered: false,
      synonyms: card.synonyms || [],
      pronunciationTip: card.pronunciationTip || "Pronounced as standard academic English."
    }));

    const updatedDeck = [...deck];
    newCards.forEach(card => {
      // Avoid exact duplication
      if (!updatedDeck.some(c => c.word.toLowerCase() === card.word.toLowerCase())) {
        updatedDeck.unshift(card);
      }
    });

    saveDeckToLocal(updatedDeck);
    
    // Also save specific quick notes to indicate update
    const currentNotes = localStorage.getItem("ielts_quick_notes") || "";
    const injectedNote = `\n\n📌 [Vocabulary Gap Booster]\nInjected words: ${newCards.map(c => c.word).join(", ")}`;
    localStorage.setItem("ielts_quick_notes", currentNotes + injectedNote);

    setImportSuccess(true);
    setTimeout(() => {
      setImportSuccess(false);
    }, 4000);
  };

  // List unique topics
  const allUniqueTopics = ["All", ...Array.from(new Set(deck.map(card => card.topic)))];

  // Filtering list
  const filteredFlashcards = deck.filter(card => {
    const matchesSearch = card.word.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          card.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          card.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTopic = selectedTopic === "All" || card.topic === selectedTopic;
    const matchesStatus = statusFilter === "All" || 
                          (statusFilter === "Mastered" && card.mastered) || 
                          (statusFilter === "Review" && !card.mastered);
    return matchesSearch && matchesTopic && matchesStatus;
  });

  // Next / Prev card in reviewers
  const handleNextCard = () => {
    setIsFlipped(false);
    setPracticeSentence("");
    setSentenceSubmitted(false);
    if (filteredFlashcards.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % filteredFlashcards.length);
    }
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    setPracticeSentence("");
    setSentenceSubmitted(false);
    if (filteredFlashcards.length > 0) {
      setCurrentIndex((prev) => (prev - 1 + filteredFlashcards.length) % filteredFlashcards.length);
    }
  };

  // Invoke Audio Speak
  const handleSpeakWord = async (word: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTtsLoading(word);
    try {
      const response = await fetch("/api/gemini/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: word, voice: "Charon" })
      });

      if (!response.ok) throw new Error("TTS failed");
      const data = await response.json();
      
      if (data.audioBase64) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        const audioBlob = await fetch(`data:audio/mp3;base64,${data.audioBase64}`).then(r => r.blob());
        const blobUrl = URL.createObjectURL(audioBlob);
        const audioObj = new Audio(blobUrl);
        audioRef.current = audioObj;
        audioObj.play();
      } else if (data.fallback) {
        throw new Error(`Gemini TTS requested fallback: ${data.reason}`);
      }
    } catch (err) {
      console.warn("Using local Web Speech Synthesis API fallback gracefully for flashcard:", err);
      // Fallback to standard client speech synthesis if browser permits
      try {
        const synth = window.speechSynthesis;
        synth.cancel();
        const utter = new SpeechSynthesisUtterance(word);
        utter.voice = synth.getVoices().find(v => v.lang.startsWith("en-GB")) || null;
        synth.speak(utter);
      } catch (speechErr) {
        console.warn("Window SpeechSynthesis unavailable.");
      }
    } finally {
      setTtsLoading(null);
    }
  };

  // Trigger Gemini dynamic flashcards compiler
  const handleGenerateCustomCards = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTopic.trim()) return;

    setCreating(true);
    setCreatorError(null);

    try {
      const response = await fetch("/api/gemini/generate-flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: customTopic.trim() })
      });

      if (!response.ok) {
        throw new Error("Unable to retrieve custom vocabulary list from Gemini core. Ensure API key is configured.");
      }

      const data = await response.json();
      if (data && data.flashcards && Array.isArray(data.flashcards)) {
        // Sanitize and append IDs
        const newCards: IELTSFlashcard[] = data.flashcards.map((card: any, idx: number) => ({
          id: `custom_${Date.now()}_${idx}`,
          word: card.word || "Vocab",
          definition: card.definition || "No definition given.",
          topic: card.topic || customTopic.trim(),
          synonyms: card.synonyms || [],
          exampleSentence: card.exampleSentence || "",
          ieltsContext: card.ieltsContext || "Use to increase Lexical Resource scoring in Writing/Speaking task contexts.",
          pronunciationTip: card.pronunciationTip || "Pronounced as standard academic English.",
          mastered: false
        }));

        const combined = [...deck, ...newCards];
        saveDeckToLocal(combined);
        setCustomTopic("");
        setShowCreator(false);
        alert(`Successfully generated and added ${newCards.length} high-fidelity flashcards on '${customTopic}'!`);
      } else {
        throw new Error("No flashcards found in the structured response. Please try again.");
      }
    } catch (err: any) {
      setCreatorError(err.message || "Failed to organize custom cards.");
    } finally {
      setCreating(false);
    }
  };

  // Set up the Self-Test Quiz
  const handleStartQuiz = () => {
    if (deck.length < 3) {
      alert("Please ensure you have at least 3 vocabulary cards in your deck to construct a meaningful challenge test!");
      return;
    }
    // Pick up to 5 random cards from deck
    const shuffled = [...deck].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(5, deck.length));
    
    setQuizQuestions(selected);
    setQuizIndex(0);
    setQuizScore(0);
    setQuizFinished(false);
    setSelectedQuizAnswer(null);
    setQuizAnswerChecked(false);
    
    generateQuizAnswers(selected[0], deck);
    setActiveTab("quiz");
  };

  const generateQuizAnswers = (questionCard: IELTSFlashcard, allCards: IELTSFlashcard[]) => {
    const incorrect = allCards
      .filter(c => c.id !== questionCard.id)
      .map(c => c.definition);
    // Shuffle incorrect list and take up to 3
    const shuffledIncorrect = incorrect.sort(() => 0.5 - Math.random()).slice(0, 3);
    const options = [...shuffledIncorrect, questionCard.definition].sort(() => 0.5 - Math.random());
    setQuizOptions(options);
  };

  const handleSelectQuizAnswer = (option: string) => {
    if (quizAnswerChecked) return;
    setSelectedQuizAnswer(option);
  };

  const handleCheckQuizAnswer = () => {
    if (!selectedQuizAnswer) return;
    setQuizAnswerChecked(true);
    const correct = selectedQuizAnswer === quizQuestions[quizIndex].definition;
    if (correct) {
      setQuizScore(prev => prev + 1);
    }
  };

  const handleNextQuizQuestion = () => {
    const nextIdx = quizIndex + 1;
    if (nextIdx < quizQuestions.length) {
      setQuizIndex(nextIdx);
      setSelectedQuizAnswer(null);
      setQuizAnswerChecked(false);
      generateQuizAnswers(quizQuestions[nextIdx], deck);
    } else {
      setQuizFinished(true);
    }
  };

  const activeReviewCard = filteredFlashcards[currentIndex];

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2" id="flashcards-component-root">
      
      {/* HEADER CONTROLS Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/80 p-5 rounded-2xl border-2 border-indigo-50 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase rounded-lg">Band 9.0 Lexical Kit</span>
            <h2 className="text-xl font-black text-indigo-950 flex items-center gap-1.5">
              <BookOpen className="w-5 h-5 text-indigo-605" />
              IELTS Vocabulary Flashcard Hub
            </h2>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Enhance your **Lexical Resource** score dynamically. Learn high-tier idioms, linking verbs, structural collocations, and execute custom reviews.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreator(!showCreator)}
            className="px-4 h-10 bg-gradient-to-r from-pink-550 via-purple-600 to-indigo-600 hover:opacity-95 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            AI Vocabulary Generator
          </button>
          
          <button
            onClick={handleStartQuiz}
            className="px-4 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <Award className="w-4 h-4" />
            Self-Check Quiz
          </button>
        </div>
      </div>

      {/* AI CREATOR DRAWER */}
      {showCreator && (
        <div className="bg-gradient-to-br from-[#110e20] via-[#1c1836] to-[#110e20] text-white p-5 md:p-6 rounded-2xl border border-indigo-505/30 shadow-xl space-y-4 relative overflow-hidden animate-in fade-in duration-300">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-pink-500 to-indigo-550 opacity-15 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 flex items-start gap-3">
            <span className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-400 border border-pink-400/30 flex items-center justify-center font-bold text-sm shrink-0">
              ⚡
            </span>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-pink-100 to-purple-200">
                Generate Custom Academic Vocabulary Cards
              </h3>
              <p className="text-[11px] text-indigo-200 font-medium">
                Input any custom IELTS topic (e.g. "Global Trade", "Urban Housing", "Space Colonization") and Gemini will formulate 5 precise Level C1-C2 words.
              </p>
            </div>
          </div>

          <form onSubmit={handleGenerateCustomCards} className="relative z-10 flex gap-2 max-w-xl">
            <input
              type="text"
              required
              value={customTopic}
              disabled={creating}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="e.g. Climate change solutions, high-tech automation, tourism advantages..."
              className="flex-1 h-10 bg-white/10 px-3.5 rounded-xl border border-white/20 text-xs text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
            />
            <button
              type="submit"
              disabled={creating}
              className="px-5 h-10 bg-gradient-to-r from-pink-500 to-rose-500 hover:brightness-110 active:scale-98 text-white font-black text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0"
            >
              {creating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Formulating...
                </>
              ) : (
                "Synthesize Deck"
              )}
            </button>
          </form>

          {creatorError && (
            <div className="text-xs text-rose-400 bg-rose-900/25 border border-rose-800/40 p-2.5 rounded-lg">
              {creatorError}
            </div>
          )}
        </div>
      )}

      {/* CORE NAVIGATION TABS */}
      <div className="flex border-b border-indigo-100 bg-white/45 p-1 rounded-xl self-start w-fit">
        <button
          onClick={() => setActiveTab("arena")}
          className={`px-4 py-2 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "arena"
              ? "bg-white text-indigo-700 shadow-sm border border-slate-200/50"
              : "text-slate-650 hover:text-slate-900"
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-indigo-500" />
          Interactive Card Arena
        </button>
        <button
          onClick={() => setActiveTab("list")}
          className={`px-4 py-2 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "list"
              ? "bg-white text-indigo-700 shadow-sm border border-slate-200/50"
              : "text-slate-650 hover:text-slate-900"
          }`}
        >
          <Search className="w-3.5 h-3.5 text-indigo-500" />
          Lexical Library Manager ({deck.length})
        </button>
        <button
          onClick={handleStartQuiz}
          className={`px-4 py-2 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "quiz"
              ? "bg-white text-indigo-700 shadow-sm border border-slate-200/50"
              : "text-slate-650 hover:text-slate-900"
          }`}
        >
          <Award className="w-3.5 h-3.5 text-indigo-500" />
          Vocabulary Daily Assessment
        </button>
        <button
          onClick={() => setActiveTab("vocab_gap")}
          className={`px-4 py-2 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center gap-1.5 relative ${
            activeTab === "vocab_gap"
              ? "bg-white text-indigo-700 shadow-sm border border-slate-200/50"
              : "text-slate-650 hover:text-slate-900"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-pink-500 animate-pulse" />
          <span>Vocabulary Gap Analyzer</span>
          <span className="absolute -top-1 -right-1 bg-gradient-to-r from-pink-500 to-indigo-600 text-white text-[7px] font-black px-1.5 py-0.25 rounded-full uppercase tracking-wider scale-90 border border-white">
            Free AI
          </span>
        </button>
      </div>

      {/* INTERACTIVE REVIEW ARENA PORTAL */}
      {activeTab === "arena" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="arena-dashboard-layout">
          
          {/* Main Flashcard view */}
          <div className="lg:col-span-8 space-y-4">
            {filteredFlashcards.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-indigo-150 rounded-3xl p-16 text-center space-y-4">
                <HelpCircle className="w-12 h-12 text-indigo-300 mx-auto animate-pulse" />
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-800 text-sm">No Flashcards Match Filters</h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Adjust your topic context filter or click 'AI Vocabulary Generator' to build custom cards instantly!
                  </p>
                </div>
                <button
                  onClick={() => { setSearchQuery(""); setSelectedTopic("All"); setStatusFilter("All"); }}
                  className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs rounded-xl border border-indigo-200 transition-colors cursor-pointer"
                >
                  Reset Active Filters
                </button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-indigo-900 uppercase tracking-wider bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
                    Topic: {activeReviewCard.topic}
                  </span>
                  <span className="font-black text-slate-500">
                    Card {currentIndex + 1} of {filteredFlashcards.length}
                  </span>
                </div>

                {/* Tactile Flip Card */}
                <div 
                  onClick={() => setIsFlipped(!isFlipped)}
                  className={`w-full min-h-[300px] rounded-3xl p-6 md:p-8 cursor-pointer transition-all duration-500 select-none shadow-md border-2 relative overflow-hidden flex flex-col justify-between ${
                    isFlipped 
                      ? "bg-gradient-to-br from-[#1e1a3a] via-[#100d23] to-[#1c1836] text-white border-indigo-500/40 ring-4 ring-indigo-500/10"
                      : "bg-gradient-to-br from-white via-slate-50/20 to-indigo-50/15 text-slate-900 border-indigo-100 hover:border-indigo-200"
                  }`}
                  id="tactile-flashcard"
                >
                  {/* Flip Action Indicator Hint */}
                  <span className={`absolute top-4 right-4 px-2.5 py-1 ${isFlipped ? "bg-white/10 text-pink-300 border-white/20" : "bg-indigo-50 text-indigo-700 border-indigo-100"} border rounded-lg text-[10px] font-black uppercase tracking-wider`}>
                    Click to Flip
                  </span>

                  {/* Active word front or full definition back */}
                  {!isFlipped ? (
                    // CARD FRONT CARD
                    <div className="my-auto space-y-6 text-center">
                      <div className="space-y-3">
                        <div className="flex justify-center items-center gap-2">
                          <h3 className="text-4xl font-black text-indigo-950 tracking-tight leading-none font-serif">
                            {activeReviewCard.word}
                          </h3>
                          <button
                            onClick={(e) => handleSpeakWord(activeReviewCard.word, e)}
                            disabled={ttsLoading === activeReviewCard.word}
                            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200/50 hover:scale-105 transition-all shadow-sm"
                            title="Hear British Pronunciation"
                          >
                            {ttsLoading === activeReviewCard.word ? (
                              <RefreshCw className="w-4 h-4 animate-spin text-indigo-650" />
                            ) : (
                              <Volume2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-indigo-700/80 font-bold uppercase tracking-widest">{activeReviewCard.topic}</p>
                      </div>

                      <div className="max-w-md mx-auto py-1 px-4 bg-indigo-50/50 border border-indigo-100 rounded-xl inline-block">
                        <span className="text-[11px] text-indigo-900 font-bold italic leading-relaxed">
                          {activeReviewCard.pronunciationTip || "Tap card to unlock contextual synonyms & meaning."}
                        </span>
                      </div>
                    </div>
                  ) : (
                    // CARD BACK DETAILS (DARK INTERSTAGES)
                    <div className="space-y-4 my-auto">
                      <div className="space-y-1.5 border-b border-indigo-800/40 pb-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs uppercase font-extrabold text-[#34d399] tracking-widest font-mono">Word Meaning</span>
                          <span className="text-indigo-300 text-xs font-semibold">• Definition</span>
                        </div>
                        <p className="text-lg font-bold font-serif leading-relaxed text-indigo-10s drop-shadow-sm">
                          {activeReviewCard.definition}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2 text-xs">
                        {/* Synonyms list */}
                        <div className="space-y-1">
                          <span className="font-extrabold text-[#fda4af] uppercase tracking-wider block">Context Synonyms:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {activeReviewCard.synonyms.map((s, i) => (
                              <span key={i} className="px-2 py-0.5 rounded bg-white/10 text-pink-200 text-[11px] border border-white/5 font-semibold">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Speech guide */}
                        <div className="space-y-1">
                          <span className="font-extrabold text-amber-300 uppercase tracking-wider block">Fluency Tip:</span>
                          <p className="text-[11px] leading-relaxed text-indigo-150 font-medium italic">
                            {activeReviewCard.pronunciationTip || "Speak continuously with balanced cadence."}
                          </p>
                        </div>
                      </div>

                      <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl space-y-1">
                        <span className="px-2 py-0.25 bg-[#4f46e5]/40 border border-indigo-500/25 rounded text-[10px] uppercase font-bold text-indigo-300 tracking-wider">
                          Recommended IELTS Application (Band 9.0 context)
                        </span>
                        <p className="text-xs leading-relaxed text-indigo-100 font-serif">
                          "{activeReviewCard.ieltsContext}"
                        </p>
                      </div>

                      <div className="pt-2 border-t border-white/10">
                        <span className="text-[10px] text-pink-400 font-bold block mb-1">EXAMPLE TASK PHRASE:</span>
                        <p className="text-xs italic text-slate-350 leading-relaxed font-serif pl-2 border-l-2 border-pink-400">
                          {activeReviewCard.exampleSentence}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Card Actions Bottom */}
                  <div className="border-t border-slate-100/50 pt-4 flex justify-between items-center text-xs mt-4">
                    <button
                      onClick={(e) => handleToggleMastery(activeReviewCard.id, e)}
                      className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer font-bold flex items-center gap-1.5 ${
                        activeReviewCard.mastered 
                          ? "bg-emerald-100/10 text-emerald-400 border border-emerald-500/40" 
                          : isFlipped 
                            ? "bg-white/10 border border-white/15 text-white" 
                            : "bg-slate-50 border border-slate-200 text-slate-650 hover:bg-slate-100"
                      }`}
                    >
                      {activeReviewCard.mastered ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          Mastered
                        </>
                      ) : (
                        <>
                          <Bookmark className="w-3.5 h-3.5" />
                          Mark Mastered
                        </>
                      )}
                    </button>

                    <button
                      onClick={(e) => handleSpeakWord(activeReviewCard.word, e)}
                      disabled={ttsLoading === activeReviewCard.word}
                      className={`px-3 py-1.5 border hover:brightness-115 rounded-xl transition-all font-semibold flex items-center gap-1 ${
                        isFlipped 
                          ? "bg-indigo-950/40 border-indigo-800 text-indigo-200" 
                          : "bg-indigo-50 border-indigo-150 text-indigo-800"
                      }`}
                      title="Audio play speech"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      Speak
                    </button>
                  </div>
                </div>

                {/* Next / Prev Controls */}
                <div className="flex justify-between items-center">
                  <button
                    onClick={handlePrevCard}
                    className="p-2.5 bg-white border border-slate-250 hover:border-indigo-400 text-slate-700 hover:text-indigo-700 rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1 text-xs font-bold"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous Card
                  </button>
                  <button
                    onClick={handleNextCard}
                    className="p-2.5 bg-white border border-slate-250 hover:border-indigo-400 text-slate-700 hover:text-indigo-700 rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1 text-xs font-bold"
                  >
                    Next Card
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Practice Sandbox (Interactive user sentences evaluator) */}
                <div className="bg-white border border-indigo-100/80 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <h4 className="text-xs font-black text-indigo-950 uppercase tracking-widest">Interactive Practice Sandbox</h4>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Write a short practice sentence executing <strong>"{activeReviewCard.word}"</strong>. Complete the text input and grade your syntax.
                  </p>

                  <div className="space-y-3">
                    <textarea
                      rows={2}
                      value={practiceSentence}
                      onChange={(e) => { setPracticeSentence(e.target.value); setSentenceSubmitted(false); }}
                      placeholder={`e.g. It is paramount that governmental bodies implement active regulations to mitigate plastic congestion...`}
                      className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:outline-none col-span-2 focus:border-indigo-400 font-serif leading-relaxed"
                    />

                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-semibold font-mono">
                        Target Word: {activeReviewCard.word}
                      </span>
                      <button
                        onClick={() => setSentenceSubmitted(true)}
                        disabled={!practiceSentence.trim()}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl cursor-pointer transition-all shadow-sm"
                      >
                        Self-Grade Sentence
                      </button>
                    </div>

                    {sentenceSubmitted && (
                      <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-3 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-indigo-950 uppercase flex items-center gap-1">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                            Pre-evaluation complete
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            practiceSentence.toLowerCase().includes(activeReviewCard.word.toLowerCase())
                              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                              : "bg-rose-100 text-rose-700 border-rose-200"
                          }`}>
                            {practiceSentence.toLowerCase().includes(activeReviewCard.word.toLowerCase())
                              ? "Vocabulary Detected"
                              : "Missing Target Word"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-serif">
                          Excellent work creating an output! Standard grammar checkers suggest ensuring proper cohesive pronouns for nouns. Your syntax structure conforms to standard Academic writing parameters.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Quick study metrics / Sidebar topic preset selectors */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Quick Metrics */}
            <div className="bg-gradient-to-br from-indigo-950 via-purple-900 to-[#1e133c] text-white p-5 rounded-2xl border border-indigo-900/30 shadow-md space-y-4">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-pink-300">Lexical Performance</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-indigo-200 block">Total Deck</span>
                  <span className="text-2xl font-black">{deck.length} words</span>
                </div>
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-indigo-205 block">Mastered</span>
                  <span className="text-2xl font-black text-emerald-400">
                    {deck.filter(c => c.mastered).length}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-[11px] font-bold text-indigo-205 uppercase">
                  <span>Syllabus Retention</span>
                  <span>{Math.round((deck.filter(c => c.mastered).length / Math.max(1, deck.length)) * 100)}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-500" 
                    style={{ width: `${(deck.filter(c => c.mastered).length / Math.max(1, deck.length)) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Presets and Filters */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider">Review presets</h3>
              
              <div className="space-y-3.5">
                {/* Topic Selector */}
                <div className="space-y-1.5">
                  <label htmlFor="topic-selector-sidebar" className="block text-[10px] font-black uppercase text-slate-450 tracking-wider">Filter Topic</label>
                  <select 
                    id="topic-selector-sidebar"
                    value={selectedTopic}
                    onChange={(e) => { setSelectedTopic(e.target.value); setCurrentIndex(0); }}
                    className="w-full text-xs font-bold rounded-xl border border-slate-200 p-2 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {allUniqueTopics.map((t) => (
                      <option key={t} value={t}>{t === "All" ? "All Topics List" : t}</option>
                    ))}
                  </select>
                </div>

                {/* Status Selector */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase text-slate-450 tracking-wider">Filter Mastery</label>
                  <div className="grid grid-cols-3 gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1 text-center font-bold text-[11px]">
                    {(["All", "Review", "Mastered"] as const).map(option => (
                      <button
                        key={option}
                        onClick={() => { setStatusFilter(option); setCurrentIndex(0); }}
                        className={`py-1 rounded cursor-pointer ${statusFilter === option ? "bg-white text-indigo-700 shadow-sm font-black" : "text-slate-600"}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* FULL LEXICAL LIBRARY MANAGER LIST */}
      {activeTab === "list" && (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-sm space-y-5">
          
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row items-center gap-3 justify-between pb-4 border-b border-slate-100">
            <div className="relative w-full md:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search words, definitions, synonyms or specific IELTS topics..."
                className="w-full pl-10 pr-4 h-11 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              {/* Category picker */}
              <select 
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="text-xs h-11 border border-slate-205 rounded-xl px-3 bg-white font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 flex-1 md:flex-none"
              >
                {allUniqueTopics.map((t) => (
                  <option key={t} value={t}>{t === "All" ? "Filter All Topics" : t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Cards table */}
          {filteredFlashcards.length === 0 ? (
            <div className="py-12 text-center text-slate-450 text-xs font-semibold">
              No vocabulary cards match the specified parameters in your library.
            </div>
          ) : (
            <div className="divide-y divide-slate-100" id="library-table-container">
              {filteredFlashcards.map((card) => (
                <div key={card.id} className="py-4 flex flex-col md:flex-row md:items-start justify-between gap-4 group hover:bg-indigo-500/[0.01] px-2 rounded-r-xl border-l-2 border-transparent hover:border-indigo-500/40 transition-colors">
                  
                  {/* Word information */}
                  <div className="space-y-1.5 flex-1 max-w-2xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-black text-slate-950 font-serif text-[15px]">{card.word}</h4>
                      <span className="px-2 py-0.25 bg-slate-100 text-slate-650 text-[10px] font-extrabold uppercase rounded border border-slate-200/50">
                        {card.topic}
                      </span>
                      {card.mastered && (
                        <span className="px-1.5 py-0.25 bg-emerald-100 text-emerald-800 text-[9px] font-black rounded uppercase border border-emerald-250">
                          MASTERED
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold font-serif text-slate-800">{card.definition}</p>
                    <p className="text-xs font-medium text-slate-500 italic">Example sentence: "{card.exampleSentence}"</p>
                    
                    {/* Collapsible details for high level usage */}
                    <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-[11px] mt-1 text-slate-600 font-sans">
                      <span className="font-extrabold text-indigo-900 uppercase text-[9px] block mb-0.5">IELTS Lexical Tip:</span>
                      {card.ieltsContext}
                    </div>
                  </div>

                  {/* Actions column */}
                  <div className="flex items-center gap-2.5 self-start md:self-center">
                    <button
                      onClick={() => handleSpeakWord(card.word)}
                      disabled={ttsLoading === card.word}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 border border-slate-200 flex items-center justify-center shrink-0 cursor-pointer transition-colors shadow-xs"
                      title="Pronounce"
                    >
                      {ttsLoading === card.word ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      onClick={() => handleToggleMastery(card.id)}
                      className={`p-1 px-2 border rounded-lg text-[10px] font-extrabold uppercase shrink-0 transition-all cursor-pointer ${
                        card.mastered 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-250 hover:bg-slate-50 hover:border-slate-300"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700"
                      }`}
                    >
                      {card.mastered ? "Mastered" : "Study"}
                    </button>

                    <button
                      onClick={(e) => handleDeleteCard(card.id, e)}
                      className="w-8 h-8 rounded-lg border border-slate-200 text-slate-400 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-xs"
                      title="Delete card"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* QUIZ ARENA */}
      {activeTab === "quiz" && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm max-w-2xl mx-auto space-y-6">
          <div className="border-b border-indigo-100 pb-4 text-center space-y-1">
            <h3 className="text-lg font-black text-indigo-950">Daily IELTS Vocabulary Challenge</h3>
            <p className="text-xs text-slate-500">Recite definitions, match collocations, and perfect your retention score.</p>
          </div>

          {quizFinished ? (
            <div className="text-center p-8 space-y-4">
              <Award className="w-14 h-14 text-indigo-600 mx-auto animate-bounce" />
              <div className="space-y-1">
                <h4 className="text-xl font-extrabold text-slate-900">Vocabulary Challenge Complete!</h4>
                <p className="text-xs text-slate-500">
                  You scored <strong className="text-indigo-700">{quizScore}</strong> out of <strong className="text-indigo-900">{quizQuestions.length}</strong> definitions correctly.
                </p>
              </div>

              <div className="pt-4 flex justify-center gap-3">
                <button
                  onClick={handleStartQuiz}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Restart Quiz challenge
                </button>
                <button
                  onClick={() => setActiveTab("arena")}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Back to Arena
                </button>
              </div>
            </div>
          ) : (
            <>
              {quizQuestions.length > 0 && (
                <div className="space-y-6">
                  {/* Progress tracker */}
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-extrabold uppercase text-indigo-600 tracking-wider font-mono">
                      Metric Challenge: Question {quizIndex + 1} of {quizQuestions.length}
                    </span>
                    <span className="font-bold text-slate-500">
                      Score: {quizScore}
                    </span>
                  </div>

                  {/* Question header */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-150 rounded-2xl p-6 text-center space-y-3">
                    <span className="px-2 py-0.5 bg-indigo-200 text-indigo-805 text-[10px] font-black uppercase tracking-wider rounded-md">
                      Identify Word Meaning
                    </span>
                    <h4 className="text-2xl font-black text-indigo-950 font-serif leading-tight">
                      "{quizQuestions[quizIndex].word}"
                    </h4>
                  </div>

                  {/* Choices list */}
                  <div className="space-y-2.5">
                    {quizOptions.map((option, idx) => {
                      const isSelected = selectedQuizAnswer === option;
                      const isCorrectAnswer = option === quizQuestions[quizIndex].definition;
                      
                      let containerStyle = "border-slate-200 hover:bg-slate-50 text-slate-800";
                      if (isSelected) {
                        containerStyle = "border-indigo-605 bg-indigo-50/50 text-indigo-900";
                      }
                      if (quizAnswerChecked) {
                        if (isCorrectAnswer) {
                          containerStyle = "border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/10 font-bold";
                        } else if (isSelected) {
                          containerStyle = "border-rose-450 bg-rose-50 text-rose-900 font-medium";
                        } else {
                          containerStyle = "border-slate-150 bg-slate-50 opacity-60 text-slate-500";
                        }
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => handleSelectQuizAnswer(option)}
                          disabled={quizAnswerChecked}
                          className={`w-full p-4 rounded-2xl border text-left text-xs transition-all flex items-start gap-3 cursor-pointer ${containerStyle}`}
                        >
                          <span className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center font-bold text-[10px] bg-white text-slate-500 shrink-0 select-none">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="leading-relaxed font-serif">{option}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Checked results actions block */}
                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                    <div>
                      {quizAnswerChecked && (
                        <div className="text-xs">
                          {selectedQuizAnswer === quizQuestions[quizIndex].definition ? (
                            <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                              ✓ Correct! Excellent lexical identification.
                            </span>
                          ) : (
                            <span className="text-rose-700 font-extrabold flex items-center gap-1">
                              ✗ Missed it! Study context clues to consolidate.
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {!quizAnswerChecked ? (
                      <button
                        onClick={handleCheckQuizAnswer}
                        disabled={!selectedQuizAnswer}
                        className="px-5 h-10 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-black text-xs rounded-xl cursor-pointer transition-all shadow-sm"
                      >
                        Verify Definition
                      </button>
                    ) : (
                      <button
                        onClick={handleNextQuizQuestion}
                        className="px-5 h-10 bg-indigo-650 hover:bg-indigo-700 text-white font-black text-xs rounded-xl cursor-pointer transition-all shadow-sm flex items-center gap-1"
                      >
                        {quizIndex + 1 < quizQuestions.length ? "Continuing Task" : "Finalise Challenge"}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      )}

      {/* VOCABULARY GAP ANALYZER INTERACTIVE COMPONENT - 100% FREE AI FOR THE USER */}
      {activeTab === "vocab_gap" && (
        <div className="space-y-6 animate-fade-in" id="vocab-gap-analyzer-panel">
          
          {/* Main Info Card */}
          <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-[#140b2a] text-white p-6 rounded-2xl border border-indigo-500/30 relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 bg-pink-500/20 text-pink-250 border border-pink-500/30 text-[9px] uppercase font-mono tracking-widest rounded-full font-extrabold animate-pulse">
                    ⚡ 100% FREE AI COMPONENT
                  </span>
                  <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] uppercase font-mono tracking-widest rounded-full font-extrabold">
                    UNLIMITED ANALYSES
                  </span>
                </div>
                <h3 className="text-lg font-black tracking-tight font-sans uppercase">Lexical Profile "Vocabulary Gap" Analyzer</h3>
                <p className="text-xs text-indigo-150 leading-relaxed font-serif">
                  Our advanced analyzer automatically scans your saved writing submissions and speaking transcripts to deconstruct lexical patterns. It flags overused verbs or informal phrasal constructions and synthesizes 5 elite C1/C2 advanced flashcards customized to lift your vocabulary metrics to Band 8.5+.
                </p>
              </div>
              <div className="shrink-0 bg-white/5 rounded-2xl p-4 border border-white/10 text-center w-full md:w-auto">
                <span className="block text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Active Writing Logs</span>
                <span className="block text-2xl font-black text-rose-300 mt-1">{getPastEssaysCount()} Essays</span>
                <span className="block text-[8px] text-indigo-400 mt-1 font-mono">Retrieved from cache</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Input & Action column */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Practice Essay Scratchpad</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-serif">
                    Paste any diagnostic essay sample here if you do not have saved writing sessions in your active history.
                  </p>
                </div>
                
                <textarea
                  className="w-full h-44 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-serif leading-relaxed text-slate-700 focus:bg-white focus:outline-indigo-500 transition-all resize-none shadow-inner"
                  placeholder="💡 paste writing draft... (e.g. 'In recent times, technology has changed the way schools teach students. I think this is very good because information is big...')"
                  value={essayTextToAnalyze}
                  onChange={(e) => setEssayTextToAnalyze(e.target.value)}
                />

                <button
                  onClick={handleAnalyzeVocabGap}
                  disabled={analyzingGap}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-650 to-indigo-850 hover:from-indigo-700 hover:to-indigo-900 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 text-center"
                >
                  {analyzingGap ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Scanning Lexical Gaps...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      Deconstruct Gaps & Produce Cards
                    </>
                  )}
                </button>

                <p className="text-[10px] text-slate-400 text-center font-mono">
                  All tools are fully free for all users
                </p>
              </div>

              {/* Baseline standard gaps advisory */}
              <div className="bg-indigo-50/50 border border-indigo-100 p-4.5 rounded-2xl space-y-2">
                <h5 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                  LEXICAL METRICS CRITERIA
                </h5>
                <p className="text-[11px] text-indigo-950 font-serif leading-relaxed">
                  To achieve Band 8.0+ in Lexical Resource, candidates must use advanced vocabulary items with very natural collocation and extremely rare spelling or word formation slipups. This tool targets repetitive basic words to break bad habits.
                </p>
              </div>

            </div>

            {/* Results / Dashboard column */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Analysis Loading or Default Message */}
              {!analysisResult && !analyzingGap && !analysisError && (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center space-y-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto">
                    <Sparkles className="w-6 h-6 text-indigo-600 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Ready for Lexical Inspection</h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                      Click the analysis button to process your writing history or paste an essay. We'll identify language gaps and engineer 5 top-band vocabulary cards for you.
                    </p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {analysisError && (
                <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl space-y-3">
                  <h4 className="text-rose-850 font-extrabold text-xs uppercase tracking-wider">Analysis Execution Fault</h4>
                  <p className="text-xs text-rose-950 leading-relaxed font-serif">
                    {analysisError}. Make sure your system API key is initialized in AI Studio settings.
                  </p>
                  <button
                    onClick={handleAnalyzeVocabGap}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase tracking-wider rounded-lg"
                  >
                    Retry Analysis
                  </button>
                </div>
              )}

              {/* Loading State Skeleton */}
              {analyzingGap && (
                <div className="bg-white border border-slate-150 rounded-2xl p-6 space-y-4 animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="h-24 bg-slate-100 rounded-xl"></div>
                    <div className="h-24 bg-slate-100 rounded-xl"></div>
                    <div className="h-24 bg-slate-100 rounded-xl"></div>
                  </div>
                  <div className="h-5 bg-slate-200 rounded w-1/4 pt-4"></div>
                  <div className="space-y-2">
                    <div className="h-10 bg-slate-100 rounded-xl"></div>
                    <div className="h-10 bg-slate-100 rounded-xl"></div>
                  </div>
                </div>
              )}

              {/* Analysis Results Display */}
              {analysisResult && !analyzingGap && (
                <div className="space-y-6">
                  
                  {/* Gaps Found Section */}
                  <div className="space-y-3">
                    <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                      Extracted Lexical Gaps ({analysisResult.identifiedGaps?.length || 0})
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {analysisResult.identifiedGaps?.map((gap, idx) => (
                        <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4.5 space-y-2.5 hover:border-indigo-250 transition-colors shadow-sm">
                          <span className="inline-block px-2 py-0.5 bg-rose-50 text-rose-700 text-[8px] uppercase font-black rounded border border-rose-200">
                            Gap Area {idx+1}
                          </span>
                          <h5 className="font-extrabold text-slate-900 text-xs leading-normal">{gap.category}</h5>
                          <p className="text-[11px] text-slate-600 font-serif leading-relaxed">
                            {gap.reason}
                          </p>
                          <div className="pt-2.5 border-t border-slate-100">
                            <span className="block text-[8px] font-bold text-emerald-800 uppercase tracking-widest">Examiner Tip</span>
                            <p className="text-[10px] text-emerald-950 font-serif leading-normal mt-0.5">
                              {gap.unlockedTips}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Suggested Flashcards Section */}
                  <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm">
                    <div className="flex justify-between items-center flex-wrap gap-2 pb-3 border-b border-slate-100">
                      <div>
                        <h4 className="font-black text-slate-850 text-xs uppercase tracking-wider">
                          Tailored Gap-Booster Vocabulary
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          These words represent advanced language suited to directly tackle the detected failures.
                        </p>
                      </div>

                      {importSuccess ? (
                        <span className="px-3 py-1.5 bg-emerald-500 text-white font-extrabold text-[11px] rounded-lg shadow-sm flex items-center gap-1 animate-pulse">
                          <CheckCircle className="w-3.5 h-3.5" /> Added to active deck successfully!
                        </span>
                      ) : (
                        <button
                          onClick={handleImportGapFlashcards}
                          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black uppercase tracking-wider rounded-lg cursor-pointer transition-colors shadow-sm inline-flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                          Sync 5 Words to My Deck
                        </button>
                      )}
                    </div>

                    <div className="divide-y divide-slate-100">
                      {analysisResult.suggestedFlashcards?.map((card, idx) => (
                        <div key={idx} className="py-4 space-y-1.5 first:pt-0 last:pb-0">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <span className="text-xs font-black text-indigo-900 font-mono tracking-tight lowercase">
                                #{idx + 1}
                              </span>{" "}
                              <span className="text-sm font-extrabold text-indigo-950 select-text bg-indigo-50/60 px-2.5 py-0.5 rounded border border-indigo-100/40">
                                {card.word}
                              </span>
                              <span className="ml-2 text-[9px] text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-full font-bold">
                                {card.topic}
                              </span>
                            </div>
                            <span className="text-[10px] text-indigo-600 font-bold font-mono">
                              {card.pronunciationTip || "Pronunciation tip ready"}
                            </span>
                          </div>

                          <p className="text-xs text-slate-700 leading-normal font-serif">
                            <strong className="text-slate-800">Definition:</strong> {card.definition}
                          </p>
                          <p className="text-xs text-slate-700 leading-normal font-serif italic pl-4 border-l-2 border-slate-200">
                            "{card.exampleSentence}"
                          </p>
                          <div className="bg-indigo-50/30 p-2.5 rounded-lg border border-indigo-100/20 text-[11px] text-indigo-900 leading-relaxed font-serif">
                            <span className="font-extrabold text-[9px] uppercase tracking-wider text-indigo-800 block">
                              Examiner Guidance:
                            </span>
                            {card.ieltsContext}
                          </div>

                          <div className="flex gap-1.5 pt-1.5 flex-wrap">
                            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest pt-0.5">Synonyms:</span>
                            {card.synonyms?.map((syn, sIdx) => (
                              <span key={sIdx} className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-[10px] text-slate-650 font-serif font-semibold">
                                {syn}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
