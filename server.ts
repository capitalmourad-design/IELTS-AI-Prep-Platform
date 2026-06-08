import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Helper to check API Key before initializing
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing. Please add it in Settings > Secrets.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// 1. Personalized Study Plan Generator
app.post("/api/gemini/study-plan", async (req, res) => {
  try {
    const { examType, targetBand, daysRemaining, weaknesses } = req.body;
    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Generate a comprehensive, highly personalized study preparation plan for an IELTS student. 
      Exam Type: ${examType}
      Target Overall Band: ${targetBand}
      Days Remaining until Exam: ${daysRemaining}
      Identified Weaknesses: ${weaknesses || "None stated"}
      
      Provide a strong overarching preparation strategy, daily milestones, and task allocations matching the active modules.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            examType: { type: Type.STRING },
            targetBand: { type: Type.NUMBER },
            daysRemaining: { type: Type.NUMBER },
            weaknesses: { type: Type.STRING },
            overallStrategy: { type: Type.STRING },
            dailyTasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.INTEGER },
                  topic: { type: Type.STRING },
                  details: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  focusModule: { type: Type.STRING, description: "Must be: Listening, Reading, Writing, or Speaking" }
                },
                required: ["day", "topic", "details", "duration", "focusModule"]
              }
            },
            weeklyMilestones: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["examType", "targetBand", "daysRemaining", "weaknesses", "overallStrategy", "dailyTasks", "weeklyMilestones"]
        }
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Error generating study plan:", error);
    res.status(500).json({ error: error.message || "Failed to generate study plan" });
  }
});

// 2. Dynamic IELTS Listening Exercise Generator
app.post("/api/gemini/generate-listening", async (req, res) => {
  try {
    const { difficulty } = req.body; // Easy, Medium, Hard
    const ai = getGeminiClient();

    const sectionPromptMap = {
      Easy: "a daily conversational context (e.g. general travel guide, booking a flat) with simple transactions",
      Medium: "a public communication or informative exchange (e.g. radio broadcast guide, town council discussion)",
      Hard: "an advanced educational context or high-level dialogue (e.g. academic advisory talk, lecture presentation on nanotechnology)"
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Generate a realistic IELTS Listening Section scenario matching a difficulty level of '${difficulty}'.
      This should focus on ${sectionPromptMap[difficulty as keyof typeof sectionPromptMap || "Medium"]}.
      Ensure the resulting script feels naturally spoken with typical pauses or clarifications.
      Provide 5 solid practice questions:
      - 2 Multiple Choice questions (with 3-4 options)
      - 2 Fill in the Blank questions
      - 1 True/False/Not Given question
      Include correct answers and option lists.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            situation: { type: Type.STRING },
            difficulty: { type: Type.STRING },
            speakers: { type: Type.ARRAY, items: { type: Type.STRING } },
            transcript: { type: Type.STRING, description: "Full spoken script of the scenario suitable for IELTS listening narrative." },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  type: { type: Type.STRING, description: "Must be: multiple_choice, true_false_not_given, or fill_blank" },
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Required if multiple_choice or true_false_not_given." },
                  answer: { type: Type.STRING, description: "Correct answer (e.g., option letter like 'A', word like 'True', or precise word/phrase for fill_blank)" }
                },
                required: ["id", "type", "question", "answer"]
              }
            }
          },
          required: ["title", "situation", "difficulty", "speakers", "transcript", "questions"]
        }
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Error generating listening exercise:", error);
    res.status(500).json({ error: error.message || "Failed to generate listening test" });
  }
});

