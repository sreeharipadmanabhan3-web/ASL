import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { LoginScreen } from './components/LoginScreen';
import { IntroScreen } from './components/IntroScreen';
import { MainApp } from './components/MainApp';
import { ProfileSettingsModal } from './components/ProfileSettingsModal';

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
    } else {
      // Authenticated — restore last screen or default to 'app'
      const savedPhase = sessionStorage.getItem('appPhase') as AppPhase | null;
      setPhaseState(savedPhase === 'app' || savedPhase === 'intro' ? savedPhase : 'intro');
    }
  }, [authLoading, isAuthenticated]);

  const handleStartCamera = () => {
    setPhase('app');
  };

  const handleLogout = () => {
    logout();
    setPhase('login');
  };

  // Loading screen
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

  // Login screen
  if (phase === 'login') {
    return (
      <LoginScreen
        onLogin={login}
        onRegister={register}
        onGuestLogin={loginAsGuest}
        isLoading={authLoading}
        error={error}
      />
    );
  }

  // Intro screen
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
          />
        )}
      </>
    );
  }

  // Main app
  if (!user) return null;
  
  return (
    <>
      <MainApp 
        user={user}
        onLogout={handleLogout}
        onNavigateHome={() => setPhase('intro')}
        onRefreshUser={refreshUser}
        onOpenSettings={() => setShowSettings(true)}
      />
      {showSettings && (
        <ProfileSettingsModal
          user={user!}
          onClose={() => setShowSettings(false)}
          onUpdateProfile={updateProfile}
        />
      )}
    </>
  );
}
