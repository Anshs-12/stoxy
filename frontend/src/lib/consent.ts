export interface Consent {
  analytics: boolean;
  timestamp: number;
}

const STORAGE_KEY = 'stoxy-consent';

// Consent is stored in localStorage (a functional, non-essential mechanism).
// No tracking (GA4) is loaded until the user grants analytics consent.

export const getConsent = (): Consent | null => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Consent) : null;
  } catch {
    return null;
  }
};

export const setConsent = (analytics: boolean): Consent => {
  const consent: Consent = { analytics, timestamp: Date.now() };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
  window.dispatchEvent(new Event('stoxy:consent-change'));
  return consent;
};

// Reopens the consent banner on demand (footer "Cookie settings" link).
export const requestConsentReopen = () => {
  window.dispatchEvent(new Event('stoxy:open-consent'));
};