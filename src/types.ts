export interface Verse {
  number: number;
  text: string;
}

export interface Psalm {
  number: number;
  title: string;
  theme: string;
  verses: Verse[];
}

export interface PsalmMetadata {
  number: number;
  title: string;
  theme: string;
  category: string;
  preview: string;
}

export type ThemeMode = "light" | "dark";
export type VoiceGender = "masculine" | "feminine";

export interface AppSettings {
  themeMode: ThemeMode;
  voiceGender: VoiceGender;
  voiceSpeed: number; // e.g. 0.8, 1.0, 1.2
  fontSizeMultiplier: number; // e.g., 0.85, 1.0, 1.15, 1.3
  notificationTime: string; // "HH:MM" e.g. "08:00" (Morning)
  notificationTimeAfternoon?: string; // "HH:MM" e.g. "14:00"
  notificationTimeEvening?: string; // "HH:MM" e.g. "20:00"
  enableMorningNotif?: boolean;
  enableAfternoonNotif?: boolean;
  enableEveningNotif?: boolean;
  hasSetupVoice: boolean;
  continuousAudio: boolean;
  userName?: string;
  hasAcceptedPrivacy?: boolean;
  isPremium?: boolean;
}

export interface PlayerState {
  isPlaying: boolean;
  isPaused: boolean;
  currentPsalmNumber: number | null;
  currentVerseIndex: number;
  totalVerses: number;
  progress: number; // 0 to 100
  isSingleVerseMode?: boolean;
}

export interface SavedProgress {
  psalmNumber: number;
  verseIndex: number;
}
