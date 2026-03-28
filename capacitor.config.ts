import type { CapacitorConfig } from "@capacitor/cli";
import { NATIVE_APP_USER_AGENT_TOKEN } from "./lib/native/constants";

const serverUrl =
  process.env.CAPACITOR_SERVER_URL?.trim() || "https://pure-therapeutic-art-therapy.com";

const isCleartext = serverUrl.startsWith("http://");

const config: CapacitorConfig = {
  appId: "com.detroostboom.puretherapeuticart",
  appName: "Pure Therapeutic ART",
  webDir: ".capacitor-shell",
  appendUserAgent: NATIVE_APP_USER_AGENT_TOKEN,
  server: {
    url: serverUrl,
    cleartext: isCleartext,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: false,
      showSpinner: false,
      backgroundColor: "#F7EFE8",
      androidSplashResourceName: "splash",
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#F7EFE8",
      overlaysWebView: false,
    },
  },
};

export default config;
