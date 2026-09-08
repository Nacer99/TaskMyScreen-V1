import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerServiceWorker, restoreNotifications } from "./lib/notifications";

// Register Service Worker and restore any pending scheduled notifications
// that survived a page reload (persisted in localStorage)
registerServiceWorker().then((registration) => {
  if (registration) restoreNotifications();
});

createRoot(document.getElementById("root")!).render(<App />);
