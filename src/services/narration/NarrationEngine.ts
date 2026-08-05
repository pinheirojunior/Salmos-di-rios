import { VoiceGender, Psalm, Verse } from "../../types";

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

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
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
   * Selects the optimal voice for pt-BR based on gender preference.
   */
  private selectBestVoice(gender: VoiceGender): { voice: SpeechSynthesisVoice | null; pitch: number } {
    const allVoices = this.getAvailableVoices();
    const isFemale = gender === "feminine";

    // Filter Portuguese voices first, fallback to all voices if none found
    const ptVoices = allVoices.filter((v) =>
      v.lang.toLowerCase().startsWith("pt")
    );
    const candidateVoices = ptVoices.length > 0 ? ptVoices : allVoices;

    if (candidateVoices.length === 0) {
      // Default pitch adjustments if no browser voices listed yet
      return { voice: null, pitch: isFemale ? 1.05 : 0.88 };
    }

    // Try finding gender matches by voice name
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

    // Secondary fallback: pick pt-BR voice
    const ptBrVoice = candidateVoices.find((v) => v.lang.toLowerCase().includes("br")) || candidateVoices[0];
    return {
      voice: ptBrVoice,
      pitch: isFemale ? 1.08 : 0.88, // Pitch modulation ensures clear distinction
    };
  }

  /**
   * Preprocesses verse text for clean, natural devotional reading.
   */
  private prepareText(text: string, removeVerseNumbers = true): string {
    let cleaned = text;

    if (removeVerseNumbers) {
      // Remove verse number markers like "1.", "1 ", "(1)", "1 - "
      cleaned = cleaned.replace(/^\(?\d+\)?[\.\s\-]+/, "");
    }

    // Remove any unexpected inline verse tags or bracket markers
    cleaned = cleaned.replace(/\[\d+\]/g, "").replace(/\(\d+\)/g, "");

    // Trim and normalize multiple spaces
    cleaned = cleaned.replace(/\s+/g, " ").trim();

    return cleaned;
  }

  /**
   * Subscribe to narration state changes
   */
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

  /**
   * Start narrating a Psalm
   */
  private isTitleSpoken = false;

  public start(
    psalm: Psalm,
    startVerseIndex = 0,
    options: NarrationOptions,
    onFinish?: () => void
  ): void {
    this.stop(); // Stop any active session immediately

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

  /**
   * Speak a single verse (or single verse mode)
   */
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

  /**
   * Internal verse-by-verse playback sequence (Modo 1 - Leitura Normal)
   * Announces "Salmo X." at start, and "Versículo Y. [texto]" for each verse.
   */
  private speakVerseByVerse(sessionId: number): void {
    if (sessionId !== this.currentSessionId || !this.currentPsalm || !this.isPlaying) return;

    const verses = this.currentPsalm.verses;

    // Announce Psalm chapter title at start of reading
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
    // Announce verse number then text: "Versículo X. [texto]"
    const textToSpeak = `Versículo ${currentVerse.number}. ${cleanVerseText}`;

    this.speakUtterance(textToSpeak, sessionId, () => {
      if (sessionId !== this.currentSessionId || !this.isPlaying) return;

      if (this.currentVerseIndex < verses.length - 1) {
        this.currentVerseIndex += 1;
        this.emitState();
        // Brief natural devotional pause between verses (350ms)
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

  /**
   * Internal continuous audiobook-style playback (Modo 2 - Áudio Contínuo)
   * Announces "Salmo X." at start, then reads text of verses fluently without announcing verse numbers.
   */
  private speakContinuous(sessionId: number): void {
    if (sessionId !== this.currentSessionId || !this.currentPsalm || !this.isPlaying) return;

    const verses = this.currentPsalm.verses;

    // Announce Psalm chapter title at start of reading if starting at verse 0
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
    // Clean text without verse number prefix and WITHOUT saying "Versículo X."
    const textToSpeak = this.prepareText(currentVerse.text, true);

    this.speakUtterance(textToSpeak, sessionId, () => {
      if (sessionId !== this.currentSessionId || !this.isPlaying) return;

      if (this.currentVerseIndex < verses.length - 1) {
        this.currentVerseIndex += 1;
        this.emitState();
        // Fluid minimal pause between verses in continuous mode
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
   * Speaks a chunk of text using SpeechSynthesis with fallback handling
   */
  private speakUtterance(
    text: string,
    sessionId: number,
    onEnded: () => void
  ): void {
    if (!this.synth) {
      // SpeechSynthesis not supported in environment fallback
      onEnded();
      return;
    }

    this.synth.cancel(); // Clear hardware queue

    const utterance = new SpeechSynthesisUtterance(text);
    const { voice, pitch } = this.selectBestVoice(this.options.gender);

    if (voice) {
      utterance.voice = voice;
    }
    utterance.lang = "pt-BR";
    utterance.pitch = pitch;
    // Base speed rate: 0.9x for a calm devotional pace, multiplied by option speed
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

  /**
   * Pause playback
   */
  public pause(): void {
    if (!this.isPlaying || this.isPaused) return;
    this.isPaused = true;
    if (this.synth) {
      try {
        this.synth.pause();
      } catch {
        // Ignore synthesis pause errors
      }
    }
    this.emitState();
  }

  /**
   * Resume playback
   */
  public resume(): void {
    if (!this.isPlaying || !this.isPaused) return;
    this.isPaused = false;
    if (this.synth) {
      try {
        if (this.synth.paused) {
          this.synth.resume();
        } else if (this.currentPsalm) {
          // Restart current verse if resume fails
          this.start(
            this.currentPsalm,
            this.currentVerseIndex,
            this.options,
            this.onFinishCallback || undefined
          );
          return;
        }
      } catch {
        // Fallback to restarting
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

  /**
   * Stop playback completely and reset state
   */
  public stop(): void {
    this.currentSessionId += 1; // Invalidate any running utterance callbacks
    this.isPlaying = false;
    this.isPaused = false;

    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {
        // Ignore cancel errors
      }
    }

    this.emitState();
  }

  /**
   * Jump to specific verse
   */
  public jumpToVerse(verseIndex: number): void {
    if (!this.currentPsalm) return;
    this.start(
      this.currentPsalm,
      verseIndex,
      this.options,
      this.onFinishCallback || undefined
    );
  }

  /**
   * Update options on the fly
   */
  public updateOptions(newOptions: NarrationOptions): void {
    const genderChanged = this.options.gender !== newOptions.gender;
    const speedChanged = this.options.speed !== newOptions.speed;
    const continuousChanged = this.options.continuousAudio !== newOptions.continuousAudio;

    this.options = newOptions;

    // If active playback options changed, restart current verse with new settings smoothly
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
