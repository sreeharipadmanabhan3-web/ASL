import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { User } from '../types';
import { useHandTracking } from '../hooks/useHandTracking';
import { useMLModel } from '../hooks/useMLModel';
import { useChat } from '../hooks/useChat';
import { ProfileBadge } from './ProfileBadge';
import { VocabularyPanel } from './VocabularyPanel';
import { RecordingControls } from './RecordingControls';
import { SentenceBar } from './SentenceBar';
import { ChatPanel } from './ChatPanel';

interface MainAppProps {
  user: User;
  onLogout: () => void;
  onNavigateHome: () => void;
  onRefreshUser?: () => void;
  onOpenSettings?: () => void;
}

export function MainApp({ user, onLogout, onNavigateHome, onOpenSettings }: MainAppProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sentence, setSentence] = useState<string[]>([]);
  const [showVocabulary, setShowVocabulary] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const [mirrorVideo, setMirrorVideo] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [exposure, setExposure] = useState(1.0);
  const [showExposureSlider, setShowExposureSlider] = useState(false);
  const [showDeviceDropdown, setShowDeviceDropdown] = useState(false);
  const [showResolutionDropdown, setShowResolutionDropdown] = useState(false);
  const [showLandmarks, setShowLandmarks] = useState(true);

  // Close dropdown on click outside
  useEffect(() => {
    if (!showDeviceDropdown) return;
    const handleOutsideClick = () => setShowDeviceDropdown(false);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [showDeviceDropdown]);

  // Close exposure slider on click outside
  useEffect(() => {
    if (!showExposureSlider) return;
    const handleOutsideClick = () => setShowExposureSlider(false);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [showExposureSlider]);

  // Close resolution dropdown on click outside
  useEffect(() => {
    if (!showResolutionDropdown) return;
    const handleOutsideClick = () => setShowResolutionDropdown(false);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [showResolutionDropdown]);

  // Toggle video stream play/pause states
  useEffect(() => {
    if (videoRef.current) {
      if (isPaused) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(err => console.error("Error playing video feed:", err));
      }
    }
  }, [isPaused]);

  // Load TensorFlow.js model
  const {
    isLoaded: mlLoaded,
    isLoading: mlLoading,
    error: mlError,
    predict: mlPredict,
    vocabulary: mlVocabulary
  } = useMLModel('/model/model.json');

  // Stable options ref — prevents recreating startTracking on every render
  const mlPredictRef = useRef(mlPredict);
  useEffect(() => { mlPredictRef.current = mlPredict; }, [mlPredict]);
  const mlLoadedRef = useRef(mlLoaded);
  useEffect(() => { mlLoadedRef.current = mlLoaded; }, [mlLoaded]);

  const stableOptions = useMemo(() => ({
    onPredict: async (landmarks: number[][]) => {
      if (mlLoadedRef.current && mlPredictRef.current) {
        return mlPredictRef.current(landmarks);
      }
      return [];
    },
    onRegisterWord: (word: string) => {
      setSentence(prev => [...prev, word]);
    },
    isModelLoaded: mlLoaded
  }), [mlLoaded]);

  const {
    status,
    isTracking,
    handsDetected,
    isRecording,
    recordingProgress,
    predictions,
    startTracking,
    stopTracking,
    startRecording,
    clearRecording,
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    resolution,
    changeResolution
  } = useHandTracking(videoRef, canvasRef, stableOptions);

  const handleCameraChange = useCallback(async (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    if (status === 'tracking' || status === 'starting') {
      await startTracking(deviceId);
    }
  }, [status, startTracking, setSelectedDeviceId]);

  const toggleConnection = useCallback(async () => {
    if (status === 'tracking' || status === 'starting') {
      stopTracking();
    } else {
      await startTracking(selectedDeviceId);
    }
  }, [status, startTracking, stopTracking, selectedDeviceId]);

  const {
    messages,
    sendSignerMessage,
    sendReceiverMessage,
    clearMessages,
  } = useChat();

  // Use refs so the effect never re-runs due to function identity changes
  const startTrackingRef = useRef(startTracking);
  useEffect(() => { startTrackingRef.current = startTracking; }, [startTracking]);
  const stopTrackingRef = useRef(stopTracking);
  useEffect(() => { stopTrackingRef.current = stopTracking; }, [stopTracking]);

  useEffect(() => {
    startTrackingRef.current();
    return () => {
      stopTrackingRef.current();
    };
  }, []);

  useEffect(() => {
    const refreshLayout = () => {
      window.dispatchEvent(new Event('resize'));
    };

    requestAnimationFrame(refreshLayout);
    const timeout = setTimeout(refreshLayout, 250);

    return () => clearTimeout(timeout);
  }, []); // empty deps — runs once on mount, cleans up on unmount

  // Track unread messages when chat is collapsed
  useEffect(() => {
    if (!chatExpanded && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender === 'receiver') {
        setUnreadCount(prev => prev + 1);
      }
    }
  }, [messages, chatExpanded]);

  // Clear unread when chat is expanded
  useEffect(() => {
    if (chatExpanded) {
      setUnreadCount(0);
    }
  }, [chatExpanded]);

  const addWordToSentence = useCallback(() => {
    if (predictions.length > 0) {
      setSentence(prev => [...prev, predictions[0].word]);
    }
  }, [predictions]);

  const resetSentence = useCallback(() => {
    setSentence([]);
  }, []);

  const sendSentence = useCallback(() => {
    if (sentence.length > 0) {
      sendSignerMessage(sentence.join(' '));
      setSentence([]);
    }
  }, [sentence, sendSignerMessage]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'r':
          startRecording();
          break;
        case 'c':
          clearRecording();
          break;
        case 'a':
          addWordToSentence();
          break;
        case 'x':
          resetSentence();
          break;
        case 's':
          sendSentence();
          break;
        case 't':
          setChatExpanded(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startRecording, clearRecording, addWordToSentence, resetSentence, sendSentence]);

  return (
    <div className="w-screen h-dvh min-h-dvh bg-black flex overflow-hidden select-none animate-fade-in relative">

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full overflow-hidden z-10 relative">

        {/* Central Console Area */}
        <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden relative z-10">

          {/* 1. Sleek Dashboard Console Card */}
          <div
            className={`flex-1 h-full min-h-0 flex flex-col overflow-hidden relative bg-black/60 backdrop-blur-sm transition-all duration-500 ${handsDetected > 0
              ? 'shadow-[inset_0_0_60px_rgba(16,185,129,0.06)]'
              : ''
              }`}
          >
            {/* Video Viewport Area (Pitch Black Theme) */}
            <div className="flex-1 w-full h-full min-h-0 bg-black relative flex items-center justify-center overflow-hidden">
              {/* Main Video Stream Element */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                style={{
                  transform: mirrorVideo ? 'scaleX(-1)' : 'scaleX(1)',
                  filter: `brightness(${exposure})`
                }}
              />

              {/* MediaPipe Canvas Drawing Element */}
              <canvas
                ref={canvasRef}
                className={`absolute inset-0 w-full h-full object-cover pointer-events-none z-10 ${showLandmarks ? '' : 'hidden'}`}
                style={{ transform: mirrorVideo ? 'scaleX(-1)' : 'scaleX(1)' }}
              />

              {/* Paused Stream Overlay Banner (Pitch Black Pause Cover) */}
              {isPaused && (
                <div className="absolute inset-0 flex items-center justify-center bg-black z-15 animate-fade-in pointer-events-auto">
                  <div className="text-center p-6 glass-panel rounded-2xl border border-white/[0.08] shadow-2xl">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center mx-auto mb-3 text-amber-400 shadow-md">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h4 className="text-xs font-semibold text-white/95 tracking-wide">CAMERA PAUSED</h4>
                    <p className="text-[9px] text-white/40 mt-1 font-light leading-relaxed">
                      Click the play button in the toolbar below to resume landmark mapping
                    </p>
                  </div>
                </div>
              )}

              {/* Model Loading / Not Loaded Overlay Banner */}
              {!mlLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-30 animate-fade-in pointer-events-auto">
                  <div className="text-center p-6 w-full max-w-sm glass-panel rounded-3xl border border-white/[0.08] shadow-2xl flex flex-col items-center">
                    {mlLoading ? (
                      <>
                        <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
                          <div className="absolute inset-0 rounded-full border-2 border-white/[0.06]" />
                          <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-transparent border-t-amber-500 border-r-amber-500/40 animate-spin" />
                          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                            <span className="text-lg">🔄</span>
                          </div>
                        </div>
                        <h3 className="text-white/90 text-sm font-medium tracking-wide">Loading AI Model</h3>
                        <p className="text-white/45 text-[10px] font-light mt-1.5 leading-relaxed max-w-[240px]">
                          Loading sign vocabulary configurations and weights...
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="relative w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-red-500/10 border border-red-500/25 shadow-lg">
                          <span className="text-2xl select-none">⚠️</span>
                        </div>
                        <h3 className="text-red-400 font-semibold text-sm tracking-wide">Model Not Loaded</h3>
                        <p className="text-white/45 text-[10px] font-light mt-1.5 max-w-[260px] leading-relaxed">
                          {mlError ? `Error: ${mlError}` : 'The sign recognition model could not be loaded. Hand tracking and prediction are disabled.'}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Camera Offline / Disconnected / Starting states (Pitch Black Theme) */}
              {mlLoaded && !isTracking && (
                <div className="absolute inset-0 flex items-center justify-center bg-black z-20 animate-fade-in pointer-events-auto">
                  <div className="text-center p-6 w-full max-w-sm glass-panel rounded-3xl border border-white/[0.08] shadow-2xl flex flex-col items-center">
                    {status === 'idle' ? (
                      <>
                        {/* Standby State */}
                        <div className="relative w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-white/[0.02] border border-white/[0.06] shadow-lg">
                          <div className="absolute inset-0 rounded-full bg-emerald-500/5 blur-md animate-pulse" />
                          <span className="text-2xl select-none">📷</span>
                        </div>
                        <h3 className="text-white/90 text-sm font-semibold tracking-wide">Webcam Interface Offline</h3>
                        <p className="text-white/45 text-[10px] font-light mt-1 mb-5 max-w-[260px] leading-relaxed">
                          Initialize your camera in the settings console below to start real-time ASL fingerspelling and hand landmark tracking.
                        </p>

                        {/* Connect Button */}
                        <button
                          onClick={toggleConnection}
                          className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black text-xs font-bold tracking-wider uppercase shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all duration-300 active:scale-95 cursor-pointer"
                        >
                          Connect Camera
                        </button>
                      </>
                    ) : status === 'error' ? (
                      <>
                        {/* Error State */}
                        <div className="relative w-14 h-14 mb-4 flex items-center justify-center bg-red-500/10 rounded-full border border-red-500/25 shadow-lg">
                          <span className="text-xl">🚫</span>
                        </div>
                        <h3 className="text-red-400 font-semibold mb-1 text-sm tracking-wide">Camera Access Blocked</h3>

                        <div className="w-full text-white/45 text-[10px] font-light leading-relaxed text-left space-y-2 mt-3 border-t border-white/[0.06] pt-3">
                          <p>To enable capture tracking:</p>
                          <ol className="list-decimal pl-4 space-y-1">
                            <li>Click the camera icon in your browser address bar</li>
                            <li>Toggle permissions to "Allow" state</li>
                            <li>Choose another camera in the console bar below and click retry</li>
                          </ol>
                        </div>

                        {/* Retry Button */}
                        <button
                          onClick={toggleConnection}
                          className="w-full mt-5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/10 text-white text-xs font-semibold border border-white/[0.08] transition-all cursor-pointer active:scale-95"
                        >
                          Retry Connection
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Starting/Loading State */}
                        <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
                          <div className="absolute inset-0 rounded-full border-2 border-white/[0.06]" />
                          <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-transparent border-t-emerald-500 border-r-emerald-500/40 animate-spin" />
                          <div className="absolute inset-1.5 rounded-full border-b-2 border-l-2 border-transparent border-b-teal-400 border-l-teal-400/40 animate-spin" style={{ animationDuration: '1.6s', animationDirection: 'reverse' }} />
                          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <span className="text-lg">📷</span>
                          </div>
                        </div>
                        <h3 className="text-white/90 text-sm font-medium tracking-wide">Starting Camera Stream</h3>
                        <p className="text-white/45 text-[10px] font-light mt-1.5 leading-relaxed max-w-[240px]">
                          Please accept the camera device usage request in your browser tab.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Console Bottom Action / Settings Footer Bar */}
            <div className="w-full bg-[#070707]/90 border-t border-white/[0.06] flex flex-col gap-3.5 p-4 shrink-0 mb-0 z-20 relative">

              {/* SentenceBar overlay — floats above the footer when letters are present */}
              {sentence.length > 0 && (
                <div className="absolute bottom-full left-0 right-0 px-4 pb-2 animate-fade-in pointer-events-auto z-30">
                  <SentenceBar
                    words={sentence}
                    onSend={sendSentence}
                  />
                </div>
              )}

              {/* Row 1: Camera Selectors and Options */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Left Side: Status and Dropdown Selectors */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* Home/Back Navigation Button */}
                  <button
                    onClick={() => {
                      stopTracking();
                      onNavigateHome();
                    }}
                    className="flex items-center justify-center w-8.5 h-8.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-white/80 hover:text-white transition-all duration-200 active:scale-90 cursor-pointer shadow-md"
                    title="Return to Dashboard"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                  </button>

                  <div className="w-px h-4 bg-white/10" />

                  {/* Connection Status Badge */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06] shadow-sm">
                    {isTracking ? (
                      isRecording ? (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                      ) : isPaused ? (
                        <span className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]"></span>
                      ) : (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                      )
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-white/20"></span>
                    )}
                    <span className="text-[10px] font-bold font-mono tracking-widest text-white/50 uppercase">
                      {!isTracking ? 'Offline' : isRecording ? 'Recording' : isPaused ? 'Paused' : 'Live Feed'}
                    </span>
                  </div>

                  {/* Hands Detected Status Badge */}
                  {isTracking && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 border border-white/[0.06] shadow-sm animate-fade-in">
                      <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${handsDetected > 0 ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-white/25'}`} />
                      <span className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-wider">
                        {handsDetected} Hand{handsDetected !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}

                  {/* Current Prediction Badge */}
                  {isTracking && predictions.length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-sm animate-fade-in">
                      <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                        Sign: {predictions[0].word} ({Math.round(predictions[0].confidence * 100)}%)
                      </span>
                    </div>
                  )}

                  <div className="w-px h-4 bg-white/10 hidden sm:block" />

                  {/* Camera Selector Dropdown */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeviceDropdown(prev => !prev);
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-white/80 hover:text-white transition-all duration-200 active:scale-95 cursor-pointer shadow-md"
                    >
                      <span>📷</span>
                      <span className="max-w-[130px] truncate">
                        {devices.find(d => d.deviceId === selectedDeviceId)?.label || 'Camera Feed'}
                      </span>
                      <svg className={`w-3.5 h-3.5 text-white/40 transition-transform duration-200 ${showDeviceDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {showDeviceDropdown && (
                      <div className="absolute bottom-full left-0 mb-2 w-64 rounded-xl bg-[#090909]/95 backdrop-blur-md border border-white/[0.08] shadow-2xl p-1.5 flex flex-col gap-1 z-40 animate-scale-in">
                        {devices.length === 0 ? (
                          <div className="px-3 py-2 text-xs text-white/40 italic">No cameras detected</div>
                        ) : (
                          devices.map((device, idx) => (
                            <button
                              key={device.deviceId || idx}
                              onClick={() => {
                                handleCameraChange(device.deviceId);
                                setShowDeviceDropdown(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all duration-150 flex items-center gap-2 cursor-pointer ${device.deviceId === selectedDeviceId
                                ? 'bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/10'
                                : 'text-white/70 hover:text-white hover:bg-white/[0.04]'
                                }`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              <span className="truncate">{device.label || `Camera ${idx + 1}`}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Resolution Selector Dropdown */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowResolutionDropdown(prev => !prev);
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-white/80 hover:text-white transition-all duration-200 active:scale-95 cursor-pointer shadow-md"
                    >
                      <span>⚙️</span>
                      <span>{resolution.toUpperCase()}</span>
                      <svg className={`w-3.5 h-3.5 text-white/40 transition-transform duration-200 ${showResolutionDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {showResolutionDropdown && (
                      <div className="absolute bottom-full left-0 mb-2 w-32 rounded-xl bg-[#090909]/95 backdrop-blur-md border border-white/[0.08] shadow-2xl p-1.5 flex flex-col gap-1 z-40 animate-scale-in">
                        {(['480p', '720p', '1080p'] as const).map((res) => (
                          <button
                            key={res}
                            onClick={() => {
                              changeResolution(res);
                              setShowResolutionDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all duration-150 flex items-center justify-between cursor-pointer ${res === resolution
                              ? 'bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/10'
                              : 'text-white/70 hover:text-white hover:bg-white/[0.04]'
                              }`}
                          >
                            <span>{res.toUpperCase()}</span>
                            <span className="text-[9px] text-white/30">
                              {res === '480p' ? 'VGA' : res === '720p' ? 'HD' : 'FHD'}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side: Adjustment Controls */}
                <div className="flex items-center gap-1.5">
                  {isTracking && (
                    <>
                      {/* Mirror Option */}
                      <button
                        onClick={() => setMirrorVideo(!mirrorVideo)}
                        className={`p-2 rounded-xl transition-all duration-200 active:scale-90 cursor-pointer border ${!mirrorVideo
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                          : 'text-white/60 hover:text-white hover:bg-white/[0.04] border-transparent'
                          }`}
                        title={mirrorVideo ? "Normal Feed" : "Mirror Feed"}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      </button>

                      {/* Exposure Adjuster */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowExposureSlider(prev => !prev);
                          }}
                          className={`p-2 rounded-xl transition-all duration-200 active:scale-90 cursor-pointer border ${showExposureSlider
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                            : 'text-white/60 hover:text-white hover:bg-white/[0.04] border-transparent'
                            }`}
                          title="Adjust Brightness"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1.5m0 15V21m-9-9h1.5m15 0H21m-3-6.364l-1.06 1.06m-10.607 10.607l-1.06 1.06m0-12.728l1.06 1.06m10.607 10.607l1.06 1.06M12 7.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9z" />
                          </svg>
                        </button>

                        {showExposureSlider && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 bottom-full mb-2 bg-[#090909]/95 backdrop-blur-md p-3.5 rounded-2xl border border-white/[0.08] shadow-2xl flex flex-col gap-1.5 z-40 animate-scale-in w-48 pointer-events-auto"
                          >
                            <div className="flex items-center justify-between text-[9px] font-mono font-bold tracking-wider text-white/50">
                              <span>EXPOSURE</span>
                              <span className="text-emerald-400">{Math.round(exposure * 100)}%</span>
                            </div>
                            <input
                              type="range"
                              min="0.5"
                              max="1.5"
                              step="0.05"
                              value={exposure}
                              onChange={(e) => setExposure(parseFloat(e.target.value))}
                              className="w-full accent-emerald-500 h-1.5 rounded-lg bg-white/[0.08] cursor-pointer appearance-none outline-none focus:outline-none"
                            />
                          </div>
                        )}
                      </div>

                      {/* Landmarks Visibility */}
                      <button
                        onClick={() => setShowLandmarks(!showLandmarks)}
                        className={`p-2 rounded-xl transition-all duration-200 active:scale-90 cursor-pointer border ${showLandmarks
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                          : 'text-white/60 hover:text-white hover:bg-white/[0.04] border-transparent'
                          }`}
                        title={showLandmarks ? "Hide Hand Landmarks" : "Show Hand Landmarks"}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25V4.5m0 15v2.25m-9.75-9.75h2.25m15 0h2.25m-3.25-6.19l-1.59 1.59m-11.82 8.48l-1.59 1.59m1.59-11.82l1.59 1.59m8.48 11.82l1.59-1.59" />
                        </svg>
                      </button>

                      {/* Play/Pause Feed */}
                      <button
                        onClick={() => setIsPaused(!isPaused)}
                        className={`p-2 rounded-xl transition-all duration-200 active:scale-90 cursor-pointer border ${isPaused
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/25'
                          : 'text-white/60 hover:text-white hover:bg-white/[0.04] border-transparent'
                          }`}
                        title={isPaused ? "Resume Video Stream" : "Pause Video Stream"}
                      >
                        {isPaused ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                          </svg>
                        )}
                      </button>
                    </>
                  )}

                  {/* Power Connect/Disconnect button */}
                  <button
                    onClick={toggleConnection}
                    className={`p-2 rounded-xl transition-all duration-200 active:scale-90 cursor-pointer border flex items-center justify-center gap-1.5 text-xs font-semibold px-3 ${isTracking
                      ? 'bg-red-500/15 hover:bg-red-500/25 text-red-400 border-red-500/30'
                      : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border-emerald-500/30 shadow-lg shadow-emerald-500/5'
                      }`}
                    title={isTracking ? "Disconnect Camera" : "Connect Camera"}
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728M12 3v9" />
                    </svg>
                    <span>{isTracking ? 'Stop' : 'Start'}</span>
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="w-full h-px bg-white/[0.06]" />

              {/* Row 2: Spelled Actions / Record Control Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                {/* Left Side: Shortcut Hint */}
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-bold font-mono tracking-wider text-white/40">HOTKEYS</span>
                  <span className="text-[10px] text-white/20 font-mono tracking-wide">
                    R record &bull; C clear &bull; A add &bull; X reset &bull; S send &bull; T chat
                  </span>
                </div>

                {/* Center: Recording Controls */}
                <div className="flex justify-center">
                  <RecordingControls
                    isRecording={isRecording}
                    recordingProgress={recordingProgress}
                    hasPrediction={predictions.length > 0}
                    hasSentence={sentence.length > 0}
                    onRecord={startRecording}
                    onClear={clearRecording}
                    onAdd={addWordToSentence}
                    onReset={resetSentence}
                    onSend={sendSentence}
                  />
                </div>

                {/* Right Side: Status, Chat Toggle, and Profile */}
                <div className="flex items-center gap-2.5">
                  {/* ML Engine Status */}
                  <div
                    onClick={() => mlLoaded && setShowVocabulary(prev => !prev)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.02] border border-white/[0.06] shadow-sm transition-all ${mlLoaded ? 'cursor-pointer hover:bg-white/[0.08]' : ''}`}
                    title={mlLoaded ? "Click to view trained vocabulary" : ""}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${mlLoaded ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : mlLoading ? 'bg-amber-400 animate-pulse' : 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]'}`} />
                    <span className="text-[10px] font-bold font-mono tracking-widest text-white/40 uppercase">
                      {mlLoaded ? 'Inference Ready' : mlLoading ? 'Model Loading' : 'Model Not Loaded'}
                    </span>
                  </div>

                  {/* Chat Toggle Button */}
                  <button
                    onClick={() => setChatExpanded(!chatExpanded)}
                    className={`relative flex items-center justify-center w-8.5 h-8.5 rounded-xl backdrop-blur-md border transition-all duration-200 shadow-md active:scale-90 cursor-pointer ${chatExpanded
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                      : 'bg-white/[0.03] border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.08]'
                      }`}
                    title="Toggle Chat"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {!chatExpanded && unreadCount > 0 && (
                      <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-white text-[9px] font-bold flex items-center justify-center shadow-lg border border-black">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </div>
                    )}
                  </button>

                  {/* Profile Badge */}
                  <ProfileBadge
                    user={user}
                    onLogout={onLogout}
                    onOpenSettings={onOpenSettings}
                  />
                </div>
              </div>

            </div>
          </div>


        </div>
      </div>

      {/* Vocabulary Modal Panel */}
      {showVocabulary && (
        <VocabularyPanel onClose={() => setShowVocabulary(false)} vocabulary={mlVocabulary} />
      )}

      {/* Fluid Collapsible Chat Side Panel */}
      <div
        className="flex flex-col border-l border-white/10 bg-[#080808] h-dvh min-h-dvh flex-shrink-0 transition-all duration-300 ease-out overflow-hidden"
        style={{
          width: chatExpanded ? '320px' : '0px'
        }}
      >
        <div className="w-[320px] h-full flex flex-col flex-shrink-0">
          {/* Chat Header */}
          <div className="px-5 py-4 border-b border-white/[0.08] bg-[#090909]/60 backdrop-blur-md flex-shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/35 flex items-center justify-center shadow-inner">
                  <span className="text-base select-none">💬</span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#080808] shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white/90 tracking-wide">Receiver Node</h3>
                <p className="text-[11px] font-medium text-emerald-400">Connected</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {messages.length > 0 && (
                <button
                  onClick={clearMessages}
                  className="p-2 rounded-xl text-white/40 hover:text-white/80 hover:bg-white/[0.04] transition-all active:scale-95"
                  title="Clear conversation histories"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => setChatExpanded(false)}
                className="p-2 rounded-xl text-white/40 hover:text-white/80 hover:bg-white/[0.04] transition-all active:scale-95"
                title="Collapse sidebar menu"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Message List area */}
          <div className="flex-1 min-h-0 flex flex-col">
            <ChatPanel
              messages={messages}
              onSendReceiverMessage={sendReceiverMessage}
            />
          </div>
        </div>
      </div>

    </div>
  );
}
