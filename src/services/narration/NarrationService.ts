import { TextToSpeech } from "@capacitor-community/text-to-speech";
import { NarrationOptions, NarrationState, VoiceInfo, NarrationEventHandlers } from "./types";

class NarrationService {
  private state: NarrationState = 'idle';
  private voices: VoiceInfo[] = [];
  private voicesLoadedPromise: Promise<VoiceInfo[]> | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private activeMode: 'capacitor' | 'speechSynthesis' | 'audioStream' | null = null;
  
  private currentEventHandlers: NarrationEventHandlers | null = null;
  private currentText = '';
  private currentOptions: NarrationOptions = {};
  
  // Audio stream chunking state
  private streamChunks: string[] = [];
  private currentChunkIndex = 0;
  private isStopped = false;

  constructor() {
    this.log("Initializing NarrationService...");
    if (typeof window !== "undefined") {
      this.initVoices();
    }
  }

  private log(message: string, ...args: any[]): void {
    console.log(`[NarrationService] ${message}`, ...args);
  }

  private warn(message: string, ...args: any[]): void {
    console.warn(`[NarrationService] ⚠️ ${message}`, ...args);
  }

  private error(message: string, ...args: any[]): void {
    console.error(`[NarrationService] ❌ ${message}`, ...args);
  }

