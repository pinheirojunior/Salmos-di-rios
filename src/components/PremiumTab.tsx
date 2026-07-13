import React, { useState } from "react";
import { Sparkles, Crown, Check, Heart, ShieldAlert, Award, ArrowRight, Star } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PremiumTabProps {
  isPremium: boolean;
  onPurchaseComplete: () => void;
}

export default function PremiumTab({ isPremium, onPurchaseComplete }: PremiumTabProps) {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSimulatePurchase = () => {
    setIsCheckingOut(true);
    // Simulate short network delay for checkout
    setTimeout(() => {
      setIsCheckingOut(false);
      setShowSuccess(true);
      onPurchaseComplete();
    }, 1500);
  };

  const advantages = [
    {
      title: "100% Livre de Anúncios",
      desc: "Nenhum anúncio em banner ou tela cheia (AdMob) interromperá sua reflexão.",
    },
    {
      title: "Narrações Fluidas e Rápidas",
      desc: "Acesso de alta prioridade aos mecanismos de voz e áudio do aplicativo.",
    },
    {
      title: "Apoie o Desenvolvedor",
      desc: "Ajude o desenvolvedor independente a manter os servidores e criar mais conteúdos sagrados.",
    },
    {
      title: "Selo Premium no Perfil",
      desc: "Um selo visual dourado exclusivo ao lado do seu nome nas saudações diárias.",
    },
  ];

  return (
    <div id="premium-tab-container" className="space-y-6 max-w-lg mx-auto pb-10">
      {/* Tab Header Banner */}
      <div className="text-center space-y-2 py-4">
        <span className="text-[10px] font-mono uppercase tracking-widest text-gold-accent font-bold bg-gold-cream/40 dark:bg-slate-800 border border-gold-accent/15 px-3 py-1 rounded-full inline-block">
          Apoie o Projeto
        </span>
        <h1 className="font-serif font-bold text-3xl text-gray-900 dark:text-white">
          Acesso Premium 🌟
        </h1>
        <p className="text-xs text-gray-400 dark:text-gray-500 max-w-sm mx-auto leading-relaxed">
          Torne sua jornada pelos Salmos ainda mais tranquila, livre de anúncios e apoie este trabalho.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {/* SUCCESS MESSAGE */}
        {showSuccess || isPremium ? (
          <motion.div
            key="premium-success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-amber-50 to-yellow-50/20 dark:from-slate-900 dark:to-slate-950 border-2 border-[#d4af37] rounded-3xl p-6 sm:p-8 text-center space-y-5 relative overflow-hidden"
          >
            {/* Crown decoration background */}
            <div className="absolute -right-10 -bottom-10 opacity-5 dark:opacity-10 pointer-events-none">
              <Crown className="w-40 h-40 text-gold-accent" />
            </div>

            <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-gold-accent to-amber-600 flex items-center justify-center text-white shadow-xl shadow-gold-accent/25 mx-auto">
              <Award className="w-8 h-8 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h2 className="font-serif font-bold text-2xl text-gold-accent">
                Você é Premium!
              </h2>
              <p className="text-sm font-serif text-gray-700 dark:text-gray-300">
                Agradecemos profundamente pelo seu apoio generoso. Seu nome agora conta com o selo exclusivo dourado e todos os anúncios do aplicativo foram permanentemente desativados.
              </p>
            </div>

            <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent mx-auto" />

            <div className="flex items-center justify-center gap-2 text-xs font-mono text-gold-accent font-semibold">
              <Star className="w-4 h-4 fill-current animate-pulse" />
              <span>Assinatura Vitalícia Ativa</span>
              <Star className="w-4 h-4 fill-current animate-pulse" />
            </div>
          </motion.div>
        ) : (
          /* REGULAR PURCHASE OPTIONS */
          <motion.div
            key="premium-checkout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Advantages Box */}
            <div className="bg-white dark:bg-slate-900 border border-gold-accent/15 dark:border-gray-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-md">
              <h3 className="font-display font-bold text-sm text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <Crown className="w-4 h-4 text-gold-accent" /> Benefícios da Versão Premium
              </h3>

              <div className="space-y-3.5">
                {advantages.map((adv, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="p-1 bg-amber-50 dark:bg-slate-800 text-gold-accent rounded-full mt-0.5 flex-shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="font-sans font-semibold text-xs text-gray-800 dark:text-gray-100">
                        {adv.title}
                      </h4>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 font-serif leading-normal">
                        {adv.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Simulated Price Card & Buy Button */}
            <div className="bg-gradient-to-br from-[#4a2e1d] to-[#231209] dark:from-[#1b1a17] dark:to-[#0c0c0b] border-2 border-[#d4af37] rounded-3xl p-6 text-center space-y-5 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Crown className="w-20 h-20 text-[#d4af37]" />
              </div>

              <div className="space-y-1.5">
                <span className="text-[9px] font-mono text-[#d4af37] uppercase tracking-widest font-bold">
                  PROMOÇÃO DE APOIADOR
                </span>
                <p className="text-3xl font-display font-bold text-amber-100">
                  R$ 9,90
                </p>
                <p className="text-[10px] text-amber-200/50 font-serif">
                  *Pagamento único, sem mensalidades. Acesso vitalício para sempre.
                </p>
              </div>

              <button
                id="buy-premium-button"
                onClick={handleSimulatePurchase}
                disabled={isCheckingOut}
                className="w-full h-12 bg-[#d4af37] hover:bg-[#c19d2f] text-[#231209] font-display font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.01] active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isCheckingOut ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-[#231209]/20 border-t-[#231209] animate-spin" />
                    <span>Processando Apoio...</span>
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4 fill-current" />
                    <span>Apoiar e Adquirir Premium</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-[9px] text-amber-200/40 font-mono flex items-center justify-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                Sua compra apoia servidores, banco de dados e atualizações diárias.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
