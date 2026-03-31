import React, { useState } from 'react';
import { Search, MapPin, Globe, Server, Shield, Activity, Wifi, Info } from 'lucide-react';
import { motion } from 'motion/react';

export default function IPLookup({ embedded = false }: { embedded?: boolean }) {
  const [ipQuery, setIpQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipQuery.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`https://www.sankavollerei.com/tools/iplookup?apikey=planaai&q=${ipQuery.trim()}`);
      const data = await response.json();

      if (data.status) {
        setResult(data.result);
      } else {
        setError(data.message || 'Gagal menemukan data IP tersebut.');
      }
    } catch (err) {
      console.error('Error fetching IP data:', err);
      setError('Terjadi kesalahan saat menghubungi server. Pastikan koneksi internet Anda stabil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={embedded ? "w-full" : "max-w-4xl mx-auto"}>
      {!embedded && (
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-black text-white mb-4 drop-shadow-[0_0_15px_rgba(0,240,255,0.5)]">
            IP <span className="text-neon-cyan">Lookup</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Lacak dan temukan informasi detail mengenai alamat IP mana pun di seluruh dunia.
          </p>
        </div>
      )}

      <div className={`bg-dark-surface/60 border border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl backdrop-blur-xl mb-8 ${embedded ? 'border-neon-cyan/50 shadow-[0_0_30px_rgba(0,240,255,0.15)]' : ''}`}>
        {embedded && (
          <div className="flex items-center space-x-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30">
              <Globe className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-bold text-white">Lacak Alamat IP</h3>
          </div>
        )}
        
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-500" />
            </div>
            <input
              type="text"
              value={ipQuery}
              onChange={(e) => setIpQuery(e.target.value)}
              placeholder="Masukkan alamat IP (contoh: 8.8.8.8)"
              className="w-full pl-11 pr-4 py-4 bg-black/40 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 focus:border-neon-cyan text-white placeholder-gray-600 transition-all font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !ipQuery.trim()}
            className="px-8 py-4 bg-neon-cyan text-black font-black rounded-2xl hover:shadow-[0_0_20px_rgba(0,240,255,0.6)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center whitespace-nowrap"
          >
            {loading ? (
              <span className="flex items-center">
                <Activity className="animate-spin h-5 w-5 mr-2" />
                Mencari...
              </span>
            ) : (
              'Lacak IP'
            )}
          </button>
        </form>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl text-center mb-8"
        >
          {error}
        </motion.div>
      )}

      {result && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dark-surface/40 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-lg"
        >
          <div className="flex items-center mb-6 pb-4 border-b border-white/5">
            <Globe className="h-6 w-6 text-neon-cyan mr-3" />
            <h3 className="text-xl font-bold text-white">Hasil Pelacakan IP</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {Object.entries(result).map(([key, value]) => {
              // Skip complex objects or arrays for simple display
              if (typeof value === 'object' || value === null || value === '') return null;
              
              // Format key: camelCase to Title Case
              const formattedKey = key
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, (str) => str.toUpperCase());

              return (
                <InfoRow key={key} label={formattedKey} value={String(value)} highlight={key.toLowerCase() === 'ip' || key.toLowerCase() === 'query'} />
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function InfoRow({ label, value, highlight = false }: { label: string, value: string, highlight?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-white/5 last:border-0">
      <span className="text-sm text-gray-400 mb-1 sm:mb-0 capitalize">{label}</span>
      <span className={`text-sm font-medium sm:text-right break-all ${highlight ? 'text-neon-cyan font-mono font-bold' : 'text-gray-200'}`}>
        {value}
      </span>
    </div>
  );
}
