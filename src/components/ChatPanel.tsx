import React, { useRef, useEffect, useState } from 'react';
import { Message } from '../types';

interface ChatPanelProps {
  messages: Message[];
  onSendReceiverMessage: (text: string) => void;
}

export function ChatPanel({ messages, onSendReceiverMessage }: ChatPanelProps) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (inputText.trim()) {
      onSendReceiverMessage(inputText.trim());
      setInputText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-[#080808]">
      {/* Scrollable Message List */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center mb-4 shadow-md">
              <svg className="w-6 h-6 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-white/40 text-sm font-medium">No messages yet</p>
            <p className="text-white/20 text-xs mt-2 leading-relaxed max-w-[200px] mx-auto font-light">
              Sign signs into the camera feed or type a response below.
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isSignerMessage = message.sender === 'signer';
            const showTimestamp = index === messages.length - 1 || 
              messages[index + 1]?.sender !== message.sender;
            
            return (
              <div
                key={message.id}
                className={`flex ${isSignerMessage ? 'justify-start' : 'justify-end'} animate-slide-in-right`}
              >
                <div className="max-w-[85%]">
                  
                  {/* Sender Badge */}
                  {isSignerMessage && (
                    <div className="flex items-center gap-1.5 mb-1.5 ml-1">
                      <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/25">
                        <span className="text-[9px] text-emerald-400 font-semibold select-none">🤟</span>
                      </div>
                      <span className="text-[10px] text-emerald-400/80 font-medium tracking-wide">Signer</span>
                    </div>
                  )}

                  {!isSignerMessage && (
                    <div className="flex items-center justify-end gap-1.5 mb-1.5 mr-1">
                      <span className="text-[10px] text-teal-400/80 font-medium tracking-wide">You</span>
                      <div className="w-4 h-4 rounded-full bg-teal-500/20 flex items-center justify-center border border-teal-500/25">
                        <span className="text-[9px] text-teal-400 font-semibold select-none">👤</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Message Bubble Container */}
                  <div
                    className={`rounded-2xl px-4 py-3 shadow-md border ${
                      isSignerMessage
                        ? 'bg-gradient-to-br from-emerald-950/40 via-teal-950/20 to-neutral-900/10 border-emerald-500/20 rounded-tl-sm text-white/95'
                        : 'bg-gradient-to-br from-emerald-600 to-teal-700 border-emerald-500/10 rounded-tr-sm text-white'
                    }`}
                  >
                    <p className="text-sm leading-relaxed tracking-wide font-light break-words">
                      {message.text}
                    </p>
                  </div>
                  
                  {/* Timestamp */}
                  {showTimestamp && (
                    <p className={`text-[10px] mt-1.5 font-light text-white/20 tracking-wider ${
                      isSignerMessage ? 'ml-1 text-left' : 'mr-1 text-right'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer Panel */}
      <div className="p-4 border-t border-white/[0.06] bg-[#0a0a0a] flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your response..."
              className="w-full glass-input rounded-full px-5 py-3 pr-14 text-sm text-white placeholder-white/20 focus:outline-none focus:border-emerald-500/40"
            />
            
            {/* Morphing Spring Send Button */}
            <button
              onClick={handleSend}
              disabled={!inputText.trim()}
              className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ease-out ${
                inputText.trim() 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white scale-100 rotate-0 shadow-[0_0_12px_rgba(16,185,129,0.35)]' 
                  : 'bg-white/[0.03] text-white/20 scale-90 -rotate-45 cursor-not-allowed'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
        <p className="text-[10px] text-white/15 text-center mt-2.5 font-light tracking-wide">
          Press <kbd className="font-mono bg-white/5 border border-white/10 rounded px-1 text-white/30 text-[9px]">Enter</kbd> to transmit response
        </p>
      </div>
    </div>
  );
}
