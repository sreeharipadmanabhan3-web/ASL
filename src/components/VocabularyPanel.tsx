import { VOCABULARY } from '../types';

interface VocabularyPanelProps {
  onClose: () => void;
  vocabulary?: string[];
}

export function VocabularyPanel({ onClose, vocabulary }: VocabularyPanelProps) {
  const displayVocab = vocabulary && vocabulary.length > 0 ? vocabulary : VOCABULARY;

  return (
    <>
      {/* Blurred Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Vocabulary Panel Overlay */}
      <div className="absolute left-1/2 top-20 -translate-x-1/2 w-80 p-5 bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-2xl z-50 animate-scale-in origin-top">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4 border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm">📚</span>
            <h3 className="text-white/90 text-sm font-semibold tracking-wide">
              Vocabulary <span className="text-[10px] text-white/40 font-mono font-medium ml-1">({displayVocab.length})</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/[0.05] rounded-lg text-white/40 hover:text-white/80 transition-all cursor-pointer active:scale-95"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Word Chips Grid */}
        <div className="flex flex-wrap gap-1.5 max-h-60 overflow-y-auto pr-1">
          {displayVocab.map((word) => (
            <span
              key={word}
              className="px-2.5 py-1.5 bg-white/[0.02] border border-white/[0.05] rounded-lg text-white/50 text-[11px] font-medium tracking-wide hover:text-emerald-400 hover:border-emerald-500/25 hover:bg-emerald-500/5 transition-all duration-200 hover:scale-105 cursor-default"
            >
              {word}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
