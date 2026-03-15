// Wrapper for PostHog-events – gjør ingenting hvis analytics ikke er lastet
export function useAnalytics() {
  const capture = (event: string, properties?: Record<string, unknown>) => {
    window.posthog?.capture(event, properties);
  };

  return { capture };
}
