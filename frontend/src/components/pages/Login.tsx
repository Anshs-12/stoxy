import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, ArrowRight } from 'lucide-react';

export const Login = () => {
  const { isLoggedIn, authLoading } = useAuth();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  if (authLoading) return null; // Let the global spinner or layout handle the blank frame if needed

  if (isLoggedIn) {
    return <Navigate to={from} replace />;
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="max-w-md w-full bg-surface academic-shadow border border-border-light rounded px-8 py-10 flex flex-col items-center text-center">
        <div className="h-16 w-16 bg-neutral rounded-full flex items-center justify-center mb-6">
          <Shield className="h-7 w-7 text-muted" />
        </div>
        
        <h1 className="text-2xl font-manrope font-medium tracking-tight text-primary mb-3">Sign in to Stoxy</h1>
        <p className="text-sm font-inter text-muted mb-10 max-w-[280px]">
          Secure your portfolio and unlock personalized market insights.
        </p>
        
        <a 
          href="/api/v2/oauth2/authorization/google" 
          className="w-full flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-base rounded py-3.5 px-6 font-medium text-sm transition-colors group"
        >
          <img 
            src="https://www.svgrepo.com/show/475656/google-color.svg" 
            alt="Google" 
            className="w-5 h-5 bg-surface rounded-full p-0.5"
          />
          <span>Continue with Google</span>
          <ArrowRight className="h-4 w-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </a>
        
        <p className="mt-8 text-[11px] text-muted font-inter uppercase tracking-widest">
          Enterprise Grade Security
        </p>
      </div>
    </div>
  );
};
