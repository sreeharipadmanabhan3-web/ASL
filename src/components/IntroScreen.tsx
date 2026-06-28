import { User } from '../types';
import { ProfileBadge } from './ProfileBadge';

interface IntroScreenProps {
  onStart: () => void;
  user: User;
  onLogout: () => void;
  onRefreshUser?: () => void;
  onOpenSettings?: () => void;
}

export function IntroScreen({ onStart, user, onLogout, onOpenSettings }: IntroScreenProps) {
  return (
    <div className="h-screen w-screen bg-black flex flex-col justify-between p-6 overflow-hidden select-none relative">

      {/* 1. Header Bar */}
      <header className="relative w-full max-w-6xl mx-auto flex items-center justify-between border-b border-white/[0.06] pb-4 shrink-0 z-30 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
            <span className="text-xl text-black font-semibold">🤟</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">ASL Link</h1>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono font-medium">v1.2.0</span>
            </div>
            <p className="text-[10px] text-white/35 font-light">Client-Side Landmark Processing</p>
          </div>
        </div>

        <ProfileBadge user={user} onLogout={onLogout} onOpenSettings={onOpenSettings} />
      </header>

      {/* 2. Main Dashboard Content Grid */}
      <main className="relative w-full max-w-6xl mx-auto flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 py-6 items-stretch overflow-hidden z-10">
        
        {/* Left Section - Camera Feed Console (Active Control Hub) */}
        <div className="flex flex-col gap-6 overflow-hidden">
          <div className="glass-panel rounded-2xl p-8 border border-white/[0.08] flex-1 flex flex-col justify-between shadow-xl animate-fade-up relative overflow-hidden group">
            {/* Animated background scanning effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 via-transparent to-teal-500/5 opacity-50 pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-500/25 to-transparent animate-pulse" />
            
            <div className="relative z-10 flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest block mb-1">Control Hub</span>
                <h2 className="text-2xl font-bold tracking-tight text-white mb-3 leading-tight">Camera Feed Console</h2>
                <p className="text-white/45 text-xs font-light leading-relaxed mb-8 max-w-md">
                  Boot up your local device camera to initiate real-time fingerspelling, grammar mapping, and holographic landmark tracking.
                </p>
              </div>

              {/* Spectacular animated visual representation of scanning */}
              <div className="flex-1 min-h-[160px] max-h-[220px] rounded-xl border border-white/[0.05] bg-white/[0.01] flex items-center justify-center relative overflow-hidden mb-8 group-hover:border-emerald-500/10 transition-all duration-300">
                <div className="hud-grid-overlay opacity-30" />
                <div className="hud-scanline opacity-40" style={{ animationDuration: '4s' }} />
                <div className="relative w-20 h-20 flex items-center justify-center">
                  {/* Glowing concentric scanning rings */}
                  <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-ping" style={{ animationDuration: '3s' }} />
                  <div className="absolute -inset-4 rounded-full border border-teal-500/10 animate-ping" style={{ animationDuration: '4s', animationDelay: '1s' }} />
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/25 flex items-center justify-center shadow-lg shadow-emerald-500/5">
                    <span className="text-3xl animate-pulse select-none">📷</span>
                  </div>
                </div>
              </div>

              <button
                onClick={onStart}
                className="group w-full py-4 relative bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold text-xs tracking-wider rounded-xl transition-all inline-flex items-center justify-center gap-2 active:scale-[0.98] shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 cursor-pointer uppercase"
              >
                <span>Initialize Camera Feed</span>
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Right Section - Signing Guides & Inference Rules */}
        <div className="flex flex-col gap-6 overflow-y-auto pr-1">
          {/* Signing Guides Card */}
          <div className="glass-panel rounded-2xl p-6 border border-white/[0.08] shadow-xl flex flex-col justify-between animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <div>
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest block mb-4">Signing Guides</span>
              <div className="space-y-5">
                <div className="flex gap-4 text-left">
                  <span className="text-lg shrink-0 bg-white/5 border border-white/10 w-9 h-9 rounded-xl flex items-center justify-center shadow-inner">💡</span>
                  <div>
                    <h4 className="text-xs font-semibold text-white/85">Optimal Lighting</h4>
                    <p className="text-[10px] text-white/40 font-light mt-1 leading-relaxed">Ensure hands and facial boundaries are bright and well-lit. Face camera sources directly.</p>
                  </div>
                </div>

                <div className="flex gap-4 text-left">
                  <span className="text-lg shrink-0 bg-white/5 border border-white/10 w-9 h-9 rounded-xl flex items-center justify-center shadow-inner">📐</span>
                  <div>
                    <h4 className="text-xs font-semibold text-white/85">Framing Space</h4>
                    <p className="text-[10px] text-white/40 font-light mt-1 leading-relaxed">Maintain track landmarks inside the upper-torso chest camera frame box.</p>
                  </div>
                </div>

                <div className="flex gap-4 text-left">
                  <span className="text-lg shrink-0 bg-white/5 border border-white/10 w-9 h-9 rounded-xl flex items-center justify-center shadow-inner">⏱️</span>
                  <div>
                    <h4 className="text-xs font-semibold text-white/85">Spelling Pace</h4>
                    <p className="text-[10px] text-white/40 font-light mt-1 leading-relaxed">Pause briefly at gesture completion to append letters cleanly to the sequence.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Inference & Grammar Rules Card */}
          <div className="glass-panel rounded-2xl p-6 border border-white/[0.08] shadow-xl animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest block mb-4">Inference Rules</span>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/[0.01] border border-white/[0.04] rounded-xl flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold text-white/85 block mb-1">Fingerspelling</span>
                  <span className="text-[10px] text-white/35 font-light leading-relaxed">Consecutive single letters will merge into cohesive words automatically.</span>
                </div>
              </div>
              <div className="p-4 bg-white/[0.01] border border-white/[0.04] rounded-xl flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold text-white/85 block mb-1">Spacing Spells</span>
                  <span className="text-[10px] text-white/35 font-light leading-relaxed">Multi-character words append spaces dynamically to keep readability clean.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* 3. Footer Bar */}
      <footer className="relative w-full max-w-6xl mx-auto flex items-center justify-between border-t border-white/[0.06] pt-4 shrink-0 z-10 animate-fade-in text-[10px] text-white/20 font-light">
        <div className="flex items-center gap-2">
          <span>Engine Status:</span>
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            Ready for Capture
          </span>
        </div>
        <div>
          <span>Powered by MediaPipe Hand Landmarks & TensorFlow.js</span>
        </div>
        <div>
          <span>© 2026 ASL Link Systems. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}

