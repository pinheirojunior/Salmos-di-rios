import { AppSettings } from "../types";

export interface NotificationContent {
  title: string;
  body: string;
  psalmNumber: number;
  timeString: string;
}

const MORNING_MESSAGES = [
  "Seu Salmo de hoje já está esperando por você.",
  "Comece o dia fortalecendo sua fé e renovando suas esperanças.",
  "Que a Palavra de Deus ilumine e abençoe as suas primeiras horas.",
  "Separe alguns minutos para ouvir a mensagem de paz no Salmo de hoje.",
  "Que o amor do Altíssimo renove suas forças neste novo amanhecer.",
];

const AFTERNOON_MESSAGES = [
  "Reserve alguns minutos para fortalecer sua fé no meio do dia.",
  "Deus continua cuidando de você em cada detalhe.",
  "Um Salmo pode transformar o restante da sua tarde em pura paz.",
  "Faça uma pausa abençoada e renove sua esperança espiritual.",
  "Sinta a presença e a proteção divina no seu caminhar hoje.",
];

const EVENING_MESSAGES = [
  "Termine o dia com uma mensagem de paz nos Salmos.",
  "Entregue suas preocupações e gratidões a Deus antes de descansar.",
  "Que o Salmo de hoje traga profunda serenidade ao seu coração.",
  "Durma em paz sob a sombra protetora das asas do Senhor.",
  "Agradeça pelas bênçãos do dia e descanse na graça divina.",
];

export function getPersonalizedNotificationContent(
  userName?: string,
  targetHour?: number,
  psalmNumber: number = 23
): NotificationContent {
  const hour = targetHour !== undefined ? targetHour : new Date().getHours();
  
  let period: "morning" | "afternoon" | "evening" = "morning";
  let greeting = "";

  const trimmedName = userName ? userName.trim() : "";

  if (hour >= 5 && hour < 12) {
    period = "morning";
    greeting = trimmedName ? `Bom dia, ${trimmedName}! 🌅` : "Bom dia! 🌅";
  } else if (hour >= 12 && hour < 18) {
    period = "afternoon";
    greeting = trimmedName ? `Boa tarde, ${trimmedName}! 📖` : "Boa tarde! 📖";
  } else {
    period = "evening";
    greeting = trimmedName ? `Boa noite, ${trimmedName}! 🌙` : "Boa noite! 🌙";
  }

  let messageList = MORNING_MESSAGES;
  if (period === "afternoon") messageList = AFTERNOON_MESSAGES;
  if (period === "evening") messageList = EVENING_MESSAGES;

  const randomIndex = Math.floor(Math.random() * messageList.length);
  const selectedBody = messageList[randomIndex];

  const nowStr = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return {
    title: greeting,
    body: selectedBody,
    psalmNumber,
    timeString: nowStr,
  };
}

class NotificationService {
  private intervalId: any = null;
  private onTriggerCallback: ((content: NotificationContent) => void) | null = null;
  private swRegistration: ServiceWorkerRegistration | null = null;

  constructor() {
    this.registerServiceWorker();
  }

