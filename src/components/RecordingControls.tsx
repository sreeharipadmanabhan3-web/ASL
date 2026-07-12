
interface RecordingControlsProps {
  isRecording: boolean;
  recordingProgress: number;
  hasPrediction: boolean;
  hasSentence: boolean;
  onRecord: () => void;
  onClear: () => void;
  onAdd: () => void;
  onReset: () => void;
  onSend: () => void;
}

export function RecordingControls({
  isRecording,
  recordingProgress,
  hasPrediction,
  hasSentence,
  onRecord,
  onClear,
  onAdd,
  onReset,
  onSend,
}: RecordingControlsProps) {
  return (
    <div className="flex items-center gap-1.5 p-2 bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/[0.08] rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.65)] select-none">

      {/* Record Button */}
      <button
        onClick={onRecord}
        disabled={isRecording}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-xs tracking-wide transition-all duration-300 active:scale-95 ${isRecording
            ? 'bg-red-500/10 border border-red-500/20 text-red-400 cursor-not-allowed animate-pulse'
            : 'bg-gradient-to-r from-[#0078d4] to-[#7c3aed] hover:from-[#0086f0] hover:to-[#8b5cf6] text-white shadow-lg shadow-blue-500/10 cursor-pointer'
          }`}
      >
        {isRecording ? (
          <>
            <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
            <span>RECORDING {recordingProgress > 0 ? `(${Math.round(recordingProgress * 100)}%)` : ''}</span>
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
            </svg>
            <span>RECORD</span>
          </>
        )}
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-white/10" />

      {/* Clear Button */}
      <button
        onClick={onClear}
        className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold text-white/60 hover:text-white hover:bg-white/[0.05] transition-all duration-200 active:scale-95 cursor-pointer"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
        <span>CLEAR</span>
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-white/10" />

      {/* Add Button */}
      <button
        onClick={onAdd}
        disabled={!hasPrediction}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold transition-all duration-200 active:scale-95 ${hasPrediction
            ? 'text-white/80 hover:text-blue-400 hover:bg-white/[0.05] cursor-pointer'
            : 'text-white/20 cursor-not-allowed opacity-50'
          }`}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        <span>ADD</span>
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-white/10" />

      {/* Reset Button */}
      <button
        onClick={onReset}
        className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold text-white/60 hover:text-white hover:bg-white/[0.05] transition-all duration-200 active:scale-95 cursor-pointer"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
        <span>RESET</span>
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-white/10" />

      {/* Send Button */}
      <button
        onClick={onSend}
        disabled={!hasSentence}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold transition-all duration-300 active:scale-95 ${hasSentence
            ? 'bg-gradient-to-r from-[#0078d4] via-blue-600 to-[#7c3aed] hover:from-[#0086f0] hover:to-[#8b5cf6] text-white shadow-lg shadow-blue-500/10 cursor-pointer'
            : 'text-white/20 cursor-not-allowed opacity-50'
          }`}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
        <span>SEND</span>
      </button>
    </div>
  );
}
