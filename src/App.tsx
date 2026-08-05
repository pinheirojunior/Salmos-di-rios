import React, { useState, useEffect, useRef } from "react";
import { Compass, Heart, Settings, Sparkles, BookOpen, Volume2, Bell, X, LayoutGrid, Book, Crown, Shuffle } from "lucide-react";
import { AppSettings, PlayerState, Psalm, VoiceGender } from "./types";
import { psalmsMetadataList } from "./data/psalmsMetadata";
import allPsalmsData from "./data/allPsalms.json";
import { motion, AnimatePresence } from "motion/react";

// Import modular components
import Catalog from "./components/Catalog";
import DigitalBook from "./components/DigitalBook";
import AudioPlayer from "./components/AudioPlayer";
import ImmersiveReader from "./components/ImmersiveReader";
import SettingsModal from "./components/SettingsModal";
import VoicePrompt from "./components/VoicePrompt";
import Onboarding from "./components/Onboarding";
import PremiumTab from "./components/PremiumTab";
import { SimulatedBannerAd, SimulatedInterstitialAd } from "./components/AdMobAds";
import { narrationEngine } from "./services/narration/NarrationEngine";
import { notificationService, NotificationContent } from "./services/notificationService";
import { storageService } from "./services/storageService";
import { appLifecycleService } from "./services/appLifecycleService";
import { shareContent } from "./utils/shareUtils";

interface DailyPsalmState {
  currentDailyPsalm: number;
  lastSelectedDate: string; // "YYYY-MM-DD"
  history: number[];
  currentCycleSequence: number[];
}

