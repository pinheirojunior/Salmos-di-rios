import React from "react";
import { X, Sparkles, Info } from "lucide-react";
import { motion } from "motion/react";

interface AboutModalProps {
  onClose: () => void;
}

export default function AboutModal({ onClose }: AboutModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div
        id="about-app-card"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 180 }}
        className="bg-white dark:bg-slate-900 border border-gold-accent/20 dark:border-gray-800 rounded-3xl max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gold-cream/40 dark:bg-slate-950/40 border-b border-gold-accent/10 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-gold-accent" />
            <h2 className="font-serif font-bold text-lg text-gray-800 dark:text-gray-100">
              Sobre o Aplicativo
            </h2>
          </div>
          <button
            id="about-app-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-850 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
            title="Fechar sobre o aplicativo"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 font-serif text-sm text-gray-700 dark:text-gray-300 space-y-4 leading-relaxed scrollbar-thin select-text">
          <div className="text-center pb-3 border-b border-gray-100 dark:border-gray-800/60 flex flex-col items-center">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-gold-accent to-amber-600 flex items-center justify-center text-white shadow-md mb-2">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-sans font-bold text-base text-gray-800 dark:text-gray-100">
              Salmos Diários
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Sua dose diária de reflexão e fé</p>
          </div>

          <div className="space-y-3 font-serif">
            <p>
              O aplicativo <strong>Salmos Diários</strong> é um refúgio espiritual digital projetado para trazer paz, inspiração e consolo em sua caminhada de fé diária.
            </p>
            <p>
              Com ele, você pode começar o dia em comunhão profunda através de uma curadoria espiritual pensada para acalmar a mente, renovar as forças e aproximar o coração da Palavra sagrada.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800/60">
            <h4 className="font-sans font-bold text-gray-800 dark:text-gray-100 text-xs uppercase tracking-wider text-gold-accent">
              Principais Recursos
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-xs font-sans text-gray-500 dark:text-gray-400">
              <li><strong>Salmo Diário:</strong> Uma mensagem inspiradora selecionada para guiar suas manhãs.</li>
              <li><strong>Narração Soleme:</strong> Áudio imersivo narrado de forma calma e solene.</li>
              <li><strong>Livro Sagrado Digital:</strong> Navegação intuitiva por todos os 150 Salmos.</li>
              <li><strong>Personalização Completa:</strong> Ajustes de voz, velocidade e tamanho de letra.</li>
              <li><strong>Favoritos:</strong> Guarde os salmos que mais tocam seu coração.</li>
            </ul>
          </div>
          
          <p className="text-xs font-serif italic text-gray-400 dark:text-gray-500 text-center pt-2">
            "Deleita-te também no Senhor, e ele te concederá os desejos do teu coração." — Salmo 37:4
          </p>
        </div>

        {/* Footer with Signature (Requirement) */}
        <div className="px-6 py-5 bg-gray-50/80 dark:bg-slate-950/40 border-t border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center text-center space-y-2">
          <div className="space-y-0.5">
            <p className="text-[10px] font-sans text-gray-400 dark:text-gray-500 leading-normal">
              Desenvolvido por <span className="font-semibold text-gold-accent">Sorte Lab Dev</span>
              <br />
              José Pinheiro Junior
            </p>
            <p className="text-[9px] font-mono text-gray-400/80 dark:text-gray-500/80 tracking-widest uppercase">
              Versão 1.0.0
            </p>
          </div>
          
          <button
            id="about-app-ok-btn"
            onClick={onClose}
            className="px-5 py-2 bg-gold-accent hover:bg-amber-600 text-white font-sans text-xs font-semibold rounded-xl shadow-sm transition-colors cursor-pointer mt-1"
          >
            Fechar
          </button>
        </div>
      </motion.div>
    </div>
  );
}
