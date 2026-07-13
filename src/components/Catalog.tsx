import React, { useState, useMemo } from "react";
import { Search, Sparkles, Heart, Filter, X } from "lucide-react";
import { PsalmMetadata } from "../types";
import { psalmsMetadataList } from "../data/psalmsMetadata";
import { motion, AnimatePresence } from "motion/react";

interface CatalogProps {
  onSelectPsalmNumber: (num: number) => void;
  favorites: number[];
  onToggleFavorite: (num: number, e: React.MouseEvent) => void;
  onPrefetchPsalmNumber?: (num: number) => void;
}

export default function Catalog({
  onSelectPsalmNumber,
  favorites,
  onToggleFavorite,
  onPrefetchPsalmNumber,
}: CatalogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  const categories = useMemo(() => {
    return [
      "Todos",
      "Louvor e Adoração",
      "Confiança e Fé",
      "Proteção Divina",
      "Oração e Lamento",
      "Sabedoria e Instrução",
    ];
  }, []);

  // Filter list based on search and category
  const filteredPsalms = useMemo(() => {
    return psalmsMetadataList.filter(psalm => {
      // Category filter
      const matchesCategory = selectedCategory === "Todos" || psalm.category === selectedCategory;

      // Text search query matching number, title, theme, category or preview
      const query = searchQuery.trim().toLowerCase();
      if (!query) return matchesCategory;

      const matchesNumber = psalm.number.toString() === query;
      const matchesTitle = psalm.title.toLowerCase().includes(query);
      const matchesTheme = psalm.theme.toLowerCase().includes(query);
      const matchesCategoryText = psalm.category.toLowerCase().includes(query);
      const matchesPreview = psalm.preview.toLowerCase().includes(query);

      return matchesCategory && (matchesNumber || matchesTitle || matchesTheme || matchesCategoryText || matchesPreview);
    });
  }, [searchQuery, selectedCategory]);

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "Louvor e Adoração":
        return "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30";
      case "Proteção Divina":
        return "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30";
      case "Oração e Lamento":
        return "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30";
      case "Confiança e Fé":
        return "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30";
      default:
        return "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30";
    }
  };

  return (
    <div className="space-y-6" id="applet-catalog-section">
      {/* Search Bar container */}
      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          id="catalog-search-input"
          type="text"
          placeholder="Pesquisar por número, palavra, tema ou sentimento..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white dark:bg-slate-900/60 pl-12 pr-10 py-3.5 rounded-2xl border border-gold-accent/15 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-gold-accent/40 shadow-sm transition-all placeholder:text-gray-400 text-gray-800 dark:text-gray-100 text-sm"
        />
        {searchQuery && (
          <button
            id="catalog-search-clear"
            onClick={() => setSearchQuery("")}
            className="absolute inset-y-0 right-3 flex items-center p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            title="Limpar pesquisa"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Categories Filter Pills horizontal list */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex-shrink-0 text-gray-400 dark:text-gray-500 mr-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5" />
          <span>Filtro:</span>
        </div>
        {categories.map((cat) => (
          <button
            key={cat}
            id={`catalog-cat-pill-${cat.replace(/\s+/g, "-")}`}
            onClick={() => setSelectedCategory(cat)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-display font-medium transition-all ${
              selectedCategory === cat
                ? "bg-gold-accent text-white shadow-md shadow-gold-accent/20 scale-[1.03]"
                : "bg-white dark:bg-slate-900 border border-gold-accent/10 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid count summary banner */}
      <div className="flex justify-between items-center text-xs font-mono text-gray-400 dark:text-gray-500 px-1 border-b border-gray-100 dark:border-gray-800/60 pb-3">
        <span>Resultados encontrados</span>
        <span className="font-semibold text-gold-accent">{filteredPsalms.length} de 150 Salmos</span>
      </div>

      {/* Grid list container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredPsalms.map((psalm, idx) => {
            const isFav = favorites.includes(psalm.number);

            return (
              <motion.div
                key={psalm.number}
                id={`catalog-psalm-card-${psalm.number}`}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.35, ease: "easeOut", delay: Math.min(0.15, idx * 0.015) }}
                onClick={() => onSelectPsalmNumber(psalm.number)}
                onMouseEnter={() => onPrefetchPsalmNumber?.(psalm.number)}
                className="group relative bg-white dark:bg-slate-900 border border-gold-accent/10 dark:border-gray-800 hover:border-gold-accent/35 dark:hover:border-gold-accent/25 rounded-2xl p-5 cursor-pointer hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card row header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      {/* Stylized circle number indicator */}
                      <div className="h-10 w-10 rounded-full bg-gold-cream dark:bg-slate-800 border border-gold-accent/20 group-hover:bg-gold-accent group-hover:border-gold-accent flex items-center justify-center font-display font-bold text-xs text-gold-accent group-hover:text-white transition-all flex-shrink-0">
                        Sl {psalm.number}
                      </div>
                      <div>
                        <h3 className="font-display font-semibold text-sm text-gray-800 dark:text-gray-100 group-hover:text-gold-accent transition-colors">
                          {psalm.title}
                        </h3>
                        {/* Category tag bubble */}
                        <span className={`inline-block border rounded px-2 py-0.5 mt-1 text-[10px] font-medium tracking-wide ${getCategoryColor(psalm.category)}`}>
                          {psalm.category}
                        </span>
                      </div>
                    </div>

                    {/* Bookmark icon click triggers toggleFavorite */}
                    <button
                      id={`catalog-fav-btn-${psalm.number}`}
                      onClick={(e) => onToggleFavorite(psalm.number, e)}
                      className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                        isFav ? "text-red-500" : "text-gray-300 dark:text-gray-600 hover:text-gray-500"
                      }`}
                      title={isFav ? "Remover dos favoritos" : "Salvar nos favoritos"}
                    >
                      <Heart className={`w-4 h-4 ${isFav ? "fill-current" : ""}`} />
                    </button>
                  </div>

                  {/* Psalm central theme description */}
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 leading-relaxed mb-2.5">
                    "{psalm.theme}"
                  </p>

                  {/* Visual scripture snippet excerpt */}
                  <p className="text-xs italic text-gray-400 dark:text-gray-500 font-serif leading-relaxed line-clamp-2">
                    {psalm.preview}
                  </p>
                </div>

                {/* Micro card gold decoration footer */}
                <div className="flex items-center justify-between border-t border-gray-50 dark:border-gray-800/40 mt-4 pt-3 text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-gold-accent/60" />
                    Ler ou ouvir
                  </span>
                  <span className="opacity-0 group-hover:opacity-100 text-gold-accent transition-opacity font-sans font-medium flex items-center gap-1">
                    Toque para abrir &rarr;
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Empty placeholder state */}
        {filteredPsalms.length === 0 && (
          <div className="col-span-1 md:col-span-2 py-16 text-center space-y-3">
            <div className="w-12 h-12 bg-gold-cream dark:bg-slate-800 border border-gold-accent/15 rounded-full flex items-center justify-center mx-auto mb-2 text-gold-accent">
              <Search className="w-6 h-6 opacity-60" />
            </div>
            <h3 className="font-display font-medium text-gray-700 dark:text-gray-300">
              Nenhum Salmo encontrado
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 max-w-xs mx-auto">
              Experimente buscar por outros termos, temas como "fé" ou números de 1 a 150.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
