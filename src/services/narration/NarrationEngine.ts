import { TextToSpeech } from "@capacitor-community/text-to-speech";
import { Capacitor } from "@capacitor/core";
import { VoiceGender, Psalm } from "../../types";

export interface NarrationOptions {
  gender: VoiceGender;
  speed: number;
  continuousAudio: boolean;
}

export type NarrationEventCallback = (state: {
  isPlaying: boolean;
  isPaused: boolean;
  currentVerseIndex: number;
  totalVerses: number;
  progress: number;
}) => void;

class NarrationEngine {
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private currentSessionId = 0;

  private isPlaying = false;
  private isPaused = false;
  private currentPsalm: Psalm | null = null;
  private currentVerseIndex = 0;
  private options: NarrationOptions = {
    gender: "feminine",
    speed: 1.0,
    continuousAudio: false,
  };

  private listeners: Set<NarrationEventCallback> = new Set();
  private onFinishCallback: (() => void) | null = null;
  private isTitleSpoken = false;

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        this.synth = window.speechSynthesis;
        this.loadVoices();
        if (this.synth.onvoiceschanged !== undefined) {
          this.synth.onvoiceschanged = () => this.loadVoices();
        }
      } catch (e) {
        console.warn("Web SpeechSynthesis initialization error:", e);
      }
    }
  }

  private loadVoices(): void {
    if (!this.synth) return;
    try {
      this.voices = this.synth.getVoices() || [];
    } catch {
      this.voices = [];
    }
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (this.voices.length === 0) {
      this.loadVoices();
    }
    return this.voices;
  }

  /**
   * Selects optimal voice and pitch for pt-BR based on gender preference for Web SpeechSynthesis.
   */
  private selectBestVoice(gender: VoiceGender): { voice: SpeechSynthesisVoice | null; pitch: number } {
    const allVoices = this.getAvailableVoices();
    const isFemale = gender === "feminine";

    const ptVoices = allVoices.filter((v) =>
      v.lang.toLowerCase().startsWith("pt")
    );
    const candidateVoices = ptVoices.length > 0 ? ptVoices : allVoices;

    if (candidateVoices.length === 0) {
      return { voice: null, pitch: isFemale ? 1.05 : 0.88 };
    }

    const genderKeywords = isFemale
      ? ["female", "feminina", "mulher", "maria", "vitoria", "bruna", "luciana", "heloisa", "zira", "samantha", "clara", "helena"]
      : ["male", "masculina", "homem", "ricardo", "felipe", "daniel", "antonio", "jorge", "joao"];

    const matchedVoice = candidateVoices.find((v) => {
      const name = v.name.toLowerCase();
      return genderKeywords.some((kw) => name.includes(kw));
    });

    if (matchedVoice) {
      return { voice: matchedVoice, pitch: isFemale ? 1.0 : 0.92 };
    }

    const ptBrVoice = candidateVoices.find((v) => v.lang.toLowerCase().includes("br")) || candidateVoices[0];
    return {
      voice: ptBrVoice,
      pitch: isFemale ? 1.08 : 0.88,
    };
  }

  /**
   * Preprocesses verse text for clean, natural devotional reading.
   */
  private prepareText(text: string, removeVerseNumbers = true): string {
    let cleaned = text;

    if (removeVerseNumbers) {
      cleaned = cleaned.replace(/^\(?\d+\)?[\.\s\-]+/, "");
    }

    cleaned = cleaned.replace(/\[\d+\]/g, "").replace(/\(\d+\)/g, "");
    cleaned = cleaned.replace(/\s+/g, " ").trim();

    return cleaned;
  }

  public subscribe(callback: NarrationEventCallback): () => void {
    this.listeners.add(callback);
    this.emitState();
    return () => {
      this.listeners.delete(callback);
    };
  }

  private emitState(): void {
    const totalVerses = this.currentPsalm?.verses.length || 0;
    const progress = totalVerses > 0 ? Math.round(((this.currentVerseIndex + 1) / totalVerses) * 100) : 0;

    const state = {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      currentVerseIndex: this.currentVerseIndex,
      totalVerses,
      progress,
    };

    this.listeners.forEach((cb) => cb(state));
  }

  public getOptions(): NarrationOptions {
    return this.options;
  }

  public start(
    psalm: Psalm,
    startVerseIndex = 0,
    options: NarrationOptions,
    onFinish?: () => void
  ): void {
    this.stop();

    this.currentSessionId += 1;
    const sessionId = this.currentSessionId;

    this.currentPsalm = psalm;
    this.currentVerseIndex = Math.max(0, Math.min(startVerseIndex, psalm.verses.length - 1));
    this.options = options;
    this.onFinishCallback = onFinish || null;
    this.isPlaying = true;
    this.isPaused = false;
    this.isTitleSpoken = false;

    this.emitState();

    if (options.continuousAudio) {
      this.speakContinuous(sessionId);
    } else {
      this.speakVerseByVerse(sessionId);
    }
  }

  public startSingleVerse(
    psalm: Psalm,
    verseIndex: number,
    options: NarrationOptions
  ): void {
    this.stop();

    this.currentSessionId += 1;
    const sessionId = this.currentSessionId;

    this.currentPsalm = psalm;
    this.currentVerseIndex = verseIndex;
    this.options = options;
    this.isPlaying = true;
    this.isPaused = false;
    this.isTitleSpoken = true;
    this.emitState();

    const verse = psalm.verses[verseIndex];
    if (!verse) {
      this.stop();
      return;
    }

    const cleanVerseText = this.prepareText(verse.text, true);
    const textToSpeak = `Versículo ${verse.number}. ${cleanVerseText}`;
    this.speakUtterance(textToSpeak, sessionId, () => {
      if (this.currentSessionId === sessionId) {
        this.stop();
      }
    });
  }

  private speakVerseByVerse(sessionId: number): void {
    if (sessionId !== this.currentSessionId || !this.currentPsalm || !this.isPlaying) return;

    const verses = this.currentPsalm.verses;

    if (this.currentVerseIndex === 0 && !this.isTitleSpoken) {
      this.isTitleSpoken = true;
      const titleText = `Salmo ${this.currentPsalm.number}.`;
      this.speakUtterance(titleText, sessionId, () => {
        if (sessionId !== this.currentSessionId || !this.isPlaying) return;
        setTimeout(() => {
          if (sessionId === this.currentSessionId && this.isPlaying && !this.isPaused) {
            this.speakVerseByVerse(sessionId);
          }
        }, 300);
      });
      return;
    }

    if (this.currentVerseIndex >= verses.length) {
      this.finishPlayback(sessionId);
      return;
    }

    const currentVerse = verses[this.currentVerseIndex];
    const cleanVerseText = this.prepareText(currentVerse.text, true);
    const textToSpeak = `Versículo ${currentVerse.number}. ${cleanVerseText}`;

    this.speakUtterance(textToSpeak, sessionId, () => {
      if (sessionId !== this.currentSessionId || !this.isPlaying) return;

      if (this.currentVerseIndex < verses.length - 1) {
        this.currentVerseIndex += 1;
        this.emitState();
        setTimeout(() => {
          if (sessionId === this.currentSessionId && this.isPlaying && !this.isPaused) {
            this.speakVerseByVerse(sessionId);
          }
        }, 350);
      } else {
        this.finishPlayback(sessionId);
      }
    });
  }

  private speakContinuous(sessionId: number): void {
    if (sessionId !== this.currentSessionId || !this.currentPsalm || !this.isPlaying) return;

    const verses = this.currentPsalm.verses;

    if (this.currentVerseIndex === 0 && !this.isTitleSpoken) {
      this.isTitleSpoken = true;
      const titleText = `Salmo ${this.currentPsalm.number}.`;
      this.speakUtterance(titleText, sessionId, () => {
        if (sessionId !== this.currentSessionId || !this.isPlaying) return;
        setTimeout(() => {
          if (sessionId === this.currentSessionId && this.isPlaying && !this.isPaused) {
            this.speakContinuous(sessionId);
          }
        }, 250);
      });
      return;
    }

    if (this.currentVerseIndex >= verses.length) {
      this.finishPlayback(sessionId);
      return;
    }

    const currentVerse = verses[this.currentVerseIndex];
    const textToSpeak = this.prepareText(currentVerse.text, true);

    this.speakUtterance(textToSpeak, sessionId, () => {
      if (sessionId !== this.currentSessionId || !this.isPlaying) return;

      if (this.currentVerseIndex < verses.length - 1) {
        this.currentVerseIndex += 1;
        this.emitState();
        setTimeout(() => {
          if (sessionId === this.currentSessionId && this.isPlaying && !this.isPaused) {
            this.speakContinuous(sessionId);
          }
        }, 150);
      } else {
        this.finishPlayback(sessionId);
      }
    });
  }

  /**
   * Speaks a chunk of text using Capacitor Native Text-To-Speech (on Android/iOS)
   * or Web SpeechSynthesis (fallback in browsers).
   */
  private speakUtterance(
    text: string,
    sessionId: number,
    onEnded: () => void
  ): void {
    const isNative = Capacitor.isNativePlatform();

    if (isNative) {
      this.speakNative(text, sessionId, onEnded);
    } else {
      this.speakWeb(text, sessionId, onEnded);
    }
  }

  private async speakNative(
    text: string,
    sessionId: number,
    onEnded: () => void
  ): Promise<void> {
    try {
      await TextToSpeech.stop();
    } catch {
      // Ignore stop error
    }

    if (sessionId !== this.currentSessionId) return;

    const isFemale = this.options.gender === "feminine";
    const pitch = isFemale ? 1.05 : 0.88;
    const rate = Math.max(0.6, Math.min(1.5, 0.9 * (this.options.speed || 1.0)));

    try {
      await TextToSpeech.speak({
        text,
        lang: "pt-BR",
        rate,
        pitch,
        category: "ambient",
      });

      if (sessionId === this.currentSessionId) {
        onEnded();
      }
    } catch (err: any) {
      console.warn("Capacitor TextToSpeech error, falling back to Web Speech:", err);
      if (sessionId === this.currentSessionId) {
        this.speakWeb(text, sessionId, onEnded);
      }
    }
  }

  private speakWeb(
    text: string,
    sessionId: number,
    onEnded: () => void
  ): void {
    if (!this.synth) {
      onEnded();
      return;
    }

    try {
      this.synth.cancel();
    } catch {
      // Ignore cancel errors
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const { voice, pitch } = this.selectBestVoice(this.options.gender);

    if (voice) {
      utterance.voice = voice;
    }
    utterance.lang = "pt-BR";
    utterance.pitch = pitch;
    utterance.rate = Math.max(0.6, Math.min(1.5, 0.92 * (this.options.speed || 1.0)));

    utterance.onend = () => {
      if (sessionId === this.currentSessionId) {
        onEnded();
      }
    };

    utterance.onerror = (e) => {
      console.warn("SpeechSynthesis utterance error:", e);
      if (sessionId === this.currentSessionId) {
        onEnded();
      }
    };

    try {
      this.synth.speak(utterance);
    } catch (err) {
      console.error("Error invoking SpeechSynthesis.speak:", err);
      onEnded();
    }
  }

  public pause(): void {
    if (!this.isPlaying || this.isPaused) return;
    this.isPaused = true;

    if (Capacitor.isNativePlatform()) {
      TextToSpeech.stop().catch(() => {});
    } else if (this.synth) {
      try {
        this.synth.pause();
      } catch {
        // Ignore synthesis pause errors
      }
    }
    this.emitState();
  }

  public resume(): void {
    if (!this.isPlaying || !this.isPaused) return;
    this.isPaused = false;

    if (Capacitor.isNativePlatform()) {
      if (this.currentPsalm) {
        if (this.options.continuousAudio) {
          this.speakContinuous(this.currentSessionId);
        } else {
          this.speakVerseByVerse(this.currentSessionId);
        }
      }
    } else if (this.synth) {
      try {
        if (this.synth.paused) {
          this.synth.resume();
        } else if (this.currentPsalm) {
          this.start(
            this.currentPsalm,
            this.currentVerseIndex,
            this.options,
            this.onFinishCallback || undefined
          );
          return;
        }
      } catch {
        if (this.currentPsalm) {
          this.start(
            this.currentPsalm,
            this.currentVerseIndex,
            this.options,
            this.onFinishCallback || undefined
          );
          return;
        }
      }
    }
    this.emitState();
  }

  public stop(): void {
    this.currentSessionId += 1;
    this.isPlaying = false;
    this.isPaused = false;

    if (Capacitor.isNativePlatform()) {
      TextToSpeech.stop().catch(() => {});
    }

    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {
        // Ignore cancel errors
      }
    }

    this.emitState();
  }

  public jumpToVerse(verseIndex: number): void {
    if (!this.currentPsalm) return;
    this.start(
      this.currentPsalm,
      verseIndex,
      this.options,
      this.onFinishCallback || undefined
    );
  }

  public updateOptions(newOptions: NarrationOptions): void {
    const genderChanged = this.options.gender !== newOptions.gender;
    const speedChanged = this.options.speed !== newOptions.speed;
    const continuousChanged = this.options.continuousAudio !== newOptions.continuousAudio;

    this.options = newOptions;

    if (this.isPlaying && (genderChanged || speedChanged || continuousChanged) && this.currentPsalm) {
      this.start(
        this.currentPsalm,
        this.currentVerseIndex,
        this.options,
        this.onFinishCallback || undefined
      );
    }
  }

  private finishPlayback(sessionId: number): void {
    if (sessionId !== this.currentSessionId) return;

    this.isPlaying = false;
    this.isPaused = false;
    this.emitState();

    if (this.onFinishCallback) {
      const cb = this.onFinishCallback;
      this.onFinishCallback = null;
      cb();
    }
  }
}

export const narrationEngine = new NarrationEngine();
