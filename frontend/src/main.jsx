import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";

import "./styles/tokens.css";
import "./styles/global.css";

const container = document.getElementById("root");

if (!container) {
  throw new Error(
    "Root element not found. Expected an element with id=\"root\" in index.html."
  );
}

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
