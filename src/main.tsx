import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { loadYandexMaps } from "@/lib/yandexMapsLoader";
import "./index.css";

const yandexMapsApiKey = (import.meta.env.VITE_YMAPS_API_KEY ?? "").trim();

if (yandexMapsApiKey) {
  void loadYandexMaps(yandexMapsApiKey).catch(() => {
    // Ignore warm-up errors; the map module will handle retries and user-facing state.
  });
}

createRoot(document.getElementById("root")!).render(<App />);
