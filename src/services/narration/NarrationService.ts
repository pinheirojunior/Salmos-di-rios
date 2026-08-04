import { TextToSpeech } from "@capacitor-community/text-to-speech";
import { NarrationOptions, NarrationState, VoiceInfo, NarrationEventHandlers } from "./types";

class NarrationService {
  private state: NarrationState = 'idle';
  private voices: VoiceInfo[] = [];
  private voicesLoadedPromise: Promise<VoiceInfo[]> | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private activeMode: 'capacitor' | 'speechSynthesis' | 'audioStream' | null = null;
  
  private currentEventHandlers: NarrationEventHandlers | null = null;
  private currentText = '';
  private currentOptions: NarrationOptions = {};
  
  // Sentence/phrase chunking state for SpeechSynthesis & AudioStream
  private textChunks: string[] = [];
  private currentChunkIndex = 0;
  private isStopped = false;

  // Timers & Keep-Alive
  private keepAliveInterval: any = null;
  private speechStartWatchdogTimer: any = null;
  private chunkTimeoutTimer: any = null;
  private isSpeechSynthesisDisabledInWebView = false;

  constructor() {
    this.log("Initializing NarrationService...");
    if (typeof window !== "undefined") {
      const isWebView = this.isAndroidWebView();
      this.log(`[ENV] Runtime environment: ${isWebView ? "Android WebView (Web Into App / Median / Native)" : "Standard Browser (AI Studio / Chrome / GitHub Pages)"}`);
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
   * Detect if the application is running inside an Android WebView environment
   */
  public isAndroidWebView(): boolean {
    if (typeof window === "undefined" || typeof navigator === "undefined") return false;
    const ua = navigator.userAgent || "";
    const isAndroid = /android/i.test(ua);
    const isWebViewUa = /wv|\bWebView\b|Version\/[\d.]+|\bgonative\b|\bmedian\b|\bwebintoapp\b|App/i.test(ua);
    const hasAndroidHostObject = Boolean((window as any).Android) || Boolean((window as any).Median) || Boolean((window as any).GoNative);
    return isAndroid && (isWebViewUa || hasAndroidHostObject);
  }

  /**
   * Asynchronously load and categorize available speech voices
   */
  public async initVoices(): Promise<VoiceInfo[]> {
    if (typeof window === "undefined") return [];
    if (this.voicesLoadedPromise) return this.voicesLoadedPromise;

    this.voicesLoadedPromise = new Promise((resolve) => {
      const fetchAndCategorize = (): VoiceInfo[] => {
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

      if ("speechSynthesis" in window) {
        let resolved = false;
        let pollCount = 0;

        const checkVoices = () => {
          const loaded = fetchAndCategorize();
          if (loaded.length > 0 && !resolved) {
            resolved = true;
            this.voices = loaded;
            this.log("Voices loaded successfully.");
            resolve(this.voices);
            return true;
          }
          return false;
        };

        const handleVoicesChanged = () => {
          if (checkVoices() && "speechSynthesis" in window) {
            window.speechSynthesis.onvoiceschanged = null;
          }
        };

        window.speechSynthesis.onvoiceschanged = handleVoicesChanged;

        const pollInterval = setInterval(() => {
          pollCount++;
          if (checkVoices() || pollCount >= 4) {
            clearInterval(pollInterval);
            if (!resolved) {
              resolved = true;
              this.voices = fetchAndCategorize();
              this.log(`Voice loading finalized after ${pollCount} checks (count: ${this.voices.length}).`);
              resolve(this.voices);
            }
          }
        }, 300);
      } else {
        resolve([]);
      }
    });

    return this.voicesLoadedPromise;
  }

  /**
   * Get loaded Portuguese or all speech voices
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
   * Unlock browser audio playback context on direct user gesture
   */
  public unlock(): void {
    if (typeof window === "undefined") return;

    this.log("[UNLOCK] Unlocking audio & speech context via user interaction...");

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        if (!this.audioContext) {
          this.audioContext = new AudioContextClass();
        }
        if (this.audioContext.state === 'suspended') {
          this.audioContext.resume().catch(() => {});
        }
        const buffer = this.audioContext.createBuffer(1, 1, 22050);
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioContext.destination);
        source.start(0);
      }
    } catch (e) {}

    if (!this.currentAudioElement) {
      try {
        this.currentAudioElement = new Audio();
      } catch (e) {}
    }

    if (this.currentAudioElement) {
      try {
        const silentWav = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
        if (!this.currentAudioElement.src) {
          this.currentAudioElement.src = silentWav;
        }
        const p = this.currentAudioElement.play();
        if (p !== undefined) {
          p.then(() => {}).catch(() => {});
        }
      } catch (e) {}
    }

    if ("speechSynthesis" in window) {
      try {
        window.speechSynthesis.getVoices();
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch (e) {}
    }
  }

  /**
   * Stop all active speech engines immediately
   */
  public stop(): void {
    this.log("⏹️ [STOP] Stopping narration...");
    this.isStopped = true;
    this.state = 'idle';

    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }

    if (this.speechStartWatchdogTimer) {
      clearTimeout(this.speechStartWatchdogTimer);
      this.speechStartWatchdogTimer = null;
    }

    if (this.chunkTimeoutTimer) {
      clearTimeout(this.chunkTimeoutTimer);
      this.chunkTimeoutTimer = null;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        this.warn("Error canceling SpeechSynthesis:", e);
      }
    }

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

