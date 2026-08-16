import { ScrollText, TriangleAlert } from 'lucide-react';
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

const TermsOfService = () => {
  return (
    <div className="space-y-6">
      <div className="bg-surface border border-border-light rounded-none p-6 md:p-8">
        <div className="flex items-center gap-2 mb-2">
          <ScrollText className="h-3.5 w-3.5 text-play" />
          <span className="text-[9px] font-mono text-muted uppercase tracking-widest">
            Legal / Terms
          </span>
        </div>
        <h1 className="font-heading text-2xl md:text-3xl font-semibold text-primary tracking-tight">
          Terms &amp; <span className="text-play">Conditions</span>
        </h1>
        <p className="text-[14px] md:text-[15px] font-sans text-primary/80 leading-relaxed max-w-[62ch] mt-2">
          Last updated: August 2026
        </p>
      </div>

      <div className="max-w-[85ch]">
        <p className="text-[14px] md:text-[15px] font-sans text-primary/90 leading-relaxed">
          Stoxy Finance is an independent, non-commercial side project built and maintained by
          a solo developer. It is <strong className="text-primary">not a registered company,
          broker, dealer, or financial advisor</strong>. By using Stoxy Finance, you agree to
          the terms below.
        </p>
      </div>

      <div className="space-y-7 max-w-[85ch]">
        <Section title="What Stoxy Finance is">
          <p>
            Stoxy Finance is an informational tool — live NSE, BSE prices, indices, charts,
            watchlists, portfolio tracking, and AI-assisted summaries. It does not execute
            trades, hold funds, or act as a broker or investment advisor in any capacity.
          </p>
        </Section>

        <Section title="Not financial advice">
          <div className="bg-amber-500/10 border border-amber-600/50 dark:border-amber-500/30 p-5 md:p-6 flex gap-4">
            <TriangleAlert className="h-6 w-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[14px] md:text-[15px] font-sans text-primary leading-relaxed">
              Nothing on this platform — prices, charts, indicators, news summaries, or
              AI-generated analysis — is financial advice or a recommendation to buy, sell, or
              hold any security. AI-generated content may be inaccurate or wrong; treat it as a
              starting point, not a decision. Markets are volatile and involve real risk of
              loss. <High>Do your own research</High> and consult a SEBI-registered advisor
              before making investment decisions.
            </p>
          </div>
        </Section>

        <Section title="Market data">
          <p>
            Market data is sourced from third-party providers (including Upstox and AngelOne)
            and may be delayed, incomplete, or contain errors. Always confirm prices with your
            broker before acting on anything shown here.
          </p>
        </Section>

        <Section title="Eligibility">
          <p>
            You must be at least 18 years old to use Stoxy Finance. You use the service at
            your own risk and discretion.
          </p>
        </Section>

        <Section title="No warranties">
          <p>
            The service is provided <High>"as is"</High>, with no guarantee of uptime,
            accuracy, or security. It's a side project, run without a dedicated ops team —
            expect occasional downtime or bugs.
          </p>
        </Section>

        <Section title="Limitation of liability">
          <p>
            Stoxy Finance and its creator are <High>not liable</High> for any losses — trading
            losses, lost profits, lost data, or otherwise — arising from your use of the
            service. You are solely responsible for decisions you make based on information
            from this platform.
          </p>
        </Section>

        <Section title="Acceptable use">
          <p>Please don't:</p>
          <ul className="space-y-2.5">
            <Li>Scrape, crawl, or bulk-harvest data from the service</Li>
            <Li>Attempt unauthorised access to accounts, systems, or APIs</Li>
            <Li>Use the service for unlawful, fraudulent, or abusive purposes</Li>
            <Li>Interfere with or overload the service or its infrastructure</Li>
          </ul>
        </Section>

        <Section title="Accounts">
          <p>
            You're responsible for keeping your sign-in credentials confidential and your info
            accurate. Accounts that violate these terms may be suspended.
          </p>
        </Section>

        <Section title="Intellectual property">
          <p>
            The Stoxy Finance name, logo, and code belong to the creator. Please don't copy or
            redistribute without permission.
          </p>
        </Section>

        <Section title="Third-party services">
          <p>
            Stoxy integrates with third-party services (Google Sign-In, market data providers).
            We're not responsible for their content or practices — you use them at your own
            risk.
          </p>
        </Section>

        <Section title="Changes">
          <p>
            These terms may be updated as the project evolves. Continued use after an update
            means you accept the revised terms.
          </p>
        </Section>

        <Section title="Governing law">
          <p>These terms are governed by the laws of India.</p>
        </Section>

        <Section title="Contact">
          <p>
            Questions? Email{' '}
            <a
              href="mailto:anshxcookies@gmail.com"
              className="text-play font-semibold underline underline-offset-2"
            >
              anshxcookies@gmail.com
            </a>
            . Privacy Policy:{' '}
            <Link to="/privacy" className="text-play font-semibold underline underline-offset-2">
              /privacy
            </Link>
          </p>
        </Section>
      </div>
    </div>
  );
};

export default TermsOfService;