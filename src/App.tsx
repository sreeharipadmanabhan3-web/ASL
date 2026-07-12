import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { LoginScreen } from './components/LoginScreen';
import { IntroScreen } from './components/IntroScreen';
import { MainApp } from './components/MainApp';
import { ProfileSettingsModal } from './components/ProfileSettingsModal';
import { CustomCursor } from './components/CustomCursor';

type AppPhase = 'loading' | 'login' | 'intro' | 'app';

export default function App() {
  const {
    user,
    isLoading: authLoading,
    error,
    isAuthenticated,
    login,
    register,
    loginAsGuest,
    logout,
    refreshUser,
    updateProfile
  } = useAuth();

  const [phase, setPhaseState] = useState<AppPhase>('loading');
  const [showSettings, setShowSettings] = useState(false);
  const [successType, setSuccessType] = useState<'login' | 'register' | 'guest' | null>(null);

  const [perfSettings, setPerfSettings] = useState(() => {
    const saved = localStorage.getItem('asl_perf_settings');
    const defaults = {
      backendDelegate: 'GPU' as 'GPU' | 'CPU',
      tfjsBackend: 'webgl' as 'webgl' | 'cpu',
      trackingFps: 30 as number,
      enableCustomCursor: false as boolean,
      enableAutoAdd: true as boolean,
      autoAddDuration: 1.5 as number
    };
    if (saved) {
      try {
        return { ...defaults, ...JSON.parse(saved) };
      } catch (e) { }
    }
    return defaults;
  });

  // Persist phase so refresh restores the correct screen
  const setPhase = (newPhase: AppPhase) => {
    if (newPhase === 'app' || newPhase === 'intro') {
      sessionStorage.setItem('appPhase', newPhase);
    } else {
      sessionStorage.removeItem('appPhase');
    }
    setPhaseState(newPhase);
  };

  // Determine phase based on auth state
  useEffect(() => {
    if (authLoading) return; // still checking, do nothing

    if (!isAuthenticated) {
      // Not logged in — go to login and clear saved phase
      sessionStorage.removeItem('appPhase');
      setPhaseState('login');
      setSuccessType(null);
    } else {
      // Authenticated — if successType is set, delay transition!
      if (successType) {
        const timer = setTimeout(() => {
          const savedPhase = sessionStorage.getItem('appPhase') as AppPhase | null;
          setPhase(savedPhase === 'app' || savedPhase === 'intro' ? savedPhase : 'intro');
        }, 1800);
        return () => clearTimeout(timer);
      } else {
        const savedPhase = sessionStorage.getItem('appPhase') as AppPhase | null;
        setPhase(savedPhase === 'app' || savedPhase === 'intro' ? savedPhase : 'intro');
      }
    }
  }, [authLoading, isAuthenticated, successType]);

  const handleLogin = async (u: string, p: string) => {
    const res = await login(u, p);
    if (res) {
      setSuccessType('login');
    }
    return res;
  };

  const handleRegister = async (u: string, e: string, p: string, d?: string) => {
    const res = await register(u, e, p, d);
    if (res) {
      setSuccessType('register');
    }
    return res;
  };

  const handleGuestLogin = async () => {
    const res = await loginAsGuest();
    if (res) {
      setSuccessType('guest');
    }
    return res;
  };

  const handleStartCamera = () => {
    setPhase('app');
  };

  const handleLogout = () => {
    logout();
    setPhase('login');
  };

  const renderContent = () => {
    if (phase === 'loading') {
      return (
        <div className="fixed inset-0 bg-[#050505] flex flex-col items-center justify-center overflow-hidden">
          {/* Ambient glow backgrounds */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/5 rounded-full blur-[160px] pointer-events-none" style={{ animationDelay: '-5s' }} />

          <div className="relative flex flex-col items-center gap-6">
            {/* Concentric rotating loaders around the hand sign */}
            <div className="relative w-24 h-24 flex items-center justify-center">
              {/* Outer ring */}
              <div className="absolute inset-0 rounded-full border border-white/[0.04]" />
              <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-transparent border-t-emerald-500 border-r-emerald-500/40 animate-spin" style={{ animationDuration: '1.2s' }} />

              {/* Inner ring (counter-rotating) */}
              <div className="absolute inset-2 rounded-full border border-white/[0.04]" />
              <div className="absolute inset-2 rounded-full border-b-2 border-l-2 border-transparent border-b-teal-400 border-l-teal-400/40 animate-spin" style={{ animationDuration: '1.8s', animationDirection: 'reverse' }} />

              {/* Center icon */}
              <div className="w-14 h-14 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center shadow-2xl backdrop-blur-md">
                <span className="text-2xl animate-pulse select-none">🤟</span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-1.5 text-center">
              <h2 className="text-white text-lg font-medium tracking-wide">ASL Link</h2>
              <div className="flex items-center gap-2">
                <span className="text-white/40 text-xs font-light tracking-widest uppercase">Initializing Interface</span>
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (phase === 'login') {
      return (
        <div className="relative w-full h-full">
          <LoginScreen
            onLogin={handleLogin}
            onRegister={handleRegister}
            onGuestLogin={handleGuestLogin}
            isLoading={authLoading}
            error={error}
          />

          {successType && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in pointer-events-auto">
              <div className="w-full max-w-sm p-8 text-center glass-panel rounded-3xl border border-white/[0.12] shadow-2xl animate-scale-in">
                <div className="relative w-16 h-16 mb-5 flex items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/25 shadow-lg mx-auto">
                  <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-ping" />
                  <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                <h3 className="text-white text-lg font-bold tracking-tight mb-2">
                  {successType === 'register' ? 'Node Registered' : 'Access Granted'}
                </h3>

                <p className="text-white/45 text-xs font-light leading-relaxed max-w-[260px] mx-auto">
                  {successType === 'login' && `Welcome back, ${user?.displayName || user?.username || 'user'}. Opening secure ASL Link capture gateway...`}
                  {successType === 'register' && `Account created for ${user?.username}. Preparing system models...`}
                  {successType === 'guest' && `Temporary guest credentials active. Opening translation gateway...`}
                </p>

                <div className="sonar-spinner">
                  <div className="sonar-wave" />
                  <div className="sonar-wave" />
                  <div className="sonar-wave" />
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (phase === 'intro') {
      return (
        <>
          <IntroScreen
            onStart={handleStartCamera}
            user={user!}
            onLogout={handleLogout}
            onRefreshUser={refreshUser}
            onOpenSettings={() => setShowSettings(true)}
          />
          {showSettings && (
            <ProfileSettingsModal
              user={user!}
              onClose={() => setShowSettings(false)}
              onUpdateProfile={updateProfile}
              perfSettings={perfSettings}
              onUpdatePerfSettings={(settings) => {
                setPerfSettings(settings);
                localStorage.setItem('asl_perf_settings', JSON.stringify(settings));
              }}
            />
          )}
        </>
      );
    }

    // Main app phase
    if (!user) return null;

    return (
      <>
        <MainApp
          user={user}
          onLogout={handleLogout}
          onNavigateHome={() => setPhase('intro')}
          onRefreshUser={refreshUser}
          onOpenSettings={() => setShowSettings(true)}
          perfSettings={perfSettings}
        />
        {showSettings && (
          <ProfileSettingsModal
            user={user!}
            onClose={() => setShowSettings(false)}
            onUpdateProfile={updateProfile}
            perfSettings={perfSettings}
            onUpdatePerfSettings={(settings) => {
              setPerfSettings(settings);
              localStorage.setItem('asl_perf_settings', JSON.stringify(settings));
            }}
          />
        )}
      </>
    );
  };

  return (
    <>
      <CustomCursor enable={perfSettings.enableCustomCursor} />
      {renderContent()}
    </>
  );
}

