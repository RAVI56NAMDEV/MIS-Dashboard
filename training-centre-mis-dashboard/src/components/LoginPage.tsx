import React, { useState } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  firebaseSignOut,
  User,
} from '../lib/firebase';
import { ALLOWED_EMAIL_DOMAIN, isAllowedDomain } from '../config/authConfig';
import {
  Building2,
  Lock,
  ShieldAlert,
  ShieldCheck,
  AlertCircle,
  LogOut,
} from 'lucide-react';

interface LoginPageProps {
  user: User | null;
  isCheckingAuth: boolean;
  onLoginSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  user,
  isCheckingAuth,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Google Sign-In Handler
  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request'
      ) {
        setErrorMessage(
          'Sign-in window was closed before completing authentication. Click "Continue with Google" to try again.'
        );
      } else if (err?.code === 'auth/popup-blocked') {
        setErrorMessage(
          'Sign-in popup was blocked by your browser. Please allow popups for this site and try again.'
        );
      } else if (err?.code === 'auth/network-request-failed') {
        setErrorMessage(
          'Unable to connect. Please check your internet connection and try again.'
        );
      } else {
        console.error('Google Sign-In Error:', err);
        setErrorMessage(
          'Google Sign-In failed. Please use your Anudip organization Google account.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await firebaseSignOut(auth);
      setErrorMessage(null);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // STATE A: Session checking loading state
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 font-sans">
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4 animate-pulse">
            <Lock className="w-7 h-7" />
          </div>
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
          <h2 className="text-sm font-semibold text-white tracking-wide">
            Verifying Organization Access
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Checking Google session and domain clearance...
          </p>
        </div>
      </div>
    );
  }

  // STATE B: User logged in with a non-Anudip Google account (e.g. @gmail.com)
  if (user && !isAllowedDomain(user.email)) {
    const userDomain = user.email ? user.email.split('@')[1] : 'unknown';

    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-950/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-md w-full bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 backdrop-blur-xl">
          <div className="flex justify-center mb-5">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center shadow-inner">
              <ShieldAlert className="w-7 h-7" />
            </div>
          </div>

          <div className="text-center space-y-2 mb-6">
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-rose-950/80 text-rose-400 border border-rose-800/50 uppercase tracking-wider">
              Access Denied
            </span>
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              Unauthorized Google Account
            </h1>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Access denied. Please sign in with your Anudip organization Google account.
            </p>
          </div>

          <div className="bg-neutral-950/90 border border-neutral-800 rounded-2xl p-4 mb-6 space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-neutral-800">
              <span className="text-neutral-400">Current Account:</span>
              <span className="font-semibold text-neutral-200 truncate max-w-[200px]">
                {user.email}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pb-2 border-b border-neutral-800">
              <span className="text-neutral-400">Detected Domain:</span>
              <span className="font-semibold text-rose-400">@{userDomain}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">Required Domain:</span>
              <span className="font-bold text-emerald-400">@{ALLOWED_EMAIL_DOMAIN}</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-950/40 border border-rose-900/50 text-rose-300 text-xs mb-6">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p className="leading-snug">
              This MIS contains confidential training centre operational data. Only accounts ending in{' '}
              <strong className="text-white">@{ALLOWED_EMAIL_DOMAIN}</strong> are authorized.
            </p>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full py-3 px-4 rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            <LogOut className="w-4 h-4" />
            Sign Out & Switch Google Account
          </button>
        </div>
      </div>
    );
  }

  // STATE C: Main Google-Only Login Card
  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col justify-between p-4 sm:p-6 font-sans relative overflow-hidden">
      {/* Background glowing blurred gradients */}
      <div className="absolute -top-40 -left-40 w-[450px] h-[450px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[450px] h-[450px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Branding */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold shadow-lg shadow-blue-900/30">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-sm font-extrabold text-white tracking-tight block">
              TRAINING CENTRE MIS
            </span>
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-mono block">
              Anudip Management Information System
            </span>
          </div>
        </div>

        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-neutral-900/90 text-neutral-300 border border-neutral-800">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          Restricted Portal (@{ALLOWED_EMAIL_DOMAIN})
        </span>
      </div>

      {/* Centered Glassmorphism Authentication Card */}
      <div className="max-w-md w-full mx-auto my-auto py-6 relative z-10">
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-neutral-700/80">
          
          {/* Card Header Icon & Title */}
          <div className="text-center space-y-2 mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600/20 to-purple-600/20 border border-blue-500/30 text-blue-400 mb-1 shadow-inner">
              <Lock className="w-6 h-6" />
            </div>

            <div className="inline-block">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-950/80 text-blue-400 border border-blue-800/50 uppercase tracking-wider">
                Organization Authentication
              </span>
            </div>

            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              TRAINING CENTRE MIS
            </h1>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-xs mx-auto">
              Sign in with your official Google organization account to access student metrics, placement analytics, and operational reports.
            </p>
          </div>

          {/* Domain Clearance Badge */}
          <div className="bg-neutral-950/80 border border-neutral-800/90 rounded-2xl p-3.5 mb-6 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-neutral-400 text-[11px]">Authorized Domain:</span>
            </div>
            <span className="font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-lg border border-emerald-800/40 text-xs">
              @{ALLOWED_EMAIL_DOMAIN}
            </span>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/70 text-rose-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-white hover:bg-neutral-100 active:scale-[0.99] text-neutral-900 font-bold text-xs transition-all duration-200 shadow-md flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 group"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          <p className="text-[11px] text-neutral-500 text-center mt-4 leading-relaxed">
            Only Anudip Google accounts (<span className="text-neutral-400">@anudip.org</span>) will be granted access.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-6xl w-full mx-auto text-center text-[11px] text-neutral-500 relative z-10">
        Training Centre MIS &bull; Internal Enterprise Portal &bull; Anudip Foundation
      </div>
    </div>
  );
};
