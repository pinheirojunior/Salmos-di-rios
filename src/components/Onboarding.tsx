import React, { useState } from "react";
import { Sparkles, Shield, User, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import PrivacyPolicyModal from "./PrivacyPolicyModal";

interface OnboardingProps {
  onComplete: (name: string) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [name, setName] = useState("");
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Por favor, informe seu nome.");
      return;
    }
    if (!acceptedPrivacy) {
      setError("Você precisa aceitar a Política de Privacidade para continuar.");
      return;
    }
    onComplete(trimmedName);
  };

  return (
    <div className="fixed inset-0 bg-gold-cream dark:bg-slate-950 z-[90] flex items-center justify-center p-4 overflow-y-auto">
      {/* Background decorations */}
      <div className="absolute top-10 left-10 w-48 h-48 rounded-full bg-gold-accent/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full bg-amber-600/5 blur-3xl pointer-events-none" />

      <motion.div
        id="onboarding-card"
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 180 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-gold-accent/25 dark:border-gray-800 rounded-[32px] shadow-2xl p-6 sm:p-8 space-y-6 flex flex-col justify-between relative"
      >
        {/* Decorative Badge */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-gold-accent to-amber-600 flex items-center justify-center text-white shadow-xl shadow-gold-accent/25">
            <Sparkles className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-mono tracking-widest text-gold-accent font-bold uppercase">
              Bem-vindo ao Salmos do Dia
            </span>
            <h1 className="font-serif font-bold text-2xl sm:text-3xl text-gray-900 dark:text-white leading-tight">
              Seu momento diário de conexão com os Salmos.
            </h1>
            <p className="text-xs text-gray-400 dark:text-gray-500 max-w-xs mx-auto">
              Um espaço de paz, reflexão e espiritualidade diária.
            </p>
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="user-name-input"
              className="text-xs font-semibold text-gray-600 dark:text-gray-300 block font-display"
            >
              Como podemos chamar você?
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                <User className="w-4 h-4" />
              </span>
              <input
                id="user-name-input"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
                placeholder="Ex: João, Maria, Ana..."
                maxLength={40}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-800/80 border border-gold-accent/15 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-accent/50 focus:border-gold-accent transition-all font-sans placeholder-gray-400"
              />
            </div>
          </div>

          {/* Privacy Checkbox */}
          <div className="flex items-start gap-3 bg-gray-50/50 dark:bg-slate-850 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
            <input
              id="privacy-checkbox"
              type="checkbox"
              checked={acceptedPrivacy}
              onChange={(e) => {
                setAcceptedPrivacy(e.target.checked);
                setError("");
              }}
              className="mt-1 h-4 w-4 rounded border-gold-accent/30 text-gold-accent focus:ring-gold-accent cursor-pointer accent-amber-600"
            />
            <label
              htmlFor="privacy-checkbox"
              className="text-xs text-gray-500 dark:text-gray-400 leading-normal select-none"
            >
              Li e aceito a{" "}
              <button
                type="button"
                id="onboarding-privacy-link-btn"
                onClick={() => setShowPrivacyModal(true)}
                className="text-gold-accent hover:text-amber-600 underline font-medium cursor-pointer"
              >
                Política de Privacidade
              </button>{" "}
              do aplicativo Salmos do Dia.
            </label>
          </div>

          {/* Validation Error Feedback */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-center text-xs font-semibold text-red-500"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Submit Button (touch target >= 44px) */}
          <button
            type="submit"
            id="onboarding-continue-btn"
            disabled={!name.trim() || !acceptedPrivacy}
            className={`w-full h-12 rounded-xl text-xs font-display font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer ${
              name.trim() && acceptedPrivacy
                ? "bg-gradient-to-r from-gold-accent to-amber-600 text-white shadow-lg shadow-gold-accent/20 hover:scale-[1.02] active:scale-98"
                : "bg-gray-200 dark:bg-slate-800 text-gray-400 dark:text-gray-600 cursor-not-allowed"
            }`}
          >
            <span>Começar</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Minimal Footer */}
        <div className="text-center text-[10px] text-gray-400 font-mono flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5" />
          <span>Conexão Segura e Livre de Coletas Indevidas</span>
        </div>
      </motion.div>

      {/* Privacy Policy Modal */}
      <AnimatePresence>
        {showPrivacyModal && (
          <PrivacyPolicyModal onClose={() => setShowPrivacyModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
