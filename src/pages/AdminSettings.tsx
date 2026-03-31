import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { db, doc, getDoc, setDoc, OperationType, handleFirestoreError } from '../firebase';
import { Settings } from '../types';
import { motion } from 'motion/react';
import { Save, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminSettings() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [showApiKey1, setShowApiKey1] = useState(false);
  const [showApiKey2, setShowApiKey2] = useState(false);
  const [showAdminPin, setShowAdminPin] = useState(false);

  const [formData, setFormData] = useState<Settings>({
    siteTitle: '',
    logoUrl: '',
    apiKey: 'planaai',
    apiKey2: '20444144e6e22f545cd0b9d2f0b8f6a26754911dee37aab2f4',
    adminPin: '',
    contactEmail: '',
    footerText: '',
    heroTitle: '',
    heroSubtitle: '',
    profileName: '',
    profileImageUrl: '',
    facebookUrl: '',
    instagramUrl: '',
    tiktokUrl: ''
  });

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/login');
      return;
    }
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (!isAdmin) return;

    const fetchSettings = async () => {
      try {
        setLoading(true);
        
        // Fetch public settings from Firestore
        const docSnap = await getDoc(doc(db, 'settings', 'global')).catch(error => {
          handleFirestoreError(error, OperationType.GET, 'settings/global');
          throw error;
        });

        // Fetch secrets from backend API (which checks the PIN)
        const pin = localStorage.getItem('adminPin') || '';
        const secretsRes = await fetch('/api/admin/secrets', {
          headers: { 'x-admin-pin': pin }
        });

        let newFormData = { ...formData };

        if (docSnap.exists()) {
          const publicData = docSnap.data() as any;
          newFormData = {
            ...newFormData,
            ...publicData,
            logoUrl: publicData.logoUrl !== undefined ? publicData.logoUrl : newFormData.logoUrl
          };
        }

        if (secretsRes.ok) {
          const secrets = await secretsRes.json();
          newFormData = {
            ...newFormData,
            apiKey: secrets.apiKey || '',
            apiKey2: secrets.apiKey2 || '',
            adminPin: secrets.adminPin || ''
          };
        } else if (secretsRes.status === 401) {
          // If unauthorized, it means the PIN in sessionStorage is wrong or missing
          navigate('/login');
          return;
        }

        setFormData(newFormData);
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      // Split public settings and private secrets
      const { apiKey, apiKey2, adminPin, ...publicSettings } = formData;
      
      // Save public settings to Firestore
      await setDoc(doc(db, 'settings', 'global'), publicSettings);
      
      // Save secrets to backend (which will also sync to Firestore if we want, but for now it saves to secrets.json)
      const pin = localStorage.getItem('adminPin') || '';
      const res = await fetch('/api/admin/secrets', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-pin': pin 
        },
        body: JSON.stringify({ apiKey, apiKey2, adminPin })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save secrets');
      }

      // Update local storage if pin was changed
      if (adminPin) {
        localStorage.setItem('adminPin', adminPin);
      } else {
        localStorage.removeItem('adminPin');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      console.error('Save error:', error);
      handleFirestoreError(error, OperationType.WRITE, 'settings/global');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">General Settings</h1>
        <p className="mt-1 text-gray-400">Configure global website information and content.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 rounded-3xl border border-white/10 bg-dark-surface/50 backdrop-blur-sm p-8 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
        <div className="grid gap-8">
          <div className="grid gap-8 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300">Site Title</label>
              <input
                type="text"
                value={formData.siteTitle}
                onChange={(e) => setFormData({ ...formData, siteTitle: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all"
                placeholder="e.g. My Portfolio"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300">Logo URL</label>
              <input
                type="text"
                value={formData.logoUrl || ''}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all"
                placeholder="https://example.com/logo.png"
              />
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300">Contact Email</label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all"
                placeholder="hello@example.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300">API Key (Sankavollerei)</label>
              <div className="relative">
                <input
                  type={showApiKey1 ? "text" : "password"}
                  value={formData.apiKey || ''}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2.5 pr-10 text-sm text-white placeholder-gray-600 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all"
                  placeholder="planaai"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey1(!showApiKey1)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white"
                >
                  {showApiKey1 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300">API Key (Velixs)</label>
              <div className="relative">
                <input
                  type={showApiKey2 ? "text" : "password"}
                  value={formData.apiKey2 || ''}
                  onChange={(e) => setFormData({ ...formData, apiKey2: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2.5 pr-10 text-sm text-white placeholder-gray-600 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all"
                  placeholder="20444144e6e22f545cd0b9d2f0b8f6a26754911dee37aab2f4"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey2(!showApiKey2)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white"
                >
                  {showApiKey2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300">Footer Text</label>
              <input
                type="text"
                value={formData.footerText}
                onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all"
                placeholder="© 2024 Portfolio"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300">Admin Login PIN</label>
              <div className="relative">
                <input
                  type={showAdminPin ? "text" : "password"}
                  value={formData.adminPin || ''}
                  onChange={(e) => setFormData({ ...formData, adminPin: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2.5 pr-10 text-sm text-white placeholder-gray-600 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all"
                  placeholder="Leave blank to disable PIN"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPin(!showAdminPin)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white"
                >
                  {showAdminPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="h-px bg-white/10"></div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-300">Hero Headline</label>
            <input
              type="text"
              value={formData.heroTitle}
              onChange={(e) => setFormData({ ...formData, heroTitle: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all"
              placeholder="Main title on the landing page"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-300">Hero Subtitle</label>
            <textarea
              rows={3}
              value={formData.heroSubtitle}
              onChange={(e) => setFormData({ ...formData, heroSubtitle: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all"
              placeholder="Short description under the headline"
            />
          </div>

          <div className="h-px bg-white/10"></div>

          <div className="grid gap-8 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300">Profile Name (Typing Animation)</label>
              <input
                type="text"
                value={formData.profileName || ''}
                onChange={(e) => setFormData({ ...formData, profileName: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all"
                placeholder="e.g. Muhammad Zir"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300">Profile Image URL</label>
              <input
                type="text"
                value={formData.profileImageUrl || ''}
                onChange={(e) => setFormData({ ...formData, profileImageUrl: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all"
                placeholder="https://example.com/avatar.png"
              />
            </div>
          </div>

          <div className="h-px bg-white/10"></div>

          <div className="grid gap-8 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300">Facebook URL</label>
              <input
                type="text"
                value={formData.facebookUrl || ''}
                onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all"
                placeholder="https://facebook.com/..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300">Instagram URL</label>
              <input
                type="text"
                value={formData.instagramUrl || ''}
                onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all"
                placeholder="https://instagram.com/..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300">TikTok URL</label>
              <input
                type="text"
                value={formData.tiktokUrl || ''}
                onChange={(e) => setFormData({ ...formData, tiktokUrl: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all"
                placeholder="https://tiktok.com/@..."
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center">
            {success && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center text-sm font-medium text-neon-cyan drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Settings saved successfully!
              </motion.div>
            )}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center rounded-xl bg-neon-cyan/10 border border-neon-cyan/50 px-8 py-3 text-sm font-semibold text-neon-cyan transition-all hover:bg-neon-cyan hover:text-black hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] disabled:opacity-50 disabled:hover:bg-neon-cyan/10 disabled:hover:text-neon-cyan disabled:hover:shadow-none"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
