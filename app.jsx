import React, { useState, useEffect } from 'react';
import { BookOpen, Sparkles, RotateCcw, Brain, Copy, Check, Loader2, X } from 'lucide-react';

const FlashcardGenerator = () => {
  const [inputText, setInputText] = useState('');
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [flippedIndices, setFlippedIndices] = useState(new Set());
  const [generatedCount, setGeneratedCount] = useState(0);

  // API Key - injected by the environment
  const apiKey = "";

  const handleGenerate = async () => {
    if (!inputText.trim()) return;

    setLoading(true);
    setError(null);
    setFlashcards([]);
    setFlippedIndices(new Set());

    // Logic: Scale card count based on word count
    const wordCount = inputText.trim().split(/\s+/).length;
    // Minimum 4 cards, Maximum 20 (to avoid API timeouts), approx 1 card per 60 words
    const targetCount = Math.min(Math.max(Math.ceil(wordCount / 60), 4), 20);

    try {
      const systemPrompt = `
        You are an expert study assistant. 
        Analyze the user's text and extract the most important concepts, facts, or definitions.
        
        Based on the length of the provided text, you must create exactly ${targetCount} flashcards to ensure thorough coverage.
        
        Strictly follow this JSON format:
        {
          "flashcards": [
            { "front": "Question or Term", "back": "Answer or Definition" }
          ]
        }
        
        Return ONLY the raw JSON.
      `;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: inputText }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: {
              responseMimeType: "application/json"
            }
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!textResponse) {
        throw new Error("No data returned from AI");
      }

      const parsedData = JSON.parse(textResponse);
      
      if (parsedData.flashcards && Array.isArray(parsedData.flashcards)) {
        setFlashcards(parsedData.flashcards);
        setGeneratedCount(prev => prev + 1);
      } else {
        throw new Error("Invalid format received");
      }

    } catch (err) {
      console.error(err);
      setError("Failed to generate cards. The text might be too complex or the connection was lost.");
    } finally {
      setLoading(false);
    }
  };

  const toggleFlip = (index) => {
    setFlippedIndices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const resetAll = () => {
    setInputText('');
    setFlashcards([]);
    setFlippedIndices(new Set());
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-indigo-600">
            <Brain size={28} strokeWidth={2.5} />
            <span className="text-xl font-bold tracking-tight text-slate-900">FlashGen AI</span>
          </div>
          <div className="hidden sm:flex items-center gap-4">
             {flashcards.length > 0 && (
               <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full uppercase">
                 {flashcards.length} Cards Generated
               </span>
             )}
             <div className="text-sm text-slate-500">Scaleable Learning</div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-1">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-semibold text-slate-700 flex items-center gap-2">
                <BookOpen size={18} />
                Source Material
              </h2>
              {inputText && (
                <button 
                  onClick={resetAll}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                  title="Clear all"
                >
                  <RotateCcw size={16} />
                </button>
              )}
            </div>
            <textarea
              className="w-full h-80 p-4 resize-none outline-none text-slate-600 placeholder:text-slate-300 bg-transparent"
              placeholder="Paste long notes for more cards, or a single sentence for just a few..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <div className="p-3 bg-slate-50 rounded-b-xl border-t border-slate-100 flex justify-end">
              <button
                onClick={handleGenerate}
                disabled={loading || !inputText.trim()}
                className={`
                  flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all duration-200
                  ${!inputText.trim() 
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                    : loading
                      ? 'bg-indigo-400 text-white cursor-wait'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0'
                  }
                `}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Analyzing Content...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Generate Smart Deck
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-emerald-50 rounded-xl p-4 text-sm text-emerald-800 border border-emerald-100">
            <p className="font-medium mb-1">📈 Smart Scaling Active:</p>
            <p className="opacity-80">The app now automatically detects the length of your input. Long articles will generate up to 20 deep-dive cards, while short snippets stay concise.</p>
          </div>
        </div>

        <div className="relative">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 mb-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <X size={20} />
              {error}
            </div>
          )}

          {!loading && flashcards.length === 0 && !error && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Copy size={24} className="opacity-50" />
              </div>
              <h3 className="text-lg font-medium text-slate-600 mb-1">Ready to Study</h3>
              <p className="max-w-xs mx-auto">Paste a long textbook chapter or a short note to generate a custom deck.</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-12">
            {flashcards.map((card, index) => (
              <div 
                key={`${generatedCount}-${index}`}
                className="group h-48 w-full perspective-1000 cursor-pointer"
                onClick={() => toggleFlip(index)}
              >
                <div 
                  className={`
                    relative w-full h-full duration-500 preserve-3d transition-transform
                    ${flippedIndices.has(index) ? 'rotate-y-180' : ''}
                  `}
                >
                  <div className="absolute w-full h-full backface-hidden bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 rounded-xl p-5 flex flex-col items-center justify-center text-center transition-colors">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">Front</span>
                    <p className="text-slate-700 font-medium leading-relaxed">
                      {card.front}
                    </p>
                  </div>

                  <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-slate-800 rounded-xl p-5 flex flex-col items-center justify-center text-center shadow-lg text-white">
                     <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2">Back</span>
                    <p className="leading-relaxed font-medium">
                      {card.back}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
};

export default FlashcardGenerator;