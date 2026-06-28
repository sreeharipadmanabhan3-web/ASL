export interface User {
  id: number;
  username: string;
  email: string;
  displayName: string;
  avatarColor: string;
  isGuest: boolean;
}

export interface Prediction {
  word: string;
  confidence: number;
}

export interface HandTrackingState {
  isTracking: boolean;
  handsDetected: number;
  isRecording: boolean;
  recordingProgress: number;
  predictions: Prediction[];
}

export interface Message {
  id: string;
  text: string;
  sender: 'signer' | 'receiver';
  timestamp: Date;
}

export type AppPhase = 'locked' | 'intro' | 'app';

export const VOCABULARY = [
  'hello', 'thank you', 'please', 'sorry', 'yes', 'no',
  'help', 'love', 'friend', 'family', 'eat', 'drink',
  'more', 'finish', 'want', 'need', 'good', 'bad',
  'happy', 'sad'
];

export const MAX_FRAMES = 30;
