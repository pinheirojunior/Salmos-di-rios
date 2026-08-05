import React, { useState } from "react";
import { Play, Pause, Square, SkipBack, SkipForward, Volume2, X, Settings2, Sparkles, ChevronUp, ChevronDown } from "lucide-react";
import { Psalm, AppSettings, PlayerState, VoiceGender } from "../types";
import { narrationEngine } from "../services/narration/NarrationEngine";
import { motion, AnimatePresence } from "motion/react";

interface AudioPlayerProps {
  psalm: Psalm;
  settings: AppSettings;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  playerState: PlayerState;
  onClose: () => void;
  onStartNextPsalm?: (nextPsalmNumber: number) => void;
}

export default function AudioPlayer({
  psalm,
  settings,
  onUpdateSettings,
  playerState,
  onClose,
  onStartNextPsalm,
}: AudioPlayerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const currentVerse = psalm.verses[playerState.currentVerseIndex] || psalm.verses[0];
  const isPlaying = playerState.isPlaying && !playerState.isPaused;

  const handlePlayPause = () => {
    if (playerState.isPlaying) {
      if (playerState.isPaused) {
        narrationEngine.resume();
      } else {
        narrationEngine.pause();
      }
    } else {
      narrationEngine.start(
        psalm,
        playerState.currentVerseIndex,
        {
          gender: settings.voiceGender,
          speed: settings.voiceSpeed,
          continuousAudio: settings.continuousAudio,
        },
        () => {
          if (narrationEngine.getOptions().continuousAudio && onStartNextPsalm && psalm.number < 150) {
            onStartNextPsalm(psalm.number + 1);
          }
        }
      );
    }
  };

  const handleStop = () => {
    narrationEngine.stop();
    onClose();
  };

  const handlePrevVerse = () => {
    const prevIdx = Math.max(0, playerState.currentVerseIndex - 1);
    narrationEngine.jumpToVerse(prevIdx);
  };

  const handleNextVerse = () => {
    if (playerState.currentVerseIndex < psalm.verses.length - 1) {
      const nextIdx = playerState.currentVerseIndex + 1;
      narrationEngine.jumpToVerse(nextIdx);
    } else if (onStartNextPsalm && psalm.number < 150) {
      onStartNextPsalm(psalm.number + 1);
    }
  };

  const handleVoiceGenderChange = (gender: VoiceGender) => {
    onUpdateSettings({ voiceGender: gender });
    narrationEngine.updateOptions({
      gender,
      speed: settings.voiceSpeed,
      continuousAudio: settings.continuousAudio,
    });
  };

  const handleContinuousAudioToggle = () => {
    const newContinuous = !settings.continuousAudio;
    onUpdateSettings({ continuousAudio: newContinuous });
    narrationEngine.updateOptions({
      gender: settings.voiceGender,
      speed: settings.voiceSpeed,
      continuousAudio: newContinuous,
    });
  };

  const handleSpeedChange = (speed: number) => {
    onUpdateSettings({ voiceSpeed: speed });
    narrationEngine.updateOptions({
      gender: settings.voiceGender,
      speed,
      continuousAudio: settings.continuousAudio,
    });
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed bottom-16 sm:bottom-20 left-0 right-0 z-50 p-3 sm:p-4 max-w-3xl mx-auto pointer-events-none"
    >
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-gold-accent/25 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden pointer-events-auto">
        {/* Expanded preferences drawer */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-b border-gray-100 dark:border-slate-800 p-4 space-y-4 bg-gray-50/50 dark:bg-slate-950/50"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-widest text-gold-accent font-bold flex items-center gap-1.5">
                  <Settings2 className="w-3.5 h-3.5" /> Configurações da Narração
                </span>
                <button
                  id="audio-player-collapse-btn"
                  onClick={() => setIsExpanded(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs flex items-center gap-1 cursor-pointer"
                >
                  <ChevronDown className="w-4 h-4" /> Fechar
                </button>
              </div>

              {/* Voice Gender Selection */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold block">
                  Estilo de Voz
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="audio-player-voice-masculine"
                    onClick={() => handleVoiceGenderChange("masculine")}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      settings.voiceGender === "masculine"
                        ? "bg-amber-50 dark:bg-amber-950/40 border-gold-accent text-amber-900 dark:text-amber-200 shadow-sm"
                        : "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    👨 Voz Masculina
                  </button>
                  <button
                    id="audio-player-voice-feminine"
                    onClick={() => handleVoiceGenderChange("feminine")}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      settings.voiceGender === "feminine"
                        ? "bg-amber-50 dark:bg-amber-950/40 border-gold-accent text-amber-900 dark:text-amber-200 shadow-sm"
                        : "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    👩 Voz Feminina
                  </button>
                </div>
              </div>

              {/* Speed & Continuous Audio row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Speed buttons */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold block">
                    Velocidade
                  </span>
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-gray-200 dark:border-slate-800">
                    {[0.8, 1.0, 1.2].map((s) => (
                      <button
                        key={s}
                        id={`audio-player-speed-${s}`}
                        onClick={() => handleSpeedChange(s)}
                        className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                          settings.voiceSpeed === s
                            ? "bg-gold-accent text-white shadow-xs"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                        }`}
                      >
                        {s === 1.0 ? "Normal" : `${s}x`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Continuous audio toggle */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold block">
                    Áudio Contínuo
                  </span>
                  <button
                    id="audio-player-continuous-toggle"
                    onClick={handleContinuousAudioToggle}
                    className={`w-full py-1.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                      settings.continuousAudio
                        ? "bg-amber-50 dark:bg-amber-950/40 border-gold-accent text-amber-900 dark:text-amber-200"
                        : "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    <span className="text-[11px]">Sem citar versículos</span>
                    <span className={`w-3.5 h-3.5 rounded-full ${settings.continuousAudio ? "bg-gold-accent" : "bg-gray-300 dark:bg-gray-700"}`} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Bar */}
        <div className="p-3 sm:p-4 flex flex-col gap-2">
          {/* Progress bar line */}
          <div className="w-full bg-gray-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
            <motion.div
              className="bg-gold-accent h-full transition-all duration-300"
              style={{ width: `${playerState.progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            {/* Title & Info */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-gold-accent flex items-center justify-center flex-shrink-0 border border-gold-accent/20">
                <Volume2 className={`w-5 h-5 ${isPlaying ? "animate-pulse text-amber-600 dark:text-gold-accent" : "text-gray-400"}`} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-sm text-gray-900 dark:text-gray-100 truncate">
                    Salmo {psalm.number}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold flex-shrink-0">
                    {settings.voiceGender === "masculine" ? "👨 Masculina" : "👩 Feminina"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-serif truncate mt-0.5">
                  {settings.continuousAudio
                    ? "Leitura contínua"
                    : `Versículo ${playerState.currentVerseIndex + 1} de ${psalm.verses.length}`}
                  {currentVerse ? ` — "${currentVerse.text.substring(0, 35)}..."` : ""}
                </p>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              {/* Expand Settings */}
              <button
                id="audio-player-expand-btn"
                onClick={() => setIsExpanded(!isExpanded)}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  isExpanded
                    ? "bg-amber-50 dark:bg-amber-950/50 border-gold-accent text-gold-accent"
                    : "border-gray-200 dark:border-slate-800 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                }`}
                title="Configurações de voz e velocidade"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>

              {/* Prev verse */}
              <button
                id="audio-player-prev-btn"
                onClick={handlePrevVerse}
                disabled={playerState.currentVerseIndex === 0}
                className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition-colors"
                title="Versículo anterior"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              {/* Main Play / Pause Button */}
              <button
                id="audio-player-play-pause-btn"
                onClick={handlePlayPause}
                className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-600 to-gold-accent text-white flex items-center justify-center shadow-lg shadow-amber-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title={isPlaying ? "Pausar Narração" : "Reproduzir Narração"}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 translate-x-0.5" />}
              </button>

              {/* Next verse */}
              <button
                id="audio-player-next-btn"
                onClick={handleNextVerse}
                className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                title="Próximo versículo"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              {/* Stop & Close */}
              <button
                id="audio-player-stop-btn"
                onClick={handleStop}
                className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer transition-colors ml-1"
                title="Encerrar Narração"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
