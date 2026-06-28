import React, { useState } from 'react';
import { User } from '../types';
import { Avatar } from './Avatar';

interface ProfileSettingsModalProps {
  user: User;
  onClose: () => void;
  onUpdateProfile: (displayName: string, avatarColor: string) => Promise<boolean>;
}

export function ProfileSettingsModal({ user, onClose, onUpdateProfile }: ProfileSettingsModalProps) {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [avatarColor, setAvatarColor] = useState(user.avatarColor || '#06b6d4');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const colors = [
    { name: 'Cyan', hex: '#06b6d4' },
    { name: 'Emerald', hex: '#10b981' },
    { name: 'Amber', hex: '#f59e0b' },
    { name: 'Violet', hex: '#8b5cf6' },
    { name: 'Rose', hex: '#f43f5e' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    
    try {
      const success = await onUpdateProfile(displayName, avatarColor);
      if (success) {
        onClose();
      } else {
        setError('Failed to update profile.');
      }
    } catch (err) {
      setError('An error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md z-[9999] animate-fade-in pointer-events-auto">
      <div className="w-full max-w-md p-6 glass-panel rounded-3xl border border-white/[0.12] shadow-2xl relative animate-scale-in">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white hover:bg-white/[0.05] p-1.5 rounded-lg transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-6">
          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest block mb-1 font-mono">NODE IDENTIFICATION</span>
          <h2 className="text-xl font-bold tracking-tight text-white leading-tight">Profile Settings</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar Preview */}
          <div className="flex flex-col items-center gap-2.5 p-4 bg-white/[0.02] border border-white/[0.04] rounded-2xl">
            <Avatar username={user.username} avatarColor={avatarColor} size={64} />
            <div className="text-center">
              <span className="text-xs text-white/70 font-semibold font-mono block">@{user.username}</span>
              <span className="text-[9px] text-white/35 uppercase tracking-widest block mt-0.5">{user.email || 'guest@asllink.local'}</span>
            </div>
          </div>

          {/* Display Name Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono font-bold text-white/40 tracking-wider block">DISPLAY NAME</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Operator Alias"
              className="w-full glass-input rounded-xl py-3 px-4 text-white text-sm placeholder-white/20 focus:outline-none"
            />
          </div>

          {/* Avatar Color Picker */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono font-bold text-white/40 tracking-wider block">NODE AVATAR COLOR</label>
            <div className="flex gap-3 justify-center py-1">
              {colors.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setAvatarColor(c.hex)}
                  className={`w-7 h-7 rounded-full transition-all duration-200 border-2 active:scale-90 cursor-pointer ${
                    avatarColor === c.hex
                      ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                      : 'border-transparent opacity-65 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* System Statistics */}
          <div className="p-3.5 bg-black/40 border border-white/[0.06] rounded-xl flex justify-around text-center">
            <div>
              <span className="text-white/35 text-[9px] font-mono block uppercase">Translations</span>
              <span className="text-white text-sm font-bold mt-0.5 block">42</span>
            </div>
            <div className="w-px h-6 bg-white/[0.08]" />
            <div>
              <span className="text-white/35 text-[9px] font-mono block uppercase">Signs Captured</span>
              <span className="text-white text-sm font-bold mt-0.5 block">184</span>
            </div>
            <div className="w-px h-6 bg-white/[0.08]" />
            <div>
              <span className="text-white/35 text-[9px] font-mono block uppercase">Node State</span>
              <span className="text-emerald-400 text-xs font-bold font-mono mt-1 block flex items-center gap-1.5 justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ONLINE
              </span>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-xs text-center">{error}</p>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 rounded-xl border border-white/10 text-white/70 hover:text-white bg-white/[0.02] hover:bg-white/[0.05] transition-all text-xs font-semibold uppercase tracking-wider cursor-pointer active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-black font-bold text-xs tracking-wider uppercase transition-all cursor-pointer active:scale-95 shadow-md shadow-emerald-500/10"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
