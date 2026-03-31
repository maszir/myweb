import React, { useState, useEffect } from 'react';
import { auth, googleProvider, signInWithPopup, db, doc, getDoc } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { LogIn, X, Lock } from 'lucide-react';
import { Settings } from '../types';
import { useAuth } from '../AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { user, verifyPin, needsPin, isPinVerified, isAdmin } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  
  // PIN states
  const [pinInput, setPinInput] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'global'));
        if (docSnap.exists()) {
          setSettings(docSnap.data() as Settings);
        }
      } catch (err) {
        console.error('Failed to fetch settings', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      navigate('/admin');
    }
  }, [isAdmin, navigate]);

  const handleLogin = async () => {
    if (loginLoading) return;
    
    try {
      setLoginLoading(true);
      setError(null);
      await signInWithPopup(auth, googleProvider);
      // After login, the AuthContext will update and the useEffect above will handle redirection if no PIN is needed
      // or the UI will switch to PIN input if needed
    } catch (err: any) {
      if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') {
        setError('Login window was closed. Please try again.');
        return;
      }
      setError('Failed to login. Please try again.');
      console.error(err);
    } finally {
      setLoginLoading(false);
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await verifyPin(pinInput);
    if (success) {
      setError(null);
    } else {
      setError('Incorrect PIN. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-neon-cyan border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex h-[60vh] items-center justify-center relative">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md rounded-3xl border border-white/10 bg-dark-surface/80 backdrop-blur-xl p-8 text-center shadow-[0_0_30px_rgba(0,240,255,0.15)]"
      >
        <button 
          onClick={() => navigate('/')}
          className="absolute right-6 top-6 text-gray-400 hover:text-neon-cyan transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        {(!user || (user.email !== 'wazirusid@gmail.com')) ? (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-neon-cyan/20 border border-neon-cyan/30 text-neon-cyan shadow-[0_0_15px_rgba(0,240,255,0.3)]">
              <LogIn className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">Admin Login</h1>
            <p className="mt-2 text-gray-400">
              Sign in with your Google account to manage your portfolio.
            </p>
            
            {error && (
              <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loginLoading}
              className="mt-8 flex w-full items-center justify-center space-x-3 rounded-xl bg-white/5 border border-white/10 px-6 py-3 font-semibold text-white transition-all hover:bg-white/10 hover:border-neon-cyan/50 hover:shadow-[0_0_15px_rgba(0,240,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loginLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="h-5 w-5" />
                  <span>Sign in with Google</span>
                </>
              )}
            </button>
            
            {user && user.email !== 'wazirusid@gmail.com' && (
              <p className="mt-4 text-xs text-red-400">
                Logged in as {user.email}. This account is not authorized as admin.
              </p>
            )}
          </>
        ) : needsPin && !isPinVerified ? (
          <form onSubmit={handlePinSubmit}>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-neon-purple/20 border border-neon-purple/30 text-neon-purple shadow-[0_0_15px_rgba(176,38,255,0.3)]">
              <Lock className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">Protected Area</h1>
            <p className="mt-2 text-gray-400">
              Welcome back, {user?.displayName || 'Admin'}.<br />
              Please enter the admin PIN to continue.
            </p>
            
            {error && (
              <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="mt-8 space-y-4">
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-center text-2xl tracking-widest text-white placeholder-gray-600 focus:border-neon-purple focus:outline-none focus:ring-1 focus:ring-neon-purple transition-all"
                placeholder="••••"
                autoFocus
              />
              <button
                type="submit"
                className="flex w-full items-center justify-center space-x-3 rounded-xl bg-neon-purple/20 border border-neon-purple/50 px-6 py-3 font-semibold text-neon-purple transition-all hover:bg-neon-purple hover:text-white hover:shadow-[0_0_15px_rgba(176,38,255,0.4)]"
              >
                <span>Verify PIN</span>
              </button>
              
              <button
                type="button"
                onClick={() => auth.signOut()}
                className="w-full text-xs text-gray-500 hover:text-gray-400 transition-colors"
              >
                Sign out from {user?.email}
              </button>
            </div>
          </form>
        ) : (
          <div className="py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-neon-cyan border-t-transparent mx-auto"></div>
            <p className="mt-4 text-gray-400">Redirecting to dashboard...</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
