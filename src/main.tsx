import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initServiceWorker, restorePendingNotifications } from "./lib/notifications";

// Register Service Worker and restore any pending scheduled notifications
// that survived a page reload (persisted in localStorage)
initServiceWorker().then((ok) => {
  if (ok) restorePendingNotifications();
});

createRoot(document.getElementById("root")!).render(<App />);
