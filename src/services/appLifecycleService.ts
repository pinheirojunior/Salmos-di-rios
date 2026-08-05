import { App } from "@capacitor/app";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Capacitor } from "@capacitor/core";
import { Dialog } from "@capacitor/dialog";

export interface AppLifecycleHandlers {
  onBackButton: () => boolean | Promise<boolean>;
}

class AppLifecycleService {
  private backButtonListenerAttached = false;
  private currentHandlers: AppLifecycleHandlers | null = null;
  private isDialogShowing = false;

  public initNativeLifecycle(handlers: AppLifecycleHandlers) {
    this.currentHandlers = handlers;

    if (!Capacitor.isNativePlatform()) return;

    if (!this.backButtonListenerAttached) {
      this.backButtonListenerAttached = true;
      try {
        App.addListener("backButton", async () => {
          if (this.isDialogShowing) return;

          if (this.currentHandlers) {
            const handled = await this.currentHandlers.onBackButton();
            if (!handled) {
              await this.showExitConfirmation();
            }
          }
        });
      } catch (e) {
        console.warn("App addListener backButton error:", e);
      }
    }
  }

  public async showExitConfirmation(): Promise<boolean> {
    if (this.isDialogShowing) return false;
    this.isDialogShowing = true;

    try {
      const result = await Dialog.confirm({
        title: "Sair do aplicativo",
        message: "Tem certeza de que deseja fechar o aplicativo?",
        okButtonTitle: "Sair",
        cancelButtonTitle: "Cancelar",
      });

      this.isDialogShowing = false;

      if (result && result.value) {
        if (Capacitor.isNativePlatform()) {
          await App.exitApp();
        }
        return true;
      }
      return false;
    } catch (e) {
      this.isDialogShowing = false;
      console.warn("Capacitor Dialog error:", e);

      if (typeof window !== "undefined" && window.confirm) {
        const confirmed = window.confirm(
          "Sair do aplicativo\n\nTem certeza de que deseja fechar o aplicativo?"
        );
        if (confirmed) {
          if (Capacitor.isNativePlatform()) {
            await App.exitApp();
          }
          return true;
        }
      }
      return false;
    }
  }

  public async updateStatusBar(themeMode: "light" | "dark") {
    if (!Capacitor.isNativePlatform()) return;
    try {
      if (themeMode === "dark") {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: "#0f172a" });
      } else {
        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setBackgroundColor({ color: "#fbf9f4" });
      }
    } catch (e) {
      console.warn("StatusBar setStyle error:", e);
    }
  }
}

export const appLifecycleService = new AppLifecycleService();