// 3. Dynamic IELTS Reading Exercise Generator
app.post("/api/gemini/generate-reading", async (req, res) => {
  try {
    const { difficulty, passageType } = req.body; // Easy/Medium/Hard, Science/History/Business/Culture
    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Generate a realistic IELTS Reading Passage around ${passageType}. The difficulty level must be strictly '${difficulty}'.
      Write a highly detailed reading passage of approximately 400-500 words representing formal academic journal articles or quality educational guides.
      Structure it into clear sub-headed paragraphs.
      Then, provide exactly 5 practice questions testing comprehensive reading comprehension:
      - 2 Multiple choice questions
      - 2 Statement Validation (True/False/Not Given) questions
      - 1 Sentence Completion (Fill in the blank) question
      Include clear answers for each!`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            passageType: { type: Type.STRING },
            difficulty: { type: Type.STRING },
            passage: { type: Type.STRING, description: "Rich, formal passage formatted with paragraph titles/headers." },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  type: { type: Type.STRING, description: "Must be: multiple_choice, true_false_not_given, or fill_blank" },
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Choices list if MCQ or statement." },
                  answer: { type: Type.STRING, description: "Detailed absolute target answer" }
                },
                required: ["id", "type", "question", "answer"]
              }
            }
          },
          required: ["title", "passageType", "difficulty", "passage", "questions"]
        }
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Error generating reading exercise:", error);
    res.status(500).json({ error: error.message || "Failed to generate reading test" });
  }
});

// 4. IELTS Writing Evaluator
app.post("/api/gemini/grade-writing", async (req, res) => {
  try {
    const { taskType, prompt, userSubmission } = req.body;
    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `You are an expert official IELTS Writing examiner. Evaluate the student's submission in detail.
      Task Category: ${taskType}   (e.g., Task 1 Academic graph report, Task 1 General letter, Task 2 Essay)
      Examiner Prompt Details: "${prompt}"
      User Essay Response:
      -----------
      ${userSubmission}
      -----------
      
      Score the student strictly using official IELTS writing criteria:
      1. Task Achievement / Task Response
      2. Coherence and Cohesion
      3. Lexical Resource (Vocabulary diversity & precision)
      4. Grammatical Range and Accuracy
      
      Return precise criteria-focused feedback, point out grammatical highlights/corrections, list 3-4 sentence level fixes, and supply a Model Answer achieving a Band 9.0 level.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallBand: { type: Type.NUMBER },
            scores: {
              type: Type.OBJECT,
              properties: {
                taskAchievement: { type: Type.NUMBER },
                coherenceCohesion: { type: Type.NUMBER },
                lexicalResource: { type: Type.NUMBER },
                grammaticalRange: { type: Type.NUMBER }
              },
              required: ["taskAchievement", "coherenceCohesion", "lexicalResource", "grammaticalRange"]
            },
            feedback: {
              type: Type.OBJECT,
              properties: {
                taskAchievement: { type: Type.STRING },
                coherenceCohesion: { type: Type.STRING },
                lexicalResource: { type: Type.STRING },
                grammaticalRange: { type: Type.STRING }
              },
              required: ["taskAchievement", "coherenceCohesion", "lexicalResource", "grammaticalRange"]
            },
            corrections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  original: { type: Type.STRING },
                  revised: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ["original", "revised", "explanation"]
              }
            },
            modelAnswer: { type: Type.STRING }
          },
          required: ["overallBand", "scores", "feedback", "corrections", "modelAnswer"]
        }
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Error grading IELTS writing:", error);
    res.status(500).json({ error: error.message || "Failed to grade writing task" });
  }
});

// 5. IELTS Speaking Evaluator
app.post("/api/gemini/grade-speaking", async (req, res) => {
  try {
    const { part, topic, transcript } = req.body;
    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Roleplay as a senior IELTS Speaking examiner. Grade the following speech transcript.
      Speaking Exam Part: Part ${part}
      Prompts / Topic Focus: "${topic}"
      Spoken Transcript Response:
      -----------
      ${transcript}
      -----------
      
      Assess the verbal quality according to standard descriptors:
      1. Fluency and Coherence
      2. Lexical Resource
      3. Grammatical Range and Accuracy
      4. Pronunciation estimate (based on structural tone, lexical pacing, and phonological clarity of their choices)
      
      List core positive strengths, actionable tips for vocabulary expansion, and structural replacements (idioms/collocations) where they could elevate their response.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            estimatedBand: { type: Type.NUMBER },
            scores: {
              type: Type.OBJECT,
              properties: {
                fluencyCoherence: { type: Type.NUMBER },
                lexicalResource: { type: Type.NUMBER },
                grammaticalRange: { type: Type.NUMBER },
                pronunciation: { type: Type.NUMBER }
              },
              required: ["fluencyCoherence", "lexicalResource", "grammaticalRange", "pronunciation"]
            },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
            modelBetterPhrases: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  user: { type: Type.STRING },
                  better: { type: Type.STRING }
                },
                required: ["user", "better"]
              }
            }
          },
          required: ["estimatedBand", "scores", "strengths", "improvements", "modelBetterPhrases"]
        }
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Error grading IELTS speaking:", error);
    res.status(500).json({ error: error.message || "Failed to grade speaking task" });
  }
});