const shuffleArray = (array: number[]): number[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const getOrGenerateDailyPsalmState = (): DailyPsalmState => {
  const defaultSequence = Array.from({ length: 150 }, (_, i) => i + 1);
  const todayStr = new Date().toLocaleDateString("sv"); // YYYY-MM-DD
  
  const generateNewState = (): DailyPsalmState => {
    const sequence = shuffleArray(defaultSequence);
    const firstPsalm = sequence[0];
    return {
      currentDailyPsalm: firstPsalm,
      lastSelectedDate: todayStr,
      history: [firstPsalm],
      currentCycleSequence: sequence,
    };
  };

  if (typeof window === "undefined") {
    return generateNewState();
  }

  const saved = localStorage.getItem("salmo_dia_daily_state_v3");
  if (saved) {
    try {
      const state = JSON.parse(saved) as DailyPsalmState;
      if (
        state &&
        typeof state.currentDailyPsalm === "number" &&
        state.lastSelectedDate &&
        Array.isArray(state.history) &&
        Array.isArray(state.currentCycleSequence) &&
        state.currentCycleSequence.length === 150
      ) {
        // Strict verification: ensure both sequence and history contain only numbers from 1 to 150 and are unique
        const isSequenceValid = new Set(state.currentCycleSequence).size === 150 && 
                                state.currentCycleSequence.every(n => n >= 1 && n <= 150);
        
        const isHistoryValid = state.history.every(n => n >= 1 && n <= 150) && 
                               new Set(state.history).size === state.history.length;

        if (isSequenceValid && isHistoryValid) {
          if (state.lastSelectedDate === todayStr) {
            return state;
          }

          // New day! Let's advance
          let newHistory = [...state.history];
          let newSequence = [...state.currentCycleSequence];

          if (newHistory.length >= 150) {
            newHistory = [];
            newSequence = shuffleArray(defaultSequence);
          }

          let nextPsalm = newSequence.find(p => !newHistory.includes(p));
          if (!nextPsalm) {
            newHistory = [];
            newSequence = shuffleArray(defaultSequence);
            nextPsalm = newSequence[0];
          }

          newHistory.push(nextPsalm);

          const updatedState: DailyPsalmState = {
            currentDailyPsalm: nextPsalm,
            lastSelectedDate: todayStr,
            history: newHistory,
            currentCycleSequence: newSequence,
          };

          localStorage.setItem("salmo_dia_daily_state_v3", JSON.stringify(updatedState));
          return updatedState;
        }
      }
    } catch (e) {
      console.error("Error reading daily Psalm state, resetting:", e);
    }
  }

  // Fallback migration check from old state
  const oldSaved = localStorage.getItem("salmo_dia_daily_state");
  if (oldSaved) {
    try {
      const state = JSON.parse(oldSaved) as DailyPsalmState;
      if (
        state &&
        typeof state.currentDailyPsalm === "number" &&
        state.lastSelectedDate &&
        Array.isArray(state.history) &&
        Array.isArray(state.currentCycleSequence) &&
        state.currentCycleSequence.length === 150
      ) {
        const isSequenceValid = new Set(state.currentCycleSequence).size === 150 && 
                                state.currentCycleSequence.every(n => n >= 1 && n <= 150);
        const isHistoryValid = state.history.every(n => n >= 1 && n <= 150) && 
                               new Set(state.history).size === state.history.length;
        
        if (isSequenceValid && isHistoryValid) {
          localStorage.setItem("salmo_dia_daily_state_v3", oldSaved);
          localStorage.removeItem("salmo_dia_daily_state");
          return getOrGenerateDailyPsalmState();
        }
      }
    } catch (_) {}
  }

  // First run
  const newState = generateNewState();
  localStorage.setItem("salmo_dia_daily_state_v3", JSON.stringify(newState));
  return newState;
};

const defaultSettings: AppSettings = {
  themeMode: "light",
  voiceGender: "feminine",
  voiceSpeed: 1.0,
  fontSizeMultiplier: 1.0,
  notificationTime: "08:00",
  notificationTimeAfternoon: "14:00",
  notificationTimeEvening: "20:00",
  enableMorningNotif: true,
  enableAfternoonNotif: false,
  enableEveningNotif: false,
  hasSetupVoice: false,
  continuousAudio: false,
  userName: undefined,
  hasAcceptedPrivacy: false,
  isPremium: false,
};

export default function App() {
  // Local Settings & Favorites persistent storage
  const [settings, setSettings] = useState<AppSettings>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("salmo_dia_settings");
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { console.error(e); }
      }
    }
    return defaultSettings;
  });

  const [favorites, setFavorites] = useState<number[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("salmo_dia_favorites");
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { console.error(e); }
      }
    }
    return [23, 91, 121]; // default starting favorites
  });

  // Client-side local cache to make loading of previously fetched Psalms instant (0ms)
  const [clientPsalmCache, setClientPsalmCache] = useState<Record<number, Psalm>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("salmo_dia_contents_cache_v5");
        return saved ? JSON.parse(saved) : {};
      } catch (e) {
        console.warn("Could not load local psalm cache", e);
      }
    }
    return {};
  });

  const savePsalmToClientCache = (number: number, psalm: Psalm) => {
    setClientPsalmCache(prev => {
      const updated = { ...prev, [number]: psalm };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("salmo_dia_contents_cache_v5", JSON.stringify(updated));
        } catch (e) {
          console.warn("Storage quota exceeded or error writing cache:", e);
        }
      }
      return updated;
    });
  };

  const [activeTab, setActiveTab] = useState<"inicio" | "salmos" | "favoritos" | "configuracoes" | "premium">("inicio");
  const [dailyPsalmState, setDailyPsalmState] = useState<DailyPsalmState>(() => {
    return getOrGenerateDailyPsalmState();
  });

  useEffect(() => {
    const checkDailyPsalm = () => {
      const freshState = getOrGenerateDailyPsalmState();
      setDailyPsalmState(freshState);
    };

    checkDailyPsalm();

    // Check every minute in case the app is left open overnight
    const interval = setInterval(checkDailyPsalm, 60000);
    return () => clearInterval(interval);
  }, []);

  const [selectedPsalm, setSelectedPsalm] = useState<Psalm | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [catalogLayout, setCatalogLayout] = useState<"grid" | "book">("book");

  // AdMob tracking states
  const appStartTime = useRef(Date.now());
  const [actionCount, setActionCount] = useState(0);
  const [lastAdShownTime, setLastAdShownTime] = useState(0);
  const [showInterstitial, setShowInterstitial] = useState(false);

  const incrementActionCount = () => {
    if (settings.isPremium) return;
    setActionCount(prev => {
      const next = prev + 1;
      const now = Date.now();
      const timeSinceStart = now - appStartTime.current;
      
      const minStartDelay = 5 * 60 * 1000; // First ad only after 5 minutes of app usage
      const minIntervalBetweenAds = 5 * 60 * 1000; // 5 minutes cooldown between ads
      
      // Trigger only if we have been active for 5+ minutes and hit intervals of 6 actions
      if (timeSinceStart >= minStartDelay && next % 6 === 0) {
        if (lastAdShownTime === 0 || (now - lastAdShownTime >= minIntervalBetweenAds)) {
          setShowInterstitial(true);
          setLastAdShownTime(now);
        }
      }
      return next;
    });
  };

  // Audio state engine
  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    isPaused: false,
    currentPsalmNumber: null,
    currentVerseIndex: 0,
    totalVerses: 0,
    progress: 0,
  });

  // Subscribe to narration engine updates
  useEffect(() => {
    const unsubscribe = narrationEngine.subscribe((state) => {
      setPlayerState((prev) => ({
        ...prev,
        isPlaying: state.isPlaying,
        isPaused: state.isPaused,
        currentVerseIndex: state.currentVerseIndex,
        totalVerses: state.totalVerses,
        progress: state.progress,
      }));
    });
    return unsubscribe;
  }, []);

  // Sync narration engine options whenever settings change
  useEffect(() => {
    narrationEngine.updateOptions({
      gender: settings.voiceGender,
      speed: settings.voiceSpeed,
      continuousAudio: settings.continuousAudio,
    });
  }, [settings.voiceGender, settings.voiceSpeed, settings.continuousAudio]);

  // Active notification modal/toast state
  const [notificationToast, setNotificationToast] = useState<{
    show: boolean;
    title: string;
    body: string;
    psalmNumber: number;
    timeString: string;
  } | null>(null);

  // Home card displayed psalm number (defaults to daily psalm, can be randomized via "Ver um novo Salmo")
  const [displayedHomePsalmNumber, setDisplayedHomePsalmNumber] = useState<number>(() => dailyPsalmState.currentDailyPsalm);

  // Sync displayed psalm when official daily psalm changes
  useEffect(() => {
    setDisplayedHomePsalmNumber(dailyPsalmState.currentDailyPsalm);
  }, [dailyPsalmState.currentDailyPsalm]);

  // Save configurations to localStorage
  useEffect(() => {
    localStorage.setItem("salmo_dia_settings", JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem("salmo_dia_favorites", JSON.stringify(favorites));
  }, [favorites]);

  // Initialize notification scheduler
  useEffect(() => {
    const settingsRef = { current: settings };
    settingsRef.current = settings;

    notificationService.initScheduler(
      () => settingsRef.current,
      () => dailyPsalmState.currentDailyPsalm,
      (content: NotificationContent) => {
        setNotificationToast({
          show: true,
          title: content.title,
          body: content.body,
          psalmNumber: content.psalmNumber,
          timeString: content.timeString,
        });
      }
    );
  }, [dailyPsalmState.currentDailyPsalm, settings]);

  // Handle URL launch actions from notifications (e.g. ?action=read-daily-psalm)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (
        params.get("action") === "read-daily-psalm" ||
        params.get("source") === "notification"
      ) {
        setActiveTab("inicio");
        const dailyNum = dailyPsalmState.currentDailyPsalm;
        if (dailyNum) {
          fetchPsalmText(dailyNum).then((psalm) => {
            if (psalm) {
              setSelectedPsalm(psalm);
              setIsReaderOpen(true);
            }
          });
        }
      }
    }
  }, [dailyPsalmState.currentDailyPsalm]);

  // Sync theme configurations (Light / Dark mode) & StatusBar
  useEffect(() => {
    const root = document.documentElement;
    if (settings.themeMode === "dark") {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }
    appLifecycleService.updateStatusBar(settings.themeMode);
  }, [settings.themeMode]);

  // Native Android Back Button lifecycle handler
  useEffect(() => {
    appLifecycleService.initNativeLifecycle({
      onBackButton: () => {
        if (showInterstitial) {
          setShowInterstitial(false);
          return true;
        }
        if (isReaderOpen) {
          setIsReaderOpen(false);
          return true;
        }
        if (isSettingsOpen) {
          setIsSettingsOpen(false);
          return true;
        }
        if (notificationToast?.show) {
          setNotificationToast(null);
          return true;
        }
        if (activeTab !== "inicio") {
          setActiveTab("inicio");
          return true;
        }
        return false;
      },
    });
  }, [showInterstitial, isReaderOpen, isSettingsOpen, notificationToast, activeTab]);

  // Sync global font size multiplier to html root
  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = `${settings.fontSizeMultiplier * 100}%`;
    return () => {
      root.style.fontSize = "";
    };
  }, [settings.fontSizeMultiplier]);

  // Calculate greeting message based on local hours and username
  const getGreeting = () => {
    const hours = new Date().getHours();
    let prefix = "Bom dia";
    if (hours >= 12 && hours < 18) prefix = "Boa tarde";
    else if (hours >= 18 || hours < 5) prefix = "Boa noite";
    
    const name = settings.userName || "visitante";
    return `${prefix}, ${name}!`;
  };

  // Get dynamic positive and encouraging message based on the daily psalm number
  const getDailyEncouragement = (psalmNumber: number) => {
    const messages = [
      "Que a Palavra de Deus fortaleça seu coração e guie seus passos com luz hoje.",
      "Encontre paz no silêncio da oração e confie nos planos divinos para o seu dia.",
      "A graça e a misericórdia de Deus renovam suas forças a cada novo amanhecer.",
      "Abra seu coração para o amor divino e sinta o cuidado de Deus em cada pequeno detalhe.",
      "Que a esperança ilumine seu caminho e afaste toda a ansiedade do seu coração.",
      "Deus é o seu refúgio e fortaleza; descanse sob a sombra de Sua proteção.",
      "Que o dia de hoje seja repleto de bênçãos, gratidão e profunda paz espiritual.",
      "A sabedoria do Senhor é o escudo que protege e orienta o seu caminhar.",
      "Cultive a fé em seu coração e assista as bênçãos florescerem em sua vida.",
      "Sinta o sopro de paz do Altíssimo acalmar a sua alma neste novo dia.",
      "Com Deus ao seu lado, nenhuma tempestade poderá abalar a sua fé e perseverança.",
      "Que sua jornada de hoje seja guardada pelo amor celestial e conduzida pela harmonia."
    ];
    const index = (psalmNumber || 1) % messages.length;
    return messages[index];
  };

  const dailyPsalmNumber = dailyPsalmState.currentDailyPsalm;
  const dailyPsalmMetadata = psalmsMetadataList[dailyPsalmNumber - 1];
  const displayedHomePsalmMetadata = psalmsMetadataList[displayedHomePsalmNumber - 1];

  // Load selected Psalm from Express Backend API (utilizing client-side memory + storage cache)
  const fetchPsalmText = async (number: number, silent = false) => {
    // 1. Prioritize offline static local database for instant (0ms) load and 100% offline access
    const staticPsalm = (allPsalmsData as Record<string, Psalm>)[String(number)];
    if (staticPsalm) {
      return staticPsalm;
    }

    // 2. Fallback to runtime memory cache
    if (clientPsalmCache[number] && clientPsalmCache[number].number === number) {
      return clientPsalmCache[number];
    }

    if (!silent) setIsLoading(true);
    try {
      const response = await fetch(`/api/psalm/${number}`);
      if (response.ok) {
        const data = await response.json();
        const psalm = data as Psalm;
        
        // 2. Cache in state and localStorage
        savePsalmToClientCache(number, psalm);
        return psalm;
      } else {
        console.error("API error loading Psalm");
      }
    } catch (err) {
      console.error("Network error loading Psalm:", err);
    } finally {
      if (!silent) setIsLoading(false);
    }
    return null;
  };

  // Automated background pre-loader (eagerly fetches Daily Psalm, Favorites, and Famous Psalms)
  useEffect(() => {
    const prefetchImportantPsalms = async () => {
      // 1. Prefetch daily psalm (highly likely to be read or played)
      if (dailyPsalmNumber) {
        await fetchPsalmText(dailyPsalmNumber, true);
      }

      // 2. Prefetch first few favorites
      for (const favNum of favorites.slice(0, 5)) {
        await fetchPsalmText(favNum, true);
      }

      // 3. Prefetch famous popular psalms
      const popular = [1, 23, 91, 121];
      for (const popNum of popular) {
        await fetchPsalmText(popNum, true);
      }
    };

    // Delay slightly to keep initial mount perfectly smooth
    const timer = setTimeout(() => {
      prefetchImportantPsalms();
    }, 1500);

    return () => clearTimeout(timer);
  }, [dailyPsalmNumber, favorites]);

  const handleOpenPsalmReader = async (number: number) => {
    const psalm = await fetchPsalmText(number);
    if (psalm) {
      setSelectedPsalm(psalm);
      setIsReaderOpen(true);
      incrementActionCount();
    }
  };

  const handleStartPsalmAudio = (number: number, verseIndex = 0, isSingleVerseMode = false) => {
    const startAudioWithPsalm = (psalm: Psalm) => {
      setSelectedPsalm(psalm);
      setPlayerState((prev) => ({
        ...prev,
        currentPsalmNumber: number,
        currentVerseIndex: verseIndex,
        isSingleVerseMode: !!isSingleVerseMode,
      }));

      if (isSingleVerseMode) {
        narrationEngine.startSingleVerse(psalm, verseIndex, {
          gender: settings.voiceGender,
          speed: settings.voiceSpeed,
          continuousAudio: settings.continuousAudio,
        });
      } else {
        narrationEngine.start(
          psalm,
          verseIndex,
          {
            gender: settings.voiceGender,
            speed: settings.voiceSpeed,
            continuousAudio: settings.continuousAudio,
          },
          () => {
            if (narrationEngine.getOptions().continuousAudio && number < 150) {
              handleStartPsalmAudio(number + 1, 0, false);
            }
          }
        );
      }
      incrementActionCount();
    };

    const staticPsalm = (allPsalmsData as Record<string, Psalm>)[String(number)];
    if (staticPsalm) {
      startAudioWithPsalm(staticPsalm);
    } else {
      fetchPsalmText(number).then((psalm) => {
        if (psalm) {
          startAudioWithPsalm(psalm);
        }
      });
    }
  };

  const handleSetupVoice = (gender: VoiceGender) => {
    setSettings((prev) => ({
      ...prev,
      voiceGender: gender,
      hasSetupVoice: true,
    }));
    narrationEngine.updateOptions({
      gender,
      speed: settings.voiceSpeed,
      continuousAudio: settings.continuousAudio,
    });
  };

  // Toggle favorite Psalm from any card or list
  const handleToggleFavorite = (number: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // Avoid opening the reader when clicking heart icon
    }
    setFavorites(prev =>
      prev.includes(number) ? prev.filter(n => n !== number) : [...prev, number]
    );
  };

  // Share Psalm text & link
  const handleSharePsalm = async (psalmNumber: number) => {
    const metadata = psalmsMetadataList[psalmNumber - 1];
    const title = metadata?.title || `Salmo ${psalmNumber}`;
    const preview = metadata?.preview || "";
    const shareText = `${title}\n\n"${preview}"\n\nLido no aplicativo Salmos Diários - Fé e Oração`;

    const result = await shareContent(title, shareText);
    if (result.copied) {
      setNotificationToast({
        show: true,
        title: "Copiado com Sucesso! 📋",
        body: "O texto do Salmo foi copiado para sua área de transferência.",
        psalmNumber,
        timeString: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      });
    }
  };

  const handleResetPreferences = () => {
    setSettings({
      ...defaultSettings,
      userName: undefined,
      hasAcceptedPrivacy: false,
      isPremium: false,
    });
    setFavorites([23, 91, 121]);
    setActiveTab("inicio");
    setIsSettingsOpen(false);
    
    localStorage.removeItem("salmo_dia_settings");
    localStorage.removeItem("salmo_dia_favorites");
    localStorage.removeItem("salmo_dia_daily_state");
    
    // Regenerate daily Psalm state
    const defaultSequence = Array.from({ length: 150 }, (_, i) => i + 1);
    const initialShuffled = shuffleArray(defaultSequence);
    const todayStr = new Date().toLocaleDateString("sv");
    const freshState = {
      currentDailyPsalm: initialShuffled[0],
      lastSelectedDate: todayStr,
      history: [initialShuffled[0]],
      currentCycleSequence: initialShuffled,
    };
    localStorage.setItem("salmo_dia_daily_state", JSON.stringify(freshState));
    setDailyPsalmState(freshState);
  };

  // Trigger test notification
  const handleTriggerTestNotification = () => {
    setIsSettingsOpen(false); // Close settings panel if open
    setActiveTab("inicio");   // Ensure we are on main screen
    notificationService.triggerTestNotification(
      settings.userName,
      dailyPsalmNumber,
      (content: NotificationContent) => {
        setNotificationToast({
          show: true,
          title: content.title,
          body: content.body,
          psalmNumber: content.psalmNumber,
          timeString: content.timeString,
        });
      }
    );
  };

  // Select a new random psalm without changing the official daily psalm
  const handleSelectRandomPsalm = () => {
    let nextNum = Math.floor(Math.random() * 150) + 1;
    if (nextNum === displayedHomePsalmNumber) {
      nextNum = (nextNum % 150) + 1;
    }
    setDisplayedHomePsalmNumber(nextNum);
    fetchPsalmText(nextNum, true);
  };

  const handleUpdateSettings = (updated: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updated }));
  };

  // Load Favorite Psalms Metadata list
  const favoritePsalmsMetadata = psalmsMetadataList.filter(p => favorites.includes(p.number));

  return (
    <div className="min-h-screen bg-gold-cream dark:bg-slate-950 text-gray-800 dark:text-gray-100 flex flex-col justify-between transition-colors duration-300 pb-36 select-none">
      
      {/* 2. MAIN PAGE SCROLL CONTENT VIEW */}
      <main className="relative max-w-2xl mx-auto w-full px-5 py-6 flex-1 flex flex-col justify-start">
        
        {/* Clean floating settings toggle button */}
        <div className="absolute top-5 right-5 z-30">
          <button
            id="header-settings-toggle"
            onClick={() => setActiveTab("configuracoes")}
            className="p-2.5 rounded-full bg-white/60 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900 text-gray-500 hover:text-gold-accent dark:hover:text-gold-accent backdrop-blur-md transition-all cursor-pointer border border-gold-accent/10 dark:border-gray-800/50 shadow-sm"
            title="Abrir Configurações"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
        
        {/* Tab Selection Navigation */}
        <AnimatePresence mode="wait">
          {activeTab === "inicio" && (
            <motion.div
              key="inicio-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 flex flex-col"
            >
              {/* Daily greeting segment */}
              <div className="space-y-1 py-1 pr-14">
                <span className="text-xs font-mono uppercase tracking-widest text-gold-accent font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Salmos Diários
                </span>
                <h1 className="font-display font-bold text-3xl tracking-tight text-gray-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                  <span>{getGreeting()}</span>
                  {settings.isPremium && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-mono uppercase tracking-wider text-amber-600 dark:text-gold-accent bg-amber-50 dark:bg-slate-800 border border-gold-accent/30 rounded-full px-2 py-0.5 animate-pulse">
                      <Crown className="w-3 h-3 fill-current text-gold-accent" /> Premium
                    </span>
                  )}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-serif leading-relaxed italic">
                  "{getDailyEncouragement(displayedHomePsalmNumber)}"
                </p>
              </div>

              {/* CENTRAL EXQUISITE GLOWING DAILY CARD */}
              <div
                id="home-daily-psalm-card"
                className="relative overflow-hidden bg-gradient-to-br from-white via-amber-50/20 to-white dark:from-slate-900 dark:via-slate-900/40 dark:to-slate-900 border-2 border-gold-accent/30 dark:border-gold-accent/15 rounded-3xl p-6 sm:p-8 shadow-xl hover:shadow-2xl hover:border-gold-accent/50 dark:hover:border-gold-accent/30 transition-all duration-300 group"
              >
                {/* Glowing ambient decorative effect */}
                <div className="absolute -right-20 -top-20 w-48 h-48 rounded-full bg-gold-accent/10 dark:bg-gold-accent/5 blur-3xl animate-glow pointer-events-none" />

                <div className="space-y-5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono tracking-widest text-gold-accent uppercase font-bold bg-amber-50 dark:bg-slate-800/80 border border-gold-accent/25 px-2.5 py-1 rounded-full flex items-center gap-1">
                      {displayedHomePsalmNumber === dailyPsalmNumber ? (
                        "Salmo do Dia"
                      ) : (
                        <>
                          <Shuffle className="w-3 h-3 inline" /> Salmo #{displayedHomePsalmNumber}
                        </>
                      )}
                    </span>
                    <button
                      id="daily-card-favorite-btn"
                      onClick={(e) => handleToggleFavorite(displayedHomePsalmNumber, e)}
                      className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors ${
                        favorites.includes(displayedHomePsalmNumber) ? "text-red-500" : "text-gray-300 dark:text-gray-600"
                      }`}
                      title={favorites.includes(displayedHomePsalmNumber) ? "Remover dos favoritos" : "Salvar nos favoritos"}
                    >
                      <Heart className={`w-5 h-5 ${favorites.includes(displayedHomePsalmNumber) ? "fill-current" : ""}`} />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <h2 className="font-serif font-bold text-3xl text-gray-800 dark:text-gray-100 group-hover:text-gold-accent transition-colors">
                      {displayedHomePsalmMetadata.title}
                    </h2>
                    <p className="font-serif italic text-base text-gray-500 dark:text-gray-400 leading-relaxed border-l-2 border-gold-accent/30 pl-4">
                      "{displayedHomePsalmMetadata.theme}"
                    </p>
                  </div>

                  {/* Preview verses */}
                  <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 font-serif leading-relaxed italic line-clamp-3">
                    "{displayedHomePsalmMetadata.preview}"
                  </p>

                  <div className="w-full h-px bg-gray-100 dark:bg-gray-800/60 my-2" />

                  {/* Reading / Narration actions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <button
                      id="daily-read-btn"
                      onClick={() => handleOpenPsalmReader(displayedHomePsalmNumber)}
                      className="w-full min-h-[44px] py-2.5 px-3 bg-gradient-to-r from-gold-accent to-amber-600 text-white rounded-xl text-xs font-display font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-95 hover:from-gold-hover hover:to-amber-700 shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer leading-tight"
                    >
                      <BookOpen className="w-4 h-4 flex-shrink-0" />
                      <span>Ler Salmo</span>
                    </button>
                    <button
                      id="daily-audio-btn"
                      onClick={() => handleStartPsalmAudio(displayedHomePsalmNumber)}
                      className="w-full min-h-[44px] py-2.5 px-3 bg-white dark:bg-slate-800 text-gold-accent dark:text-amber-400 rounded-xl text-xs font-display font-semibold border border-gold-accent/25 dark:border-gray-700 hover:bg-gold-cream dark:hover:bg-slate-700 shadow-sm hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer leading-tight text-center"
                    >
                      <Volume2 className="w-4 h-4 flex-shrink-0" />
                      <span>Ouvir capítulo inteiro</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Button "Ver um novo Salmo" */}
              <button
                id="home-ver-novo-salmo-btn"
                onClick={handleSelectRandomPsalm}
                className="w-full py-3.5 px-5 bg-white dark:bg-slate-900 text-gold-accent dark:text-amber-400 border-2 border-gold-accent/30 dark:border-gold-accent/20 hover:border-gold-accent dark:hover:border-gold-accent/50 rounded-2xl font-display font-bold text-sm shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer group active:scale-[0.99]"
              >
                <Shuffle className="w-4.5 h-4.5 transition-transform group-hover:rotate-180 duration-500 text-gold-accent" />
                <span>Ver um novo Salmo</span>
              </button>

              {/* Devocional helper message */}
              <div className="bg-white dark:bg-slate-900 border border-gold-accent/10 dark:border-gray-800 rounded-2xl p-5 flex items-start gap-4">
                <div className="p-2 bg-amber-50 dark:bg-slate-800 text-gold-accent rounded-xl flex-shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-display font-semibold text-xs text-gray-800 dark:text-gray-200">
                    O Cântico de Davi
                  </h4>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 font-serif leading-relaxed">
                    Os Salmos de Davi são as orações de maior vigor lírico e conforto espiritual da humanidade. Tire 5 minutos hoje para sentar-se em silêncio absoluto, fechar os olhos e permitir que a narrativa sagrada acalme sua mente.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "salmos" && (
            <motion.div
              key="salmos-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="py-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="pr-14 sm:pr-20">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-gold-accent font-semibold block">
                    Canto das Escrituras
                  </span>
                  <h1 className="font-display font-bold text-2xl tracking-tight text-gray-900 dark:text-white">
                    O Livro dos Salmos
                  </h1>
                  <p className="text-xs text-gray-400">
                    Navegue pelas escrituras em formato de livro sagrado ou use a busca inteligente.
                  </p>
                </div>

                {/* Segmented layout switcher button bar (Requirement 3) */}
                <div className="flex bg-gold-cream/40 dark:bg-slate-800 rounded-xl p-1 self-start sm:self-center border border-gold-accent/15">
                  <button
                    id="layout-btn-book"
                    onClick={() => setCatalogLayout("book")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display font-semibold transition-all cursor-pointer ${
                      catalogLayout === "book"
                        ? "bg-gold-accent text-white shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    }`}
                  >
                    <Book className="w-3.5 h-3.5" />
                    <span>Livro Digital</span>
                  </button>
                  <button
                    id="layout-btn-grid"
                    onClick={() => setCatalogLayout("grid")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display font-semibold transition-all cursor-pointer ${
                      catalogLayout === "grid"
                        ? "bg-gold-accent text-white shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Grade de Busca</span>
                  </button>
                </div>
              </div>

              {/* Toggle layouts depending on user selection */}
              <AnimatePresence mode="wait">
                {catalogLayout === "book" ? (
                  <motion.div
                    key="book-layout"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25 }}
                  >
                    <DigitalBook
                      settings={settings}
                      onOpenImmersiveReader={handleOpenPsalmReader}
                      onStartAudio={handleStartPsalmAudio}
                      favorites={favorites}
                      onToggleFavorite={(num, e) => handleToggleFavorite(num, e)}
                      fetchPsalmText={fetchPsalmText}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="grid-layout"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25 }}
                  >
                    <Catalog
                      onSelectPsalmNumber={handleOpenPsalmReader}
                      favorites={favorites}
                      onToggleFavorite={handleToggleFavorite}
                      onPrefetchPsalmNumber={(num) => fetchPsalmText(num, true)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {activeTab === "favoritos" && (
            <motion.div
              key="favoritos-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="py-1 pr-14">
                <span className="text-[10px] font-mono uppercase tracking-widest text-gold-accent font-semibold block">
                  Meus Abrigos de Paz
                </span>
                <h1 className="font-display font-bold text-2xl tracking-tight text-gray-900 dark:text-white">
                  Meus Salmos Favoritos
                </h1>
                <p className="text-xs text-gray-400">
                  Sua curadoria pessoal de orações guardadas para leitura e audição recorrentes.
                </p>
              </div>

              {/* Favorites catalog filtered list */}
              {favoritePsalmsMetadata.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {favoritePsalmsMetadata.map((psalm) => (
                    <div
                      key={psalm.number}
                      id={`favorite-psalm-${psalm.number}`}
                      onClick={() => handleOpenPsalmReader(psalm.number)}
                      className="group bg-white dark:bg-slate-900 border border-gold-accent/10 dark:border-gray-800 rounded-2xl p-5 cursor-pointer hover:shadow-xl hover:border-gold-accent/30 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-mono text-gold-accent uppercase font-bold">
                            Salmo {psalm.number}
                          </span>
                          <button
                            id={`fav-remove-btn-${psalm.number}`}
                            onClick={(e) => handleToggleFavorite(psalm.number, e)}
                            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-red-500"
                            title="Remover dos favoritos"
                          >
                            <Heart className="w-4 h-4 fill-current" />
                          </button>
                        </div>
                        <div>
                          <h3 className="font-display font-semibold text-sm text-gray-800 dark:text-gray-100 group-hover:text-gold-accent transition-colors">
                            {psalm.title}
                          </h3>
                          <p className="text-xs italic text-gray-500 dark:text-gray-400 font-serif mt-1">
                            "{psalm.theme}"
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] text-gold-accent font-sans mt-4 flex items-center gap-1 group-hover:translate-x-1 transition-all">
                        Toque para abrir &rarr;
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center space-y-3 bg-white dark:bg-slate-900 rounded-2xl border border-gold-accent/5">
                  <div className="w-12 h-12 bg-gold-cream dark:bg-slate-800 text-gold-accent rounded-full flex items-center justify-center mx-auto mb-2 opacity-60">
                    <Heart className="w-6 h-6" />
                  </div>
                  <h3 className="font-display font-medium text-gray-700 dark:text-gray-300">
                    Nenhum Salmo favorito salvo
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 max-w-xs mx-auto px-4 leading-relaxed">
                    Você pode salvar Salmos de sua preferência clicando no ícone de coração no Salmo do Dia ou na listagem completa.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "configuracoes" && (
            <motion.div
              key="configuracoes-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <SettingsModal
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onTriggerTestNotification={handleTriggerTestNotification}
                onClose={() => {}}
                onResetPreferences={handleResetPreferences}
                isInline={true}
              />
            </motion.div>
          )}

          {activeTab === "premium" && (
            <motion.div
              key="premium-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <PremiumTab
                isPremium={!!settings.isPremium}
                onPurchaseComplete={() => {
                  handleUpdateSettings({ isPremium: true });
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* 3. SKELETON LOADING COVER EFFECT */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gold-cream/60 dark:bg-slate-950/60 backdrop-blur-sm z-55 flex flex-col items-center justify-center space-y-4 pointer-events-none"
          >
            <div className="relative h-12 w-12 rounded-full border-2 border-gold-accent/20 border-t-gold-accent animate-spin" />
            <span className="font-serif italic text-sm text-gold-accent font-semibold animate-pulse">
              Carregando escrituras sagradas...
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. MODALS & AUXILIARY VIEWS */}
      
      {/* Immersive Script Reader overlay */}
      <AnimatePresence>
        {isReaderOpen && selectedPsalm && (
          <ImmersiveReader
            psalm={selectedPsalm}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            playerState={playerState}
            onStartAudio={(verseIndex, isSingle) => handleStartPsalmAudio(selectedPsalm.number, verseIndex, isSingle)}
            onPauseAudio={() => narrationEngine.pause()}
            onResumeAudio={() => narrationEngine.resume()}
            isFavorite={favorites.includes(selectedPsalm.number)}
            onToggleFavorite={() => handleToggleFavorite(selectedPsalm.number)}
            onClose={() => setIsReaderOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Audio TTS Player overlay control bar (only when active and on non-home tabs) */}
      {activeTab !== "inicio" && selectedPsalm && playerState.currentPsalmNumber && (
        <AudioPlayer
          psalm={selectedPsalm}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          playerState={playerState}
          onStartNextPsalm={(nextNum) => handleStartPsalmAudio(nextNum, 0)}
          onClose={() => {
            narrationEngine.stop();
            setPlayerState((prev) => ({ ...prev, currentPsalmNumber: null }));
          }}
        />
      )}

      {/* Configuration Customizations settings modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsModal
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onTriggerTestNotification={handleTriggerTestNotification}
            onClose={() => setIsSettingsOpen(false)}
            onResetPreferences={handleResetPreferences}
          />
        )}
      </AnimatePresence>

      {/* Voice Selection prompt for initial setup */}
      <AnimatePresence>
        {!settings.hasSetupVoice && (
          <VoicePrompt
            onSelectGender={handleSetupVoice}
            userName={settings.userName}
          />
        )}
      </AnimatePresence>

      {/* Daily simulated push notification alert overlay toast banner */}
      {/* Centered Notification Popup Modal */}
      <AnimatePresence>
        {notificationToast && notificationToast.show && (
          <div
            id="simulated-notification-overlay"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setNotificationToast(prev => prev ? { ...prev, show: false } : null)}
          >
            <motion.div
              id="simulated-notification-popup"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-100 rounded-3xl p-6 shadow-2xl border-2 border-gold-accent/40 flex flex-col gap-4 z-50"
            >
              <button
                id="notification-dismiss-btn"
                onClick={() => setNotificationToast(prev => prev ? { ...prev, show: false } : null)}
                className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-tr from-gold-accent to-amber-600 rounded-2xl text-white shadow-md">
                  <Bell className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-gold-accent font-bold uppercase tracking-wider block">
                    Salmo do Dia • Notificação
                  </span>
                  <span className="text-[11px] text-gray-400 font-mono">
                    {notificationToast.timeString || settings.notificationTime}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 border-t border-gray-100 dark:border-slate-800 pt-3">
                <h3 className="font-serif font-bold text-xl text-gray-900 dark:text-white leading-snug">
                  {notificationToast.title}
                </h3>
                <p className="text-sm font-serif leading-relaxed text-gray-600 dark:text-gray-300 italic">
                  "{notificationToast.body}"
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  id="notification-open-psalm-btn"
                  onClick={() => {
                    setNotificationToast(prev => prev ? { ...prev, show: false } : null);
                    handleOpenPsalmReader(notificationToast.psalmNumber);
                  }}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-gold-accent to-amber-600 text-white rounded-xl text-xs font-display font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" />
                  Ler Salmo do Dia Agora
                </button>
                <button
                  id="notification-close-btn"
                  onClick={() => setNotificationToast(prev => prev ? { ...prev, show: false } : null)}
                  className="py-3 px-4 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-display font-semibold hover:bg-gray-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Audio TTS Player overlay control bar */}
      {selectedPsalm && playerState.currentPsalmNumber && (
        <AudioPlayer
          psalm={selectedPsalm}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          playerState={playerState}
          onStartNextPsalm={(nextNum) => handleStartPsalmAudio(nextNum, 0)}
          onClose={() => {
            narrationEngine.stop();
            setPlayerState((prev) => ({ ...prev, currentPsalmNumber: null }));
          }}
        />
      )}

      {/* Google AdMob Banner Simulation (Requirement 1) */}
      {!settings.isPremium && (
        <div className="fixed bottom-16 left-0 right-0 z-40 max-w-2xl mx-auto px-4 pointer-events-auto">
          <SimulatedBannerAd
            isPremium={!!settings.isPremium}
            onGoPremium={() => setActiveTab("premium")}
          />
        </div>
      )}

      {/* Google AdMob Interstitial Simulation (Requirement 2) */}
      <AnimatePresence>
        {showInterstitial && !settings.isPremium && (
          <SimulatedInterstitialAd
            isPremium={!!settings.isPremium}
            onClose={() => setShowInterstitial(false)}
          />
        )}
      </AnimatePresence>

      {/* Onboarding screen (Requirement onboarding section) */}
      <AnimatePresence>
        {(!settings.userName || !settings.hasAcceptedPrivacy) && (
          <Onboarding
            onComplete={(name) => {
              handleUpdateSettings({
                userName: name,
                hasAcceptedPrivacy: true,
              });
            }}
          />
        )}
      </AnimatePresence>

      {/* 5. BOTTOM NAVIGATION BAR FOOTER (MOBILE TABS RAIL) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/85 dark:bg-slate-950/85 backdrop-blur-lg border-t border-gold-accent/10 py-2 sm:py-3.5 px-2 sm:px-6 flex items-center justify-around z-40 max-w-2xl mx-auto rounded-t-2xl shadow-lg transition-colors">
        {[
          { id: "inicio", label: "Início", icon: Sparkles },
          { id: "salmos", label: "Salmos", icon: Compass },
          { id: "favoritos", label: "Favoritos", icon: Heart },
          { id: "configuracoes", label: "Ajustes", icon: Settings },
          { id: "premium", label: "Apoio 🌟", icon: Crown },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => {
                setActiveTab(tab.id as any);
                // Exit reading mode when switching main navigation tabs
                setIsReaderOpen(false);
                incrementActionCount();
              }}
              className={`flex flex-col items-center gap-0.5 sm:gap-1 cursor-pointer transition-all px-1 py-0.5 rounded-lg min-w-[44px] ${
                isActive
                  ? "text-gold-accent scale-105 font-medium"
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              }`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "stroke-[2.5]" : ""}`} />
              <span className="text-[9px] sm:text-[10px] font-display uppercase tracking-wider whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
