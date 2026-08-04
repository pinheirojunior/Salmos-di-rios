export type NarrationState = 'idle' | 'loading' | 'speaking' | 'paused' | 'error';

export interface NarrationOptions {
  rate?: number;
  pitch?: number;
  voiceName?: string;
  lang?: string;
  gender?: 'masculine' | 'feminine';
}

export interface VoiceInfo {
  name: string;
  lang: string;
  isPt: boolean;
  isFemale: boolean;
  nativeVoice?: SpeechSynthesisVoice;
}

export interface NarrationEventHandlers {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
  onPause?: () => void;
  onResume?: () => void;
}
