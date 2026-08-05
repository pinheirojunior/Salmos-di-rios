import React, { useState, useEffect } from "react";
import { Book, ChevronLeft, ChevronRight, Sparkles, Heart, RefreshCw, Layers, Volume2 } from "lucide-react";
import { Psalm, AppSettings } from "../types";
import { psalmsMetadataList } from "../data/psalmsMetadata";
import { motion, AnimatePresence } from "motion/react";

interface DigitalBookProps {
  settings: AppSettings;
  onOpenImmersiveReader: (num: number) => void;
  onStartAudio?: (num: number) => void;
  favorites: number[];
  onToggleFavorite: (num: number, e: React.MouseEvent) => void;
  fetchPsalmText?: (number: number, silent?: boolean) => Promise<Psalm | null>;
}

export default function DigitalBook({
  settings,
  onOpenImmersiveReader,
  onStartAudio,
  favorites,
  onToggleFavorite,
  fetchPsalmText,
}: DigitalBookProps) {
  const [isOpened, setIsOpened] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [psalmData, setPsalmData] = useState<Psalm | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState("Todos");

  const categories = [
    "Todos",
    "Louvor e Adoração",
    "Confiança e Fé",
    "Proteção Divina",
    "Oração e Lamento",
    "Sabedoria e Instrução",
  ];

  const getFontSizeClass = () => {
    const mult = settings.fontSizeMultiplier || 1.0;
    if (mult <= 0.85) return "text-xs leading-relaxed";
    if (mult <= 1.0) return "text-sm leading-relaxed";
    if (mult <= 1.15) return "text-base leading-relaxed";
    return "text-lg leading-relaxed";
  };

  // Fetch Psalm text when selectedChapter changes
  useEffect(() => {
    if (selectedChapter === null) {
      setPsalmData(null);
      return;
    }

    const fetchChapter = async () => {
      setIsLoading(true);
      try {
        const data = fetchPsalmText 
          ? await fetchPsalmText(selectedChapter)
          : await (async () => {
              const response = await fetch(`/api/psalm/${selectedChapter}`);
              return response.ok ? await response.json() : null;
            })();
        
        if (data) {
          setPsalmData(data);
          
          // Speculative background prefetch of adjacent chapters
          if (fetchPsalmText) {
            if (selectedChapter < 150) fetchPsalmText(selectedChapter + 1, true);
            if (selectedChapter > 1) fetchPsalmText(selectedChapter - 1, true);
          }
        }
      } catch (err) {
        console.error("Erro na requisição do Salmo:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChapter();
  }, [selectedChapter, fetchPsalmText]);

  // Filter chapter list based on category
  const filteredChapters = psalmsMetadataList.filter((item) => {
    if (activeCategoryFilter === "Todos") return true;
    return item.category === activeCategoryFilter;
  });

  const handleNextChapter = () => {
    if (selectedChapter && selectedChapter < 150) {
      setSelectedChapter(selectedChapter + 1);
    }
  };

  const handlePrevChapter = () => {
    if (selectedChapter && selectedChapter > 1) {
      setSelectedChapter(selectedChapter - 1);
    }
  };

  return (
    <div id="digital-book-container" className="w-full max-w-2xl mx-auto flex flex-col items-center">
      <AnimatePresence mode="wait">
        {/* 1. BOOK CLOSED - COVER VIEW */}
        {!isOpened && (
          <motion.div
            key="book-cover"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20, rotateY: -90 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md aspect-[3/4] bg-radial from-[#4a2e1d] to-[#231209] dark:from-[#1b1a17] dark:to-[#0c0c0b] border-[12px] border-[#d4af37] dark:border-[#a88a2a] rounded-[24px] p-6 shadow-2xl flex flex-col justify-between items-center text-center relative overflow-hidden select-none cursor-pointer"
            onClick={() => setIsOpened(true)}
          >
            {/* Golden ornate corners */}
            <div className="absolute top-4 left-4 w-10 h-10 border-t-2 border-l-2 border-[#d4af37]/60 rounded-tl-lg" />
            <div className="absolute top-4 right-4 w-10 h-10 border-t-2 border-r-2 border-[#d4af37]/60 rounded-tr-lg" />
            <div className="absolute bottom-4 left-4 w-10 h-10 border-b-2 border-l-2 border-[#d4af37]/60 rounded-bl-lg" />
            <div className="absolute bottom-4 right-4 w-10 h-10 border-b-2 border-r-2 border-[#d4af37]/60 rounded-br-lg" />

            {/* Subtle spine line */}
            <div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-black/40 to-transparent border-r border-white/5" />

            <div className="mt-8 space-y-2">
              <Sparkles className="w-10 h-10 text-[#d4af37] mx-auto opacity-90" />
              <p className="text-[#d4af37] text-xs font-mono tracking-widest uppercase font-bold pt-2">
                Escrituras Sagradas
              </p>
            </div>

            <div className="space-y-4 my-auto">
              <h1 className="font-serif text-4xl sm:text-5xl font-bold text-amber-100 tracking-tight leading-tight">
                O Livro dos<br />
                <span className="text-[#d4af37] font-serif italic">Salmos</span>
              </h1>
              <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent mx-auto" />
              <p className="text-amber-200/60 font-sans text-xs tracking-wider">
                150 Cânticos de Louvor e Oração
              </p>
            </div>

            <div className="mb-8 space-y-4">
              <p className="text-amber-100/70 font-serif text-[10px] tracking-widest uppercase italic">
                Tradução Clássica de João Ferreira de Almeida
              </p>
              <button
                id="open-book-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpened(true);
                }}
                className="px-6 py-2.5 bg-[#d4af37] hover:bg-[#c19d2f] text-[#231209] font-display font-bold text-xs uppercase tracking-widest rounded-full shadow-md hover:shadow-lg transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                Abrir o Livro
              </button>
            </div>
          </motion.div>
        )}

        {/* 2. BOOK OPENED - CHAPTERS GRID INDEX OR ACTIVE READING PAGE */}
        {isOpened && (
          <motion.div
            key="book-content"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="w-full bg-[#fbf9f4] dark:bg-slate-900 border border-gold-accent/20 dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden flex flex-col transition-colors duration-300"
          >
            {/* Header / Spine controls */}
            <header className="px-5 py-3.5 bg-gold-cream/40 dark:bg-slate-950/40 border-b border-gold-accent/10 dark:border-gray-800 flex items-center justify-between">
              <button
                id="book-back-to-index-btn"
                onClick={() => {
                  if (selectedChapter !== null) {
                    setSelectedChapter(null);
                  } else {
                    setIsOpened(false);
                  }
                }}
                className="flex items-center gap-1.5 text-xs text-gold-accent font-display font-medium hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{selectedChapter !== null ? "Sumário do Livro" : "Fechar Livro"}</span>
              </button>

              <div className="flex items-center gap-1.5 font-serif italic text-xs text-gray-500 dark:text-gray-400">
                <Book className="w-3.5 h-3.5 text-gold-accent" />
                <span>{selectedChapter !== null ? `Salmo ${selectedChapter}` : "Bíblia dos Salmos"}</span>
              </div>

              {selectedChapter !== null ? (
                <div className="flex items-center gap-1">
                  <button
                    id="book-prev-chapter"
                    onClick={handlePrevChapter}
                    disabled={selectedChapter <= 1}
                    className="p-1 rounded-full hover:bg-gold-cream dark:hover:bg-slate-800 text-gray-500 disabled:opacity-30"
                    title="Salmo anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] font-mono text-gray-400">{selectedChapter}/150</span>
                  <button
                    id="book-next-chapter"
                    onClick={handleNextChapter}
                    disabled={selectedChapter >= 150}
                    className="p-1 rounded-full hover:bg-gold-cream dark:hover:bg-slate-800 text-gray-500 disabled:opacity-30"
                    title="Próximo Salmo"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="w-6 h-6" /> // spacer
              )}
            </header>

            {/* Inner Content Area */}
            <div className="p-6 sm:p-8 flex-1 min-h-[420px] flex flex-col justify-start relative">
              {/* Case A: Showing the full 150 circular Chapters Grid */}
              {selectedChapter === null && (
                <div className="space-y-6 flex flex-col flex-1">
                  <div className="text-center space-y-1.5">
                    <h2 className="font-serif text-xl font-bold text-gray-800 dark:text-gray-100">
                      Escolha um Salmo
                    </h2>
                    <p className="text-xs text-gray-400 max-w-md mx-auto">
                      Selecione qualquer uma das 150 escrituras abaixo para ler e escutar. Você também pode filtrar por sentimento.
                    </p>
                  </div>

                  {/* Horizontal Scroll Categories for Quick Filtering inside the Book Index */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-2 px-2">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        id={`book-cat-pill-${cat.replace(/\s+/g, "-")}`}
                        onClick={() => setActiveCategoryFilter(cat)}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-display font-semibold transition-all ${
                          activeCategoryFilter === cat
                            ? "bg-gold-accent text-white"
                            : "bg-white dark:bg-slate-800 border border-gold-accent/10 dark:border-gray-700 text-gray-500 hover:bg-gold-cream dark:hover:bg-slate-700"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Grid of 150 items */}
                  <div className="grid grid-cols-5 sm:grid-cols-8 gap-2.5 overflow-y-auto max-h-[340px] pr-1.5 scrollbar-thin">
                    {filteredChapters.map((psalm) => {
                      const isFav = favorites.includes(psalm.number);
                      return (
                        <button
                          key={psalm.number}
                          id={`book-chapter-bead-${psalm.number}`}
                          onClick={() => setSelectedChapter(psalm.number)}
                          className={`aspect-square rounded-full border flex flex-col items-center justify-center relative cursor-pointer group transition-all ${
                            favorites.includes(psalm.number)
                              ? "bg-amber-50 dark:bg-amber-950/20 border-gold-accent/40 text-gold-accent font-bold"
                              : "bg-white dark:bg-slate-800 border-gold-accent/10 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gold-accent/40 hover:bg-gold-cream dark:hover:bg-slate-700"
                          }`}
                          title={`${psalm.title} - ${psalm.theme}`}
                        >
                          <span className="font-display text-xs">{psalm.number}</span>
                          {isFav && (
                            <span className="absolute bottom-1 w-1 h-1 bg-red-400 rounded-full" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Case B: Loading state */}
              {selectedChapter !== null && isLoading && (
                <div className="flex-1 flex flex-col items-center justify-center space-y-3 py-20">
                  <RefreshCw className="w-8 h-8 text-gold-accent animate-spin" />
                  <span className="font-serif italic text-xs text-gold-accent animate-pulse">
                    Folheando páginas do livro...
                  </span>
                </div>
              )}

              {/* Case C: Displaying specific loaded Psalm */}
              {selectedChapter !== null && !isLoading && psalmData && (
                <motion.div
                  key={`chapter-${selectedChapter}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex flex-col flex-1 justify-between space-y-6"
                >
                  <div className="space-y-5">
                    {/* Chapter Header Card Row */}
                    <div className="flex justify-between items-start border-b border-gold-accent/10 dark:border-gray-800 pb-3">
                      <div>
                        <h2 className="font-serif font-bold text-2xl text-gray-800 dark:text-gray-100">
                          {psalmData.title}
                        </h2>
                        <span className="text-[10px] font-mono text-gold-accent uppercase tracking-widest">
                          {psalmsMetadataList[selectedChapter - 1]?.category || "Sagrado"}
                        </span>
                      </div>

                      <button
                        id="book-page-fav-btn"
                        onClick={(e) => onToggleFavorite(selectedChapter, e)}
                        className={`p-2 rounded-full hover:bg-gold-cream dark:hover:bg-slate-800 transition-colors ${
                          favorites.includes(selectedChapter) ? "text-red-500" : "text-gray-300 dark:text-gray-600"
                        }`}
                        title={favorites.includes(selectedChapter) ? "Remover dos favoritos" : "Salvar nos favoritos"}
                      >
                        <Heart className={`w-5 h-5 ${favorites.includes(selectedChapter) ? "fill-current" : ""}`} />
                      </button>
                    </div>

                    {/* Book theological Theme Intro */}
                    <div className="bg-[#f5f2e9] dark:bg-slate-950 p-4 rounded-xl border border-gold-accent/10 italic text-center text-sm font-serif text-gray-600 dark:text-gray-400">
                      "{psalmData.theme}"
                    </div>

                    {/* Verses reader inside the book */}
                    <div className="space-y-5 font-serif text-gray-700 dark:text-gray-300 leading-relaxed max-h-[250px] overflow-y-auto pr-2 scrollbar-thin select-text">
                      {psalmData.verses.map((verse) => (
                        <p key={verse.number} className={getFontSizeClass()}>
                          <span className="font-mono text-[10px] font-bold text-gold-accent mr-2 bg-gold-cream dark:bg-slate-800 px-1.5 py-0.5 rounded-full select-none">
                            {verse.number}
                          </span>
                          {verse.text}
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* Actions under reading page */}
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gold-accent/10 dark:border-gray-800">
                    {onStartAudio && (
                      <button
                        id="book-page-start-audio-btn"
                        onClick={() => onStartAudio(selectedChapter)}
                        className="w-full py-2.5 bg-white dark:bg-slate-800 text-gold-accent hover:bg-gold-cream dark:hover:bg-slate-700 rounded-xl text-xs font-display font-bold border border-gold-accent/25 dark:border-gray-700 shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        Ouvir Narração
                      </button>
                    )}

                    <button
                      id="book-page-immersive-reader-btn"
                      onClick={() => onOpenImmersiveReader(selectedChapter)}
                      className={`py-2.5 bg-[#d4af37] text-[#231209] hover:bg-[#c19d2f] rounded-xl text-xs font-display font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${onStartAudio ? "w-full" : "col-span-2"}`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      Modo Imersivo
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Book bottom index pagination indicator */}
            {selectedChapter === null && (
              <footer className="px-5 py-3 border-t border-gold-accent/5 bg-gold-cream/20 dark:bg-slate-950/20 text-center text-[10px] text-gray-400 font-mono flex justify-between items-center">
                <span>Total de escrituras: 150</span>
                <span>Modo Livro Digital Ativo</span>
              </footer>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
