"use client";

import Script from "next/script";

// Analytics via CDN – lastes kun hvis NEXT_PUBLIC_POSTHOG_KEY er satt i miljøet.
// Ingen avhengighet i package.json, ingen tracking for self-hosted instanser.
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = "https://eu.i.posthog.com";

declare global {
  interface Window {
    posthog?: {
      init: (key: string, options: object) => void;
      capture: (event: string, properties?: object) => void;
    };
  }
}

export default function Analytics() {
  if (!POSTHOG_KEY) return null;

  return (
    <Script
      src="https://eu-assets.i.posthog.com/static/array.js"
      strategy="afterInteractive"
      onLoad={() => {
        window.posthog?.init(POSTHOG_KEY, {
          api_host: POSTHOG_HOST,
          persistence: "memory",
          autocapture: false,
          capture_pageview: true,
          disable_session_recording: true,
        });
      }}
    />
  );
}
