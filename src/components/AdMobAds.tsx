import React, { useState, useEffect } from "react";
import { X, Sparkles, ShieldCheck, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Easily customizable Google AdMob simulation configurations (Requirement 3 of Ads section)
export const AD_CONFIG = {
  enabled: true,                  // Toggle ads globally
  minIntervalSeconds: 300,        // Minimum seconds between interstitial displays (5 minutes)
  actionsBeforeAd: 6,             // Number of page switches or finished readings before an ad
  initialDelayMinutes: 5,         // Initial delay before any interstitial can be shown
};

interface BannerProps {
  isPremium: boolean;
  onGoPremium: () => void;
}

/**
 * Fixed AdMob Banner simulation component (Requirement 1 of Ads section)
 * Positioned discretely, does not interrupt reading, styled cleanly
 */
export function SimulatedBannerAd({ isPremium, onGoPremium }: BannerProps) {
  const [closed, setClosed] = useState(false);

  if (!AD_CONFIG.enabled || isPremium || closed) return null;

  return (
    <motion.div
      id="admob-simulated-banner"
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-gray-100 dark:bg-slate-900 border-t border-gold-accent/10 dark:border-gray-800 text-center py-2 px-4 flex items-center justify-between gap-3 text-[11px] h-12 w-full max-w-2xl mx-auto rounded-t-xl z-20 shadow-sm relative overflow-hidden"
    >
      <div className="flex items-center gap-2">
        <span className="bg-gold-accent/15 text-gold-accent text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border border-gold-accent/20 tracking-wider">
          Anúncio
        </span>
        <p className="font-serif text-gray-500 dark:text-gray-400 truncate text-[10px] text-left">
          Alimente sua fé diariamente. Apoie este app livre de anúncios!
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          id="banner-remove-ads-btn"
          onClick={onGoPremium}
          className="bg-gold-accent/90 hover:bg-gold-accent text-white dark:text-slate-950 font-display font-semibold text-[9px] px-2.5 py-1 rounded-full transition-all cursor-pointer"
        >
          Remover Ads 🌟
        </button>
        <button
          id="banner-close-ad-btn"
          onClick={() => setClosed(true)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
          title="Fechar anúncio"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Decorative tiny subtle bg logo */}
      <div className="absolute right-12 top-0 bottom-0 flex items-center opacity-5 pointer-events-none">
        <Sparkles className="w-8 h-8 text-gold-accent" />
      </div>
    </motion.div>
  );
}

interface InterstitialProps {
  isPremium: boolean;
  onClose: () => void;
}

/**
 * Fullscreen simulated Google AdMob Interstitial ad (Requirement 2 of Ads section)
 */
export function SimulatedInterstitialAd({ isPremium, onClose }: InterstitialProps) {
  const [countdown, setCountdown] = useState(3);
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanClose(true);
    }
  }, [countdown]);

  if (!AD_CONFIG.enabled || isPremium) {
    onClose();
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[200] flex flex-col justify-between p-6 text-white">
      {/* Top Banner details */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <span className="bg-gold-accent text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider">
            Google AdMob Interstitial
          </span>
          <span className="text-xs text-gray-400 font-sans flex items-center gap-1">
            <Info className="w-3.5 h-3.5" /> Simulação de Anúncio
          </span>
        </div>

        {canClose ? (
          <button
            id="interstitial-close-btn"
            onClick={onClose}
            className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all cursor-pointer"
            title="Fechar anúncio"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
          <div className="text-xs text-gold-accent font-mono font-bold">
            Fechando em {countdown}s...
          </div>
        )}
      </div>

      {/* Center Graphic */}
      <div className="max-w-md mx-auto w-full text-center space-y-6 my-auto">
        <div className="h-20 w-20 rounded-[24px] bg-gradient-to-tr from-gold-accent to-amber-600 flex items-center justify-center text-white shadow-2xl mx-auto">
          <Sparkles className="w-12 h-12" />
        </div>

        <div className="space-y-2">
          <h2 className="font-serif font-bold text-2xl tracking-tight text-white">
            Gostaria de ler os Salmos sem anúncios?
          </h2>
          <p className="text-xs text-gray-400 max-w-sm mx-auto font-sans leading-relaxed">
            Adquira a Versão Premium para apoiar o desenvolvimento independente e remover todos os anúncios permanentemente por apenas R$ 9,90.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3 text-left">
          <ShieldCheck className="w-8 h-8 text-gold-accent flex-shrink-0" />
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-gray-100 font-sans">Sua Paz Não Deve Ser Interrompida</p>
            <p className="text-[10px] text-gray-400 font-sans leading-normal">
              Anúncios ajudam a financiar os servidores de áudio. Mas você tem total controle nas configurações.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom info */}
      <div className="text-center text-[10px] text-gray-500 font-mono border-t border-white/10 pt-4">
        Google Play Store Compliance • AdMob ID: ca-app-pub-3940256099942544
      </div>
    </div>
  );
}
