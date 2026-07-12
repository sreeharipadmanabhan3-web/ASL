import { Prediction } from '../types';

interface PredictionOverlayProps {
  predictions: Prediction[];
  isRecording: boolean;
  recordingProgress: number;
  holdingLetter?: string | null;
  holdProgress?: number;
  autoAddDuration?: number;
}

export function PredictionOverlay({
  predictions,
  isRecording,
  recordingProgress,
  holdingLetter,
  holdProgress,
  autoAddDuration
}: PredictionOverlayProps) {
  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.7) return 'from-emerald-400 to-teal-500';
    if (confidence > 0.4) return 'from-amber-400 to-orange-500';
    return 'from-rose-500 to-red-600';
  };

  const getTextColor = (confidence: number) => {
    if (confidence > 0.7) return 'text-emerald-400';
    if (confidence > 0.4) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <>
      {/* Recording Progress HUD */}
      {isRecording && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4 z-20 animate-fade-in select-none">
          <div className="flex items-center gap-3.5 px-6 py-3.5 bg-black/85 backdrop-blur-2xl rounded-full border border-red-500/25 shadow-2xl">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
            <span className="text-white text-xs font-bold tracking-widest uppercase">RECORDING SIGN</span>
            <span className="text-white/50 text-xs font-mono font-semibold">
              {Math.round(recordingProgress * 100)}%
            </span>
          </div>

          {/* Progress Bar Container */}
          <div className="w-64 h-1.5 bg-white/5 border border-white/10 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all duration-100 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
              style={{ width: `${recordingProgress * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Prediction Results Board Overlay */}
      {predictions.length > 0 && !isRecording && (
        <div className="absolute bottom-4 right-4 w-72 p-4 bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/[0.08] rounded-2xl z-20 shadow-2xl animate-scale-in origin-bottom-right select-none">

          {/* Primary Top Prediction Card */}
          <div className="mb-4">
            <p className="text-white/30 text-[10px] uppercase font-bold tracking-wider mb-1">Top Match</p>
            <h2 className={`font-semibold tracking-tight ${predictions[0].word === 'Gesture Not Found' ? 'text-2xl' : 'text-4xl'} ${getTextColor(predictions[0].confidence)}`}>
              {predictions[0].word}
            </h2>
            <div className="flex items-center gap-3.5 mt-3">
              <div className="flex-1 h-2 bg-white/5 border border-white/5 rounded-full overflow-hidden shadow-inner">
                <div
                  className={`h-full bg-gradient-to-r ${getConfidenceColor(predictions[0].confidence)} rounded-full transition-all duration-300`}
                  style={{ width: `${predictions[0].confidence * 100}%` }}
                />
              </div>
              <span className={`text-xs font-mono font-bold leading-none ${getTextColor(predictions[0].confidence)}`}>
                {Math.round(predictions[0].confidence * 100)}%
              </span>
            </div>
            {holdingLetter === predictions[0].word && holdProgress !== undefined && holdProgress > 0 && (
              <div className="mt-3.5 pt-3 border-t border-white/[0.06] animate-fade-in">
                <div className="flex justify-between items-center text-[9px] font-mono font-bold tracking-wider mb-1.5 text-blue-400">
                  <span>HOLDING SIGN TO ADD</span>
                  <span>{((holdProgress / 100) * (autoAddDuration ?? 1.5)).toFixed(1)}s / {(autoAddDuration ?? 1.5).toFixed(1)}s</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 border border-white/5 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-75 shadow-[0_0_8px_rgba(0,120,212,0.4)] animate-pulse"
                    style={{ width: `${holdProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Alternate Prediction Candidates */}
          {predictions.length > 1 && (
            <div className="space-y-2.5 pt-3 border-t border-white/[0.06]">
              {predictions.slice(1).map((pred, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-white/45 text-xs font-medium">{pred.word}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden shadow-inner">
                      <div
                        className={`h-full bg-gradient-to-r ${getConfidenceColor(pred.confidence)} rounded-full`}
                        style={{ width: `${pred.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-white/30 text-[10px] font-mono font-medium w-8 text-right">
                      {Math.round(pred.confidence * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
