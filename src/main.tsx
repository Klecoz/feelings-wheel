import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { keepUpToDate } from "./pwa";
import { requestPersistentStorage } from "./lib/persistence";

keepUpToDate();

// Ask once, on every start: the answer can change when the app is installed.
void requestPersistentStorage();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
