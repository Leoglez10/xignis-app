import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { App } from "./app/App";
import { SplashScreen } from "./components/SplashScreen";
import { AuthProvider } from "./features/session/AuthContext";
import "./styles/globals.css";
import "./lib/i18n";
import { queryClient } from "./lib/queryClient";
import { ToastProvider } from "./components/ui/Toast";
import { ConfirmProvider } from "./components/ui/ConfirmDialog";
import { PreferencesProvider } from "./features/settings/PreferencesContext";
import { OfflineBanner } from "./components/OfflineBanner";
import { DeepLinkHandler } from "./components/DeepLinkHandler";
import { initializeMonitoring } from "./lib/monitoring";

initializeMonitoring();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SplashScreen>
      <QueryClientProvider client={queryClient}>
        <PreferencesProvider>
          <ToastProvider>
            <ConfirmProvider>
              <BrowserRouter>
                <DeepLinkHandler />
                <AuthProvider>
                  <OfflineBanner />
                  <App />
                </AuthProvider>
              </BrowserRouter>
            </ConfirmProvider>
          </ToastProvider>
        </PreferencesProvider>
      </QueryClientProvider>
    </SplashScreen>
  </React.StrictMode>,
);
