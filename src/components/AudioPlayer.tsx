import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Square, SkipForward, SkipBack, Volume2, ChevronUp, ChevronDown, Sparkles, X, RotateCcw } from "lucide-react";
import { Psalm, AppSettings, PlayerState } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { narrationEngine } from "../utils/narrationEngine";

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
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const timerRef = useRef<number | null>(null);
  
  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const voices = window.speechSynthesis.getVoices();
        const ptVoices = voices.filter(v => v.lang.toLowerCase().startsWith("pt"));
        // If no Portuguese voices are detected, load all voices as fallback
        setAvailableVoices(ptVoices.length > 0 ? ptVoices : voices);
      }
    };
    
    loadVoices();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      narrationEngine.stopAll();
    };
  }, []);

  // Recalculate estimated durations of all verses
  const getVerseDurations = () => {
    if (!psalm) return [];
    // Average reading speed: ~14 characters per second for slow/serene reading
    const baseCps = 14 * (1 / settings.voiceSpeed);
    return psalm.verses.map(v => Math.max(3, v.text.length / baseCps));
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

  // Playback control
  const getBestVoiceForGender = (gender: "masculine" | "feminine", voices: SpeechSynthesisVoice[]): string | undefined => {
    if (!voices || voices.length === 0) return undefined;
    const isFemaleTarget = gender === "feminine";
    
    const scored = voices.map(voice => {
      const name = voice.name.toLowerCase();
      const lang = voice.lang.toLowerCase().replace("_", "-");
      
      const femaleKeywords = [
        "maria", "bruna", "luciana", "heloisa", "zira", "female", "mulher", "feminina", 
        "francisca", "joana", "samantha", "victoria", "amalia", "clara", "helena"
      ];
      const maleKeywords = [
        "felipe", "daniel", "antonio", "male", "homem", "masculina", "helio"
      ];
      
      let isFemale = false;
      let isMale = false;
      
      if (femaleKeywords.some(k => name.includes(k))) {
        isFemale = true;
      } else if (maleKeywords.some(k => name.includes(k))) {
        isMale = true;
      } else {
        if (name.includes("google") && !name.includes("male") && !name.includes("homem")) {
          isFemale = true;
        } else {
          isFemale = true; 
        }
      }
      
      const matchesGender = isFemaleTarget ? isFemale : (!isFemale || isMale);
      if (!matchesGender) {
        return { name: voice.name, score: -10000 };
      }
      
      let score = 0;
      if (lang.startsWith("pt-br")) {
        score += 1000;
      } else if (lang.startsWith("pt")) {
        score += 200;
      }
      
      if (name.includes("natural")) score += 1000;
      if (name.includes("neural")) score += 1000;
      if (name.includes("online")) score += 800;
      if (name.includes("google")) score += 400;
      if (name.includes("luciana") || name.includes("joana") || name.includes("samantha") || name.includes("felipe") || name.includes("daniel")) {
        score += 300;
      }
      if (name.includes("francisca") || name.includes("antonio")) {
        score += 250;
      }
      if (name.includes("zira")) score -= 600;
      if (name.includes("heloisa")) score -= 500;
      
      return { name: voice.name, score };
    });
    
    scored.sort((a, b) => b.score - a.score);
    return scored[0] && scored[0].score > -5000 ? scored[0].name : undefined;
  };

  const selectVoice = () => {
    if (availableVoices.length === 0) return null;

    if (settings.preferredVoiceName) {
      const preferred = availableVoices.find(v => v.name === settings.preferredVoiceName);
      if (preferred) return preferred;
    }

    const isFemalePreferred = settings.voiceGender === "feminine";

    // Classify and score each voice to select the absolute highest-quality option (Requirement: High quality narration)
    const scoredVoices = availableVoices.map(voice => {
      const name = voice.name.toLowerCase();
      const lang = voice.lang.toLowerCase().replace("_", "-");
      
      // Determine voice gender
      const femaleKeywords = [
        "maria", "bruna", "luciana", "heloisa", "zira", "female", "mulher", "feminina", 
        "francisca", "joana", "samantha", "victoria", "amalia", "clara", "helena"
      ];
      const maleKeywords = [
        "antonio", "helio", "daniel", "felipe", "male", "homem", "masculina", 
        "junior", "ricardo", "filipe", "duarte", "diogo"
      ];

      let isFemale = false;
      let isMale = false;

      if (femaleKeywords.some(k => name.includes(k))) {
        isFemale = true;
      } else if (maleKeywords.some(k => name.includes(k))) {
        isMale = true;
      } else {
        // Fallback guess based on standard Chrome/Edge default voice traits
        if (name.includes("google") && !name.includes("male") && !name.includes("homem")) {
          isFemale = true; // Chrome's default "Google português" is female
        } else {
          isFemale = true; 
        }
      }

      let score = 0;

      // 1. Prioritize Brazilian Portuguese (pt-BR) over European Portuguese (pt-PT)
      if (lang.startsWith("pt-br")) {
        score += 500;
      } else if (lang.startsWith("pt-pt")) {
        score += 50; 
      } else {
        score += 100; 
      }

      // 2. Prioritize modern Neural and Natural voices (exceptionally human-like, flowing narration)
      if (name.includes("natural")) score += 1000;
      if (name.includes("neural")) score += 1000;
      if (name.includes("online")) score += 800; // Edge high-quality online streams
      
      // 3. Prioritize premium platforms voices
      if (name.includes("google")) score += 400; // Google's web voices are very warm and smooth
      if (name.includes("luciana") || name.includes("joana") || name.includes("samantha")) {
        score += 300; // Apple premium serene female voices
      }
      if (name.includes("felipe") || name.includes("daniel")) {
        score += 300; // Apple premium serene male voices
      }
      if (name.includes("francisca") || name.includes("antonio")) {
        score += 250; // Edge premium voices
      }

      // 4. Heavily penalize metallic/robotic legacy TTS synthesisers (makes it sound like low-quality GPS)
      if (name.includes("zira")) score -= 600;
      if (name.includes("heloisa")) score -= 500;
      if (name.includes("spok")) score -= 500;
      if (name.includes("desktop")) score -= 200; // Offline desktop fallback voices are lower quality

      // Correct gender alignment bonus (primary criteria)
      const genderMatches = isFemalePreferred ? isFemale : !isFemale;
      if (genderMatches) {
        score += 10000; 
      }

      return { voice, score };
    });

    // Sort by score descending and take the best one
    scoredVoices.sort((a, b) => b.score - a.score);

    return scoredVoices[0]?.voice || availableVoices[0];
  };

  const lastPsalmRef = useRef<number | null>(null);

  // Automatically speak when player state changes to playing (especially on mount or psalm change)
  useEffect(() => {
    if (psalm && playerState.isPlaying && !playerState.isPaused) {
      const hasPsalmChanged = lastPsalmRef.current !== playerState.currentPsalmNumber;
      lastPsalmRef.current = playerState.currentPsalmNumber;

      // If the psalm changed or if starting fresh, speak immediately
      if (hasPsalmChanged) {
        speakVerse(playerState.currentVerseIndex);
      }
    } else {
      lastPsalmRef.current = playerState.currentPsalmNumber;
    }
  }, [playerState.currentPsalmNumber, playerState.isPlaying, playerState.isPaused]);

  // Stop narration immediately when playback is turned off
  useEffect(() => {
    if (!playerState.isPlaying) {
      narrationEngine.stopAll();
    }
  }, [playerState.isPlaying]);

  // Sync pause/resume with playerState.isPaused
  useEffect(() => {
    if (playerState.isPlaying) {
      if (playerState.isPaused) {
        narrationEngine.pause();
      } else {
        const verse = psalm?.verses[playerState.currentVerseIndex];
        const textToSpeak = verse ? verse.text : "";
        narrationEngine.resume(textToSpeak);
      }
    }
  }, [playerState.isPaused, playerState.isPlaying]);

  // Restart current verse immediately if voice configurations change during active playback
  useEffect(() => {
    if (psalm && playerState.isPlaying && !playerState.isPaused) {
      speakVerse(playerState.currentVerseIndex);
    }
  }, [settings.voiceGender, settings.preferredVoiceName, settings.voiceSpeed, settings.continuousAudio]);

  const speakVerse = (index: number) => {
    if (!psalm) return;

    narrationEngine.stopAll();

    if (index >= psalm.verses.length) {
      stopPlayback();
      return;
    }

    const verse = psalm.verses[index];
    
    // Natural phrasing structure with support for Continuous Audio Mode
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

    const voice = selectVoice();

    narrationEngine.speak(
      textToSpeak,
      {
        lang: "pt-BR",
        rate: settings.voiceSpeed || 1.0,
        pitch: settings.voiceGender === "masculine" ? 0.82 : 0.83,
        voiceName: voice?.name || settings.preferredVoiceName,
      },
      () => {
        // On end
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
      (err) => {
        console.warn("Narration error", err);
        stopPlayback();
      }
    );
  };

  const handlePlayPause = () => {
    if (playerState.isPlaying) {
      if (playerState.isPaused) {
        narrationEngine.resume();
        onUpdatePlayerState({ isPaused: false });
      } else {
        narrationEngine.pause();
        onUpdatePlayerState({ isPaused: true });
      }
    } else {
      speakVerse(playerState.currentVerseIndex);
    }
  };

  const stopPlayback = () => {
    narrationEngine.stopAll();
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
    if (!psalm) return;
    const nextIdx = Math.min(psalm.verses.length - 1, playerState.currentVerseIndex + 1);
    onUpdatePlayerState({ currentVerseIndex: nextIdx });
    if (playerState.isPlaying && !playerState.isPaused) {
      speakVerse(nextIdx);
    }
  };

  const handleSkipBackward = () => {
    const prevIdx = Math.max(0, playerState.currentVerseIndex - 1);
    onUpdatePlayerState({ currentVerseIndex: prevIdx });
    if (playerState.isPlaying && !playerState.isPaused) {
      speakVerse(prevIdx);
    }
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!psalm) return;
    const progressVal = parseFloat(e.target.value);
    const targetSeconds = (progressVal / 100) * totalDuration;
    
    // Find closest verse based on cumulative seconds
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
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-40"
          />
        )}
      </AnimatePresence>

      {/* Main player body */}
      <motion.div
        layout
        id="applet-audio-player"
        className={`fixed left-1/2 -translate-x-1/2 bg-white dark:bg-slate-900 border border-gold-accent/20 shadow-2xl z-50 transition-colors duration-300 ${
          isExpanded
            ? "bottom-0 w-full max-w-lg rounded-t-3xl h-[85vh] p-8 flex flex-col justify-between"
            : `${settings.isPremium ? "bottom-20" : "bottom-32"} w-[92%] max-w-2xl rounded-2xl p-4 flex items-center justify-between`
        }`}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 25, stiffness: 120 }}
      >
        {isExpanded ? (
          /* EXPANDED PLAYER VIEW */
          <div className="flex flex-col h-full justify-between">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
              <button
                id="player-minimize-btn"
                onClick={() => setIsExpanded(false)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
                title="Minimizar player"
              >
                <ChevronDown className="w-6 h-6" />
              </button>
              <div className="text-center">
                <span className="text-xs font-mono tracking-widest text-gold-accent uppercase font-semibold">
                  Narrações Bíblicas Clássicas
                </span>
                <h3 className="text-sm font-sans text-gray-400">Em reprodução</h3>
              </div>
              <button
                id="player-close-btn"
                onClick={() => {
                  stopPlayback();
                  onClose();
                }}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
                title="Fechar player"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sacred artwork visualization container */}
            <div className="flex-1 flex flex-col items-center justify-center py-8">
              <div className="relative w-48 h-48 rounded-full bg-gradient-to-br from-gold-cream to-amber-50 dark:from-slate-800 dark:to-slate-950 border border-gold-accent/30 flex items-center justify-center shadow-inner overflow-hidden">
                {/* Glowing ripple effect under playback */}
                {playerState.isPlaying && !playerState.isPaused && (
                  <motion.div
                    animate={{ scale: [1, 1.4, 1], opacity: [0.15, 0.4, 0.15] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    className="absolute inset-0 bg-gold-accent/20 rounded-full"
                  />
                )}
                
                {/* Visual sacred cross / icon */}
                <div className="relative z-10 flex flex-col items-center text-center p-4">
                  <Sparkles className="w-12 h-12 text-gold-accent mb-2 animate-pulse" />
                  <span className="font-display font-semibold text-2xl text-gray-800 dark:text-gray-100">
                    {psalm.title}
                  </span>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">
                    {psalm.verses.length} versículos
                  </p>
                </div>
              </div>

              {/* Subtitle / active theme */}
              <div className="text-center max-w-xs mt-6">
                <p className="text-sm italic text-gray-500 dark:text-gray-400 font-serif leading-relaxed px-4">
                  "{psalm.theme}"
                </p>
                {playerState.isPlaying && (
                  <p className="text-[11px] text-gold-accent font-mono mt-3 uppercase tracking-widest flex items-center justify-center gap-1.5">
                    <span className="flex h-1.5 w-1.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-accent opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-gold-accent"></span>
                    </span>
                    Versículo {playerState.currentVerseIndex + 1} de {psalm.verses.length}
                  </p>
                )}
              </div>
            </div>

            {/* Timings & progress bar */}
            <div className="space-y-2">
              <input
                id="player-timeline-scrub"
                type="range"
                min="0"
                max="100"
                value={playerState.progress || 0}
                onChange={handleScrub}
                className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-gold-accent"
              />
              <div className="flex justify-between text-xs font-mono text-gray-400 dark:text-gray-500 px-1">
                <span>{formatTime(playerState.elapsedTime)}</span>
                <span>-{formatTime(playerState.remainingTime)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-6 pt-4">
              <div className="flex items-center justify-center gap-8">
                <button
                  id="player-skip-back-btn"
                  onClick={handleSkipBackward}
                  className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                  disabled={playerState.currentVerseIndex === 0}
                  title="Versículo anterior"
                >
                  <SkipBack className="w-6 h-6" />
                </button>

                <button
                  id="player-play-pause-btn"
                  onClick={handlePlayPause}
                  className="p-5 bg-gradient-to-r from-gold-accent to-amber-600 text-white rounded-full hover:shadow-lg hover:scale-105 active:scale-95 transition-all shadow-md"
                  title={playerState.isPlaying && !playerState.isPaused ? "Pausar" : "Ouvir"}
                >
                  {playerState.isPlaying && !playerState.isPaused ? (
                    <Pause className="w-8 h-8" />
                  ) : (
                    <Play className="w-8 h-8 translate-x-0.5" />
                  )}
                </button>

                <button
                  id="player-skip-forward-btn"
                  onClick={handleSkipForward}
                  className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                  disabled={playerState.currentVerseIndex === psalm.verses.length - 1}
                  title="Próximo versículo"
                >
                  <SkipForward className="w-6 h-6" />
                </button>
              </div>

              {/* Continuous Audio Mode Toggle */}
              <div className="border-t border-gray-100 dark:border-gray-800/80 pt-4 px-1">
                <div className="flex items-center justify-between gap-4 bg-gray-50 dark:bg-slate-950 p-3 rounded-xl border border-gray-100 dark:border-slate-800/60 shadow-sm">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                      Áudio contínuo
                    </span>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-normal font-serif">
                      Reproduz o Salmo de forma contínua, sem anunciar o número de cada versículo.
                    </p>
                  </div>
                  <button
                    id="player-continuous-audio-toggle"
                    onClick={() => onUpdateSettings({ continuousAudio: !settings.continuousAudio })}
                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      settings.continuousAudio ? "bg-gold-accent" : "bg-gray-200 dark:bg-gray-700"
                    }`}
                    title="Ativar/Desativar áudio contínuo"
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        settings.continuousAudio ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Preferences and Voice configuration settings inside player */}
              <div className="grid grid-cols-2 gap-3.5 border-t border-gray-100 dark:border-gray-800/80 pt-4 text-xs">
                {/* Voice Gender selection */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-mono tracking-widest block font-bold">Narrações</span>
                  <div className="flex bg-gray-50 dark:bg-slate-950 rounded-xl p-0.5 border border-gray-100 dark:border-slate-800/60">
                    <button
                      id="player-voice-masculine"
                      onClick={() => {
                        const bestVoice = getBestVoiceForGender("masculine", availableVoices);
                        onUpdateSettings({ 
                          voiceGender: "masculine",
                          preferredVoiceName: bestVoice
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
                          preferredVoiceName: bestVoice
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

                {/* Speed adjustment */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-mono tracking-widest block font-bold">Velocidade</span>
                  <div className="flex bg-gray-50 dark:bg-slate-950 rounded-xl p-0.5 border border-gray-100 dark:border-slate-800/60">
                    {[0.8, 1.0, 1.2].map(speed => (
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

                {/* Specific Voice Timbre selection */}
                {availableVoices.length > 0 && (
                  <div className="space-y-1.5 col-span-2 border-t border-gray-100 dark:border-gray-800/80 pt-3">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-mono tracking-widest block font-bold">Timbre da Voz (Personalizada)</span>
                    <select
                      id="player-voice-selector"
                      value={settings.preferredVoiceName || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") {
                          onUpdateSettings({ preferredVoiceName: undefined });
                        } else {
                          const selected = availableVoices.find(v => v.name === val);
                          if (selected) {
                            const nameLower = selected.name.toLowerCase();
                            const isFemale = [
                              "maria", "bruna", "luciana", "heloisa", "zira", "female", "mulher", "feminina", 
                              "francisca", "joana", "samantha", "victoria", "amalia", "clara", "helena"
                            ].some(k => nameLower.includes(k)) || (nameLower.includes("google") && !nameLower.includes("male"));
                            
                            onUpdateSettings({ 
                              preferredVoiceName: val,
                              voiceGender: isFemale ? "feminine" : "masculine"
                            });
                          }
                        }
                      }}
                      className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800/60 rounded-xl px-3 py-2 text-[11px] font-medium text-gray-700 dark:text-gray-300 outline-none focus:ring-1 focus:ring-gold-accent cursor-pointer"
                    >
                      <option value="">-- Voz Recomendada Automática ({settings.voiceGender === "feminine" ? "Feminina" : "Masculina"}) --</option>
                      {availableVoices.map((voice) => {
                        const nameLower = voice.name.toLowerCase();
                        const isFem = [
                          "maria", "bruna", "luciana", "heloisa", "zira", "female", "mulher", "feminina", 
                          "francisca", "joana", "samantha", "victoria", "amalia", "clara", "helena"
                        ].some(k => nameLower.includes(k)) || (nameLower.includes("google") && !nameLower.includes("male"));
                        
                        const genderLabel = isFem ? "Feminina" : "Masculina";
                        const isHighQuality = nameLower.includes("natural") || nameLower.includes("neural") || nameLower.includes("online") || nameLower.includes("google") || nameLower.includes("premium");
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
          </div>
        ) : (
          /* COLLAPSED PLAYER VIEW (DOCK) */
          <>
            <div
              id="player-clickable-dock"
              onClick={() => setIsExpanded(true)}
              className="flex items-center gap-4 flex-1 cursor-pointer min-w-0"
            >
              <div className="relative h-10 w-10 rounded-full bg-gold-cream dark:bg-slate-800 border border-gold-accent/20 flex items-center justify-center flex-shrink-0">
                {playerState.isPlaying && !playerState.isPaused ? (
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="absolute inset-0 bg-gold-accent rounded-full"
                  />
                ) : null}
                <Sparkles className="relative z-10 w-5 h-5 text-gold-accent" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-semibold text-sm text-gray-800 dark:text-gray-100 truncate">
                    {psalm.title}
                  </span>
                  <span className="text-[10px] font-mono bg-amber-50 dark:bg-slate-800 text-gold-accent px-1.5 py-0.5 rounded border border-gold-accent/10">
                    Áudio
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate italic">
                  "{psalm.theme}"
                </p>
              </div>
            </div>

            {/* Minimised controls */}
            <div className="flex items-center gap-2">
              <button
                id="dock-play-pause-btn"
                onClick={handlePlayPause}
                className="p-2 text-gold-accent hover:bg-gray-50 dark:hover:bg-slate-800 rounded-full transition-colors"
                title={playerState.isPlaying && !playerState.isPaused ? "Pausar" : "Ouvir"}
              >
                {playerState.isPlaying && !playerState.isPaused ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 translate-x-0.5" />
                )}
              </button>
              
              <button
                id="dock-stop-btn"
                onClick={stopPlayback}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-full transition-colors"
                title="Parar"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>

              <button
                id="dock-expand-btn"
                onClick={() => setIsExpanded(true)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-full transition-colors"
                title="Expandir player"
              >
                <ChevronUp className="w-5 h-5" />
              </button>
            </div>
          </>
        )}
      </motion.div>
    </>
  );
}