// 5b. Dynamic IELTS Flashcard Generator
app.post("/api/gemini/generate-flashcards", async (req, res) => {
  try {
    const { topic } = req.body;
    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Generate exactly 5 highly-relevant, advanced IELTS academic vocabulary words, high-frequency phrasal verbs, collocations, or elite idioms corresponding to the topic: "${topic}".
      These should represent C1/C2 advanced language levels suitable to boost Lexical Resource scores to Band 8.5+.
      For each card, provide:
      - the target word/collocation/idiom
      - a concise, clear definition
      - the topic name (capitalized, e.g., "Architecture", "Renewable Energy", "Cohesive Connectors")
      - a list of 3-4 advanced synonyms
      - a rigorous illustrative Academic example sentence
      - an examiners advisory tip on how to deploy this in IELTS Listening, Reading, Speaking, or Writing Task 1/2 to secure maximum points
      - pronunciation guideline/tip`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            flashcards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  definition: { type: Type.STRING },
                  topic: { type: Type.STRING },
                  synonyms: { type: Type.ARRAY, items: { type: Type.STRING } },
                  exampleSentence: { type: Type.STRING },
                  ieltsContext: { type: Type.STRING, description: "Examiner guidelines for IELTS scoring context." },
                  pronunciationTip: { type: Type.STRING, description: "Guideline on pronunciation cadence and stressed syllables." }
                },
                required: ["word", "definition", "topic", "synonyms", "exampleSentence", "ieltsContext", "pronunciationTip"]
              }
            }
          },
          required: ["flashcards"]
        }
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Error generating IELTS flashcards:", error);
    res.status(500).json({ error: error.message || "Failed to generate dynamic flashcards" });
  }
});

// 6. Text-to-Speech (TTS) Proxy for Listening / Speaking questions
app.post("/api/gemini/tts", async (req, res) => {
  try {
    const { text, voice } = req.body;
    const selectedVoice = voice || "Zephyr"; 
    const ai = getGeminiClient();

    // Use gemini-3.1-flash-tts-preview
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            // Options: 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
            prebuiltVoiceConfig: { voiceName: selectedVoice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      res.json({ audioBase64: base64Audio });
    } else {
      res.json({ audioBase64: null, fallback: true, reason: "No inline data detected" });
    }
  } catch (error: any) {
    const errText = error ? error.message || String(error) : "";
    if (errText.includes("429") || errText.includes("Quota") || errText.includes("quota") || errText.includes("RESOURCE_EXHAUSTED")) {
      console.warn("Gemini TTS Quota exceeded (429). Instructing frontend to use local Web Speech synthesis API gracefully.");
      res.json({ audioBase64: null, fallback: true, reason: "quota" });
    } else {
      console.warn("Could not generate IELTS TTS via Gemini (falling back):", errText);
      res.json({ audioBase64: null, fallback: true, reason: errText || "Failed to generate speaker audio" });
    }
  }
});

// 5c. Automated Vocabulary Gap Analyzer
app.post("/api/gemini/analyze-vocab-gap", async (req, res) => {
  try {
    const { essays, targetBand } = req.body;
    const ai = getGeminiClient();

    const essaysText = essays && essays.length > 0 
      ? essays.map((e: string, i: number) => `[Essay #${i + 1}]:\n${e}`).join("\n\n")
      : "[Notice: No actual essay responses submitted yet by this user. Rely on forecasting default general-tier language flaws vs. band target requirements]";

    const contentPrompt = `You are the lead IELTS Senior Lexical Evaluator.
    Your task is to analyze the student's writing samples (essays/transcripts) to uncover "Vocabulary Gaps".
    - Track repeated simple verbs, general descriptive adjectives (like "good", "bad", "big", "important", "problem"), and informal or non-academic phrasal verbs.
    - Look for sub-optimal lexical domains that hold the student back from achieving an IELTS Band ${targetBand || 8.0}.
    - Forecast critical lexical themes matching Academic IELTS task lists.

    User Submitted Writing Content:
    ${essaysText}

    Based on this, return highly personalized evaluation details:
    1. "identifiedGaps": a list of 3 specific lexical areas/topics requiring immediate vocabulary upgrading. Each gap requires:
       - "category": name of topic or domain (e.g. "Technological Disruption", "Environmental Degradation", "Formal Academic Cohesion")
       - "reason": brief diagnostics on what vocabulary is currently missing or over-repetitive.
       - "unlockedTips": direct examiner strategy to lift lexical scores.
    2. "suggestedFlashcards": exactly 5 premier, C1/C2 advanced terms, collocations, or elite idioms to directly counter these gaps and boost their Lexical Resource score. For each flashcard provide:
       - word
       - definition
       - topic
       - academic exampleSentence
       - 3 advanced synonyms
       - ieltsContext (how to utilize it on the actual examination)
       - pronunciationTip`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contentPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            identifiedGaps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  unlockedTips: { type: Type.STRING }
                },
                required: ["category", "reason", "unlockedTips"]
              }
            },
            suggestedFlashcards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  definition: { type: Type.STRING },
                  topic: { type: Type.STRING },
                  synonyms: { type: Type.ARRAY, items: { type: Type.STRING } },
                  exampleSentence: { type: Type.STRING },
                  ieltsContext: { type: Type.STRING },
                  pronunciationTip: { type: Type.STRING }
                },
                required: ["word", "definition", "topic", "synonyms", "exampleSentence", "ieltsContext", "pronunciationTip"]
              }
            }
          },
          required: ["identifiedGaps", "suggestedFlashcards"]
        }
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Error with IELTS vocabulary gap analysis:", error);
    res.status(500).json({ error: error.message || "Failed to analyze vocabulary gap" });
  }
});

// Vite Middleware Configuration for Dev / Production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await (new Function('return import("vite")')() as any);
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[IELTS Academy] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
