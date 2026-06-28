import { User } from '../types';
import { Avatar } from './Avatar';

interface ProfileBadgeProps {
  user: User;
  onLogout: () => void;
  onOpenSettings?: () => void;
}

export function ProfileBadge({ user, onLogout, onOpenSettings }: ProfileBadgeProps) {
  const isGuest = user.username.startsWith('guest_');
  const nameToDisplay = user.displayName || (isGuest ? 'Guest Operator' : user.username);

  return (
    <div className="flex items-center gap-3 bg-white/[0.01] border border-white/[0.06] rounded-2xl p-1.5 pr-3 backdrop-blur-md shadow-md animate-fade-in">
      <button
        type="button"
        onClick={onOpenSettings}
        disabled={!onOpenSettings}
        className="flex items-center gap-2 hover:bg-white/[0.03] p-1 rounded-xl transition-all duration-200 cursor-pointer text-left active:scale-[0.98] group focus:outline-none"
        title="Node Profile Settings"
      >
        <Avatar username={user.username} avatarColor={user.avatarColor} size={30} />
        <div className="flex flex-col text-left justify-center min-w-[70px] max-w-[120px]">
          <span className="text-[11px] font-bold text-white/90 group-hover:text-emerald-400 truncate leading-tight transition-colors">
            {nameToDisplay}
          </span>
          <span className="text-[9px] font-mono text-white/35 group-hover:text-white/50 leading-tight uppercase font-medium tracking-wide transition-colors">
            {isGuest ? 'GUEST NODE' : 'AUTHORIZED'}
          </span>
        </div>
      </button>

      <div className="w-px h-6 bg-white/[0.08]" />

      <button
        onClick={onLogout}
        className="p-1.5 rounded-lg bg-white/[0.03] hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/35 border border-white/[0.06] text-white/50 transition-all duration-200 cursor-pointer active:scale-95 flex items-center justify-center focus:outline-none"
        title="Sign Out"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      </button>
    </div>
  );
}
