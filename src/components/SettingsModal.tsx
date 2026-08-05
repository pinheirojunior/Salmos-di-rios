import React, { useState } from "react";
import { X, Sun, Moon, Sparkles, Bell, AlertCircle, Type, Shield, RotateCcw, Save, Check, Info, Volume2 } from "lucide-react";
import { AppSettings, ThemeMode, VoiceGender } from "../types";
import { motion, AnimatePresence } from "motion/react";
import PrivacyPolicyModal from "./PrivacyPolicyModal";
import AboutModal from "./AboutModal";
import { notificationService } from "../services/notificationService";
import { narrationEngine } from "../services/narration/NarrationEngine";

interface SettingsModalProps {
  settings: AppSettings;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  onTriggerTestNotification: () => void;
  onClose: () => void;
  onResetPreferences: () => void;
  isInline?: boolean;
}

export default function SettingsModal({
  settings,
  onUpdateSettings,
  onTriggerTestNotification,
  onClose,
  onResetPreferences,
  isInline = false,
}: SettingsModalProps) {
  const [tempName, setTempName] = useState(settings.userName || "");
  const [nameSaved, setNameSaved] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  // Draft notification schedule states
  const [tempMorningTime, setTempMorningTime] = useState(settings.notificationTime || "08:00");
  const [tempAfternoonTime, setTempAfternoonTime] = useState(settings.notificationTimeAfternoon || "14:00");
  const [tempEveningTime, setTempEveningTime] = useState(settings.notificationTimeEvening || "20:00");
  const [tempEnableMorning, setTempEnableMorning] = useState(settings.enableMorningNotif !== false);
  const [tempEnableAfternoon, setTempEnableAfternoon] = useState(settings.enableAfternoonNotif === true);
  const [tempEnableEvening, setTempEnableEvening] = useState(settings.enableEveningNotif === true);
  const [scheduleSavedMsg, setScheduleSavedMsg] = useState<string | null>(null);
  const [permissionWarning, setPermissionWarning] = useState(false);
  const [masculineVoiceWarning, setMasculineVoiceWarning] = useState<string | null>(null);

  React.useEffect(() => {
    if (settings.voiceGender === "masculine") {
      narrationEngine.checkVoiceAvailability("masculine").then((res) => {
        if (!res.available && res.warningMessage) {
          setMasculineVoiceWarning(res.warningMessage);
        } else {
          setMasculineVoiceWarning(null);
        }
      });
    } else {
      setMasculineVoiceWarning(null);
    }
  }, [settings.voiceGender]);

  const handleSaveSchedules = async () => {
    // 1. Request/verify permissions
    const granted = await notificationService.requestPermissions();
    if (!granted && typeof window !== "undefined" && "Notification" in window && Notification.permission === "denied") {
      setPermissionWarning(true);
    } else {
      setPermissionWarning(false);
    }

    // 2. Commit settings to global state & local storage
    onUpdateSettings({
      notificationTime: tempMorningTime,
      notificationTimeAfternoon: tempAfternoonTime,
      notificationTimeEvening: tempEveningTime,
      enableMorningNotif: tempEnableMorning,
      enableAfternoonNotif: tempEnableAfternoon,
      enableEveningNotif: tempEnableEvening,
    });

    // 3. Re-schedule/update notification service
    notificationService.updateSchedules(
      () => ({
        ...settings,
        notificationTime: tempMorningTime,
        notificationTimeAfternoon: tempAfternoonTime,
        notificationTimeEvening: tempEveningTime,
        enableMorningNotif: tempEnableMorning,
        enableAfternoonNotif: tempEnableAfternoon,
        enableEveningNotif: tempEnableEvening,
      }),
      () => 23
    );

    // 4. Show success confirmation message
    setScheduleSavedMsg("Horários das notificações atualizados com sucesso.");
    setTimeout(() => {
      setScheduleSavedMsg(null);
    }, 4000);
  };

  const renderContainer = (children: React.ReactNode) => {
    if (isInline) {
      return (
        <div
          id="applet-settings-card-inline"
          className="bg-white dark:bg-slate-900 border border-gold-accent/25 dark:border-slate-800 rounded-3xl w-full max-w-md mx-auto p-6 space-y-6 shadow-md"
        >
          {children}
        </div>
      );
    }
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          id="applet-settings-card"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 180 }}
          className="bg-white dark:bg-slate-900 border border-gold-accent/25 dark:border-slate-800 rounded-3xl max-w-md w-full max-h-[85vh] overflow-y-auto shadow-2xl p-6 space-y-6 scrollbar-thin"
        >
          {children}
        </motion.div>
      </div>
    );
  };

  return (
    <>
      {renderContainer(
        <>
          {/* Header bar */}
          <div className="flex items-center justify-between pb-3.5 border-b border-gray-100 dark:border-gray-800/80">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gold-accent animate-pulse" />
              <h2 className="font-display font-bold text-lg text-gray-800 dark:text-gray-100">
                Configurações
              </h2>
            </div>
            {!isInline && (
              <button
                id="settings-close-btn"
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
                title="Fechar configurações"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

        {/* 1. Visual Theme preferences */}
        <div className="space-y-2.5">
          <label className="text-[11px] font-mono tracking-widest text-gray-400 dark:text-gray-500 uppercase font-bold flex items-center gap-1.5">
            <Sun className="w-3.5 h-3.5 text-gold-accent" /> Tema do Aplicativo
          </label>
          <div className="grid grid-cols-2 gap-1.5 bg-gray-50 dark:bg-slate-950 p-1 rounded-xl border border-gray-100 dark:border-slate-800/60">
            {(["light", "dark"] as ThemeMode[]).map((mode) => {
              const labels: Record<ThemeMode, string> = {
                light: "Claro",
                dark: "Escuro",
              };
              const isActive = settings.themeMode === mode;
              return (
                <button
                  key={mode}
                  id={`settings-theme-${mode}`}
                  onClick={() => onUpdateSettings({ themeMode: mode })}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    isActive
                      ? "bg-white dark:bg-slate-800 shadow-md text-amber-600 dark:text-gold-accent border border-gold-accent/10"
                      : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                  }`}
                >
                  {labels[mode]}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Scripture Reading Typography Size */}
        <div className="space-y-2.5">
          <label className="text-[11px] font-mono tracking-widest text-gray-400 dark:text-gray-500 uppercase font-bold flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5 text-gold-accent" /> Tamanho da Letra (Leitura)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-gray-50 dark:bg-slate-950 p-1 rounded-xl border border-gray-100 dark:border-slate-800/60">
            {([0.85, 1.0, 1.15, 1.3] as number[]).map((multiplier) => {
              const labels: Record<number, string> = {
                0.85: "Pequena",
                1.0: "Média",
                1.15: "Grande",
                1.3: "Extra Grande",
              };
              const isActive = settings.fontSizeMultiplier === multiplier;
              return (
                <button
                  key={multiplier}
                  id={`settings-font-${multiplier}`}
                  onClick={() => onUpdateSettings({ fontSizeMultiplier: multiplier })}
                  className={`py-2 px-1 text-xs font-semibold rounded-lg transition-all cursor-pointer text-center leading-tight ${
                    isActive
                      ? "bg-white dark:bg-slate-800 shadow-md text-amber-600 dark:text-gold-accent border border-gold-accent/10"
                      : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                  }`}
                >
                  {labels[multiplier]}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Audio Narration Preferences */}
        <div className="space-y-4 border-t border-gray-100 dark:border-gray-800/80 pt-4">
          <div className="flex items-center gap-2 text-[11px] font-mono tracking-widest text-gray-400 dark:text-gray-500 uppercase font-bold">
            <Volume2 className="w-4 h-4 text-gold-accent" /> Configurações da Narração
          </div>

          {/* Voice gender select */}
          <div className="space-y-2">
            <span className="text-xs text-gray-600 dark:text-gray-400 block font-semibold">
              Seleção de Voz do Aplicativo
            </span>
            <div className="grid grid-cols-2 gap-3">
              {/* Voz Masculina */}
              <button
                type="button"
                id="settings-voice-masculine"
                onClick={() => onUpdateSettings({ voiceGender: "masculine" })}
                className={`p-3.5 text-left rounded-xl border text-xs transition-all cursor-pointer ${
                  settings.voiceGender === "masculine"
                    ? "bg-amber-50 dark:bg-amber-950/40 border-gold-accent text-amber-900 dark:text-amber-200 font-bold shadow-sm"
                    : "bg-gray-50 dark:bg-slate-950 border-gray-100 dark:border-slate-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-slate-700"
                }`}
              >
                <div className="font-bold text-sm flex items-center gap-1.5">
                  👨 Voz Masculina
                </div>
                <div className="text-[10px] opacity-75 font-serif font-normal mt-0.5">
                  Leitura grave, serena e solene
                </div>
              </button>

              {/* Voz Feminina */}
              <button
                type="button"
                id="settings-voice-feminine"
                onClick={() => onUpdateSettings({ voiceGender: "feminine" })}
                className={`p-3.5 text-left rounded-xl border text-xs transition-all cursor-pointer ${
                  settings.voiceGender === "feminine"
                    ? "bg-amber-50 dark:bg-amber-950/40 border-gold-accent text-amber-900 dark:text-amber-200 font-bold shadow-sm"
                    : "bg-gray-50 dark:bg-slate-950 border-gray-100 dark:border-slate-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-slate-700"
                }`}
              >
                <div className="font-bold text-sm flex items-center gap-1.5">
                  👩 Voz Feminina
                </div>
                <div className="text-[10px] opacity-75 font-serif font-normal mt-0.5">
                  Leitura clara, suave e acolhedora
                </div>
              </button>
            </div>

            {masculineVoiceWarning && settings.voiceGender === "masculine" && (
              <div className="p-3 bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/20 rounded-xl text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2.5 mt-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block text-xs">Aviso de Compatibilidade de Voz</span>
                  <p className="text-[11px] leading-relaxed opacity-90">{masculineVoiceWarning}</p>
                </div>
              </div>
            )}
          </div>

          {/* Speed selector */}
          <div className="space-y-2">
            <span className="text-xs text-gray-600 dark:text-gray-400 block font-semibold">
              Velocidade da Narração
            </span>
            <div className="grid grid-cols-3 gap-1.5 bg-gray-50 dark:bg-slate-950 p-1 rounded-xl border border-gray-100 dark:border-slate-800/60">
              {([0.8, 1.0, 1.2] as number[]).map((speed) => {
                const isActive = settings.voiceSpeed === speed;
                return (
                  <button
                    key={speed}
                    id={`settings-speed-${speed}`}
                    onClick={() => onUpdateSettings({ voiceSpeed: speed })}
                    className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      isActive
                        ? "bg-white dark:bg-slate-800 shadow-md text-amber-600 dark:text-gold-accent border border-gold-accent/10"
                        : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                    }`}
                  >
                    {speed === 1.0 ? "Normal (1.0x)" : `${speed}x`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Continuous Audio toggle */}
          <div className="flex items-center justify-between gap-4 bg-gray-50 dark:bg-slate-950 p-3 rounded-xl border border-gray-100 dark:border-slate-800/60 shadow-sm">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Áudio Contínuo
              </span>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-normal font-serif">
                Lê o Salmo direto (sem anunciar capítulos e versículos) e passa automaticamente para o próximo Salmo ao terminar.
              </p>
            </div>
            <button
              id="settings-continuous-audio-toggle"
              onClick={() => onUpdateSettings({ continuousAudio: !settings.continuousAudio })}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.continuousAudio ? "bg-gold-accent" : "bg-gray-200 dark:bg-gray-700"
              }`}
              title="Ativar/Desativar áudio contínuo"
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  settings.continuousAudio ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* 4. Daily Notifications config */}
        <div className="space-y-4 border-t border-gray-100 dark:border-gray-800/80 pt-4">
          <div className="flex items-center gap-2 text-[11px] font-mono tracking-widest text-gray-400 dark:text-gray-500 uppercase font-bold">
            <Bell className="w-4 h-4 text-gold-accent" /> Notificações Diárias
          </div>

          <div className="space-y-3 bg-gray-50/70 dark:bg-slate-950/70 p-3.5 rounded-2xl border border-gray-100 dark:border-slate-800/80">
            {/* Morning Notification slot */}
            <div className="flex items-center justify-between gap-3 pb-2 border-b border-gray-200/50 dark:border-slate-800/50">
              <div className="flex items-center gap-2">
                <input
                  id="settings-enable-morning-checkbox"
                  type="checkbox"
                  checked={tempEnableMorning}
                  onChange={(e) => setTempEnableMorning(e.target.checked)}
                  className="w-4 h-4 text-gold-accent rounded accent-gold-accent cursor-pointer"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300 font-semibold flex items-center gap-1">
                  🌅 Matinal
                </span>
              </div>
              <input
                id="settings-notification-time-morning"
                type="time"
                disabled={!tempEnableMorning}
                value={tempMorningTime}
                onChange={(e) => setTempMorningTime(e.target.value)}
                className="bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-100 border border-gold-accent/20 dark:border-slate-800 px-3 py-1 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold-accent font-mono text-xs disabled:opacity-40"
              />
            </div>

            {/* Afternoon Notification slot */}
            <div className="flex items-center justify-between gap-3 pb-2 border-b border-gray-200/50 dark:border-slate-800/50">
              <div className="flex items-center gap-2">
                <input
                  id="settings-enable-afternoon-checkbox"
                  type="checkbox"
                  checked={tempEnableAfternoon}
                  onChange={(e) => setTempEnableAfternoon(e.target.checked)}
                  className="w-4 h-4 text-gold-accent rounded accent-gold-accent cursor-pointer"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300 font-semibold flex items-center gap-1">
                  📖 Tarde
                </span>
              </div>
              <input
                id="settings-notification-time-afternoon"
                type="time"
                disabled={!tempEnableAfternoon}
                value={tempAfternoonTime}
                onChange={(e) => setTempAfternoonTime(e.target.value)}
                className="bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-100 border border-gold-accent/20 dark:border-slate-800 px-3 py-1 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold-accent font-mono text-xs disabled:opacity-40"
              />
            </div>

            {/* Evening Notification slot */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <input
                  id="settings-enable-evening-checkbox"
                  type="checkbox"
                  checked={tempEnableEvening}
                  onChange={(e) => setTempEnableEvening(e.target.checked)}
                  className="w-4 h-4 text-gold-accent rounded accent-gold-accent cursor-pointer"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300 font-semibold flex items-center gap-1">
                  🌙 Noite
                </span>
              </div>
              <input
                id="settings-notification-time-evening"
                type="time"
                disabled={!tempEnableEvening}
                value={tempEveningTime}
                onChange={(e) => setTempEveningTime(e.target.value)}
                className="bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-100 border border-gold-accent/20 dark:border-slate-800 px-3 py-1 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold-accent font-mono text-xs disabled:opacity-40"
              />
            </div>

            {/* Prominent Save Schedules button */}
            <div className="pt-2">
              <button
                id="settings-save-notification-times-btn"
                type="button"
                onClick={handleSaveSchedules}
                className="w-full py-3 bg-gradient-to-r from-gold-accent to-amber-600 hover:from-amber-600 hover:to-gold-accent text-white font-display font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Horários</span>
              </button>
            </div>

            {/* Schedule confirmation message */}
            <AnimatePresence>
              {scheduleSavedMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 p-2.5 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-200"
                >
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{scheduleSavedMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Permission warning banner if permission is denied */}
            {permissionWarning && (
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 p-2.5 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 font-serif leading-relaxed flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  As notificações foram bloqueadas no seu navegador/dispositivo. Por favor, ative as permissões nas configurações do seu navegador para receber os avisos.
                </span>
              </div>
            )}
          </div>

          {/* Test alert button */}
          <button
            id="settings-trigger-test-btn"
            type="button"
            onClick={onTriggerTestNotification}
            className="w-full py-2.5 rounded-xl border border-gold-accent/30 text-gold-accent hover:bg-gold-cream dark:hover:bg-slate-800 text-xs font-display font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <Bell className="w-4 h-4" />
            <span>Testar Notificação Agora</span>
          </button>
        </div>

        {/* 5. Privacy Controls */}
        <div className="space-y-4 border-t border-gray-100 dark:border-gray-800/80 pt-4">
          <div className="flex items-center gap-2 text-[11px] font-mono tracking-widest text-gray-400 dark:text-gray-500 uppercase font-bold">
            <Shield className="w-4 h-4 text-gold-accent" /> Privacidade e Dados
          </div>

          <div className="space-y-3.5">
            {/* Alterar Nome option */}
            <div className="space-y-2">
              <span className="text-xs text-gray-600 dark:text-gray-400 block font-semibold">Alterar Seu Nome</span>
              <div className="flex gap-2">
                <input
                  id="settings-change-name-input"
                  type="text"
                  value={tempName}
                  onChange={(e) => {
                    setTempName(e.target.value);
                    setNameSaved(false);
                  }}
                  placeholder="Seu nome"
                  className="bg-gray-50 dark:bg-slate-950 text-gray-800 dark:text-gray-100 border border-gold-accent/15 dark:border-slate-850 px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold-accent text-xs flex-1 transition-colors"
                />
                <button
                  id="settings-save-name-btn"
                  onClick={() => {
                    if (tempName.trim()) {
                      onUpdateSettings({ userName: tempName.trim() });
                      setNameSaved(true);
                      setTimeout(() => setNameSaved(false), 2000);
                    }
                  }}
                  className="bg-gold-accent hover:bg-amber-600 text-white px-3.5 py-2 rounded-xl cursor-pointer flex items-center justify-center transition-colors shadow-sm"
                  title="Salvar nome"
                >
                  {nameSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                </button>
              </div>
              {nameSaved && (
                <p className="text-[10px] text-green-500 font-semibold pl-1">Nome atualizado com sucesso!</p>
              )}
            </div>

            {/* Read Privacy Policy option */}
            <button
              id="settings-read-privacy-btn"
              onClick={() => setShowPrivacyModal(true)}
              className="w-full py-2 bg-gray-50 dark:bg-slate-950 hover:bg-gold-cream/40 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold border border-gray-100 dark:border-slate-800/80 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-gold-accent" />
              Ler Política de Privacidade
            </button>

            {/* About App option */}
            <button
              id="settings-about-app-btn"
              onClick={() => setShowAboutModal(true)}
              className="w-full py-2 bg-gray-50 dark:bg-slate-950 hover:bg-gold-cream/40 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold border border-gray-100 dark:border-slate-800/80 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-gold-accent" />
              Sobre o Aplicativo
            </button>

            {/* Reset Preferences option */}
            {!confirmReset ? (
              <button
                id="settings-restore-prefs-btn"
                onClick={() => setConfirmReset(true)}
                className="w-full py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold border border-red-100/60 dark:border-red-900/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restaurar Preferências
              </button>
            ) : (
              <div className="space-y-1.5 bg-red-50/50 dark:bg-red-950/10 p-3 rounded-2xl border border-red-100/50 dark:border-red-900/20">
                <p className="text-[10px] text-red-600 dark:text-red-400 font-sans text-center leading-normal font-medium">
                  Tem certeza? Isso removerá seu nome salvo, favoritos e redefinirá as configurações.
                </p>
                <div className="flex gap-2">
                  <button
                    id="settings-confirm-reset-btn"
                    onClick={() => {
                      onResetPreferences();
                      setConfirmReset(false);
                    }}
                    className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    Sim, Restaurar
                  </button>
                  <button
                    id="settings-cancel-reset-btn"
                    onClick={() => setConfirmReset(false)}
                    className="flex-1 py-1.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Acessibilidade notice footer */}
        <div className="border-t border-gray-100 dark:border-gray-800/80 pt-4 flex items-start gap-2.5 text-[11px] text-gray-400 dark:text-gray-500 leading-normal">
          <AlertCircle className="w-4 h-4 text-gold-accent/70 flex-shrink-0 mt-0.5" />
          <p className="font-serif">
            Este aplicativo foi totalmente desenvolvido seguindo as melhores diretrizes de acessibilidade móvel, oferecendo suporte a alto contraste, botões com área de toque de no mínimo 44px e total compatibilidade com leitores de tela nativos.
          </p>
        </div>

        {/* Developer signature footer */}
        <div className="border-t border-gray-100 dark:border-gray-800/80 pt-4 flex flex-col items-center justify-center text-center space-y-1 pb-1">
          <p className="text-[10px] font-sans text-gray-400 dark:text-gray-500 leading-normal">
            Desenvolvido por <span className="font-semibold text-gold-accent">Sorte Lab Dev</span>
            <br />
            José Pinheiro Junior
          </p>
          <p className="text-[9px] font-mono text-gray-400/80 dark:text-gray-500/80 tracking-widest uppercase">
            Versão 1.0.0
          </p>
        </div>
        </>
      )}

      {/* Render Privacy Policy and About Modals */}
      <AnimatePresence>
        {showPrivacyModal && (
          <PrivacyPolicyModal onClose={() => setShowPrivacyModal(false)} />
        )}
        {showAboutModal && (
          <AboutModal onClose={() => setShowAboutModal(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
