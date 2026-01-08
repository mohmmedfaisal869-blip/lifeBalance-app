import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

console.log("LifeBalance: Starting bootstrap...");

const container = document.getElementById('root');

if (!container) {
  console.error("LifeBalance: Target container #root not found.");
} else {
  try {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("LifeBalance: Render triggered.");
  } catch (err) {
    console.error("LifeBalance: Critical mount error:", err);
    const display = document.getElementById('error-display');
    if (display) {
      display.style.display = 'block';
      display.innerText = `Mount Error: ${err.message}\n${err.stack}`;
    }
  }
}