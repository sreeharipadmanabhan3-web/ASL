import { useMemo } from 'react';

interface SentenceBarProps {
  words: string[];
  onSend?: () => void;
  onAddSpace?: () => void;
}

export function SentenceBar({ words, onSend, onAddSpace }: SentenceBarProps) {
  const hasWords = words.length > 0;

  // Format words: join consecutive single letters without spaces, separate words with spaces
  const formattedSentence = useMemo(() => {
    if (words.length === 0) return 'Awaiting sign spelling...';

    let result = '';
    for (let i = 0; i < words.length; i++) {
      const current = words[i];
      const prev = i > 0 ? words[i - 1] : null;

      if (current === ' ') {
        // Explicit space token
        if (result.length > 0 && !result.endsWith(' ')) {
          result += ' ';
        }
        continue;
      }

      if (prev !== null && prev !== ' ') {
        // If either previous or current is a multi-letter word, separate with space.
        // If they are both single letters (fingerspelling), do not add a space.
        if (prev.length > 1 || current.length > 1) {
          if (!result.endsWith(' ')) {
            result += ' ';
          }
        }
      }
      result += current;
    }
    return result;
  }, [words]);

  return (
    <div className="w-full flex items-center justify-between gap-4 p-4 bg-[#0a0a0a]/85 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.55)] z-20 animate-fade-up relative">
      {/* Decorative top accent line */}
      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
      
      <div className="flex items-center gap-3.5 flex-1 overflow-hidden">
        {/* Visual Indicator Icon */}
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
          hasWords 
            ? 'bg-blue-500/10 border-blue-500/25 text-blue-400 shadow-[0_0_12px_rgba(0,120,212,0.15)]' 
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
            <span className="w-1.5 h-4.5 bg-blue-400 rounded-sm animate-caret shadow-[0_0_8px_rgba(0,120,212,0.7)] flex-shrink-0" />
          )}
        </div>
      </div>
 
      <div className="flex items-center gap-2">
        {onAddSpace && (
          <button
            onClick={onAddSpace}
            disabled={!hasWords}
            className={`flex-shrink-0 flex items-center gap-2 px-4.5 py-2.5 text-[11px] font-semibold rounded-full border transition-all duration-300 ${
              hasWords
                ? 'bg-white/[0.03] hover:bg-white/[0.08] border-white/10 text-white/80 active:scale-95 cursor-pointer'
                : 'bg-white/[0.01] border-white/5 text-white/10 cursor-not-allowed'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10v4a1 1 0 001 1h16a1 1 0 001-1v-4" />
            </svg>
            <span>SPACE</span>
            {hasWords && (
              <kbd className="hidden sm:inline-block text-[8px] bg-white/10 text-white/40 px-1.5 py-0.5 rounded font-mono font-semibold ml-0.5">Space</kbd>
            )}
          </button>
        )}

        {onSend && (
          <button
            onClick={onSend}
            disabled={!hasWords}
          className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-full transition-all duration-300 ${
            hasWords
              ? 'bg-gradient-to-r from-[#0078d4] to-[#7c3aed] hover:from-[#0086f0] hover:to-[#8b5cf6] text-white shadow-lg shadow-blue-500/10 active:scale-95 cursor-pointer'
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
    </div>
  );
}
