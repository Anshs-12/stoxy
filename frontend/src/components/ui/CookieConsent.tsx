import { useEffect, useState } from 'react';
import { Cookie } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getConsent, setConsent } from '../../lib/consent';

const CookieConsent = () => {
  const [open, setOpen] = useState(() => getConsent() === null);

  useEffect(() => {
    const reopen = () => setOpen(true);
    window.addEventListener('stoxy:open-consent', reopen);
    return () => window.removeEventListener('stoxy:open-consent', reopen);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed bottom-6 right-6 w-[340px] z-50 bg-surface border border-border shadow-ambient">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Cookie className="h-4 w-4 text-play" />
          <h3 className="font-heading text-[14px] font-semibold text-primary tracking-tight">
            We use cookies
          </h3>
        </div>
        <p className="text-[12px] font-sans text-primary/90 leading-relaxed mb-1.5">
          <strong className="text-primary font-bold">Essential only</strong> — for
          preferences and keeping the site running.
        </p>
        <p className="text-[12px] font-sans text-primary/90 leading-relaxed mb-3">
          <strong className="text-primary font-bold">Accept all</strong> — enables analytics
          for our understanding.
        </p>
        <div className="flex items-center gap-3 mb-3">
          <Link to="/privacy" className="text-[11px] font-mono text-play font-semibold underline underline-offset-2">
            Privacy
          </Link>
          <Link to="/terms" className="text-[11px] font-mono text-play font-semibold underline underline-offset-2">
            Terms
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setConsent(true);
              setOpen(false);
            }}
            className="px-3.5 py-1.5 bg-play text-white dark:text-black text-[12px] font-mono hover:bg-play/90 transition-colors rounded-none"
          >
            Accept all
          </button>
          <button
            onClick={() => {
              setConsent(false);
              setOpen(false);
            }}
            className="px-3.5 py-1.5 border border-border text-[12px] font-mono text-primary hover:font-bold hover:text-play hover:border-play transition-all rounded-none"
          >
            Essential only
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;