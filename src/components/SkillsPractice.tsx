import React, { useState, useEffect, useRef } from "react";
import { 
  Volume2, VolumeX, Sparkles, BookOpen, Clock, ArrowRight, Play, Square,
  CheckCircle, Loader2, AlertCircle, RefreshCw, Send, ChevronRight, Mic, MicOff, Check, AlertTriangle,
  ExternalLink, Globe
} from "lucide-react";
import { IELTSModule } from "../types";

interface SkillsPracticeProps {
  module: IELTSModule;
  onBackToDashboard: () => void;
  onSessionSaved: () => void;
}

export default function SkillsPractice({ module, onBackToDashboard, onSessionSaved }: SkillsPracticeProps) {
  // Common state
  const [loading, setLoading] = useState(false);
  const [grading, setGrading] = useState(false);
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [error, setError] = useState<string | null>(null);

  // Audio Text-to-Speech States
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Speech Recognition States (for Speaking module)
  const [isRecording, setIsRecording] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Core generated content state
  const [exercise, setExercise] = useState<any | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [evaluated, setEvaluated] = useState<boolean>(false);
  
  // Specific Writing states
  const [writingPrompt, setWritingPrompt] = useState<string>("");
  const [writingTaskType, setWritingTaskType] = useState<string>("Task 2: Academic Essay");
  const [writingResponse, setWritingResponse] = useState<string>("");
  const [writingAssessment, setWritingAssessment] = useState<any | null>(null);

  // Specific Speaking states
  const [activePromptIndex, setActivePromptIndex] = useState(0);
  const [speakingResponses, setSpeakingResponses] = useState<string[]>([]);
  const [speakingTextResponse, setSpeakingTextResponse] = useState<string>("");
  const [speakingAssessment, setSpeakingAssessment] = useState<any | null>(null);

  const writingPromptsList = [
    {
      type: "Task 2: Academic Essay",
      title: "Environmental Responsibility",
      prompt: "Some people believe that individual citizens should take primary responsibility for protecting the environment, while others argue that only major governments and large conglomerates can make a real difference. Discuss both views and give your opinion."
    },
    {
      type: "Task 2: Academic Essay",
      title: "Artificial Intelligence in Education",
      prompt: "The rapid development of Artificial Intelligence (AI) means that human teachers might soon be entirely replaced by intelligent learning systems. To what extent do you agree or disagree with this vision of future classrooms?"
    },
    {
      type: "Task 1: Academic Report",
      title: "Global Energy Consumption Trends",
      prompt: "The provided survey data outlines shifts in global energy source consumption (renewable vs. non-renewable fossil reservoirs) between 2005 and 2025. Write a formal report of at least 150 words describing the primary trends and making comparisons where relevant."
    },
    {
      type: "Task 1: General Training Letter",
      title: "Letter to a Landlord",
      prompt: "You are currently renting an apartment and have encountered minor structure issues (a heating system leak and cracked kitchen tile). Write a letter of at least 150 words to your landlord explaining the exact situation, requesting immediate repairs, and discussing future payment parameters."
    }
  ];

  const speakingPromptsList = [
    {
      id: "part1_hobbies",
      part: 1,
      topic: "Your Hometown & Leisure Hours",
      prompts: [
        "Tell me a little bit about your hometown. What is the most scenic environment there?",
        "How do you prefer to spend your holidays or leisure hours with friends?",
        "Do you believe maintaining sports or outdoor activities is crucial for desk-bound students?"
      ]
    },
    {
      id: "part2_event",
      part: 2,
      topic: "A Historic Landmark You Visited",
      prompts: [
        "Describe a memorable historic landmark or monument you visited. You should state: where it is, when you went to see it, who accompanied you, and explain why this particular site left a profound impression on your memory."
      ]
    },
    {
      id: "part3_society",
      part: 3,
      topic: "Preserving Cultural Heritage in the Modern Age",
      prompts: [
        "To what extent do you think municipal authorities should allocate funding to rehabilitate older structural landmarks?",
        "Do young generations in your country value traditional festivities, or are modern lifestyle behaviors replacing historical values?",
        "How has digitization changed the role of local museums or archival libraries in educating children?"
      ]
    }
  ];

  useEffect(() => {
    // Basic setup if we transition out or choose Writing
    if (module === "Writing") {
      setWritingPrompt(writingPromptsList[0].prompt);
      setWritingTaskType(writingPromptsList[0].type);
    } else if (module === "Speaking") {
      setExercise(speakingPromptsList[0]);
      setSpeakingResponses(new Array(speakingPromptsList[0].prompts.length).fill(""));
    } else {
      handleFetchExercise();
    }

    // Initialize Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setSpeakingTextResponse(currentTranscript);
      };

      rec.onerror = (e: any) => {
        console.error("Speech Recognition Error", e);
        setRecognitionError("Grammatical speech capture failed or was denied. You may type manually as backup.");
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch(e) {}
      }
    };
  }, [module]);

  const handleFetchExercise = async () => {
    setLoading(true);
    setError(null);
    setExercise(null);
    setEvaluated(false);
    setUserAnswers({});
    setAudioUrl(null);

    const apiPath = module === "Listening" ? "/api/gemini/generate-listening" : "/api/gemini/generate-reading";
    const payload = module === "Listening" ? { difficulty } : { difficulty, passageType: "Science" };

    try {
      const response = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Failed to generate authentic ${module} exercise from teacher.`);
      }

      const data = await response.json();
      setExercise(data);

      // Instantly pre-load Text-to-Speech audio if it's the Listening section
      if (module === "Listening" && data.transcript) {
        handleTriggerTTS(data.transcript, false);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load practice content. Please verify connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerTTS = async (textToSpeak: string, autoplay = true) => {
    setTtsLoading(true);
    setAudioUrl(null);
    try {
      // Clean up text if too long (take the first 450 words or first 2 paragraphs to fit TTS thresholds safely)
      const cleanText = textToSpeak.split("\n").slice(0, 3).join("\n").slice(0, 1800);
      
      const response = await fetch("/api/gemini/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleanText, voice: "Zephyr" })
      });

      if (!response.ok) {
        throw new Error("TTS proxy error");
      }

      const resData = await response.json();
      if (resData.audioBase64) {
        const url = `data:audio/mp3;base64,${resData.audioBase64}`;
        setAudioUrl(url);
        
        // Setup state triggers on actual HTML Audio element
        const playObj = new Audio(url);
        playObj.onended = () => setIsPlaying(false);
        audioRef.current = playObj;
        if (autoplay) {
          playObj.play().catch(e => console.error(e));
          setIsPlaying(true);
        }
      } else if (resData.fallback) {
        throw new Error(`Gemini TTS requested fallback: ${resData.reason}`);
      }
    } catch (err) {
      console.warn("Using local Web Speech Synthesis API fallback gracefully:", err);
      // Fallback: Using speech synthesis if premium AI model fails
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(textToSpeak.slice(0, 400));
        utterance.onend = () => setIsPlaying(false);
        (window as any).utteranceRef = utterance;
        if (autoplay) {
          window.speechSynthesis.speak(utterance);
          setIsPlaying(true);
        }
      }
    } finally {
      setTtsLoading(false);
    }
  };

  const toggleAudioPlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(e => console.error(e));
        setIsPlaying(true);
      }
    } else {
      // Try speech synthesis fallback
      if (isPlaying) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
      } else {
        const textToSpeak = exercise?.transcript || exercise?.passage || "Please prepare your answer.";
        const utterance = new SpeechSynthesisUtterance(textToSpeak.slice(0, 500));
        utterance.onend = () => setIsPlaying(false);
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
      }
    }
  };

  // Recording triggers (for Speaking stream)
  const toggleRecording = () => {
    if (!recognitionRef.current) {
      setRecognitionError("Your web browser does not support standard speech recording APIs. Please type manually inside the box.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setRecognitionError(null);
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Listening/Reading Quiz evaluators
  const handleAnswerChange = (qId: number, value: string) => {
    setUserAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const handleGradeListeningOrReading = () => {
    setGrading(true);
    setTimeout(() => {
      // Calculate automated band locally based on answers matching
      setEvaluated(true);
      setGrading(false);

      // Save session inside browser practice logs for dashboard history
      const prevLogs = localStorage.getItem("ielts_practice_sessions") || "[]";
      try {
        const logs = JSON.parse(prevLogs);
        
        // Count correct
        let correctCount = 0;
        exercise.questions.forEach((q: any) => {
          const userAns = (userAnswers[q.id] || "").trim().toLowerCase();
          const targetAns = q.answer.trim().toLowerCase();
          if (userAns === targetAns || targetAns.includes(userAns) && userAns.length > 0) {
            correctCount++;
          }
        });

        const calculatedBand = correctCount === 5 ? 9.0 : correctCount === 4 ? 8.0 : correctCount === 3 ? 6.5 : correctCount === 2 ? 5.5 : 4.5;

        const sessionLog = {
          id: Math.random().toString(36).substring(7),
          module,
          title: exercise.title || `${module} Diagnostic Test`,
          timestamp: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
          userAnswers,
          metrics: {
            score: `${correctCount}/5`,
            band: calculatedBand
          },
          feedbackMarkdown: `Great effort! You finished the diagnostic simulation successfully. \n\n**Automated Insights:** Your correct ratio is **${correctCount}/5** matching standard assessment rubrics. Correct and revise your blanks to understand critical distractors.`
        };

        logs.unshift(sessionLog);
        localStorage.setItem("ielts_practice_sessions", JSON.stringify(logs));
        onSessionSaved();
      } catch (e) {
        console.error(e);
      }
    }, 1200);
  };

  // Grade typed essays using Gemini Write evaluators
  const handleEvaluateWriting = async () => {
    if (!writingResponse.trim()) {
      alert("Please write your essay or reports before submitting to the expert panel.");
      return;
    }

    setGrading(true);
    setError(null);
    setWritingAssessment(null);

    try {
      const response = await fetch("/api/gemini/grade-writing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskType: writingTaskType,
          prompt: writingPrompt,
          userSubmission: writingResponse
        })
      });

      if (!response.ok) {
        throw new Error("Writing grading server error. Please verify api key credentials.");
      }

      const evaluation = await response.json();
      setWritingAssessment(evaluation);

      // Save into persistence session logs
      const prevLogs = localStorage.getItem("ielts_practice_sessions") || "[]";
      const logs = JSON.parse(prevLogs);
      logs.unshift({
        id: Math.random().toString(36).substring(7),
        module: "Writing",
        title: `Writing: ${writingPrompt.slice(0, 30)}...`,
        timestamp: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
        writingResponse,
        metrics: {
          band: evaluation.overallBand
        },
        feedbackMarkdown: `Official criteria assessment returned an overall level of **Band ${evaluation.overallBand}**.`
      });
      localStorage.setItem("ielts_practice_sessions", JSON.stringify(logs));
      onSessionSaved();
    } catch (err: any) {
      setError(err.message || "Something went wrong during grading.");
    } finally {
      setGrading(false);
    }
  };

  // Speaking evaluator
  const handleSaveSpeakingResponse = () => {
    if (!speakingTextResponse.trim()) return;

    const list = [...speakingResponses];
    list[activePromptIndex] = speakingTextResponse;
    setSpeakingResponses(list);
    setSpeakingTextResponse("");

    if (activePromptIndex < exercise.prompts.length - 1) {
      setActivePromptIndex(prev => prev + 1);
    }
  };

  const handleEvaluateSpeaking = async () => {
    // Collect all answers
    const fullTranscript = speakingResponses
      .map((resp, idx) => `Q: ${exercise.prompts[idx]}\nA: ${resp}`)
      .join("\n\n");

    setGrading(true);
    setError(null);
    setSpeakingAssessment(null);

    try {
      const response = await fetch("/api/gemini/grade-speaking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          part: exercise.part,
          topic: exercise.topic,
          transcript: fullTranscript
        })
      });

      if (!response.ok) {
        throw new Error("Speaking rubric processor failed.");
      }

      const assessment = await response.json();
      setSpeakingAssessment(assessment);

      // Save to general statistics history
      const prevLogs = localStorage.getItem("ielts_practice_sessions") || "[]";
      const logs = JSON.parse(prevLogs);
      logs.unshift({
        id: Math.random().toString(36).substring(7),
        module: "Speaking",
        title: `Speaking Cue - ${exercise.topic}`,
        timestamp: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        speakingTranscript: fullTranscript,
        metrics: {
          band: assessment.estimatedBand
        },
        feedbackMarkdown: `Simulated diagnostic speaking exam on ${exercise.topic} evaluated at **Band ${assessment.estimatedBand}**.`
      });
      localStorage.setItem("ielts_practice_sessions", JSON.stringify(logs));
      onSessionSaved();
    } catch (err: any) {
      setError(err.message || "Speaking evaluation error.");
    } finally {
      setGrading(false);
    }
  };

  const handleSelectWritingPromptPreset = (p: any) => {
    setWritingPrompt(p.prompt);
    setWritingTaskType(p.type);
    setWritingAssessment(null);
    setWritingResponse("");
  };

  const handleSelectSpeakingTopic = (preset: any) => {
    setExercise(preset);
    setActivePromptIndex(0);
    setSpeakingTextResponse("");
    setSpeakingResponses(new Array(preset.prompts.length).fill(""));
    setSpeakingAssessment(null);
  };

  // Word count calculations for typed structures
  const countWords = (text: string) => {
    if (!text.trim()) return 0;
    return text.trim().split(/\s+/).length;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-4 animate-fade-in" id="practice-dashboard-arena">
      {/* Dynamic Module Header Card */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-[#1d1a50] border-2 border-indigo-400 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-pink-500/20 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-8 -left-8 w-44 h-44 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10">
          <button
            onClick={onBackToDashboard}
            className="text-xs font-black text-pink-300 hover:text-pink-100 flex items-center gap-1.5 uppercase tracking-widest mb-1.5 transition-colors cursor-pointer"
          >
            ← Back to Dashboard Hub
          </button>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-black text-white tracking-tight">{module} Interactive Arena</h1>
            <span className="px-3 py-1 bg-gradient-to-r from-emerald-500/25 to-teal-500/25 border border-emerald-400 text-emerald-300 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm animate-pulse">
              Rubric Feedback Enabled
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <a
            href="https://takeielts.britishcouncil.org"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-600 border border-pink-400 rounded-xl text-xs font-black text-white hover:opacity-90 transition-all flex items-center gap-1.5 shadow-md shadow-pink-950/40 cursor-pointer hover:scale-105"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Official BC Syllabus</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>

          {/* Diagnostic config for generator modules */}
          {(module === "Listening" || module === "Reading") && (
            <div className="flex items-center gap-2 bg-indigo-950/60 border border-indigo-800 p-1.5 rounded-xl text-xs">
              <span className="text-indigo-200 font-extrabold px-2">Level:</span>
              {(["Easy", "Medium", "Hard"] as const).map((lvl) => (
                <button
                  key={lvl}
                  id={`btn-level-${lvl}`}
                  onClick={() => {
                    setDifficulty(lvl);
                    // Fetch with new difficulty
                    setTimeout(() => handleFetchExercise(), 100);
                  }}
                  disabled={loading}
                  className={`py-1.5 px-3.5 rounded-lg font-black tracking-wide transition-all cursor-pointer text-xs ${
                    difficulty === lvl
                      ? "bg-gradient-to-r from-emerald-400 to-teal-500 text-teal-950 shadow-md font-bold"
                      : "text-indigo-300 hover:text-white"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-20 flex flex-col items-center justify-center text-center gap-4">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
          <div>
            <h3 className="font-bold text-lg text-slate-800">Synthesizing IELTS Materials</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              We are generating authentic exam-standard prompts, vocab charts, and reading passages matching Band Descriptors.
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-4 max-w-lg mx-auto">
          <AlertCircle className="w-10 h-10 text-rose-500" />
          <div>
            <h3 className="font-bold text-rose-950">Active Server Not Ready</h3>
            <p className="text-xs text-rose-800 leading-relaxed mt-1">
              {error}
            </p>
            <p className="text-[11px] text-rose-600 mt-2">
              Please guarantee you have supplied a valid <strong>GEMINI_API_KEY</strong> inside your AI Studio Workspace Secrets panel.
            </p>
          </div>
          <button
            onClick={handleFetchExercise}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all"
          >
            Attempt Re-load
          </button>
        </div>
      ) : (
        /* CORE ACTIVE EXPERIENCES DIVIDED BY IELTS SKILLS MODULES */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* ============ LISTENING ARENA MODULE ============ */}
          {module === "Listening" && exercise && (
            <>
              {/* Scenario Narrative Side bento */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white border-2 border-sky-100 rounded-3xl p-5 shadow-sm space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-sky-200/20 rounded-full blur-2xl pointer-events-none"></div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest bg-sky-100 border border-sky-200 text-sky-800 px-2.5 py-1 rounded-md shadow-sm">
                      Listening Scenario
                    </span>
                    <span className="text-xs text-sky-600 font-extrabold font-mono">Difficulty: {exercise.difficulty}</span>
                  </div>
                  <h2 className="text-lg font-black text-slate-900 border-b border-sky-50 pb-2 bg-clip-text text-transparent bg-gradient-to-r from-sky-900 to-indigo-900">{exercise.title}</h2>
                  
                  <div className="bg-gradient-to-r from-sky-50 to-indigo-50/50 border-l-4 border-sky-450 rounded-r-2xl p-4 space-y-3 shadow-inner">
                    <p className="text-xs text-indigo-950 font-bold leading-relaxed">
                      <strong>Situation context:</strong> {exercise.situation}
                    </p>
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] font-black text-sky-700 uppercase tracking-wider">Speakers:</span>
                      {exercise.speakers.map((s: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 bg-white border border-sky-200 text-sky-800 rounded-md text-[9px] font-black shadow-sm">{s}</span>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Audio simulation */}
                  <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl p-5 text-white flex flex-col gap-3.5 shadow-lg relative overflow-hidden border border-slate-800">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-md"></div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-emerald-400 animate-bounce" />
                        <span className="text-[11px] font-bold text-slate-350 font-mono tracking-wider uppercase">Audio Player Spec</span>
                      </div>
                      {ttsLoading && <span className="text-[9px] text-emerald-400 font-bold animate-pulse">Synthesizing Voice...</span>}
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        id="btn-play-audio"
                        onClick={toggleAudioPlayback}
                        className="w-12 h-12 bg-gradient-to-tr from-emerald-400 to-teal-500 hover:brightness-110 text-teal-950 font-bold rounded-full flex items-center justify-center cursor-pointer transition-transform duration-150 shadow-md hover:scale-105 shrink-0"
                      >
                        {isPlaying ? <Square className="w-4 h-4 fill-teal-950 text-teal-950" /> : <Play className="w-4.5 h-4.5 fill-teal-950 text-teal-950 translate-x-0.5" />}
                      </button>

                      <div className="flex-1">
                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono mb-1">
                          <span className="text-emerald-400 font-bold">{isPlaying ? "Streaming Speech..." : "Ready to Stream"}</span>
                          <span>UK Standard Neutral</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden relative">
                          <div className={`h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full ${isPlaying ? "w-full animate-[shimmer_5s_infinite_linear]" : "w-1/12"}`}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Academic Tape Script transcript display */}
                  <div className="border border-sky-100 rounded-2xl overflow-hidden shadow-sm">
                    <details className="group">
                      <summary className="list-none flex justify-between items-center p-3 cursor-pointer select-none text-xs font-extrabold text-sky-700 hover:text-sky-800 bg-sky-50/50 hover:bg-sky-50 transition-all">
                        <span>🔓 View English Voice Transcript</span>
                        <ChevronRight className="w-4 h-4 text-sky-400 group-open:rotate-90 transition-transform" />
                      </summary>
                      <div className="p-4 border-t border-sky-100 text-xs text-slate-600 leading-relaxed font-serif max-h-60 overflow-y-auto bg-white whitespace-pre-line">
                        {exercise.transcript}
                      </div>
                    </details>
                  </div>
                </div>
              </div>

              {/* Quiz Module Area */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-slate-900 text-sm">Practice Questions</h3>
                    <span className="text-xs text-slate-500 font-bold">5 Questions total</span>
                  </div>

                  <div className="space-y-6">
                    {exercise.questions.map((q: any, index: number) => {
                      const isCorrect = userAnswers[q.id]?.trim().toLowerCase() === q.answer.trim().toLowerCase();
                      
                      return (
                        <div key={q.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/30 space-y-3">
                          <div className="flex items-start gap-2">
                            <span className="bg-indigo-100 text-indigo-800 rounded font-bold text-xs px-1.5 py-0.5 mt-0.5">{index+1}</span>
                            <p className="text-xs font-semibold text-slate-800">{q.question}</p>
                          </div>

                          {/* Multiple Choice structure */}
                          {q.type === "multiple_choice" && q.options && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                              {q.options.map((opt: string) => {
                                const optLetter = opt.trim().slice(0, 1);
                                const isSelected = userAnswers[q.id] === optLetter;
                                return (
                                  <button
                                    key={opt}
                                    id={`opt-${q.id}-${optLetter}`}
                                    onClick={() => handleAnswerChange(q.id, optLetter)}
                                    disabled={evaluated}
                                    className={`p-2.5 rounded-lg border text-left text-xs font-bold transition-all cursor-pointer ${
                                      isSelected
                                        ? "border-sky-500 bg-sky-600 text-white shadow-md shadow-sky-100/50"
                                        : "border-slate-200 hover:border-sky-300 bg-white text-slate-750"
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {/* True, False, Not Given preset buttons */}
                          {q.type === "true_false_not_given" && (
                            <div className="flex gap-2">
                              {["True", "False", "Not Given"].map((choice) => {
                                const isSelected = userAnswers[q.id] === choice;
                                return (
                                  <button
                                    key={choice}
                                    id={`tfng-${q.id}-${choice}`}
                                    onClick={() => handleAnswerChange(q.id, choice)}
                                    disabled={evaluated}
                                    className={`py-2 px-3.5 rounded-lg border text-xs font-black transition-all cursor-pointer ${
                                      isSelected
                                        ? "border-sky-500 bg-sky-600 text-white shadow-md shadow-sky-100"
                                        : "border-slate-200 hover:border-sky-300 bg-white text-slate-700 hover:bg-sky-50/25"
                                    }`}
                                  >
                                    {choice}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {/* Fill Blank input Box */}
                          {q.type === "fill_blank" && (
                            <input
                              id={`input-blank-${q.id}`}
                              type="text"
                              value={userAnswers[q.id] || ""}
                              onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                              disabled={evaluated}
                              placeholder="Type precise word or numbers here..."
                              className="w-full h-11 text-sm font-bold text-sky-950 rounded-xl border-2 border-indigo-100 px-4 bg-white focus:outline-none focus:ring-4 focus:ring-sky-500/20 focus:border-sky-400 hover:border-sky-200 transition-all font-mono"
                            />
                          )}

                          {/* Evaluation Visualizer */}
                          {evaluated && (
                            <div className="p-2.5 bg-slate-100 rounded-lg flex flex-wrap items-center justify-between text-xs mt-2">
                              <span className="font-semibold text-slate-700">
                                Your Answer: <strong className="text-slate-950">{userAnswers[q.id] || "No answer"}</strong>
                              </span>
                              <span className="flex items-center gap-1.5 font-bold">
                                {isCorrect ? (
                                  <span className="text-emerald-700 flex items-center gap-1">✓ Correct</span>
                                ) : (
                                  <span className="text-rose-700">❌ Target: <strong className="text-slate-950 font-black">{q.answer}</strong></span>
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Submission and evaluation controllers */}
                  {!evaluated ? (
                    <button
                      id="btn-submit-listening"
                      onClick={handleGradeListeningOrReading}
                      disabled={grading}
                      className="w-full h-[50px] bg-gradient-to-r from-sky-500 via-indigo-500 to-pink-500 hover:brightness-110 active:scale-98 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
                    >
                      {grading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Marking exam sheets...
                        </>
                      ) : (
                        "Submit Test Panel Answers"
                      )}
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleFetchExercise}
                        className="flex-1 h-[50px] border-2 border-sky-400 bg-sky-50 text-indigo-950 text-xs font-black rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1.5 hover:bg-sky-100"
                      >
                        <RefreshCw className="w-4 h-4 text-sky-500" />
                        Next Scenario Exercise
                      </button>
                      <button
                        onClick={onBackToDashboard}
                        className="h-[50px] bg-gradient-to-r from-indigo-600 to-pink-600 hover:brightness-110 text-white text-xs font-black px-6 rounded-2xl transition-all cursor-pointer flex items-center justify-center uppercase tracking-wider shadow-md"
                      >
                        Return Home Hub
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ============ READING ARENA MODULE ============ */}
          {module === "Reading" && exercise && (
            <>
              {/* Passage split pane */}
              <div className="lg:col-span-6 space-y-4">
                <div className="bg-white border-2 border-emerald-100 rounded-3xl p-6 shadow-md shadow-emerald-50/50 space-y-4 max-h-[750px] overflow-y-auto relative border-l-8 border-l-emerald-500">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200/10 rounded-full blur-2xl pointer-events-none"></div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1 rounded-md shadow-xs animate-pulse">
                      IELTS Reading Academic
                    </span>
                    <span className="text-xs text-emerald-600 font-extrabold bg-emerald-100/40 border border-emerald-150 rounded-lg px-2 py-0.5">{exercise.passageType} Genre</span>
                  </div>
                  <h2 className="text-xl font-black text-slate-950 leading-tight border-b-2 border-emerald-100/70 pb-3 bg-clip-text text-transparent bg-gradient-to-r from-emerald-950 to-teal-950">{exercise.title}</h2>
                  
                  {/* Reading paragraphs */}
                  <div className="text-xs text-slate-800 leading-relaxed font-serif space-y-4 whitespace-pre-line text-justify pl-1 pr-2">
                    {exercise.passage}
                  </div>
                </div>
              </div>

              {/* Comprehension Quiz pane */}
              <div className="lg:col-span-6 space-y-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5 max-h-[750px] overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-slate-900 text-sm">Passage Questions</h3>
                    <span className="text-xs bg-slate-100 px-2.5 py-0.5 rounded-full font-bold">5 Questions</span>
                  </div>

                  <div className="space-y-5">
                    {exercise.questions.map((q: any, index: number) => {
                      const isCorrect = userAnswers[q.id]?.trim().toLowerCase() === q.answer.trim().toLowerCase();
                      
                      return (
                        <div key={q.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/20 space-y-3">
                          <div className="flex items-start gap-2">
                            <span className="bg-indigo-600 text-white rounded font-bold text-xs px-1.5 py-0.5 mt-0.5">{index+1}</span>
                            <p className="text-xs font-semibold text-slate-800">{q.question}</p>
                          </div>

                          {/* Options multiple_choice */}
                          {q.type === "multiple_choice" && q.options && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                              {q.options.map((opt: string) => {
                                const optLetter = opt.trim().slice(0, 1);
                                const isSelected = userAnswers[q.id] === optLetter;
                                return (
                                  <button
                                    key={opt}
                                    id={`opt-reading-${q.id}-${optLetter}`}
                                    onClick={() => handleAnswerChange(q.id, optLetter)}
                                    disabled={evaluated}
                                    className={`p-2.5 rounded-lg border text-left text-xs font-bold transition-all cursor-pointer ${
                                      isSelected
                                        ? "border-emerald-500 bg-emerald-600 text-white font-black shadow-md shadow-emerald-100"
                                        : "border-slate-200 hover:border-emerald-300 bg-white text-slate-700 hover:bg-emerald-50/20"
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {/* TFNG choices */}
                          {q.type === "true_false_not_given" && (
                            <div className="flex gap-2">
                              {["True", "False", "Not Given"].map((choice) => {
                                const isSelected = userAnswers[q.id] === choice;
                                return (
                                  <button
                                    key={choice}
                                    id={`tfng-reading-${q.id}-${choice}`}
                                    onClick={() => handleAnswerChange(q.id, choice)}
                                    disabled={evaluated}
                                    className={`py-2 px-3.5 rounded-lg border text-xs font-black transition-all cursor-pointer ${
                                      isSelected
                                        ? "border-emerald-500 bg-emerald-600 text-white shadow-md shadow-emerald-100"
                                        : "border-slate-200 hover:border-emerald-300 bg-white text-slate-700 hover:bg-emerald-50/20"
                                    }`}
                                  >
                                    {choice}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {/* Fill Blank box */}
                          {q.type === "fill_blank" && (
                            <input
                              id={`input-reading-blank-${q.id}`}
                              type="text"
                              value={userAnswers[q.id] || ""}
                              onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                              disabled={evaluated}
                              placeholder="Type answer words..."
                              className="w-full h-11 text-sm font-bold text-emerald-950 rounded-xl border-2 border-emerald-100 px-4 bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-400 hover:border-emerald-250 transition-all font-mono"
                            />
                          )}

                          {/* Correct Ans banner */}
                          {evaluated && (
                            <div className="p-2.5 bg-slate-100 rounded-lg flex flex-wrap items-center justify-between text-xs mt-2">
                              <span>
                                Your Answer: <strong className="text-slate-950">{userAnswers[q.id] || "None"}</strong>
                              </span>
                              <span className="flex items-center gap-1.5 font-bold">
                                {isCorrect ? (
                                  <span className="text-emerald-700 flex items-center gap-1">✓ Correct</span>
                                ) : (
                                  <span className="text-rose-700">❌ Target: <strong className="text-slate-950">{q.answer}</strong></span>
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {!evaluated ? (
                    <button
                      id="btn-submit-reading"
                      onClick={handleGradeListeningOrReading}
                      disabled={grading}
                      className="w-full h-[50px] bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:brightness-110 active:scale-98 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-100"
                    >
                      {grading ? "Submitting exam forms..." : "Submit Reading Test answers"}
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleFetchExercise}
                        className="flex-1 h-[50px] border-2 border-emerald-400 bg-emerald-50 text-emerald-900 text-xs font-black rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1.5 hover:bg-emerald-100"
                      >
                        <RefreshCw className="w-4 h-4 text-emerald-500" />
                        Next Passages Set
                      </button>
                      <button
                        onClick={onBackToDashboard}
                        className="h-[50px] bg-gradient-to-r from-indigo-600 to-teal-600 hover:brightness-110 text-white text-xs font-black px-6 rounded-2xl transition-all cursor-pointer flex items-center justify-center uppercase tracking-wider"
                      >
                        Dashboard Hub
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ============ WRITING ARENA MODULE ============ */}
          {module === "Writing" && (
            <>
              {/* Left sidebar writing presets */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-gradient-to-br from-purple-950 via-purple-900 to-[#3c1475] border-2 border-purple-400 rounded-3xl p-5 shadow-lg space-y-4 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/10 rounded-full blur-xl pointer-events-none"></div>
                  <h3 className="font-black text-purple-200 text-xs uppercase tracking-widest">Select Writing Prompt</h3>
                  <div className="space-y-2.5">
                    {writingPromptsList.map((preset) => (
                      <button
                        key={preset.title}
                        onClick={() => handleSelectWritingPromptPreset(preset)}
                        className={`w-full p-4 rounded-2xl border text-left text-[11px] transition-all space-y-2 cursor-pointer block ${
                          writingPrompt === preset.prompt
                            ? "border-pink-400 bg-white/10 shadow-lg text-white font-extrabold"
                            : "border-purple-800/60 hover:border-purple-500 bg-purple-950/40 text-purple-100 hover:bg-purple-900/40"
                        }`}
                      >
                        <div className="flex justify-between items-center gap-2">
                          <span className="font-black text-white text-[11px] leading-tight">{preset.title}</span>
                          <span className="text-[9px] font-black px-1.5 py-0.5 bg-pink-500 text-white rounded-md uppercase font-mono tracking-wider shrink-0 shadow-sm">{preset.type.split(" ")[1]}</span>
                        </div>
                        <p className={`line-clamp-2 text-[10px] leading-relaxed ${writingPrompt === preset.prompt ? 'text-pink-200 font-medium' : 'text-purple-300'}`}>{preset.prompt}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Main writing workbench grid */}
              <div className="lg:col-span-8 space-y-4">
                {writingAssessment ? (
                  // Scoring criteria breakdown bento dashboard
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-100">
                          Examiner Evaluated
                        </span>
                        <h2 className="text-lg font-bold text-slate-950 mt-1">Diagnostic Grader Sheet Verdict</h2>
                      </div>
                      <div className="flex items-baseline gap-1.5 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-xl">
                        <span className="text-sm font-bold text-indigo-700">Overall Band:</span>
                        <span className="text-3xl font-black text-indigo-700">{writingAssessment.overallBand}</span>
                      </div>
                    </div>

                    {/* Criteria bento metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-center space-y-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Task Response</div>
                        <div className="text-2xl font-black text-slate-800">Band {writingAssessment.scores.taskAchievement}</div>
                      </div>
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-center space-y-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Cohesion / Coherence</div>
                        <div className="text-2xl font-black text-slate-800">Band {writingAssessment.scores.coherenceCohesion}</div>
                      </div>
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-center space-y-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Lexical Resource</div>
                        <div className="text-2xl font-black text-slate-800">Band {writingAssessment.scores.lexicalResource}</div>
                      </div>
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-center space-y-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Grammar Range</div>
                        <div className="text-2xl font-black text-slate-800">Band {writingAssessment.scores.grammaticalRange}</div>
                      </div>
                    </div>

                    {/* Feedback tabs/accordions */}
                    <div className="space-y-4">
                      <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Examiner Criteria Commentary</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
                          <h4 className="font-bold text-xs text-indigo-600">Task Achievement Evaluation</h4>
                          <p className="text-xs text-slate-600 leading-relaxed font-serif">{writingAssessment.feedback.taskAchievement}</p>
                        </div>
                        <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
                          <h4 className="font-bold text-xs text-indigo-600">Structure Cohesion Comments</h4>
                          <p className="text-xs text-slate-600 leading-relaxed font-serif">{writingAssessment.feedback.coherenceCohesion}</p>
                        </div>
                        <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
                          <h4 className="font-bold text-xs text-indigo-600">Lexical Resource (Vocabulary)</h4>
                          <p className="text-xs text-slate-600 leading-relaxed font-serif">{writingAssessment.feedback.lexicalResource}</p>
                        </div>
                        <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
                          <h4 className="font-bold text-xs text-indigo-600">Grammatical Syntax Accuracy</h4>
                          <p className="text-xs text-slate-600 leading-relaxed font-serif">{writingAssessment.feedback.grammaticalRange}</p>
                        </div>
                      </div>
                    </div>

                    {/* Sentence level corrections */}
                    {writingAssessment.corrections && writingAssessment.corrections.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="font-bold text-xs text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4" />
                          Recommended Sentence Level Fixes
                        </h3>
                        <div className="space-y-2.5">
                          {writingAssessment.corrections.map((corr: any, idx: number) => (
                            <div key={idx} className="p-3 bg-rose-50/60 border border-rose-100 rounded-xl flex flex-col gap-1.5">
                              <p className="text-xs line-through text-slate-500 font-mono">"{corr.original}"</p>
                              <p className="text-xs font-bold text-emerald-800 font-mono">⚡ Refinement: "{corr.revised}"</p>
                              <p className="text-[10px] text-slate-600 font-sans italic">Why? {corr.explanation}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sample Answer bento */}
                    <div className="space-y-2 bg-indigo-50/35 border border-indigo-100 p-4 rounded-xl">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-extrabold text-indigo-900 uppercase">Official Model Band 9.0 Essay Response</h4>
                        <span className="px-1.5 py-0.5 bg-indigo-200 text-indigo-800 text-[9px] font-bold rounded uppercase">Benchmark</span>
                      </div>
                      <p className="text-xs text-slate-700 font-serif leading-relaxed whitespace-pre-line text-justify pl-1">
                        {writingAssessment.modelAnswer}
                      </p>
                    </div>

                    <button
                      onClick={() => setWritingAssessment(null)}
                      className="w-full h-11 bg-gradient-to-r from-purple-800 to-indigo-805 hover:brightness-115 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center uppercase tracking-wider shadow-sm"
                    >
                      Write Another Essay Submission
                    </button>
                  </div>
                ) : (
                  // Typing essay playground
                  <div className="bg-white border-2 border-purple-100 rounded-3xl p-6 shadow-md shadow-purple-50/50 space-y-4">
                    <div className="p-4 bg-purple-50/40 rounded-2xl border border-purple-100/50 space-y-1.5 border-l-4 border-l-purple-500">
                      <div className="flex justify-between text-[11px] text-purple-600 font-black uppercase tracking-widest">
                        <span>Current Prompt</span>
                        <span>{writingTaskType}</span>
                      </div>
                      <p className="text-xs text-slate-800 leading-relaxed font-bold">{writingPrompt}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label htmlFor="textarea-essay-body" className="block text-xs font-black text-slate-700">Your Structured Essay Response</label>
                        <span className={`text-[11px] font-black ${countWords(writingResponse) >= 250 ? "text-emerald-700 bg-emerald-50 border border-emerald-155 px-2 py-0.5 rounded-md" : "text-amber-700 bg-amber-50 border border-amber-155 px-2 py-0.5 rounded-md"}`} id="essay-counter">
                          Word Count: {countWords(writingResponse)} words {countWords(writingResponse) >= 250 ? "(✓ Threshold Met)" : "(Recommend min. 250 for Task 2)"}
                        </span>
                      </div>
                      <textarea
                        id="textarea-essay-body"
                        rows={14}
                        value={writingResponse}
                        onChange={(e) => setWritingResponse(e.target.value)}
                        placeholder="Write your thesis, arguments, and subsequent summary here using paragraph segments..."
                        className="w-full text-slate-800 rounded-2xl border-2 border-purple-100 bg-white p-5 text-xs font-serif leading-relaxed placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-purple-500/15 focus:border-purple-400 hover:border-purple-200 transition-all shadow-inner"
                      />
                    </div>

                    <button
                      id="btn-evaluate-writing"
                      onClick={handleEvaluateWriting}
                      disabled={grading}
                      className="w-full h-[52px] bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:brightness-110 active:scale-98 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-purple-100 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {grading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          AI Evaluating Grammar & Band Levels...
                        </>
                      ) : (
                        <>
                          Submit Writing to Expert Evaluator
                          <Send className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ============ SPEAKING ARENA MODULE ============ */}
          {module === "Speaking" && exercise && (
            <>
              {/* Cue topics menu sidebar */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-gradient-to-br from-amber-950 via-amber-900 to-[#78350f] border-2 border-amber-400 rounded-3xl p-5 shadow-lg space-y-4 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-xl pointer-events-none"></div>
                  <h3 className="font-black text-amber-200 text-xs uppercase tracking-widest">Examiner Cue Presets</h3>
                  <div className="space-y-2">
                    {speakingPromptsList.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => handleSelectSpeakingTopic(preset)}
                        className={`w-full p-4 rounded-2xl border text-left text-xs transition-all flex flex-col gap-1.5 cursor-pointer block ${
                          exercise.id === preset.id
                            ? "border-amber-450 bg-white/10 text-white font-extrabold shadow-md"
                            : "border-amber-800/60 hover:border-amber-500 bg-amber-950/40 text-amber-150 hover:bg-amber-900/40"
                        }`}
                      >
                        <div className="flex justify-between items-center text-[10px] text-amber-300">
                          <span>Part {preset.part} Interview</span>
                          <span className="bg-amber-500 text-white rounded-md px-1.5 py-0.5 text-[9px] uppercase font-mono tracking-wider font-extrabold">{preset.prompts.length} Prompts</span>
                        </div>
                        <h4 className={`font-black ${exercise.id === preset.id ? 'text-white text-sm' : 'text-amber-100'}`}>{preset.topic}</h4>
                      </button>
                    ))}
                  </div>

                  <div className="p-4 bg-white/5 rounded-2xl border border-amber-400/40 backdrop-blur-xs">
                    <h4 className="text-[11px] font-black text-amber-300 flex items-center gap-1.5 uppercase tracking-wide">🎤 Speaking Microphone Tip</h4>
                    <p className="text-[10px] text-amber-200 mt-1 lines-relaxed leading-relaxed font-semibold">
                      Make sure your browser permits microphone access. Speak continuously for 30-60 secs. Press standard save before moving questions.
                    </p>
                  </div>
                </div>
              </div>

              {/* Speech interaction workspace */}
              <div className="lg:col-span-8 space-y-4">
                {speakingAssessment ? (
                  // Grade display
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-100">
                          Examiner Evaluated
                        </span>
                        <h2 className="text-lg font-bold text-slate-950 mt-1">Speaking Diagnostic Score Sheet</h2>
                      </div>
                      <div className="flex items-baseline gap-1.5 bg-amber-50 border border-amber-100 px-4 py-2 rounded-xl">
                        <span className="text-sm font-bold text-amber-700">Estimated Band:</span>
                        <span className="text-3xl font-black text-amber-750">{speakingAssessment.estimatedBand}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center space-y-0.5">
                        <div className="text-[9px] font-bold text-slate-400 uppercase">Fluency & Cohesion</div>
                        <div className="text-xl font-black text-slate-800">Band {speakingAssessment.scores.fluencyCoherence}</div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center space-y-0.5">
                        <div className="text-[9px] font-bold text-slate-400 uppercase">Lexical Diversity</div>
                        <div className="text-xl font-black text-slate-800">Band {speakingAssessment.scores.lexicalResource}</div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center space-y-0.5">
                        <div className="text-[9px] font-bold text-slate-400 uppercase">Grammar Range</div>
                        <div className="text-xl font-black text-slate-800">Band {speakingAssessment.scores.grammaticalRange}</div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center space-y-0.5">
                        <div className="text-[9px] font-bold text-slate-400 uppercase">Pronunciation</div>
                        <div className="text-xl font-black text-slate-800">Band {speakingAssessment.scores.pronunciation}</div>
                      </div>
                    </div>

                    {/* strengths / improvements panels */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-emerald-50/20 border border-emerald-100 rounded-xl space-y-1.5">
                        <h4 className="font-bold text-xs text-emerald-800 uppercase tracking-wider">Estimated Positives / Strengths</h4>
                        <ul className="space-y-1 list-disc list-inside text-xs text-slate-600">
                          {speakingAssessment.strengths.map((str: string, i: number) => (
                            <li key={i}>{str}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-4 bg-amber-50/20 border border-amber-100 rounded-xl space-y-1.5">
                        <h4 className="font-bold text-xs text-amber-800 uppercase tracking-wider">Actionable Improvement Points</h4>
                        <ul className="space-y-1 list-disc list-inside text-xs text-slate-600">
                          {speakingAssessment.improvements.map((imp: string, i: number) => (
                            <li key={i}>{imp}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* idiom replacement list */}
                    {speakingAssessment.modelBetterPhrases && speakingAssessment.modelBetterPhrases.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-indigo-900 font-bold text-xs uppercase tracking-wider">Suggested Cohesion & Vocabulary Upgrades</h4>
                        <div className="space-y-2">
                          {speakingAssessment.modelBetterPhrases.map((el: any, i: number) => (
                            <div key={i} className="p-3 bg-indigo-50/40 border border-indigo-100 rounded-xl flex justify-between gap-4 text-xs font-mono">
                              <span className="text-slate-500">Declared: "{el.user}"</span>
                              <span className="font-bold text-indigo-700 text-right">⚡ Band 9.0: "{el.better}"</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => setSpeakingAssessment(null)}
                      className="w-full h-11 bg-gradient-to-r from-amber-600 to-orange-600 hover:brightness-110 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center uppercase tracking-wider shadow-sm"
                    >
                      Conduct Another Speaking Presets Session
                    </button>
                  </div>
                ) : (
                  // Active Prompt Loop Cards
                  <div className="bg-white border-2 border-amber-100 rounded-3xl p-6 shadow-md shadow-amber-50/50 space-y-5">
                    <div className="flex justify-between items-center bg-gradient-to-r from-amber-50 to-orange-50/40 p-4 border border-amber-150 rounded-2xl">
                      <div>
                        <span className="text-[10px] text-amber-600 font-extrabold uppercase block tracking-wider">IELTS SPEAKING PART {exercise.part}</span>
                        <span className="font-extrabold text-xs text-amber-950">{exercise.topic}</span>
                      </div>
                      <span className="px-3 py-1.5 bg-amber-100 text-amber-850 text-xs font-black rounded-lg border border-amber-200">
                        Prompt {activePromptIndex + 1} of {exercise.prompts.length}
                      </span>
                    </div>

                    {/* Question read box */}
                    <div className="p-4 border border-indigo-100 bg-indigo-50/35 rounded-xl flex items-center gap-3">
                      <button
                        onClick={() => handleTriggerTTS(exercise.prompts[activePromptIndex])}
                        disabled={ttsLoading}
                        className="w-10 h-10 rounded-xl bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center cursor-pointer shrink-0 shadow-sm shadow-amber-100 animate-pulse"
                        title="Say this question out loud"
                      >
                        <Volume2 className="w-5 h-5" />
                      </button>
                      <p className="text-sm font-bold text-slate-900 leading-relaxed font-serif">
                        "{exercise.prompts[activePromptIndex]}"
                      </p>
                    </div>

                    {/* Recorded outputs list */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs text-slate-700 font-bold">
                        <span>Your Voice Transcript</span>
                        <div className="flex items-center gap-2">
                          <button
                            id="btn-toggle-recording"
                            onClick={toggleRecording}
                            className={`flex items-center gap-1.5 py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer ${
                              isRecording
                                ? "bg-gradient-to-r from-rose-500 to-orange-500 hover:brightness-110 text-white animate-pulse shadow-md"
                                : "bg-amber-50 hover:bg-amber-100 text-amber-800 border-2 border-amber-100 animate-none"
                            }`}
                          >
                            {isRecording ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-amber-600" />}
                            {isRecording ? "Stop Capture" : "Start Voice Capture"}
                          </button>
                        </div>
                      </div>

                      <textarea
                        id="textarea-speaking-transcript"
                        rows={5}
                        value={speakingTextResponse}
                        onChange={(e) => setSpeakingTextResponse(e.target.value)}
                        placeholder="Start speaking by pressing the microphone trigger or manually type your interview answer here directly as fallback..."
                        className="w-full rounded-2xl border-2 border-amber-100 p-4 text-xs bg-slate-50/50 font-serif leading-relaxed placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-amber-500/15 focus:border-amber-400"
                      />
                    </div>

                    {recognitionError && (
                      <p className="text-[11px] text-amber-700 font-medium bg-amber-50/50 p-2 rounded-lg border border-amber-100/70">{recognitionError}</p>
                    )}

                    <div className="flex gap-2 justify-end border-t border-slate-100 pt-4">
                      <button
                        id="btn-save-speak-prompt"
                        onClick={handleSaveSpeakingResponse}
                        className="h-11 px-6 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm shadow-amber-100"
                      >
                        <Check className="w-4 h-4" />
                        Save Prompt Answer
                      </button>
                    </div>

                    {/* Dashboard array displays */}
                    <div className="space-y-2 border-t border-slate-100 pt-4">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saved Answers for general evaluation</h4>
                      <div className="space-y-2">
                        {exercise.prompts.map((p: string, idx: number) => {
                          const hasAns = !!speakingResponses[idx];
                          return (
                            <div key={idx} className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                              <p className="font-semibold text-slate-600 text-[11px]">Prompt {idx+1}: "{p}"</p>
                              {hasAns ? (
                                <p className="font-medium text-slate-800">Transcript: <span className="font-serif italic font-normal">"{speakingResponses[idx]}"</span></p>
                              ) : (
                                <p className="text-slate-400 text-[10px] italic">No response stored yet</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {speakingResponses.filter(r => !!r).length > 0 && (
                      <button
                        id="btn-evaluate-speaking"
                        onClick={handleEvaluateSpeaking}
                        disabled={grading}
                        className="w-full h-11 bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 hover:brightness-110 active:scale-98 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-amber-100 transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        {grading ? "Examiner analysing phrasing..." : "Compute Total Pronunciation & Band Assessment"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

        </div>
      )}
    </div>
  );
}
