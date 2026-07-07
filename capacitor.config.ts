import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.xignis.app",
  appName: "Xignis",
  webDir: "dist",
  backgroundColor: "#0DEC0D",
  ios: {
    backgroundColor: "#0DEC0D",
    contentInset: "never",
  },
};

export default config;
