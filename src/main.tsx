import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/inter/wght.css";
import App from "./App";
import "./index.css";

const root = document.getElementById("root");

window.addEventListener("error", (event) => {
  if (!root) return;
  root.innerHTML = `<pre style="white-space:pre-wrap;padding:24px;color:#ff453a">${event.message}\n${event.filename}:${event.lineno}</pre>`;
});

if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