    try {
      TextToSpeech.stop().catch(() => {});
    } catch (e) {}

    this.activeUtterance = null;
    if (typeof window !== "undefined") {
      (window as any)._activeNarrationUtterance = null;
    }
    this.activeMode = null;
    this.textChunks = [];
    this.currentChunkIndex = 0;
  }

  /**
   * Speak text string with options and handlers
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

    this.log(`🎬 [START] Starting narration: "${sanitized.substring(0, 60)}..."`);
    this.unlock();
    this.state = 'loading';

    await this.initVoices();

    const isWebView = this.isAndroidWebView();

    // Priority 1: Native Mobile Capacitor TextToSpeech (if in native shell)
    const isCapacitor =
      typeof window !== "undefined" &&
      Boolean((window as any).Capacitor?.isNativePlatform?.());

    if (isCapacitor) {
      try {
        this.log("[NATIVE] Speaking via Native Capacitor TextToSpeech plugin...");
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
          this.log("✅ [END] Native Capacitor narration finished.");
          if (handlers.onEnd) handlers.onEnd();
        }
        return;
      } catch (err: any) {
        this.warn("[NATIVE] Capacitor TextToSpeech failed, falling back:", err);
      }
    }

    // Priority 2: Web SpeechSynthesis API with Chunking & Keep-Alive
    const hasSpeechSynthesis =
      typeof window !== "undefined" &&
      "speechSynthesis" in window &&
      !this.isSpeechSynthesisDisabledInWebView;

    if (hasSpeechSynthesis) {
      try {
        this.log("[TTS] Speaking via Web SpeechSynthesis API...");
        this.activeMode = 'speechSynthesis';

        window.speechSynthesis.cancel();
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        // Split text into natural sentence/clause chunks (< 150 chars) to prevent Chrome 15s freeze
        this.textChunks = this.splitTextIntoNaturalChunks(sanitized, 150);
        this.currentChunkIndex = 0;

        // Start periodic keep-alive interval for Chrome
        if (this.keepAliveInterval) clearInterval(this.keepAliveInterval);
        this.keepAliveInterval = setInterval(() => {
          if (
            this.activeMode === 'speechSynthesis' &&
            typeof window !== "undefined" &&
            "speechSynthesis" in window &&
            window.speechSynthesis.speaking &&
            !window.speechSynthesis.paused
          ) {
            window.speechSynthesis.pause();
            window.speechSynthesis.resume();
          }
        }, 8000);

        this.speakSpeechSynthesisChunk();
        return;
      } catch (err: any) {
        this.warn("[TTS] SpeechSynthesis setup failed, falling back to Audio Stream:", err);
      }
    }

    // Priority 3: Fallback Universal HTML5 Audio Stream
    this.speakViaAudioStream(sanitized);
  }

  /**
   * Speak the current chunk using Web SpeechSynthesis
   */
  private async speakSpeechSynthesisChunk(): Promise<void> {
    if (this.isStopped) return;

    if (this.currentChunkIndex >= this.textChunks.length) {
      this.log("✅ [END] SpeechSynthesis narration completed all chunks naturally.");
      this.state = 'idle';
      if (this.keepAliveInterval) {
        clearInterval(this.keepAliveInterval);
        this.keepAliveInterval = null;
      }
      if (!this.isStopped && this.currentEventHandlers?.onEnd) {
        this.currentEventHandlers.onEnd();
      }
      return;
    }

    const chunkText = this.textChunks[this.currentChunkIndex];
    if (!chunkText || !chunkText.trim()) {
      this.currentChunkIndex++;
      this.speakSpeechSynthesisChunk();
      return;
    }

    this.log(`🗣️ [CHUNK ${this.currentChunkIndex + 1}/${this.textChunks.length}] Speaking: "${chunkText}"`);

    const utterance = new SpeechSynthesisUtterance(chunkText.trim());
    utterance.lang = this.currentOptions.lang || "pt-BR";
    
    const baseRate = this.currentOptions.rate || 1.0;
    utterance.rate = baseRate * 0.92;

    if (this.currentOptions.pitch) {
      utterance.pitch = this.currentOptions.pitch;
    } else if (this.currentOptions.gender === "masculine") {
      utterance.pitch = 0.82;
    } else {
      utterance.pitch = 0.83;
    }

    const loadedVoices = this.voices.length > 0 ? this.voices : await this.getVoices(true);
    if (this.currentOptions.voiceName) {
      const matched = loadedVoices.find((v) => v.name === this.currentOptions.voiceName);
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

    let chunkStarted = false;

    utterance.onstart = () => {
      chunkStarted = true;
      if (this.speechStartWatchdogTimer) {
        clearTimeout(this.speechStartWatchdogTimer);
        this.speechStartWatchdogTimer = null;
      }
      this.state = 'speaking';
      if (this.currentChunkIndex === 0 && this.currentEventHandlers?.onStart) {
        this.currentEventHandlers.onStart();
      }
    };

    utterance.onend = () => {
      this.log(`[CHUNK END] Chunk ${this.currentChunkIndex + 1}/${this.textChunks.length} finished.`);
      if (this.speechStartWatchdogTimer) {
        clearTimeout(this.speechStartWatchdogTimer);
        this.speechStartWatchdogTimer = null;
      }
      this.activeUtterance = null;
      if (typeof window !== "undefined") {
        (window as any)._activeNarrationUtterance = null;
      }

      if (!this.isStopped) {
        this.currentChunkIndex++;
        this.speakSpeechSynthesisChunk();
      }
    };

    utterance.onerror = (e) => {
      this.warn(`[CHUNK ERROR] Chunk ${this.currentChunkIndex + 1} error:`, e);
      if (this.speechStartWatchdogTimer) {
        clearTimeout(this.speechStartWatchdogTimer);
        this.speechStartWatchdogTimer = null;
      }
      this.activeUtterance = null;
      if (typeof window !== "undefined") {
        (window as any)._activeNarrationUtterance = null;
      }

      if (e.error !== "interrupted" && e.error !== "canceled" && !this.isStopped) {
        this.currentChunkIndex++;
        if (this.currentChunkIndex < this.textChunks.length) {
          this.speakSpeechSynthesisChunk();
        } else if (this.isAndroidWebView()) {
          this.isSpeechSynthesisDisabledInWebView = true;
          this.speakViaAudioStream(this.currentText);
        } else {
          this.state = 'error';
          if (this.currentEventHandlers?.onError) {
            this.currentEventHandlers.onError(new Error(e.error || "SpeechSynthesis error"));
          }
        }
      } else {
        this.state = 'idle';
      }
    };

    this.activeUtterance = utterance;
    if (typeof window !== "undefined") {
      (window as any)._activeNarrationUtterance = utterance;
    }

    window.speechSynthesis.speak(utterance);

    // Watchdog ONLY for Android WebViews where SpeechSynthesis hangs indefinitely on first start
    if (this.isAndroidWebView() && this.currentChunkIndex === 0) {
      this.speechStartWatchdogTimer = setTimeout(() => {
        if (!chunkStarted && !this.isStopped && this.activeMode === 'speechSynthesis') {
          this.warn(`[WATCHDOG] SpeechSynthesis start timeout in WebView. Triggering Audio Stream fallback...`);
          this.isSpeechSynthesisDisabledInWebView = true;
          try {
            window.speechSynthesis.cancel();
          } catch (e) {}
          this.speakViaAudioStream(this.currentText);
        }
      }, 3500);
    }
  }

  /**
   * Fallback engine using HTML5 Audio Stream
   */
  private speakViaAudioStream(text: string): void {
    this.log("[STREAM] Starting universal HTML5 Audio stream fallback...");
    this.activeMode = 'audioStream';
    this.state = 'speaking';

    if (this.currentEventHandlers?.onStart) {
      this.currentEventHandlers.onStart();
    }

    if (!this.currentAudioElement) {
      this.currentAudioElement = new Audio();
    }

    this.textChunks = this.splitTextIntoNaturalChunks(text, 180);
    this.currentChunkIndex = 0;

    this.playNextAudioStreamChunk();
  }

  private playNextAudioStreamChunk(): void {
    if (this.isStopped) return;

    if (this.chunkTimeoutTimer) {
      clearTimeout(this.chunkTimeoutTimer);
      this.chunkTimeoutTimer = null;
    }

    if (this.currentChunkIndex >= this.textChunks.length) {
      this.log("✅ [END] Audio stream narration finished all chunks naturally.");
      this.state = 'idle';
      if (!this.isStopped && this.currentEventHandlers?.onEnd) {
        this.currentEventHandlers.onEnd();
      }
      return;
    }

    const chunk = this.textChunks[this.currentChunkIndex];
    if (!chunk || !chunk.trim()) {
      this.currentChunkIndex++;
      this.playNextAudioStreamChunk();
      return;
    }

    if (!this.currentAudioElement) {
      this.currentAudioElement = new Audio();
    }

    const directTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=pt-BR&q=${encodeURIComponent(chunk.trim())}`;
    
    this.log(`[STREAM] Playing chunk ${this.currentChunkIndex + 1}/${this.textChunks.length}: "${chunk.substring(0, 35)}..."`);

    this.currentAudioElement.pause();
    this.currentAudioElement.currentTime = 0;
    this.currentAudioElement.src = directTtsUrl;
    
    try {
      this.currentAudioElement.playbackRate = this.currentOptions.rate || 1.0;
    } catch (e) {}

    this.currentAudioElement.onended = () => {
      if (this.chunkTimeoutTimer) {
        clearTimeout(this.chunkTimeoutTimer);
        this.chunkTimeoutTimer = null;
      }
      if (!this.isStopped) {
        this.currentChunkIndex++;
        this.playNextAudioStreamChunk();
      }
    };

    this.currentAudioElement.onerror = (e) => {
      this.warn(`[STREAM] Error playing chunk ${this.currentChunkIndex + 1}:`, e);
      if (this.chunkTimeoutTimer) {
        clearTimeout(this.chunkTimeoutTimer);
        this.chunkTimeoutTimer = null;
      }
      if (!this.isStopped) {
        this.currentChunkIndex++;
        if (this.currentChunkIndex < this.textChunks.length) {
          this.playNextAudioStreamChunk();
        } else {
          this.state = 'error';
          if (this.currentEventHandlers?.onError) {
            this.currentEventHandlers.onError(new Error("Audio stream playback failed"));
          }
        }
      }
    };

    this.chunkTimeoutTimer = setTimeout(() => {
      if (!this.isStopped && this.activeMode === 'audioStream') {
        this.warn(`[STREAM] Chunk ${this.currentChunkIndex + 1} timeout. Advancing to next chunk.`);
        this.currentChunkIndex++;
        this.playNextAudioStreamChunk();
      }
    }, 12000);

    const playPromise = this.currentAudioElement.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        this.warn("[STREAM] Audio play promise rejected:", err);
        if (!this.isStopped) {
          this.currentChunkIndex++;
          if (this.currentChunkIndex < this.textChunks.length) {
            this.playNextAudioStreamChunk();
          } else {
            this.state = 'error';
            if (this.currentEventHandlers?.onError) {
              this.currentEventHandlers.onError(err);
            }
          }
        }
      });
    }
  }

  /**
   * Split long text into natural sentence/clause chunks <= maxLength
   */
  private splitTextIntoNaturalChunks(text: string, maxLength = 150): string[] {
    const clean = text.replace(/[\r\n]+/g, " ").trim();
    if (!clean) return [];
    if (clean.length <= maxLength) return [clean];

    // Split by sentence delimiters or commas/colons
    const clauses = clean.match(/[^.!?;,:]+[.!?;,:]?/g) || [clean];
    const chunks: string[] = [];
    let current = "";

    for (const clause of clauses) {
      const trimmed = clause.trim();
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
    if (this.state !== 'speaking' && this.state !== 'loading') {
      return;
    }
    this.log("⏸️ [PAUSE] Pausing narration...");
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
    if (this.state !== 'paused') {
      this.log(`[RESUME] Ignored resume call because current state is '${this.state}'.`);
      return;
    }

    this.log("▶️ [RESUME] Resuming narration...");
    this.unlock();
    this.state = 'speaking';

    if (
      this.activeMode === 'speechSynthesis' &&
      typeof window !== "undefined" &&
      "speechSynthesis" in window
    ) {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        } else {
          this.speakSpeechSynthesisChunk();
        }
      } catch (e) {
        this.warn("Error resuming SpeechSynthesis:", e);
        this.speakSpeechSynthesisChunk();
      }
    } else if (this.activeMode === 'audioStream' && this.currentAudioElement) {
      try {
        this.currentAudioElement.play().catch((err) => {
          this.warn("Error resuming HTML5 Audio:", err);
          if (this.currentText) {
            this.speak(this.currentText, this.currentOptions, this.currentEventHandlers || {});
          }
        });
      } catch (e) {
        if (this.currentText) {
          this.speak(this.currentText, this.currentOptions, this.currentEventHandlers || {});
        }
      }
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
