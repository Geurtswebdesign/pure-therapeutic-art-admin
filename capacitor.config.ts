import type { CapacitorConfig } from "@capacitor/cli";

const serverUrl =
  process.env.CAPACITOR_SERVER_URL?.trim() || "https://pure-therapeutic-art-therapy.com";

const isCleartext = serverUrl.startsWith("http://");

const config: CapacitorConfig = {
  appId: "com.detroostboom.puretherapeuticart",
  appName: "Pure Therapeutic ART",
  webDir: ".capacitor-shell",
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
    },
  },
};

export default config;