  private async registerServiceWorker() {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      this.swRegistration = reg;
    } catch (e) {
      console.warn("ServiceWorker registration failed:", e);
    }
  }

  public async requestPermissions(): Promise<boolean> {
    if (typeof window === "undefined") return false;

    // Ensure Service Worker registration is active
    await this.registerServiceWorker();

    // Check Capacitor Local Notifications if present
    const cap = (window as any).Capacitor;
    if (cap && cap.Plugins && cap.Plugins.LocalNotifications) {
      try {
        const perm = await cap.Plugins.LocalNotifications.requestPermissions();
        if (perm.display === "granted") return true;
      } catch (e) {
        console.warn("Capacitor LocalNotifications request failed:", e);
      }
    }

    // Web Notification API
    if ("Notification" in window) {
      try {
        if (Notification.permission === "granted") return true;
        if (Notification.permission !== "denied") {
          const res = await Notification.requestPermission();
          return res === "granted";
        }
      } catch (e) {
        console.warn("Web Notification.requestPermission error:", e);
      }
    }

    return false;
  }

  public initScheduler(
    getSettings: () => AppSettings,
    getDailyPsalmNumber: () => number,
    onTriggerInApp: (content: NotificationContent) => void
  ) {
    this.onTriggerCallback = onTriggerInApp;

    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    // Check every 20 seconds
    this.intervalId = setInterval(() => {
      this.checkAndTriggerScheduled(getSettings, getDailyPsalmNumber);
    }, 20000);

    // Initial check immediately
    this.checkAndTriggerScheduled(getSettings, getDailyPsalmNumber);
  }

  public updateSchedules(
    getSettings: () => AppSettings,
    getDailyPsalmNumber: () => number
  ) {
    this.requestPermissions();
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    // Restart interval cleanly
    this.intervalId = setInterval(() => {
      this.checkAndTriggerScheduled(getSettings, getDailyPsalmNumber);
    }, 20000);

    this.checkAndTriggerScheduled(getSettings, getDailyPsalmNumber);
  }

  private async checkAndTriggerScheduled(
    getSettings: () => AppSettings,
    getDailyPsalmNumber: () => number
  ) {
    if (typeof window === "undefined") return;

    const settings = getSettings();
    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, "0");
    const currentMinutes = String(now.getMinutes()).padStart(2, "0");
    const currentTimeStr = `${currentHours}:${currentMinutes}`;
    const todayStr = now.toLocaleDateString("sv"); // YYYY-MM-DD

    // Define standard notification slots
    const slots = [
      {
        key: "morning",
        time: settings.notificationTime || "08:00",
        enabled: settings.enableMorningNotif !== false,
      },
      {
        key: "afternoon",
        time: settings.notificationTimeAfternoon || "14:00",
        enabled: settings.enableAfternoonNotif === true,
      },
      {
        key: "evening",
        time: settings.notificationTimeEvening || "20:00",
        enabled: settings.enableEveningNotif === true,
      },
    ];

    for (const slot of slots) {
      if (!slot.enabled || !slot.time) continue;

      if (currentTimeStr === slot.time) {
        const fireKey = `salmo_notif_fired_${slot.key}_${todayStr}`;
        const alreadyFired = localStorage.getItem(fireKey);

        if (!alreadyFired) {
          localStorage.setItem(fireKey, "true");

          const psalmNumber = getDailyPsalmNumber();
          const content = getPersonalizedNotificationContent(
            settings.userName,
            now.getHours(),
            psalmNumber
          );

          // Dispatch native notification
          this.sendNativeNotification(content);

          // Trigger in-app toast
          if (this.onTriggerCallback) {
            this.onTriggerCallback(content);
          }
        }
      }
    }
  }

  public async sendNativeNotification(content: NotificationContent) {
    if (typeof window === "undefined") return;

    // Check Capacitor
    const cap = (window as any).Capacitor;
    if (cap && cap.Plugins && cap.Plugins.LocalNotifications) {
      try {
        await cap.Plugins.LocalNotifications.schedule({
          notifications: [
            {
              title: content.title,
              body: content.body,
              id: Math.floor(Math.random() * 100000),
              schedule: { at: new Date(Date.now() + 100) },
              smallIcon: "res://icon",
            },
          ],
        });
        return;
      } catch (e) {
        console.warn("Capacitor schedule error:", e);
      }
    }

    // ServiceWorker showNotification (Primary Web Native Notification)
    if ("serviceWorker" in navigator) {
      try {
        const reg = this.swRegistration || (await navigator.serviceWorker.ready);
        if (reg && reg.showNotification && Notification.permission === "granted") {
          await reg.showNotification(content.title, {
            body: content.body,
            icon: "/manifest.json",
            badge: "/manifest.json",
            tag: `salmo-dia-notif-${Date.now()}`,
            vibrate: [200, 100, 200],
            data: { url: "/?action=read-daily-psalm" },
          } as any);
          return;
        }
      } catch (e) {
        console.warn("ServiceWorker showNotification error:", e);
      }
    }

    // Direct Web Notification API Fallback
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        const notif = new Notification(content.title, {
          body: content.body,
          tag: `salmo-dia-notif-${Date.now()}`,
        });
        notif.onclick = () => {
          window.focus();
          window.location.href = "/?action=read-daily-psalm";
        };
      } catch (e) {
        console.warn("Direct Web Notification error:", e);
      }
    }
  }

  public triggerTestNotification(
    userName?: string,
    psalmNumber: number = 23,
    onTriggerInApp?: (content: NotificationContent) => void
  ): NotificationContent {
    const content = getPersonalizedNotificationContent(
      userName,
      new Date().getHours(),
      psalmNumber
    );

    // Request permissions and trigger real native notification immediately
    this.requestPermissions().then((granted) => {
      if (granted) {
        this.sendNativeNotification(content);
      } else {
        console.warn("Notification permission not granted for test.");
      }
    });

    if (onTriggerInApp) {
      onTriggerInApp(content);
    }

    return content;
  }
}

export const notificationService = new NotificationService();

