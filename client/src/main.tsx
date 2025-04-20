import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// Service Worker Registration - DISABLED
/*
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      // Check if there's an existing service worker
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      // Unregister any existing service workers to avoid conflicts
      for (const registration of registrations) {
        await registration.unregister();
      }
      
      // Register the new service worker
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });
      
      console.log(
        "ServiceWorker registration successful with scope: ",
        registration.scope
      );
      
      // Handle updates
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              console.log("New content is available; please refresh.");
              // Optionally show a notification to the user
            }
          });
        }
      });
    } catch (error) {
      console.error("ServiceWorker registration failed: ", error);
    }
  });
}
*/

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