  /**
   * Asynchronously load and categorize available browser speech voices
   */
  public async initVoices(): Promise<VoiceInfo[]> {
    if (typeof window === "undefined") return [];
    if (this.voicesLoadedPromise) return this.voicesLoadedPromise;

    this.voicesLoadedPromise = new Promise((resolve) => {
      const fetchAndCategorize = () => {
        if (!("speechSynthesis" in window)) {
          this.log("Web Speech API not supported in this environment.");
          return [];
        }

        try {
          const rawVoices = window.speechSynthesis.getVoices() || [];
          if (rawVoices.length === 0) {
            return [];
          }

          const categorized: VoiceInfo[] = rawVoices.map((v) => {
            const nameLower = v.name.toLowerCase();
            const langLower = v.lang.toLowerCase().replace("_", "-");
            const isPt = langLower.startsWith("pt");

            const femaleKeywords = [
              "maria", "bruna", "luciana", "heloisa", "zira", "female", "mulher", 
              "feminina", "francisca", "joana", "samantha", "victoria", "amalia", "clara", "helena"
            ];
            const maleKeywords = ["felipe", "daniel", "antonio", "male", "homem", "masculina", "helio"];

            let isFemale = true;
            if (maleKeywords.some((k) => nameLower.includes(k))) {
              isFemale = false;
            } else if (femaleKeywords.some((k) => nameLower.includes(k))) {
              isFemale = true;
            } else if (nameLower.includes("google") && nameLower.includes("male")) {
              isFemale = false;
            }

            return {
              name: v.name,
              lang: v.lang,
              isPt,
              isFemale,
              nativeVoice: v,
            };
          });

          this.log(`Loaded ${categorized.length} speech voices.`);
          return categorized;
        } catch (err) {
          this.warn("Failed to retrieve speech voices:", err);
          return [];
        }
      };

      const initial = fetchAndCategorize();
      if (initial.length > 0) {
        this.voices = initial;
        resolve(this.voices);
        return;
      }

      // Handle async voice loading via onvoiceschanged
      if ("speechSynthesis" in window) {
        let resolved = false;
        const handleVoicesChanged = () => {
          const loaded = fetchAndCategorize();
          if (loaded.length > 0 && !resolved) {
            resolved = true;
            this.voices = loaded;
            this.log("Voices loaded via onvoiceschanged event.");
            resolve(this.voices);
          }
        };

        window.speechSynthesis.onvoiceschanged = handleVoicesChanged;

        // Fallback timeout if onvoiceschanged never fires
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            this.voices = fetchAndCategorize();
            this.log("Voice load timeout completed, voices count:", this.voices.length);
            resolve(this.voices);
          }
        }, 800);
      } else {
        resolve([]);
      }
    });

    return this.voicesLoadedPromise;
  }

  /**
   * Get all loaded voices or Portuguese-filtered voices
   */
  public async getVoices(ptOnly = false): Promise<VoiceInfo[]> {
    const all = await this.initVoices();
    if (ptOnly) {
      const pt = all.filter((v) => v.isPt);
      return pt.length > 0 ? pt : all;
    }
    return all;
  }

  /**
   * Get currently cached voices synchronously
   */
  public getCachedVoices(): VoiceInfo[] {
    return this.voices;
  }

  /**
   * Unlock browser audio playback context on direct user interaction
   */
  public unlock(): void {
    if (typeof window === "undefined") return;

    this.log("Unlocking audio engine via user gesture...");

    if ("speechSynthesis" in window) {
      try {
        window.speechSynthesis.getVoices();
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch (e) {
        this.warn("SpeechSynthesis unlock error:", e);
      }
    }

    if (!this.currentAudioElement) {
      try {
        this.currentAudioElement = new Audio();
      } catch (e) {
        this.warn("Audio element creation error:", e);
      }
    }
  }

  /**
   * Stop all active speech engines immediately (0ms delay)
   */
  public stop(): void {
    this.log("Stopping all narration engines...");
    this.isStopped = true;
    this.state = 'idle';

    // 1. Cancel Web Speech Synthesis
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        this.warn("Error canceling SpeechSynthesis:", e);
      }
    }

    // 2. Stop HTML5 Audio Element
    if (this.currentAudioElement) {
      try {
        this.currentAudioElement.pause();
        this.currentAudioElement.currentTime = 0;
        this.currentAudioElement.onended = null;
        this.currentAudioElement.onerror = null;
        this.currentAudioElement.removeAttribute("src");
      } catch (e) {
        this.warn("Error stopping HTML5 Audio:", e);
      }
    }

    // 3. Stop Native Capacitor Plugin
    try {
      TextToSpeech.stop().catch(() => {});
    } catch (e) {}

    // Cleanup references
    this.activeUtterance = null;
    if (typeof window !== "undefined") {
      (window as any)._activeNarrationUtterance = null;
    }
    this.activeMode = null;
    this.streamChunks = [];
    this.currentChunkIndex = 0;
  }

  /**
   * Speak a text string with specified options and event handlers
   */
  public async speak(
    text: string,
    options: NarrationOptions = {},
    handlers: NarrationEventHandlers = {}
  ): Promise<void> {
    this.stop();
    this.isStopped = false;
    this.currentText = text;
    this.currentOptions = options;
    this.currentEventHandlers = handlers;

    const sanitized = text.replace(/[\r\n]+/g, " ").trim();
    if (!sanitized) {
      this.log("Empty text provided to speak().");
      if (handlers.onEnd) handlers.onEnd();
      return;
    }

    this.unlock();
    this.state = 'loading';

    // Check if running in a native Capacitor shell
    const isCapacitor =
      typeof window !== "undefined" &&
      Boolean((window as any).Capacitor?.isNativePlatform?.());

    // Priority 1: Native Mobile Capacitor TextToSpeech
    if (isCapacitor) {
      try {
        this.log("Attempting speech via Native Capacitor TextToSpeech plugin...");
        this.activeMode = 'capacitor';
        this.state = 'speaking';
        if (handlers.onStart) handlers.onStart();

        await TextToSpeech.speak({
          text: sanitized,
          lang: options.lang || "pt-BR",
          rate: options.rate || 1.0,
          pitch: options.pitch || 1.0,
          volume: 1.0,
        });

        if (!this.isStopped) {
          this.state = 'idle';
          if (handlers.onEnd) handlers.onEnd();
        }
        return;
      } catch (err: any) {
        this.warn("Capacitor TextToSpeech failed, falling back to Web Speech:", err);
      }
    }

    // Priority 2: Web SpeechSynthesis API
    const hasSpeechSynthesis = typeof window !== "undefined" && "speechSynthesis" in window;

    if (hasSpeechSynthesis) {
      try {
        this.log("Attempting speech via Web SpeechSynthesis API...");
        this.activeMode = 'speechSynthesis';

        window.speechSynthesis.cancel();
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        const utterance = new SpeechSynthesisUtterance(sanitized);
        utterance.lang = options.lang || "pt-BR";
        
        // Majestic pacing for scripture reading
        const baseRate = options.rate || 1.0;
        utterance.rate = baseRate * 0.92;
        
        // Pitch setting based on gender or option
        if (options.pitch) {
          utterance.pitch = options.pitch;
        } else if (options.gender === "masculine") {
          utterance.pitch = 0.82;
        } else {
          utterance.pitch = 0.83;
        }

        // Voice selection
        const loadedVoices = await this.getVoices(true);
        if (options.voiceName) {
          const matched = loadedVoices.find((v) => v.name === options.voiceName);
          if (matched?.nativeVoice) {
            utterance.voice = matched.nativeVoice;
          }
        }

        if (!utterance.voice && loadedVoices.length > 0) {
          const matchedPt = loadedVoices.find((v) => v.isPt && v.nativeVoice);
          if (matchedPt?.nativeVoice) {
            utterance.voice = matchedPt.nativeVoice;
          }
        }

        utterance.onstart = () => {
          this.log("SpeechSynthesis utterance started.");
          this.state = 'speaking';
          if (handlers.onStart) handlers.onStart();
        };

        utterance.onend = () => {
          this.log("SpeechSynthesis utterance completed.");
          this.activeUtterance = null;
          if (typeof window !== "undefined") {
            (window as any)._activeNarrationUtterance = null;
          }
          if (!this.isStopped) {
            this.state = 'idle';
            if (handlers.onEnd) handlers.onEnd();
          }
        };

        utterance.onerror = (e) => {
          this.warn("SpeechSynthesis utterance error:", e);
          this.activeUtterance = null;
          if (typeof window !== "undefined") {
            (window as any)._activeNarrationUtterance = null;
          }

          if (e.error !== "interrupted" && e.error !== "canceled" && !this.isStopped) {
            this.warn("Web SpeechSynthesis error encountered. Triggering Audio Stream fallback...");
            this.speakViaAudioStream(sanitized);
          } else {
            this.state = 'idle';
          }
        };

        // Retain reference on instance and window scope to prevent V8 garbage collection mid-speech
        this.activeUtterance = utterance;
        if (typeof window !== "undefined") {
          (window as any)._activeNarrationUtterance = utterance;
        }

        window.speechSynthesis.speak(utterance);

        // Watchdog to resolve Chrome/Android stuck speech engine
        setTimeout(() => {
          if (
            !this.isStopped &&
            this.activeMode === 'speechSynthesis' &&
            typeof window !== "undefined" &&
            "speechSynthesis" in window
          ) {
            if (window.speechSynthesis.paused) {
              window.speechSynthesis.resume();
            }
          }
        }, 150);

        return;
      } catch (err: any) {
        this.warn("SpeechSynthesis exception thrown, falling back to Audio Stream:", err);
      }
    }

    // Priority 3: Serverless Universal HTML5 Audio Stream Fallback (Google TTS)
    this.speakViaAudioStream(sanitized);
  }

  /**
   * Fallback engine that streams TTS chunks using HTML5 Audio element
   */
  private speakViaAudioStream(text: string): void {
    this.log("Starting universal HTML5 Audio stream fallback...");
    this.activeMode = 'audioStream';
    this.state = 'speaking';

    if (this.currentEventHandlers?.onStart) {
      this.currentEventHandlers.onStart();
    }

    if (!this.currentAudioElement) {
      this.currentAudioElement = new Audio();
    }

    this.streamChunks = this.splitTextIntoChunks(text, 180);
    this.currentChunkIndex = 0;

    this.playNextStreamChunk();
  }

  private playNextStreamChunk(): void {
    if (this.isStopped) return;

    if (this.currentChunkIndex >= this.streamChunks.length) {
      this.log("All audio stream chunks completed successfully.");
      this.state = 'idle';
      if (!this.isStopped && this.currentEventHandlers?.onEnd) {
        this.currentEventHandlers.onEnd();
      }
      return;
    }

    const chunk = this.streamChunks[this.currentChunkIndex];
    if (!chunk || !chunk.trim()) {
      this.currentChunkIndex++;
      this.playNextStreamChunk();
      return;
    }

    if (!this.currentAudioElement) {
      this.currentAudioElement = new Audio();
    }

    const directTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=pt-BR&q=${encodeURIComponent(chunk.trim())}`;
    
    this.log(`Playing audio chunk ${this.currentChunkIndex + 1}/${this.streamChunks.length}: "${chunk.substring(0, 30)}..."`);

    this.currentAudioElement.pause();
    this.currentAudioElement.removeAttribute("src");
    this.currentAudioElement.src = directTtsUrl;

    this.currentAudioElement.onended = () => {
      if (!this.isStopped) {
        this.currentChunkIndex++;
        this.playNextStreamChunk();
      }
    };

    this.currentAudioElement.onerror = (e) => {
      this.warn(`Error playing stream chunk ${this.currentChunkIndex}:`, e);
      if (!this.isStopped) {
        this.currentChunkIndex++;
        if (this.currentChunkIndex < this.streamChunks.length) {
          this.playNextStreamChunk();
        } else {
          this.state = 'error';
          if (this.currentEventHandlers?.onError) {
            this.currentEventHandlers.onError(new Error("Audio stream playback failed"));
          }
        }
      }
    };

    const playPromise = this.currentAudioElement.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        this.warn("Audio play promise rejected:", err);
        if (!this.isStopped) {
          this.state = 'error';
          if (this.currentEventHandlers?.onError) {
            this.currentEventHandlers.onError(err);
          }
        }
      });
    }
  }

  /**
   * Split long text into natural sentence/phrase chunks <= maxLength
   */
  private splitTextIntoChunks(text: string, maxLength = 180): string[] {
    const clean = text.replace(/[\r\n]+/g, " ").trim();
    if (!clean) return [];
    if (clean.length <= maxLength) return [clean];

    const sentences = clean.match(/[^.!?;,]+[.!?;,]?/g) || [clean];
    const chunks: string[] = [];
    let current = "";

    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (!trimmed) continue;
      if ((current + " " + trimmed).trim().length <= maxLength) {
        current = (current + " " + trimmed).trim();
      } else {
        if (current) chunks.push(current);
        if (trimmed.length > maxLength) {
          const words = trimmed.split(" ");
          let wordChunk = "";
          for (const w of words) {
            if ((wordChunk + " " + w).trim().length <= maxLength) {
              wordChunk = (wordChunk + " " + w).trim();
            } else {
              if (wordChunk) chunks.push(wordChunk);
              wordChunk = w;
            }
          }
          if (wordChunk) chunks.push(wordChunk);
          current = "";
        } else {
          current = trimmed;
        }
      }
    }
    if (current) chunks.push(current);

    return chunks.length > 0 ? chunks : [clean];
  }

  /**
   * Pause active narration
   */
  public pause(): void {
    this.log("Pausing narration...");
    this.state = 'paused';

    if (
      this.activeMode === 'speechSynthesis' &&
      typeof window !== "undefined" &&
      "speechSynthesis" in window
    ) {
      try {
        window.speechSynthesis.pause();
      } catch (e) {
        this.warn("Error pausing SpeechSynthesis:", e);
      }
    } else if (this.activeMode === 'audioStream' && this.currentAudioElement) {
      try {
        this.currentAudioElement.pause();
      } catch (e) {
        this.warn("Error pausing HTML5 Audio:", e);
      }
    } else if (this.activeMode === 'capacitor') {
      try {
        TextToSpeech.stop().catch(() => {});
      } catch (e) {}
    }

    if (this.currentEventHandlers?.onPause) {
      this.currentEventHandlers.onPause();
    }
  }

  /**
   * Resume active narration
   */
  public resume(): void {
    this.log("Resuming narration...");
    this.unlock();

    if (
      this.activeMode === 'speechSynthesis' &&
      typeof window !== "undefined" &&
      "speechSynthesis" in window
    ) {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
          this.state = 'speaking';
        } else if (!window.speechSynthesis.speaking && this.currentText) {
          this.speak(this.currentText, this.currentOptions, this.currentEventHandlers || {});
          return;
        }
      } catch (e) {
        this.warn("Error resuming SpeechSynthesis, re-triggering speak():", e);
        if (this.currentText) {
          this.speak(this.currentText, this.currentOptions, this.currentEventHandlers || {});
          return;
        }
      }
    } else if (this.activeMode === 'audioStream' && this.currentAudioElement) {
      try {
        this.currentAudioElement.play().then(() => {
          this.state = 'speaking';
        }).catch((err) => {
          this.warn("Error resuming HTML5 Audio, re-triggering speak():", err);
          if (this.currentText) {
            this.speak(this.currentText, this.currentOptions, this.currentEventHandlers || {});
          }
        });
      } catch (e) {
        if (this.currentText) {
          this.speak(this.currentText, this.currentOptions, this.currentEventHandlers || {});
        }
      }
    } else if (this.currentText) {
      this.speak(this.currentText, this.currentOptions, this.currentEventHandlers || {});
    }

    if (this.currentEventHandlers?.onResume) {
      this.currentEventHandlers.onResume();
    }
  }

  /**
   * Get current state
   */
  public getState(): NarrationState {
    return this.state;
  }
}

export const narrationService = new NarrationService();
