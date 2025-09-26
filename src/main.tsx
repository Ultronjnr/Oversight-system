import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import ErrorBoundary from "./components/ErrorBoundary";

// Ensure a safe process.env shim in the browser so legacy code referencing process.env works
const ensureProcessEnvShim = () => {
  try {
    if (typeof window !== 'undefined') {
      const win: any = window;
      if (typeof win.process === 'undefined') {
        win.process = {
          env: {},
          version: 'v18.0.0', // Mock Node version
          platform: 'browser',
          arch: 'x64',
          cwd: () => '/',
          nextTick: (cb: () => void) => Promise.resolve().then(cb),
          title: 'browser',
          versions: {},
          release: {},
          config: {},
          pid: 1,
          features: {},
          argv: [],
          execPath: '/',
          execArgv: [],
          abort: () => {},
          umask: () => 0,
          uptime: () => 0,
          memoryUsage: () => ({
            rss: 0,
            heapTotal: 0,
            heapUsed: 0,
            external: 0,
            arrayBuffers: 0
          }),
          cpuUsage: () => ({ user: 0, system: 0 }),
          resourceUsage: () => ({}),
          hrtime: (time?: [number, number]): [number, number] => {
            const now = performance.now();
            const ns = Math.floor(now * 1e6); // Approximate nanoseconds
            const seconds = Math.floor(ns / 1e9);
            const nanoseconds = ns % 1e9;
            if (time) {
              const prevSeconds = time[0];
              const prevNs = time[1];
              const diffNs = (seconds - prevSeconds) * 1e9 + (nanoseconds - prevNs);
              return [Math.floor(diffNs / 1e9), diffNs % 1e9];
            }
            return [seconds, nanoseconds];
          },
          // Add more as needed for specific deps
        };
      } else if (!win.process.env) {
        win.process.env = {};
      }

      // Copy Vite's import.meta.env to process.env with both VITE_ and REACT_APP_ prefixes
      const meta = (import.meta as any)?.env || {};
      Object.keys(meta).forEach((k) => {
        try {
          // Prefer existing values to avoid overwriting intentionally set vars
          if (meta[k] !== undefined && win.process.env[k] === undefined) {
            win.process.env[k] = meta[k];
          }
          // Also map VITE_* -> REACT_APP_* for legacy usage
          if (k.startsWith('VITE_')) {
            const legacy = k.replace(/^VITE_/, 'REACT_APP_');
            if (win.process.env[legacy] === undefined) {
              win.process.env[legacy] = meta[k];
            }
          }
        } catch (e) {
          // ignore individual property copy errors
        }
      });

      // Ensure NODE_ENV is set
      if (!win.process.env.NODE_ENV) {
        win.process.env.NODE_ENV = meta.MODE || meta.NODE_ENV || 'development';
      }
    }
  } catch (e) {
    // ignore any shim errors
  }
};

ensureProcessEnvShim();

const getEnv = (key: string) => {
  try {
    const v = (import.meta as any)?.env?.[key];
    if (v) return v;
  } catch (e) {
    // ignore
  }
  if (typeof process !== 'undefined' && (process as any)?.env) {
    return (process as any).env[key];
  }
  return undefined;
};

// Add debugging for deployment (safe in browser)
console.log('Environment:', {
  NODE_ENV: getEnv('NODE_ENV') ?? (import.meta as any)?.env?.MODE,
  REACT_APP_SUPABASE_URL: getEnv('REACT_APP_SUPABASE_URL') || getEnv('VITE_SUPABASE_URL'),
  REACT_APP_API_URL: getEnv('REACT_APP_API_URL') || getEnv('VITE_API_URL'),
});

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
