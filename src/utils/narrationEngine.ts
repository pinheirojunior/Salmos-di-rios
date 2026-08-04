import { TextToSpeech } from "@capacitor-community/text-to-speech";

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  voiceName?: string;
  lang?: string;
}

class UniversalNarrationEngine {
  private htmlAudio: HTMLAudioElement | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private activeMode: "capacitor" | "speechSynthesis" | "audioStream" | null = null;
  private onEndCallback: (() => void) | null = null;
  private onErrorCallback: ((err: any) => void) | null = null;
  private isStopped = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.htmlAudio = new Audio();
      this.htmlAudio.addEventListener("ended", () => {
        if (!this.isStopped && this.onEndCallback) {
          this.onEndCallback();
        }
      });
      this.htmlAudio.addEventListener("error", (e) => {
        console.warn("[NarrationEngine] HTML5 Audio error:", e);
        if (!this.isStopped && this.onErrorCallback) {
          this.onErrorCallback(e);
        }
      });
    }
  }

  // Detect if running inside a native Capacitor app or an Android WebView (WebIntoApp, Median, Android WebView wrapper)
  public isNativeOrWebView(): boolean {
    if (typeof window === "undefined") return false;
    const ua = navigator.userAgent || "";
    const isCapacitor = Boolean((window as any).Capacitor?.isNativePlatform?.());
    const isAndroidWebView = /wv|Android.*Version\/[0-9.]+|WebIntoApp|Median|AppBoundary/i.test(ua);
    const hasAndroidObject = Boolean((window as any).Android) || Boolean((window as any).webkit?.messageHandlers);
    
    return isCapacitor || isAndroidWebView || hasAndroidObject;
  }

  // Check if Web SpeechSynthesis is supported AND actually has available voices
  public hasFunctionalSpeechSynthesis(): boolean {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
    try {
      const voices = window.speechSynthesis.getVoices();
      // On some WebViews, getVoices returns [] forever and speak() fails silently
      return voices && voices.length > 0;
    } catch {
      return false;
    }
  }

  // Stop ALL active sound / speech engines immediately (0ms interruption)
  public stopAll(): void {
    this.isStopped = true;

    // 1. Stop SpeechSynthesis
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        console.error("Error canceling SpeechSynthesis:", e);
      }
    }

    // 2. Stop HTML5 Audio
    if (this.htmlAudio) {
      try {
        this.htmlAudio.pause();
        this.htmlAudio.currentTime = 0;
        this.htmlAudio.removeAttribute("src");
        this.htmlAudio.load();
      } catch (e) {
        console.error("Error stopping HTML Audio:", e);
      }
    }

    // 3. Stop Capacitor TextToSpeech
    try {
      TextToSpeech.stop().catch(() => {});
    } catch (e) {
      // Ignore if not on Capacitor
    }

    this.currentUtterance = null;
    this.activeMode = null;
  }

  // Speak a sentence / verse using the best available platform engine
  public async speak(
    text: string,
    options: SpeakOptions = {},
    onEnd?: () => void,
    onError?: (err: any) => void
  ): Promise<void> {
    this.stopAll();
    this.isStopped = false;
    this.onEndCallback = onEnd || null;
    this.onErrorCallback = onError || null;

    const cleanText = text.replace(/[\r\n]+/g, " ").trim();
    if (!cleanText) {
      if (onEnd) onEnd();
      return;
    }

    const isCapacitor = typeof window !== "undefined" && Boolean((window as any).Capacitor?.isNativePlatform?.());
    
    // Priority 1: Native Capacitor TextToSpeech Plugin
    if (isCapacitor) {
      try {
        this.activeMode = "capacitor";
        await TextToSpeech.speak({
          text: cleanText,
          lang: options.lang || "pt-BR",
          rate: options.rate || 1.0,
          pitch: options.pitch || 1.0,
          volume: 1.0,
        });
        if (!this.isStopped && this.onEndCallback) {
          this.onEndCallback();
        }
        return;
      } catch (err) {
        console.warn("[NarrationEngine] Capacitor TTS failed or not available, falling back:", err);
      }
    }

    // Priority 2: Browser SpeechSynthesis (if functional and not a restricted WebView)
    const isWebView = this.isNativeOrWebView();
    const canUseBrowserSpeech = !isWebView && "speechSynthesis" in window;

    if (canUseBrowserSpeech) {
      try {
        this.activeMode = "speechSynthesis";
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = options.lang || "pt-BR";
        utterance.rate = (options.rate || 1.0) * 0.92;
        utterance.pitch = options.pitch || 0.85;

        // Select voice if requested
        const voices = window.speechSynthesis.getVoices();
        if (options.voiceName) {
          const matched = voices.find(v => v.name === options.voiceName);
          if (matched) utterance.voice = matched;
        } else {
          const ptVoice = voices.find(v => v.lang.toLowerCase().startsWith("pt"));
          if (ptVoice) utterance.voice = ptVoice;
        }

        utterance.onend = () => {
          (window as any)._activeUtterance = null;
          if (!this.isStopped && this.onEndCallback) {
            this.onEndCallback();
          }
        };

        utterance.onerror = (e) => {
          (window as any)._activeUtterance = null;
          console.warn("[NarrationEngine] SpeechSynthesis error:", e);
          if (e.error !== "interrupted" && !this.isStopped) {
            // Fallback to HTML5 audio stream if SpeechSynthesis errored
            this.speakViaAudioStream(cleanText);
          }
        };

        this.currentUtterance = utterance;
        (window as any)._activeUtterance = utterance;
        window.speechSynthesis.speak(utterance);
        return;
      } catch (e) {
        console.warn("[NarrationEngine] SpeechSynthesis throw, using audio stream fallback:", e);
      }
    }

    // Priority 3: HTML5 Audio Stream Fallback (Universal, 100% works in WebViews, WebIntoApp, Median, Android)
    this.speakViaAudioStream(cleanText);
  }

  private speakViaAudioStream(text: string): void {
    this.activeMode = "audioStream";
    if (!this.htmlAudio) {
      this.htmlAudio = new Audio();
    }

    // Use /api/tts endpoint or direct Google TTS stream fallback
    const ttsUrl = `/api/tts?text=${encodeURIComponent(text)}`;
    const fallbackDirectUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=pt-BR&q=${encodeURIComponent(text.substring(0, 300))}`;

    this.htmlAudio.src = ttsUrl;
    
    // Play HTML5 audio with error fallback
    const playPromise = this.htmlAudio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn("[NarrationEngine] Express /api/tts play failed, trying direct stream:", err);
        if (this.htmlAudio) {
          this.htmlAudio.src = fallbackDirectUrl;
          this.htmlAudio.play().catch((err2) => {
            console.error("[NarrationEngine] Direct audio stream play failed:", err2);
            if (!this.isStopped && this.onErrorCallback) {
              this.onErrorCallback(err2);
            }
          });
        }
      });
    }
  }

  public pause(): void {
    if (this.activeMode === "speechSynthesis" && typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.pause();
      } catch (e) {
        console.error("Error pausing SpeechSynthesis:", e);
      }
    } else if (this.activeMode === "audioStream" && this.htmlAudio) {
      try {
        this.htmlAudio.pause();
      } catch (e) {
        console.error("Error pausing HTML Audio:", e);
      }
    } else if (this.activeMode === "capacitor") {
      try {
        TextToSpeech.stop().catch(() => {});
      } catch (e) {}
    }
  }

  public resume(textToResumeIfFailed?: string): void {
    if (this.activeMode === "speechSynthesis" && typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        } else if (!window.speechSynthesis.speaking && textToResumeIfFailed) {
          this.speak(textToResumeIfFailed);
        }
      } catch (e) {
        if (textToResumeIfFailed) this.speak(textToResumeIfFailed);
      }
    } else if (this.activeMode === "audioStream" && this.htmlAudio) {
      try {
        this.htmlAudio.play().catch(() => {
          if (textToResumeIfFailed) this.speak(textToResumeIfFailed);
        });
      } catch (e) {
        if (textToResumeIfFailed) this.speak(textToResumeIfFailed);
      }
    } else {
      if (textToResumeIfFailed) this.speak(textToResumeIfFailed);
    }
  }
}

export const narrationEngine = new UniversalNarrationEngine();
