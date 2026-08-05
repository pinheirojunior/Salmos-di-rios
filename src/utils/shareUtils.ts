import { Share } from "@capacitor/share";
import { Clipboard } from "@capacitor/clipboard";
import { Capacitor } from "@capacitor/core";

export async function shareContent(
  title: string,
  text: string,
  url?: string
): Promise<{ shared: boolean; copied: boolean }> {
  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");

  // 1. Try Capacitor Native Share
  if (Capacitor.isNativePlatform()) {
    try {
      await Share.share({
        title,
        text,
        url: shareUrl,
        dialogTitle: title,
      });
      return { shared: true, copied: false };
    } catch (err: any) {
      if (err?.name === "AbortError" || err?.message?.includes("canceled")) {
        return { shared: false, copied: false };
      }
      console.warn("Capacitor Share failed, attempting fallback:", err);
    }
  }

  // 2. Try Web Share API if available
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url: shareUrl,
      });
      return { shared: true, copied: false };
    } catch (err: any) {
      if (err?.name === "AbortError" || err?.message?.includes("canceled")) {
        return { shared: false, copied: false };
      }
      console.warn("Web Share API failed, attempting clipboard fallback:", err);
    }
  }

  // 3. Fallback to Clipboard (Capacitor Clipboard then Web Clipboard)
  try {
    if (Capacitor.isNativePlatform()) {
      await Clipboard.write({ string: text });
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    } else {
      // Emergency fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    return { shared: false, copied: true };
  } catch (err) {
    console.error("Clipboard copy failed:", err);
    return { shared: false, copied: false };
  }
}
