import React from "react";
import { Sparkles, Check, Volume2 } from "lucide-react";
import { VoiceGender } from "../types";
import { motion } from "motion/react";

interface VoicePromptProps {
  onSelectGender: (gender: VoiceGender) => void;
  userName?: string;
}

export default function VoicePrompt({ onSelectGender, userName }: VoicePromptProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-gold-accent/20 dark:border-slate-800 shadow-2xl relative overflow-hidden"
      >
        {/* Background decorative glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-gold-accent/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center space-y-4 relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/10 to-amber-100 dark:to-slate-800 text-gold-accent border border-gold-accent/20 shadow-inner mx-auto mb-1">
            <Volume2 className="w-8 h-8 text-amber-600 dark:text-gold-accent animate-pulse" />
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-widest text-gold-accent font-bold">
              Experiência de Narração
            </span>
            <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-gray-100">
              {userName ? `Bem-vindo, ${userName}!` : "Escolha a Voz do App"}
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 font-serif leading-relaxed max-w-xs mx-auto">
              Selecione o estilo de voz que vai acompanhar suas leituras dos Salmos. Você pode alterar essa preferência a qualquer momento nas configurações.
            </p>
          </div>

          {/* Voice Gender Selection Cards */}
          <div className="grid grid-cols-1 gap-3 pt-3 text-left">
            {/* Voz Masculina */}
            <button
              id="voice-prompt-masculine-btn"
              onClick={() => onSelectGender("masculine")}
              className="group p-4 rounded-2xl border-2 border-gray-100 dark:border-slate-800 hover:border-gold-accent dark:hover:border-gold-accent bg-gray-50/70 dark:bg-slate-950 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-all cursor-pointer flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-xl shadow-xs group-hover:scale-105 transition-transform">
                  👨
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 group-hover:text-amber-600 dark:group-hover:text-gold-accent transition-colors">
                    Voz Masculina
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-serif mt-0.5">
                    Leitura grave, serena e solene
                  </p>
                </div>
              </div>

              <div className="w-6 h-6 rounded-full border border-gray-300 dark:border-slate-700 group-hover:border-gold-accent group-hover:bg-gold-accent flex items-center justify-center transition-colors">
                <Check className="w-3.5 h-3.5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>

            {/* Voz Feminina */}
            <button
              id="voice-prompt-feminine-btn"
              onClick={() => onSelectGender("feminine")}
              className="group p-4 rounded-2xl border-2 border-gray-100 dark:border-slate-800 hover:border-gold-accent dark:hover:border-gold-accent bg-gray-50/70 dark:bg-slate-950 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-all cursor-pointer flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-xl shadow-xs group-hover:scale-105 transition-transform">
                  👩
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 group-hover:text-amber-600 dark:group-hover:text-gold-accent transition-colors">
                    Voz Feminina
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-serif mt-0.5">
                    Leitura clara, suave e acolhedora
                  </p>
                </div>
              </div>

              <div className="w-6 h-6 rounded-full border border-gray-300 dark:border-slate-700 group-hover:border-gold-accent group-hover:bg-gold-accent flex items-center justify-center transition-colors">
                <Check className="w-3.5 h-3.5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          </div>

          <div className="pt-2">
            <p className="text-[11px] text-gray-400 dark:text-gray-500 font-serif flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-gold-accent" />
              Vozes em Português do Brasil de alta qualidade
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
