import { Check, Sparkles, Volume2 } from "lucide-react";
import { VoiceGender } from "../types";
import { motion } from "motion/react";

interface VoicePromptProps {
  onSelectGender: (gender: VoiceGender) => void;
}

export default function VoicePrompt({ onSelectGender }: VoicePromptProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-55 flex items-center justify-center p-6">
      <motion.div
        id="applet-voice-prompt-card"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 25, stiffness: 180 }}
        className="bg-white dark:bg-slate-900 border border-gold-accent/25 rounded-3xl max-w-md w-full p-8 shadow-2xl space-y-6 text-center"
      >
        {/* Header Visual Decoration */}
        <div className="mx-auto w-16 h-16 rounded-full bg-gold-cream dark:bg-slate-800 border border-gold-accent/20 flex items-center justify-center text-gold-accent shadow-inner">
          <Volume2 className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-mono tracking-widest text-gold-accent uppercase font-bold flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3" /> Preferências de Leitura
          </span>
          <h2 className="font-display font-bold text-xl text-gray-800 dark:text-gray-100">
            Seja bem-vindo ao Salmo do Dia
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto leading-relaxed">
            Para iniciar sua experiência de audição e oração silenciosa, qual estilo de voz você prefere para as narrações das escrituras?
          </p>
        </div>

        {/* Choice Buttons Grid */}
        <div className="grid grid-cols-1 gap-4 pt-2">
          {/* Masculine option */}
          <button
            id="voice-prompt-masculine"
            onClick={() => onSelectGender("masculine")}
            className="group text-left p-4 rounded-2xl bg-gold-cream/40 dark:bg-slate-800/40 border border-gold-accent/15 hover:border-gold-accent/50 dark:hover:border-gold-accent/40 hover:bg-gold-cream dark:hover:bg-slate-800 transition-all flex items-center justify-between"
          >
            <div>
              <h3 className="font-display font-semibold text-sm text-gray-800 dark:text-gray-100 group-hover:text-gold-accent transition-colors">
                Voz Masculina
              </h3>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                Tom calmo, sereno, com ritmo pausado e solene.
              </p>
            </div>
            <div className="h-6 w-6 rounded-full border border-gold-accent/20 group-hover:bg-gold-accent group-hover:border-gold-accent flex items-center justify-center text-white transition-all">
              <Check className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>

          {/* Feminine option */}
          <button
            id="voice-prompt-feminine"
            onClick={() => onSelectGender("feminine")}
            className="group text-left p-4 rounded-2xl bg-gold-cream/40 dark:bg-slate-800/40 border border-gold-accent/15 hover:border-gold-accent/50 dark:hover:border-gold-accent/40 hover:bg-gold-cream dark:hover:bg-slate-800 transition-all flex items-center justify-between"
          >
            <div>
              <h3 className="font-display font-semibold text-sm text-gray-800 dark:text-gray-100 group-hover:text-gold-accent transition-colors">
                Voz Feminina
              </h3>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                Tom suave, acolhedor, com leitura compassada e terna.
              </p>
            </div>
            <div className="h-6 w-6 rounded-full border border-gold-accent/20 group-hover:bg-gold-accent group-hover:border-gold-accent flex items-center justify-center text-white transition-all">
              <Check className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        </div>

        {/* Footer info message */}
        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-serif leading-normal pt-2">
          *Você poderá alterar o estilo, a velocidade da leitura ou desativar o player a qualquer momento na aba de configurações ou no painel do player.
        </p>
      </motion.div>
    </div>
  );
}
