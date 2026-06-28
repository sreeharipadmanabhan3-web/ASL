import { useState, useCallback } from 'react';
import { Message } from '../types';

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);

  const sendSignerMessage = useCallback((text: string) => {
    const message: Message = {
      id: Date.now().toString(),
      text,
      sender: 'signer',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, message]);
  }, []);

  const sendReceiverMessage = useCallback((text: string) => {
    const message: Message = {
      id: Date.now().toString(),
      text,
      sender: 'receiver',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, message]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    sendSignerMessage,
    sendReceiverMessage,
    clearMessages,
  };
}
