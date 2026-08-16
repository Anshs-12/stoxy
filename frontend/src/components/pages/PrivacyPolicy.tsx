import { ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const High = ({ children }: { children: React.ReactNode }) => (
  <span className="bg-blue-200 text-blue-900 dark:bg-[#fdeba8] dark:text-black font-semibold px-1.5 py-0.5 rounded-[3px]">
    {children}
  </span>
);

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section>
    <h2 className="font-heading text-lg md:text-[20px] font-semibold text-play tracking-tight">
      {title}
    </h2>
    <div className="mt-2.5 text-[14px] md:text-[15px] font-sans text-primary/90 leading-relaxed space-y-2.5">
      {children}
    </div>
  </section>
);

const Li = ({ children }: { children: React.ReactNode }) => (
  <li className="flex gap-2.5">
    <span className="text-play shrink-0 mt-[3px]">—</span>
    <span>{children}</span>
  </li>
);

const PrivacyPolicy = () => {
  return (
    <div className="space-y-6">
      <div className="bg-surface border border-border-light rounded-none p-6 md:p-8">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="h-3.5 w-3.5 text-play" />
          <span className="text-[9px] font-mono text-muted uppercase tracking-widest">
            Legal / Privacy
          </span>
        </div>
        <h1 className="font-heading text-2xl md:text-3xl font-semibold text-primary tracking-tight">
          Privacy <span className="text-play">Policy</span>
        </h1>
        <p className="text-[14px] md:text-[15px] font-sans text-primary/80 leading-relaxed max-w-[62ch] mt-2">
          Last updated: August 2026
        </p>
      </div>

      <div className="max-w-[85ch]">
        <p className="text-[14px] md:text-[15px] font-sans text-primary/90 leading-relaxed">
          Stoxy Finance is a side project, not a company. This explains what data is collected,
          why, and your rights over it.
        </p>
      </div>

      <div className="space-y-7 max-w-[85ch]">
        <Section title="What we collect">
          <ul className="space-y-2.5">
            <Li>
              <strong className="text-primary">Account info</strong> — signing in with Google
              gives us your name and email only. We never see your Google password.
            </Li>
            <Li>
              <strong className="text-primary">Data you create</strong> — watchlists, portfolio
              holdings, and saved searches you add.
            </Li>
            <Li>
              <strong className="text-primary">Usage &amp; analytics</strong> — pages visited,
              device/browser type, approximate region, via Google Analytics.
            </Li>
            <Li>
              <strong className="text-primary">Cookies</strong> — used to keep you signed in and
              remember preferences like theme.
            </Li>
            <Li>
              We do <High>not</High> collect financial credentials, PAN, bank details, or
              payment information — we don't process payments.
            </Li>
          </ul>
        </Section>

        <Section title="How it's used">
          <ul className="space-y-2.5">
            <Li>To run the service — your watchlists, portfolio, and settings</Li>
            <Li>To understand aggregate usage and improve the product</Li>
            <Li>To prevent abuse and unauthorised access</Li>
            <Li>To meet legal obligations where required</Li>
          </ul>
        </Section>

        <Section title="Cookies & tracking">
          <p>
            Essential cookies keep you signed in. Google Analytics helps understand usage in
            aggregate — it doesn't identify you personally. You can block analytics cookies in
            your browser without losing core functionality.
          </p>
        </Section>

        <Section title="Sharing">
          <p>
            We <High>never sell</High> your data. It's shared only with the providers that help
            run Stoxy Finance — our hosting provider, Google (sign-in and analytics), and
            market data providers (Upstox, AngelOne). We may disclose data if legally required.
          </p>
        </Section>

        <Section title="Retention & security">
          <p>
            Account data is kept until you request deletion. Analytics data follows Google's
            retention limits (up to 14 months). Everything runs over HTTPS with Google OAuth
            for auth. No system is 100% secure — we take reasonable precautions but can't
            guarantee absolute security.
          </p>
        </Section>

        <Section title="Your rights">
          <p>
            You can request access to, correction of, or deletion of your data anytime — email{' '}
            <a
              href="mailto:anshxcookies@gmail.com"
              className="text-play font-semibold underline underline-offset-2"
            >
              anshxcookies@gmail.com
            </a>
            .
          </p>
        </Section>

        <Section title="Children's privacy">
          <p>
            Stoxy Finance is for users 18 and older. We don't knowingly collect data from
            minors.
          </p>
        </Section>

        <Section title="International processing">
          <p>
            Infrastructure may be hosted outside India. Using the service means you're okay
            with that.
          </p>
        </Section>

        <Section title="Changes">
          <p>
            This policy may be updated as the project grows. Continued use after changes means
            you accept the update.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Email{' '}
            <a
              href="mailto:anshxcookies@gmail.com"
              className="text-play font-semibold underline underline-offset-2"
            >
              anshxcookies@gmail.com
            </a>
            . Terms:{' '}
            <Link to="/terms" className="text-play font-semibold underline underline-offset-2">
              /terms
            </Link>
          </p>
        </Section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;