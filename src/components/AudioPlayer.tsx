import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Square, SkipForward, SkipBack, Volume2, ChevronUp, ChevronDown, Sparkles, X, RotateCcw } from "lucide-react";
import { Psalm, AppSettings, PlayerState } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { narrationService, VoiceInfo } from "../services/narration";

interface AudioPlayerProps {
  psalm: Psalm | null;
  settings: AppSettings;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  playerState: PlayerState;
  onUpdatePlayerState: (state: Partial<PlayerState>) => void;
  onClose: () => void;
}

export default function AudioPlayer({
  psalm,
  settings,
  onUpdateSettings,
  playerState,
  onUpdatePlayerState,
  onClose,
}: AudioPlayerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<VoiceInfo[]>([]);
  const timerRef = useRef<number | null>(null);

  // Load available voices asynchronously
  useEffect(() => {
    let isMounted = true;
    
    narrationService.getVoices(true).then((voices) => {
      if (isMounted) {
        setAvailableVoices(voices);
      }
    });

    return () => {
      isMounted = false;
      narrationService.stop();
    };
  }, []);

  // Recalculate estimated durations of all verses
  const getVerseDurations = () => {
    if (!psalm) return [];
    // Average reading speed: ~14 characters per second for slow/serene reading
    const baseCps = 14 * (1 / settings.voiceSpeed);
    return psalm.verses.map((v) => Math.max(3, v.text.length / baseCps));
  };

  const verseDurations = getVerseDurations();
  const totalDuration = verseDurations.reduce((sum, d) => sum + d, 0);

  // Sync elapsed and remaining time based on current verse index
  useEffect(() => {
    if (!psalm) return;

    const elapsed = verseDurations.slice(0, playerState.currentVerseIndex).reduce((sum, d) => sum + d, 0);
    const remaining = verseDurations.slice(playerState.currentVerseIndex).reduce((sum, d) => sum + d, 0);
    const progress = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0;

    onUpdatePlayerState({
      elapsedTime: Math.round(elapsed),
      remainingTime: Math.round(remaining),
      progress,
    });
  }, [playerState.currentVerseIndex, playerState.currentPsalmNumber, settings.voiceSpeed]);

  // Audio timer emulation for smooth elapsed progress inside the current verse
  useEffect(() => {
    if (playerState.isPlaying && !playerState.isPaused) {
      const interval = 1000;
      timerRef.current = window.setInterval(() => {
        onUpdatePlayerState({
          elapsedTime: playerState.elapsedTime + 1,
          remainingTime: Math.max(0, playerState.remainingTime - 1),
          progress: totalDuration > 0 ? ((playerState.elapsedTime + 1) / totalDuration) * 100 : 0,
        });
      }, interval);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [playerState.isPlaying, playerState.isPaused, playerState.elapsedTime]);

  const getBestVoiceForGender = (gender: "masculine" | "feminine", vlist: VoiceInfo[]): string | undefined => {
    if (!vlist || vlist.length === 0) return undefined;
    const isFemaleTarget = gender === "feminine";

    const scored = vlist.map((voice) => {
      const name = voice.name.toLowerCase();
      const lang = voice.lang.toLowerCase().replace("_", "-");

      const matchesGender = isFemaleTarget ? voice.isFemale : !voice.isFemale;
      if (!matchesGender) {
        return { name: voice.name, score: -10000 };
      }

      let score = 0;
      if (lang.startsWith("pt-br")) score += 1000;
      else if (lang.startsWith("pt")) score += 200;

      if (name.includes("natural")) score += 1000;
      if (name.includes("neural")) score += 1000;
      if (name.includes("online")) score += 800;
      if (name.includes("google")) score += 400;

      return { name: voice.name, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0] && scored[0].score > -5000 ? scored[0].name : undefined;
  };

  const selectVoice = (): VoiceInfo | null => {
    if (availableVoices.length === 0) return null;

    if (settings.preferredVoiceName) {
      const preferred = availableVoices.find((v) => v.name === settings.preferredVoiceName);
      if (preferred) return preferred;
    }

    const isFemalePreferred = settings.voiceGender === "feminine";

    const scoredVoices = availableVoices.map((voice) => {
      const name = voice.name.toLowerCase();
      const lang = voice.lang.toLowerCase().replace("_", "-");

      let score = 0;
      if (lang.startsWith("pt-br")) score += 500;
      else if (lang.startsWith("pt-pt")) score += 50;

      if (name.includes("natural")) score += 1000;
      if (name.includes("neural")) score += 1000;
      if (name.includes("online")) score += 800;
      if (name.includes("google")) score += 400;

      const genderMatches = isFemalePreferred ? voice.isFemale : !voice.isFemale;
      if (genderMatches) {
        score += 10000;
      }

      return { voice, score };
    });

    scoredVoices.sort((a, b) => b.score - a.score);
    return scoredVoices[0]?.voice || availableVoices[0] || null;
  };

  const lastPlayingRef = useRef<boolean>(false);
  const lastPsalmRef = useRef<number | null>(null);

  // Automatically speak when player state changes to playing
  useEffect(() => {
    if (psalm && playerState.isPlaying && !playerState.isPaused) {
      const wasNotPlaying = !lastPlayingRef.current;
      const hasPsalmChanged = lastPsalmRef.current !== playerState.currentPsalmNumber;

      lastPlayingRef.current = playerState.isPlaying;
      lastPsalmRef.current = playerState.currentPsalmNumber;

      if (wasNotPlaying || hasPsalmChanged) {
        speakVerse(playerState.currentVerseIndex);
      }
    } else {
      lastPlayingRef.current = playerState.isPlaying;
      lastPsalmRef.current = playerState.currentPsalmNumber;
    }
  }, [playerState.currentPsalmNumber, playerState.isPlaying, playerState.isPaused]);

  // Stop narration immediately when playback is turned off
  useEffect(() => {
    if (!playerState.isPlaying) {
      narrationService.stop();
    }
  }, [playerState.isPlaying]);

  // Sync pause/resume with playerState.isPaused
  useEffect(() => {
    if (playerState.isPlaying) {
      if (playerState.isPaused) {
        narrationService.pause();
      } else if (narrationService.getState() === 'paused') {
        narrationService.resume();
      }
    }
  }, [playerState.isPaused, playerState.isPlaying]);

  // Restart current verse only if voice settings actually changed during active playback
  const settingsRef = useRef(settings);
  useEffect(() => {
    const prev = settingsRef.current;
    settingsRef.current = settings;

    const hasChanged =
      prev.voiceGender !== settings.voiceGender ||
      prev.preferredVoiceName !== settings.preferredVoiceName ||
      prev.voiceSpeed !== settings.voiceSpeed ||
      prev.continuousAudio !== settings.continuousAudio;

    if (hasChanged && psalm && playerState.isPlaying && !playerState.isPaused) {
      speakVerse(playerState.currentVerseIndex);
    }
  }, [settings.voiceGender, settings.preferredVoiceName, settings.voiceSpeed, settings.continuousAudio]);

  const speakVerse = (index: number) => {
    if (!psalm) return;

    narrationService.stop();

    if (index >= psalm.verses.length) {
      stopPlayback();
      return;
    }

    const verse = psalm.verses[index];

    let textToSpeak = "";
    if (settings.continuousAudio) {
      if (index === 0) {
        textToSpeak = `Salmo ${psalm.number}. ${verse.text}`;
      } else {
        textToSpeak = verse.text;
      }
    } else {
      if (playerState.isSingleVerseMode) {
        textToSpeak = `Salmo ${psalm.number}, versículo ${verse.number}. ${verse.text}`;
      } else if (index === 0) {
        textToSpeak = `Salmo ${psalm.number}. ${psalm.title}. Versículo ${verse.number}. ${verse.text}`;
      } else {
        textToSpeak = `Versículo ${verse.number}. ${verse.text}`;
      }
    }

    onUpdatePlayerState({
      currentPsalmNumber: psalm.number,
      currentVerseIndex: index,
      isPlaying: true,
      isPaused: false,
    });

    const selectedVoice = selectVoice();

    narrationService.speak(
      textToSpeak,
      {
        lang: "pt-BR",
        rate: settings.voiceSpeed || 1.0,
        pitch: settings.voiceGender === "masculine" ? 0.82 : 0.83,
        voiceName: selectedVoice?.name || settings.preferredVoiceName,
        gender: settings.voiceGender,
      },
      {
        onEnd: () => {
          if (playerState.isSingleVerseMode) {
            stopPlayback();
          } else {
            const nextIdx = index + 1;
            if (nextIdx >= psalm.verses.length) {
              stopPlayback();
            } else {
              onUpdatePlayerState({ currentVerseIndex: nextIdx });
              speakVerse(nextIdx);
            }
          }
        },
        onError: (err) => {
          console.warn("[AudioPlayer] Narration error:", err);
          stopPlayback();
        },
      }
    );
  };

  const handlePlayPause = () => {
    narrationService.unlock();
    if (playerState.isPlaying) {
      if (playerState.isPaused) {
        narrationService.resume();
        onUpdatePlayerState({ isPaused: false });
      } else {
        narrationService.pause();
        onUpdatePlayerState({ isPaused: true });
      }
    } else {
      speakVerse(playerState.currentVerseIndex);
    }
  };

  const stopPlayback = () => {
    narrationService.stop();
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    onUpdatePlayerState({
      isPlaying: false,
      isPaused: false,
      progress: 0,
      elapsedTime: 0,
      remainingTime: Math.round(totalDuration),
    });
  };

  const handleSkipForward = () => {
    narrationService.unlock();
    if (!psalm) return;
    const nextIdx = Math.min(psalm.verses.length - 1, playerState.currentVerseIndex + 1);
    onUpdatePlayerState({ currentVerseIndex: nextIdx });
    if (playerState.isPlaying && !playerState.isPaused) {
      speakVerse(nextIdx);
    }
  };

  const handleSkipBackward = () => {
    narrationService.unlock();
    const prevIdx = Math.max(0, playerState.currentVerseIndex - 1);
    onUpdatePlayerState({ currentVerseIndex: prevIdx });
    if (playerState.isPlaying && !playerState.isPaused) {
      speakVerse(prevIdx);
    }
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    narrationService.unlock();
    if (!psalm) return;
    const progressVal = parseFloat(e.target.value);
    const targetSeconds = (progressVal / 100) * totalDuration;

    let accumulated = 0;
    let targetIndex = 0;
    for (let i = 0; i < verseDurations.length; i++) {
      accumulated += verseDurations[i];
      if (accumulated >= targetSeconds) {
        targetIndex = i;
        break;
      }
    }

    onUpdatePlayerState({ currentVerseIndex: targetIndex });
    if (playerState.isPlaying && !playerState.isPaused) {
      speakVerse(targetIndex);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.round(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  if (!psalm) return null;

  return (
    <>
      {/* Visual background overlay when player is expanded */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsExpanded(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-40"
          />
        )}
      </AnimatePresence>

      {/* Main Floating Audio Player Container */}
      <motion.div
        layout
        className={`fixed z-50 transition-all duration-300 ${
          isExpanded
            ? "bottom-0 inset-x-0 md:bottom-6 md:left-1/2 md:-translate-x-1/2 md:max-w-xl p-4 md:p-6 bg-white dark:bg-slate-900 rounded-t-3xl md:rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800"
            : "bottom-4 inset-x-3 sm:inset-x-auto sm:right-6 sm:max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/80 dark:border-slate-800 p-3"
        }`}
      >
        {isExpanded ? (
          /* EXPANDED PLAYER VIEW */
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/10 dark:bg-gold-accent/10 rounded-xl text-amber-600 dark:text-gold-accent">
                  <Volume2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-gray-900 dark:text-gray-100 text-sm">
                    Narração Sacra • Salmo {psalm.number}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Versículo {playerState.currentVerseIndex + 1} de {psalm.verses.length}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition-colors cursor-pointer"
                  title="Minimizar player"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 text-gray-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                  title="Fechar player"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Current verse text highlight box */}
            <div className="bg-amber-500/5 dark:bg-gold-accent/5 rounded-2xl p-4 border border-amber-500/10 dark:border-gold-accent/10 max-h-36 overflow-y-auto">
              <p className="font-serif text-sm leading-relaxed text-gray-800 dark:text-gray-200 italic">
                "{psalm.verses[playerState.currentVerseIndex]?.text}"
              </p>
            </div>

            {/* Scrubbing timeline & time labels */}
            <div className="space-y-1.5">
              <input
                type="range"
                min="0"
                max="100"
                value={playerState.progress || 0}
                onChange={handleScrub}
                className="w-full accent-amber-600 dark:accent-gold-accent h-1.5 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[11px] font-mono text-gray-400 dark:text-gray-500">
                <span>{formatTime(playerState.elapsedTime)}</span>
                <span>-{formatTime(playerState.remainingTime)}</span>
              </div>
            </div>

            {/* Main Playback Buttons */}
            <div className="flex items-center justify-center gap-4 py-1">
              <button
                onClick={handleSkipBackward}
                className="p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all cursor-pointer"
                title="Versículo anterior"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                onClick={handlePlayPause}
                className="p-4 bg-amber-600 hover:bg-amber-700 dark:bg-gold-accent dark:hover:bg-amber-400 text-white dark:text-slate-950 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title={playerState.isPlaying && !playerState.isPaused ? "Pausar" : "Ouvir"}
              >
                {playerState.isPlaying && !playerState.isPaused ? (
                  <Pause className="w-6 h-6 fill-current" />
                ) : (
                  <Play className="w-6 h-6 fill-current ml-0.5" />
                )}
              </button>

              <button
                onClick={stopPlayback}
                className="p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all cursor-pointer"
                title="Parar narração"
              >
                <Square className="w-5 h-5" />
              </button>

              <button
                onClick={handleSkipForward}
                className="p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all cursor-pointer"
                title="Próximo versículo"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {/* Settings & Voice Configuration Controls */}
            <div className="grid grid-cols-2 gap-3.5 border-t border-gray-100 dark:border-gray-800/80 pt-4 text-xs">
              {/* Voice Gender */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-mono tracking-widest block font-bold">
                  Narrações
                </span>
                <div className="flex bg-gray-50 dark:bg-slate-950 rounded-xl p-0.5 border border-gray-100 dark:border-slate-800/60">
                  <button
                    id="player-voice-masculine"
                    onClick={() => {
                      const bestVoice = getBestVoiceForGender("masculine", availableVoices);
                      onUpdateSettings({
                        voiceGender: "masculine",
                        preferredVoiceName: bestVoice,
                      });
                    }}
                    className={`flex-1 text-center py-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                      settings.voiceGender === "masculine"
                        ? "bg-white dark:bg-slate-800 shadow-md text-amber-600 dark:text-gold-accent border border-gold-accent/10"
                        : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                    }`}
                  >
                    Voz Masculina
                  </button>
                  <button
                    id="player-voice-feminine"
                    onClick={() => {
                      const bestVoice = getBestVoiceForGender("feminine", availableVoices);
                      onUpdateSettings({
                        voiceGender: "feminine",
                        preferredVoiceName: bestVoice,
                      });
                    }}
                    className={`flex-1 text-center py-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                      settings.voiceGender === "feminine"
                        ? "bg-white dark:bg-slate-800 shadow-md text-amber-600 dark:text-gold-accent border border-gold-accent/10"
                        : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                    }`}
                  >
                    Voz Feminina
                  </button>
                </div>
              </div>

              {/* Speed Adjustment */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-mono tracking-widest block font-bold">
                  Velocidade
                </span>
                <div className="flex bg-gray-50 dark:bg-slate-950 rounded-xl p-0.5 border border-gray-100 dark:border-slate-800/60">
                  {[0.8, 1.0, 1.2].map((speed) => (
                    <button
                      key={speed}
                      id={`player-speed-${speed}`}
                      onClick={() => onUpdateSettings({ voiceSpeed: speed })}
                      className={`flex-1 text-center py-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                        settings.voiceSpeed === speed
                          ? "bg-white dark:bg-slate-800 shadow-md text-amber-600 dark:text-gold-accent border border-gold-accent/10"
                          : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Voice Timbre Selector */}
              {availableVoices.length > 0 && (
                <div className="space-y-1.5 col-span-2 border-t border-gray-100 dark:border-gray-800/80 pt-3">
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-mono tracking-widest block font-bold">
                    Timbre da Voz (Personalizada)
                  </span>
                  <select
                    id="player-voice-selector"
                    value={settings.preferredVoiceName || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "") {
                        onUpdateSettings({ preferredVoiceName: undefined });
                      } else {
                        const selected = availableVoices.find((v) => v.name === val);
                        if (selected) {
                          onUpdateSettings({
                            preferredVoiceName: val,
                            voiceGender: selected.isFemale ? "feminine" : "masculine",
                          });
                        }
                      }
                    }}
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800/60 rounded-xl px-3 py-2 text-[11px] font-medium text-gray-700 dark:text-gray-300 outline-none focus:ring-1 focus:ring-gold-accent cursor-pointer"
                  >
                    <option value="">
                      -- Voz Recomendada Automática ({settings.voiceGender === "feminine" ? "Feminina" : "Masculina"}) --
                    </option>
                    {availableVoices.map((voice) => {
                      const genderLabel = voice.isFemale ? "Feminina" : "Masculina";
                      const isHighQuality =
                        voice.name.toLowerCase().includes("natural") ||
                        voice.name.toLowerCase().includes("neural") ||
                        voice.name.toLowerCase().includes("google");
                      const suffix = isHighQuality ? " (Melhor Qualidade)" : "";

                      return (
                        <option key={voice.name} value={voice.name} className="dark:bg-slate-900">
                          {voice.name} [{genderLabel}]{suffix}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* COLLAPSED PLAYER VIEW (FLOAT DOCK) */
          <div className="flex items-center justify-between gap-3">
            <div
              onClick={() => setIsExpanded(true)}
              className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer group"
            >
              <div className="p-2 bg-amber-500/10 dark:bg-gold-accent/10 rounded-xl text-amber-600 dark:text-gold-accent shrink-0 group-hover:scale-105 transition-transform">
                <Volume2 className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-display font-bold text-xs text-gray-900 dark:text-gray-100 truncate">
                  Salmo {psalm.number}
                </h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                  v.{playerState.currentVerseIndex + 1}: "{psalm.verses[playerState.currentVerseIndex]?.text}"
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handlePlayPause}
                className="p-2.5 bg-amber-600 hover:bg-amber-700 dark:bg-gold-accent dark:hover:bg-amber-400 text-white dark:text-slate-950 rounded-xl shadow-md transition-all cursor-pointer"
                title={playerState.isPlaying && !playerState.isPaused ? "Pausar" : "Ouvir"}
              >
                {playerState.isPlaying && !playerState.isPaused ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>

              <button
                onClick={handleSkipForward}
                className="p-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg transition-colors cursor-pointer"
                title="Próximo versículo"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsExpanded(true)}
                className="p-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg transition-colors cursor-pointer"
                title="Expandir player"
              >
                <ChevronUp className="w-4 h-4" />
              </button>

              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
}
