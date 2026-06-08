export type IELTSModule = "Listening" | "Reading" | "Writing" | "Speaking";

export interface StudyPlanItem {
  day: number;
  topic: string;
  details: string;
  duration: string;
  focusModule: IELTSModule;
  completed?: boolean;
}

export interface PersonalizedStudyPlan {
  examType: "Academic" | "General Training";
  targetBand: number;
  daysRemaining: number;
  weaknesses: string;
  overallStrategy: string;
  dailyTasks: StudyPlanItem[];
  weeklyMilestones: string[];
}

// Listening Structure
export interface IELTSQuestion {
  id: number;
  type: "multiple_choice" | "true_false_not_given" | "fill_blank";
  question: string;
  options?: string[]; // Used for multiple_choice and true_false_not_given
  answer: string;
}

export interface IELTSListeningExercise {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  situation: string;
  speakers: string[];
  transcript: string;
  questions: IELTSQuestion[];
}

// Reading Structure
export interface IELTSReadingExercise {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  passageType: "Science" | "History" | "Business" | "Culture";
  passage: string;
  questions: IELTSQuestion[];
}

// Writing Structure
export interface IELTSWritingAssessment {
  overallBand: number;
  scores: {
    taskAchievement: number;
    coherenceCohesion: number;
    lexicalResource: number;
    grammaticalRange: number;
  };
  feedback: {
    taskAchievement: string;
    coherenceCohesion: string;
    lexicalResource: string;
    grammaticalRange: string;
  };
  corrections: Array<{
    original: string;
    revised: string;
    explanation: string;
  }>;
  modelAnswer: string;
}

// Speaking Structure
export interface IELTSSpeakingSection {
  id: string;
  part: number;
  topic: string;
  prompts: string[];
}

export interface IELTSSpeakingAssessment {
  estimatedBand: number;
  scores: {
    fluencyCoherence: number;
    lexicalResource: number;
    grammaticalRange: number;
    pronunciation: number;
  };
  strengths: string[];
  improvements: string[];
  modelBetterPhrases: Array<{
    user: string;
    better: string;
  }>;
}

// Practice History Item
export interface PracticeSession {
  id: string;
  module: IELTSModule;
  title: string;
  timestamp: string;
  userAnswers?: Record<number, string>;
  writingResponse?: string;
  speakingTranscript?: string;
  metrics: {
    score?: string; // e.g. "8/10"
    band: number; // calculated IELTS band e.g. 7.5
  };
  feedbackMarkdown: string;
}

export interface IELTSFlashcard {
  id: string;
  word: string;
  definition: string;
  topic: string;
  synonyms: string[];
  exampleSentence: string;
  ieltsContext: string;
  pronunciationTip?: string;
  mastered?: boolean;
}

