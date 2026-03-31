import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider, useAuth } from './AuthContext';
import { auth, signOut, googleProvider, signInWithPopup, db, doc, onSnapshot, handleFirestoreError, OperationType } from './firebase';
import { LogIn, LogOut, LayoutDashboard, Settings as SettingsIcon, Home as HomeIcon, PlusCircle, Facebook, Instagram, Music, Globe } from 'lucide-react';
import Home from './pages/Home';
import BlogPostDetail from './pages/BlogPostDetail';
import AdminDashboard from './pages/AdminDashboard';
import AdminSettings from './pages/AdminSettings';
import AdminPlaylist from './pages/AdminPlaylist';
import IPLookup from './pages/IPLookup';
import Login from './pages/Login';
import Preloader from './components/Preloader';
import ClickEffect from './components/ClickEffect';
import { cn } from './lib/utils';
import { Settings } from './types';

// Custom hook to fetch settings globally
const useSettings = () => {
  const [settings, setSettings] = useState<Settings | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data() as Settings);
      } else {
        setSettings(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/global');
    });
    return unsubscribe;
  }, []);

  return settings;
};

const Navbar = ({ settings }: { settings: Settings | null | undefined }) => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-dark-bg/70 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[4rem] py-4 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link 
          to="/" 
          className="flex items-center space-x-2"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          {settings === undefined ? (
            <div className="h-16 w-32 animate-pulse bg-white/5 rounded-lg"></div>
          ) : settings?.logoUrl && typeof settings.logoUrl === 'string' ? (
            <img 
              src={settings.logoUrl.replace('ibb.co.com', 'ibb.co')} 
              alt={settings?.siteTitle || 'Logo'} 
              className="h-16 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="text-xl font-bold tracking-tight text-white drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]">
              {settings?.siteTitle || 'ZIR GG'}
            </span>
          )}
        </Link>
        <div className="flex items-center space-x-4">
          <Link to="/" className="text-sm font-medium text-gray-400 transition-colors hover:text-neon-cyan hover:drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]" title="Home">
            <HomeIcon className="h-5 w-5" />
          </Link>
          {isAdmin && (
            <>
              <Link to="/admin" className="text-sm font-medium text-gray-400 transition-colors hover:text-neon-cyan hover:drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]" title="Dashboard">
                <LayoutDashboard className="h-5 w-5" />
              </Link>
              <Link to="/admin/settings" className="text-sm font-medium text-gray-400 transition-colors hover:text-neon-cyan hover:drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]" title="Settings">
                <SettingsIcon className="h-5 w-5" />
              </Link>
              <Link to="/admin/playlist" className="text-sm font-medium text-gray-400 transition-colors hover:text-neon-cyan hover:drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]" title="Playlist">
                <Music className="h-5 w-5" />
              </Link>
            </>
          )}
          {user ? (
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 text-sm font-medium text-gray-400 transition-colors hover:text-neon-purple hover:drop-shadow-[0_0_8px_rgba(176,38,255,0.8)]"
            >
              <LogOut className="h-5 w-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          ) : (
            <Link
              to="/login"
              className="flex items-center space-x-1 text-sm font-medium text-gray-400 transition-colors hover:text-neon-cyan hover:drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]"
            >
              <LogIn className="h-5 w-5" />
              <span className="hidden sm:inline">Login</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

const Footer = ({ settings }: { settings: Settings | null | undefined }) => {
  return (
    <footer className="mt-20 border-t border-white/10 bg-dark-surface py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0">
          <p className="text-sm text-gray-500">
            {settings?.footerText || `© ${new Date().getFullYear()} ZIR GG. All rights reserved.`}
          </p>
          <div className="flex space-x-6">
            {settings?.facebookUrl && (
              <a 
                href={settings.facebookUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-500 transition-colors hover:text-neon-cyan hover:drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]"
                title="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
            )}
            {settings?.instagramUrl && (
              <a 
                href={settings.instagramUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-500 transition-colors hover:text-neon-cyan hover:drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]"
                title="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
            )}
            {settings?.tiktokUrl && (
              <a 
                href={settings.tiktokUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-500 transition-colors hover:text-neon-cyan hover:drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]"
                title="TikTok"
              >
                <Music className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default function App() {
  const settings = useSettings();

  return (
    <HelmetProvider>
      <AuthProvider>
        <Router>
          <Preloader />
          <ClickEffect />
          <div className="min-h-screen bg-dark-bg font-sans text-gray-100 selection:bg-neon-cyan/30 selection:text-neon-cyan relative">
            <Navbar settings={settings} />
            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/post/:id" element={<BlogPostDetail />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
                <Route path="/admin/playlist" element={<AdminPlaylist />} />
                <Route path="/iplookup" element={<IPLookup />} />
                <Route path="/login" element={<Login />} />
              </Routes>
            </main>
            <Footer settings={settings} />
          </div>
        </Router>
      </AuthProvider>
    </HelmetProvider>
  );
}
