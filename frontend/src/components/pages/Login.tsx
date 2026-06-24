import {Navigate, useLocation} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';
import {ArrowRight, TrendingUp} from 'lucide-react';

export const Login = () => {
    const {isLoggedIn, authLoading} = useAuth();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/';

    if (authLoading) return null;

    if (isLoggedIn) {
        return <Navigate to={from} replace/>;
    }

    return (
        <div className="flex items-center justify-center min-h-[75vh]">
            <div className="max-w-sm w-full flex flex-col items-center text-center px-4">
                {/* Logo */}
                <div
                    className="h-14 w-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-6">
                    <TrendingUp className="h-6 w-6 text-accent"/>
                </div>

                {/* Heading */}
                <h1 className="text-3xl font-heading font-light tracking-tight text-primary mb-1">
                    Sign in to <span className="font-semibold">Stoxy<span className="text-accent">.</span></span>
                </h1>
                <p className="text-sm font-sans text-muted mb-8 max-w-[260px] leading-relaxed">
                    Access your portfolio, watchlists, and live NSE market data.
                </p>

                {/* Google Sign-in */}
                <a
                    href={`${import.meta.env.VITE_API_URL}/oauth2/authorization/google`}
                    className="w-full flex items-center justify-between gap-3 bg-primary text-base rounded-lg py-3.5 px-5 font-medium text-sm transition-all hover:bg-primary/90 hover:-translate-y-0.5 shadow-ambient group"
                >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" aria-hidden="true">
                        <path fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                        <path fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="flex-1 text-center">Continue with Google</span>
                    <ArrowRight
                        className="h-4 w-4 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all"/>
                </a>

                <div className="mt-8 flex items-center gap-3 text-muted">
                    <div className="h-px flex-1 bg-border-light"/>
                    <span className="text-[10px] font-mono uppercase tracking-widest">Secured by OAuth2</span>
                    <div className="h-px flex-1 bg-border-light"/>
                </div>
            </div>
        </div>
    );
};
