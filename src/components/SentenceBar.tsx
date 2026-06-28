import { useMemo } from 'react';

interface SentenceBarProps {
  words: string[];
  onSend?: () => void;
}

export function SentenceBar({ words, onSend }: SentenceBarProps) {
  const hasWords = words.length > 0;

  // Format words: join consecutive single letters without spaces, separate words with spaces
  const formattedSentence = useMemo(() => {
    if (words.length === 0) return 'Awaiting sign spelling...';

    let result = '';
    for (let i = 0; i < words.length; i++) {
      const current = words[i];
      const prev = i > 0 ? words[i - 1] : null;

      if (prev !== null) {
        // If either previous or current is a multi-letter word, separate with space.
        // If they are both single letters (fingerspelling), do not add a space.
        if (prev.length > 1 || current.length > 1) {
          result += ' ';
        }
      }
      result += current;
    }
    return result;
  }, [words]);

  return (
    <div className="w-full flex items-center justify-between gap-4 p-4 bg-[#0a0a0a]/85 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.55)] z-20 animate-fade-up relative">
      {/* Decorative top accent line */}
      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
      
      <div className="flex items-center gap-3.5 flex-1 overflow-hidden">
        {/* Visual Indicator Icon */}
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
          hasWords 
            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]' 
            : 'bg-white/5 border-white/10 text-white/20'
        }`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>

        {/* Live Spelled Text */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className={`text-base tracking-wide truncate transition-colors duration-200 ${
            hasWords ? 'text-white font-medium' : 'text-white/20 italic font-light'
          }`}>
            {formattedSentence}
          </span>
          {/* Pulsing Typist Caret */}
          {hasWords && (
            <span className="w-1.5 h-4.5 bg-emerald-400 rounded-sm animate-caret shadow-[0_0_8px_rgba(16,185,129,0.7)] flex-shrink-0" />
          )}
        </div>
      </div>

      {onSend && (
        <button
          onClick={onSend}
          disabled={!hasWords}
          className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-full transition-all duration-300 ${
            hasWords
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black shadow-lg shadow-emerald-500/10 active:scale-95 cursor-pointer'
              : 'bg-white/[0.02] border border-white/10 text-white/20 cursor-not-allowed opacity-50'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          <span>SEND</span>
          {hasWords && (
            <kbd className="hidden sm:inline-block text-[9px] bg-black/15 text-black/55 px-1.5 py-0.5 rounded font-mono font-semibold ml-1">S</kbd>
          )}
        </button>
      )}
    </div>
  );
}
