import { useEffect, useRef } from "react";
import { ArrowLeft, Play, Pause, Heart, Type, Sparkles, Volume2 } from "lucide-react";
import { Psalm, AppSettings, PlayerState } from "../types";
import { motion } from "motion/react";

interface ImmersiveReaderProps {
  psalm: Psalm | null;
  settings: AppSettings;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  playerState: PlayerState;
  onStartAudio: (verseIndex?: number, isSingleVerseMode?: boolean) => void;
  onPauseAudio: () => void;
  onResumeAudio?: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onClose: () => void;
}

export default function ImmersiveReader({
  psalm,
  settings,
  onUpdateSettings,
  playerState,
  onStartAudio,
  onPauseAudio,
  onResumeAudio,
  isFavorite,
  onToggleFavorite,
  onClose,
}: ImmersiveReaderProps) {
  const verseRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Get font size style
  const getFontSizeClass = () => {
    const mult = settings.fontSizeMultiplier;
    if (mult <= 0.85) return "text-base sm:text-lg leading-relaxed";
    if (mult <= 1.0) return "text-lg sm:text-xl leading-loose";
    if (mult <= 1.15) return "text-xl sm:text-2xl leading-loose";
    return "text-2xl sm:text-3xl leading-loose";
  };

  // Scroll active verse into view when narrated
  useEffect(() => {
    if (
      playerState.isPlaying &&
      !playerState.isPaused &&
      playerState.currentPsalmNumber === psalm?.number
    ) {
      const activeEl = verseRefs.current[playerState.currentVerseIndex];
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [playerState.currentVerseIndex, playerState.isPlaying, playerState.isPaused, psalm?.number]);

  if (!psalm) return null;

  return (
    <motion.div
      id="applet-immersive-reader"
      className="fixed inset-0 bg-gold-cream dark:bg-slate-900 z-50 overflow-y-auto flex flex-col transition-colors duration-300"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
    >
      {/* Top Header Controls */}
      <header className="sticky top-0 bg-gold-cream/90 dark:bg-slate-900/90 backdrop-blur border-b border-gold-accent/10 py-4 px-6 flex items-center justify-between z-10 transition-colors duration-300">
        <div className="flex items-center gap-3">
          <button
            id="reader-back-btn"
            onClick={onClose}
            className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 transition-colors"
            title="Voltar para a tela inicial"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display font-bold text-lg text-gray-800 dark:text-gray-100">
              {psalm.title}
            </h1>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">
              Modo Imersivo de Leitura
            </p>
          </div>
        </div>

        {/* Action controllers */}
        <div className="flex items-center gap-2">
          {/* Audio trigger inside reader */}
          <button
            id="reader-audio-btn"
            onClick={() => {
              if (playerState.isPlaying && !playerState.isPaused && playerState.currentPsalmNumber === psalm.number) {
                onPauseAudio();
              } else {
                onStartAudio();
              }
            }}
            className={`p-2.5 rounded-full border transition-all flex items-center gap-1.5 text-xs font-medium ${
              playerState.isPlaying && !playerState.isPaused && playerState.currentPsalmNumber === psalm.number
                ? "bg-gold-accent/15 border-gold-accent text-gold-accent"
                : "bg-transparent border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
            }`}
            title="Ouvir Narração do Salmo"
          >
            {playerState.isPlaying && !playerState.isPaused && playerState.currentPsalmNumber === psalm.number ? (
              <>
                <Pause className="w-4 h-4" />
                <span className="hidden sm:inline">Pausar</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 translate-x-0.5" />
                <span className="hidden sm:inline font-display">Ouvir Salmo</span>
              </>
            )}
          </button>

          {/* Bookmarking favorite */}
          <button
            id="reader-favorite-btn"
            onClick={onToggleFavorite}
            className={`p-2.5 rounded-full border transition-all ${
              isFavorite
                ? "bg-red-50 dark:bg-red-950/20 border-red-200 text-red-500"
                : "bg-transparent border-gray-200 dark:border-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800"
            }`}
            title={isFavorite ? "Remover dos favoritos" : "Salvar nos favoritos"}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
          </button>

          {/* Text Size adjusting pills */}
          <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-800 rounded-full p-0.5">
            <button
              id="reader-size-decrease"
              onClick={() => onUpdateSettings({ fontSizeMultiplier: Math.max(0.85, settings.fontSizeMultiplier - 0.15) })}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 text-xs font-bold"
              disabled={settings.fontSizeMultiplier <= 0.85}
              title="Diminuir tamanho da letra"
            >
              <Type className="w-3.5 h-3.5 scale-90" />
            </button>
            <button
              id="reader-size-increase"
              onClick={() => onUpdateSettings({ fontSizeMultiplier: Math.min(1.45, settings.fontSizeMultiplier + 0.15) })}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 text-xs font-bold"
              disabled={settings.fontSizeMultiplier >= 1.45}
              title="Aumentar tamanho da letra"
            >
              <Type className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Scripture Canvas Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-12 sm:py-16 md:py-20 flex flex-col justify-start">
        {/* Intro theological Theme Header */}
        <div className="text-center mb-12 sm:mb-16 flex flex-col items-center">
          <Sparkles className="w-8 h-8 text-gold-accent mx-auto mb-4 opacity-80" />
          <h2 className="font-serif italic text-xl sm:text-2xl text-gray-600 dark:text-gray-400 leading-relaxed px-4">
            "{psalm.theme}"
          </h2>
          <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-gold-accent to-transparent mx-auto mt-6 mb-8"></div>
          
          {/* Button to listen to the whole psalm */}
          <button
            id="immersive-audio-btn"
            onClick={() => {
              if (playerState.currentPsalmNumber === psalm.number && playerState.isPlaying) {
                if (playerState.isPaused) {
                  onResumeAudio?.();
                } else {
                  onPauseAudio();
                }
              } else {
                onStartAudio();
              }
            }}
            className="w-full max-w-xs py-3 bg-white dark:bg-slate-800 text-gold-accent dark:text-amber-500 rounded-xl text-xs font-display font-semibold border border-gold-accent/25 dark:border-gray-700 hover:bg-gold-cream dark:hover:bg-slate-700 shadow-sm hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {playerState.isPlaying && !playerState.isPaused && playerState.currentPsalmNumber === psalm.number ? (
              <>
                <Pause className="w-4 h-4" />
                Pausar áudio
              </>
            ) : playerState.isPlaying && playerState.isPaused && playerState.currentPsalmNumber === psalm.number ? (
              <>
                <Play className="w-4 h-4" />
                Retomar áudio
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4" />
                Ouvir capítulo inteiro
              </>
            )}
          </button>
        </div>

        {/* Verses stream */}
        <div className="space-y-8 font-serif select-text selection:bg-gold-accent/20">
          {psalm.verses.map((verse, index) => {
            const isActive =
              playerState.isPlaying &&
              playerState.currentPsalmNumber === psalm.number &&
              playerState.currentVerseIndex === index;

            return (
              <motion.div
                key={verse.number}
                ref={(el) => {
                  verseRefs.current[index] = el;
                }}
                id={`reader-verse-${verse.number}`}
                className={`p-4 rounded-2xl transition-all duration-500 flex items-center gap-4 border border-transparent ${
                  isActive
                    ? "bg-gradient-to-r from-amber-50/70 to-yellow-50/10 dark:from-amber-950/20 dark:to-transparent border-l-4 border-l-gold-accent border-gold-accent/15 shadow-sm translate-x-1"
                    : "hover:bg-black/[0.01] dark:hover:bg-white/[0.01]"
                }`}
                animate={{
                  opacity: isActive ? 1 : 0.85,
                  scale: isActive ? 1.01 : 1,
                }}
              >
                {/* Verse numbering */}
                <span className="font-mono text-xs font-semibold text-gold-accent select-none w-6 text-right flex-shrink-0">
                  {verse.number}
                </span>

                {/* Verse text content */}
                <p className={`flex-1 text-gray-800 dark:text-gray-200 transition-all ${getFontSizeClass()}`}>
                  {verse.text}
                </p>

                {/* Play single verse button (touch target >= 44px) */}
                <button
                  id={`play-verse-btn-${verse.number}`}
                  onClick={() => {
                    if (isActive && !playerState.isPaused) {
                      onPauseAudio();
                    } else {
                      onStartAudio(index, true);
                    }
                  }}
                  className={`h-11 w-11 rounded-full border flex items-center justify-center transition-all duration-300 flex-shrink-0 cursor-pointer ${
                    isActive && !playerState.isPaused
                      ? "bg-gold-accent text-white border-gold-accent shadow-md shadow-gold-accent/20 scale-105"
                      : "bg-white dark:bg-slate-800 border-gold-accent/15 dark:border-gray-700 text-gold-accent hover:bg-gold-cream dark:hover:bg-slate-700 hover:border-gold-accent/40"
                  }`}
                  title={`Ouvir apenas o versículo ${verse.number}`}
                >
                  {isActive && !playerState.isPaused ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4 translate-x-0.5" />
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Amém Signature block */}
        <div className="text-center mt-16 sm:mt-24 mb-12">
          <span className="font-serif italic text-lg sm:text-xl text-gold-accent tracking-widest font-semibold block">
            Amém
          </span>
          <p className="text-xs text-gray-400 font-sans mt-3">
            Tradução de Domínio Público Consagrada (João Ferreira de Almeida)
          </p>
        </div>
      </main>
    </motion.div>
  );
}
