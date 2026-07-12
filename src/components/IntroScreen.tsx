import { useState } from 'react';
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
  const [showNodes, setShowNodes] = useState(false);

  return (
    <div className="min-h-screen w-screen animate-bg-fluid flex flex-col justify-between p-6 overflow-y-auto select-none relative animate-fade-in">
      
      {/* Background ambient animations and tech elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.05] pointer-events-none z-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-blue-500/[0.02] animate-pulse-glow pointer-events-none z-0" />
      
      {/* Ambient glass glows (Windows 11 setup style) */}
      <div className="absolute top-1/4 right-1/4 w-[45vw] h-[45vw] max-w-[500px] rounded-full blur-[140px] animate-orb-color-1 pointer-events-none z-0" />
      <div className="absolute bottom-1/4 left-1/4 w-[40vw] h-[40vw] max-w-[450px] rounded-full blur-[120px] animate-orb-color-2 pointer-events-none z-0" />
      
      {/* Subtle alignment lasers */}
      <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-blue-500/5 to-transparent pointer-events-none z-0" />
      <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-purple-500/5 to-transparent pointer-events-none z-0" />

      {/* 1. Header Bar */}
      <header className="relative w-full max-w-6xl mx-auto flex items-center justify-between border-b border-white/[0.06] pb-4 shrink-0 z-30 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#0078d4] to-[#7c3aed] flex items-center justify-center shadow-lg">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
              <path d="M6 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
              <path d="M18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
              <path d="M9 18l6-8" />
              <path d="M9 6l6 8" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">ASL Link</h1>
              <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded font-mono font-medium">v1.2.0</span>
            </div>
            <p className="text-[10px] text-white/35 font-light">Client-Side Landmark Processing</p>
          </div>
        </div>

        <ProfileBadge user={user} onLogout={onLogout} onOpenSettings={onOpenSettings} />
      </header>

      {/* 2. Main Dashboard Content Grid */}
      <main className="relative w-full max-w-6xl mx-auto flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 py-6 items-stretch z-10">

        {/* Left Section - Camera Feed Console (Active Control Hub) */}
        <div className="flex flex-col gap-6">
          <div className="glass-panel rounded-3xl p-8 border border-white/[0.08] flex-1 flex flex-col justify-between shadow-xl animate-fade-up relative overflow-hidden group">
            {/* Extremely subtle ambient glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/[0.02] via-transparent to-purple-500/[0.02] opacity-40 pointer-events-none" />

            <div className="relative z-10 flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-blue-400/80 font-bold uppercase tracking-widest block mb-1">Control Hub</span>
                <h2 className="text-2xl font-bold tracking-tight text-white mb-3 leading-tight">Camera Feed Console</h2>
                <p className="text-white/40 text-xs font-light leading-relaxed mb-8 max-w-md">
                  Boot up your local device camera to initiate real-time fingerspelling, grammar mapping, and holographic landmark tracking.
                </p>
              </div>

              {/* Minimalist Preview Box */}
              <div className="flex-1 min-h-[220px] rounded-2xl border border-white/[0.06] bg-white/[0.01] flex flex-col items-center justify-center p-6 relative overflow-hidden mb-8 group-hover:border-white/[0.12] transition-all duration-300">
                <div className="w-12 h-12 rounded-full bg-white/[0.02] border border-white/[0.06] flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </div>
                <span className="text-[10px] text-white/30 tracking-widest font-mono uppercase">FEED_STANDBY</span>
              </div>

              <button
                onClick={onStart}
                className="group w-full py-4 relative bg-gradient-to-r from-[#0078d4] to-[#7c3aed] hover:from-[#0086f0] hover:to-[#8b5cf6] text-white font-bold text-xs tracking-wider rounded-xl transition-all inline-flex items-center justify-center gap-2 active:scale-[0.98] shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 cursor-pointer uppercase"
              >
                <span>Initialize Camera Feed</span>
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Right Section - ASL Bento Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Card 1: Core ASL Overview (col-span-2) */}
          <div className="col-span-2 glass-panel rounded-2xl p-6 border border-white/[0.08] shadow-xl flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.03] to-transparent opacity-60 pointer-events-none" />
            <div>
              <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest block mb-2">Language System</span>
              <h3 className="text-base font-bold text-white mb-2">American Sign Language (ASL)</h3>
              <p className="text-white/45 text-xs font-light leading-relaxed max-w-xl">
                ASL is a complete, natural language that has the same linguistic properties as spoken languages, with grammar rules that differ from English. It is expressed by movements of the hands, face, and body.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[10px] text-blue-400/80 font-mono">
              <button
                onClick={() => setShowNodes(!showNodes)}
                className="flex items-center gap-1 hover:text-blue-300 transition-colors cursor-pointer select-none focus:outline-none"
              >
                <svg
                  className={`w-3 h-3 text-blue-400 transition-transform duration-300 ${showNodes ? 'rotate-90' : ''}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                <span>3D Visual Grammar</span>
              </button>
              <span>&bull;</span>
              <span>21 tracking nodes</span>
            </div>

            {showNodes && (
              <div className="mt-4 pt-4 border-t border-white/[0.06] animate-fade-in">
                <span className="text-[9px] text-blue-400 font-bold tracking-widest uppercase block mb-3 font-mono">21 landmark tracking nodes</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-[10px] font-mono text-white/55">
                  <div className="bg-white/[0.02] border border-white/[0.04] p-2 rounded-xl">
                    <span className="text-white/20 block mb-1">Wrist</span>
                    <div className="font-semibold text-white/80">0: Wrist Joint</div>
                  </div>
                  <div className="bg-white/[0.02] border border-white/[0.04] p-2 rounded-xl">
                    <span className="text-amber-500/40 block mb-1">Thumb</span>
                    <ul className="space-y-0.5 text-[9px] leading-tight">
                      <li>1: CMC Base</li>
                      <li>2: MCP Knuckle</li>
                      <li>3: IP Joint</li>
                      <li>4: Tip</li>
                    </ul>
                  </div>
                  <div className="bg-white/[0.02] border border-white/[0.04] p-2 rounded-xl">
                    <span className="text-cyan-500/40 block mb-1">Index</span>
                    <ul className="space-y-0.5 text-[9px] leading-tight">
                      <li>5: MCP Knuckle</li>
                      <li>6: PIP Joint</li>
                      <li>7: DIP Joint</li>
                      <li>8: Tip</li>
                    </ul>
                  </div>
                  <div className="bg-white/[0.02] border border-white/[0.04] p-2 rounded-xl">
                    <span className="text-emerald-500/40 block mb-1">Middle</span>
                    <ul className="space-y-0.5 text-[9px] leading-tight">
                      <li>9: MCP Knuckle</li>
                      <li>10: PIP Joint</li>
                      <li>11: DIP Joint</li>
                      <li>12: Tip</li>
                    </ul>
                  </div>
                  <div className="bg-white/[0.02] border border-white/[0.04] p-2 rounded-xl">
                    <span className="text-purple-500/40 block mb-1">Ring</span>
                    <ul className="space-y-0.5 text-[9px] leading-tight">
                      <li>13: MCP Knuckle</li>
                      <li>14: PIP Joint</li>
                      <li>15: DIP Joint</li>
                      <li>16: Tip</li>
                    </ul>
                  </div>
                  <div className="bg-white/[0.02] border border-white/[0.04] p-2 rounded-xl">
                    <span className="text-rose-500/40 block mb-1">Pinky</span>
                    <ul className="space-y-0.5 text-[9px] leading-tight">
                      <li>17: MCP Knuckle</li>
                      <li>18: PIP Joint</li>
                      <li>19: DIP Joint</li>
                      <li>20: Tip</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Linguistic Depth (col-span-1) */}
          <div className="glass-panel rounded-2xl p-5 border border-white/[0.08] shadow-xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-bl from-purple-500/[0.03] to-transparent opacity-50 pointer-events-none" />
            <div>
              <svg className="w-5 h-5 text-purple-400 mb-2.5 block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1 0-3.12 3 3 0 0 1 0-4.88 2.5 2.5 0 0 1 0-3.12A2.5 2.5 0 0 1 9.5 2z" />
                <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 0-3.12 3 3 0 0 0 0-4.88 2.5 2.5 0 0 0 0-3.12A2.5 2.5 0 0 0 14.5 2z" />
              </svg>
              <h4 className="text-xs font-semibold text-white/90 mb-1">Linguistic Autonomy</h4>
              <p className="text-[10px] text-white/40 font-light leading-relaxed">
                ASL has its own independent rules for word order, morphology, and syntax, rather than being a direct sign encoding of English.
              </p>
            </div>
          </div>

          {/* Card 3: Concepts vs Fingerspelling (col-span-1) */}
          <div className="glass-panel rounded-2xl p-5 border border-white/[0.08] shadow-xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/[0.03] to-transparent opacity-50 pointer-events-none" />
            <div>
              <svg className="w-5 h-5 text-cyan-400 mb-2.5 block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
                <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
                <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
                <path d="M6 14v-3a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v11A10 10 0 0 0 10 22h6a6 6 0 0 0 6-6V11a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
              </svg>
              <h4 className="text-xs font-semibold text-white/90 mb-1">Dual-Mode Sign Lexicon</h4>
              <p className="text-[10px] text-white/40 font-light leading-relaxed">
                Fingerspelling spells names letter-by-letter, whereas core vocabulary words represent complete concepts in single signs.
              </p>
            </div>
          </div>

          {/* Card 4: Non-Manual Signals (col-span-2) */}
          <div className="col-span-2 glass-panel rounded-2xl p-5 border border-white/[0.08] shadow-xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/[0.02] to-purple-500/[0.02] opacity-60 pointer-events-none" />
            <div className="flex gap-4 items-start">
              <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl">
                <svg className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                  <line x1="9" y1="9" x2="9.01" y2="9" />
                  <line x1="15" y1="9" x2="15.01" y2="9" />
                </svg>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white/90 mb-1">Grammar & Non-Manual Signals</h4>
                <p className="text-[10px] text-white/40 font-light leading-relaxed">
                  Facial expressions, eyebrow placement, head tilts, and body posture are grammar markers in ASL that define sentence type and tone.
                </p>
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* 3. Hand Detection Blueprint Section */}
      <section className="relative w-full max-w-6xl mx-auto mt-8 mb-8 z-10 animate-fade-up" style={{ animationDelay: '0.2s' }}>
        <div className="glass-panel rounded-3xl p-8 border border-white/[0.08] shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.02] to-purple-500/[0.02] opacity-60 pointer-events-none" />
          
          <div className="mb-8">
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest block mb-1">Pipeline Architecture</span>
            <h2 className="text-xl font-bold tracking-tight text-white">Landmark-Based Translation Engine</h2>
            <p className="text-white/45 text-xs font-light mt-1">
              ASL Link utilizes an advanced neural pipeline combining computer vision landmark estimation with sequential deep learning.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Steps Timeline (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {[
                { step: '01', title: 'Frame Capture', desc: 'Webcam frames are buffered locally in client memory at 30fps with adjustable brightness filters.' },
                { step: '02', title: 'Palm Detection', desc: 'MediaPipe model identifies hand bounding boxes in the 2D image coordinates.' },
                { step: '03', title: '3D Landmark Mapping', desc: 'A regression neural net localizes 21 precise 3D joints (x, y, z relative coordinates) on the hand.' },
                { step: '04', title: 'Temporal Sequence Analysis (LSTM)', desc: 'Spelled frames are compiled into chronological sequences to capture sign movements over time.' },
                { step: '05', title: 'Character / Word Classification', desc: 'Our sequence model outputs predictions with probability metrics which are appended to the sentence bar.' }
              ].map((p, idx) => (
                <div key={idx} className="flex gap-4 items-start group">
                  <span className="text-xs font-bold font-mono text-blue-400/70 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/15 group-hover:bg-blue-500/25 group-hover:text-blue-300 transition-colors duration-200">{p.step}</span>
                  <div>
                    <h4 className="text-xs font-semibold text-white/90 group-hover:text-blue-300 transition-colors duration-200">{p.title}</h4>
                    <p className="text-[10px] text-white/45 font-light mt-1.5 leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Visual Hand Skeleton Blueprint Diagram (5 cols) */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl bg-white/[0.01] border border-white/[0.04] relative overflow-hidden min-h-[300px]">
              <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />
              
              {/* Hand Landmark SVG Blueprint */}
              <svg className="w-64 h-64 relative z-10 animate-svg-hand" viewBox="0 0 100 100">
                {/* Connector lines (Bones) */}
                {/* Palm Base */}
                <path d="M 50 90 L 38 72 L 50 55 L 62 58 L 74 65 L 50 90" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
                <path d="M 38 72 L 50 55 M 50 55 L 62 58 M 62 58 L 74 65" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                
                {/* Thumb - Sky Blue */}
                <path d="M 50 90 L 32 78 L 20 68 L 14 62 L 10 58" fill="none" stroke="#60cdff" strokeWidth="1.5" strokeLinecap="round" className="opacity-80" />
                {/* Index - Royal Blue */}
                <path d="M 38 72 L 32 50 L 28 35 L 25 22 L 23 12" fill="none" stroke="#0078d4" strokeWidth="1.5" strokeLinecap="round" className="opacity-80" />
                {/* Middle - Cyan Blue */}
                <path d="M 50 55 L 50 32 L 50 18 L 50 8" fill="none" stroke="#00a2ed" strokeWidth="1.5" strokeLinecap="round" className="opacity-80" />
                {/* Ring - Violet */}
                <path d="M 62 58 L 65 38 L 68 24 L 71 14 L 73 6" fill="none" stroke="#5f259f" strokeWidth="1.5" strokeLinecap="round" className="opacity-80" />
                {/* Pinky - Purple */}
                <path d="M 74 65 L 80 50 L 85 39 L 90 30 L 94 22" fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" className="opacity-80" />

                {/* Joint dots */}
                {/* Wrist */}
                <circle cx="50" cy="90" r="2.5" fill="#94a3b8" />
                
                {/* Thumb joints */}
                <circle cx="32" cy="78" r="1.5" fill="#60cdff" />
                <circle cx="20" cy="68" r="1.5" fill="#60cdff" />
                <circle cx="14" cy="62" r="1.5" fill="#60cdff" />
                <circle cx="10" cy="58" r="2" fill="#60cdff" className="animate-pulse" /> {/* Tip */}

                {/* Index joints */}
                <circle cx="32" cy="50" r="1.5" fill="#0078d4" />
                <circle cx="28" cy="35" r="1.5" fill="#0078d4" />
                <circle cx="25" cy="22" r="1.5" fill="#0078d4" />
                <circle cx="23" cy="12" r="2" fill="#0078d4" className="animate-pulse" /> {/* Tip */}

                {/* Middle joints */}
                <circle cx="50" cy="32" r="1.5" fill="#00a2ed" />
                <circle cx="50" cy="18" r="1.5" fill="#00a2ed" />
                <circle cx="50" cy="8" r="2" fill="#00a2ed" className="animate-pulse" /> {/* Tip */}

                {/* Ring joints */}
                <circle cx="65" cy="38" r="1.5" fill="#5f259f" />
                <circle cx="68" cy="24" r="1.5" fill="#5f259f" />
                <circle cx="71" cy="14" r="1.5" fill="#5f259f" />
                <circle cx="73" cy="6" r="2" fill="#5f259f" className="animate-pulse" /> {/* Tip */}

                {/* Pinky joints */}
                <circle cx="80" cy="50" r="1.5" fill="#7c3aed" />
                <circle cx="85" cy="39" r="1.5" fill="#7c3aed" />
                <circle cx="90" cy="30" r="1.5" fill="#7c3aed" />
                <circle cx="94" cy="22" r="2" fill="#7c3aed" className="animate-pulse" /> {/* Tip */}
              </svg>

              <div className="mt-4 text-center">
                <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-widest">21-Node Skeletal Map</span>
                <p className="text-[9px] text-white/35 font-light max-w-[200px] mt-1 text-center leading-relaxed">
                  Real-time hand configuration calculations mapping angles between nodes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Footer Bar */}
      <footer className="relative w-full max-w-6xl mx-auto flex items-center justify-between border-t border-white/[0.06] pt-4 shrink-0 z-10 animate-fade-in text-[10px] text-white/20 font-light">
        <div className="flex items-center gap-2">
          <span>Engine Status:</span>
          <span className="flex items-center gap-1 text-blue-400 font-medium">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
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
