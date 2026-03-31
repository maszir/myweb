import React, { useState, useEffect } from 'react';
import { Globe, Monitor, Chrome, MapPin, Navigation, Loader2 } from 'lucide-react';

export default function IPDetector() {
  const [ip, setIp] = useState<string>('Loading...');
  const [os, setOs] = useState<string>('Detecting...');
  const [browser, setBrowser] = useState<string>('Detecting...');
  const [location, setLocation] = useState<string>('Detecting...');
  const [isPrecise, setIsPrecise] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch IP and Location (IP-based is usually limited to City/Province)
    fetch('https://get.geojs.io/v1/ip/geo.json')
      .then(res => res.json())
      .then(data => {
        setIp(data.ip || 'Unknown');
        
        // Build location string: City, Region (Province), Country
        const locParts = [];
        if (data.city) locParts.push(data.city);
        if (data.region) locParts.push(data.region);
        if (data.country) locParts.push(data.country);
        
        setLocation(locParts.length > 0 ? locParts.join(', ') : 'Unknown');
      })
      .catch(() => {
        // Fallback
        fetch('https://api.ipify.org?format=json')
          .then(res => res.json())
          .then(data => {
            setIp(data.ip || 'Unknown');
            setLocation('Unknown');
          })
          .catch(() => {
            setIp('Unknown');
            setLocation('Unknown');
          });
      });

    // Detect OS
    const userAgent = window.navigator.userAgent;
    let detectedOs = 'Unknown OS';
    if (userAgent.indexOf('Win') !== -1) detectedOs = 'Windows';
    if (userAgent.indexOf('Mac') !== -1) detectedOs = 'MacOS';
    if (userAgent.indexOf('X11') !== -1) detectedOs = 'UNIX';
    if (userAgent.indexOf('Linux') !== -1) detectedOs = 'Linux';
    if (userAgent.indexOf('Android') !== -1) detectedOs = 'Android';
    if (userAgent.indexOf('like Mac') !== -1) detectedOs = 'iOS';
    setOs(detectedOs);

    // Detect Browser
    let detectedBrowser = 'Unknown Browser';
    if (userAgent.indexOf('Chrome') !== -1) detectedBrowser = 'Chrome';
    if (userAgent.indexOf('Firefox') !== -1) detectedBrowser = 'Firefox';
    if (userAgent.indexOf('Safari') !== -1 && userAgent.indexOf('Chrome') === -1) detectedBrowser = 'Safari';
    if (userAgent.indexOf('Edge') !== -1) detectedBrowser = 'Edge';
    if (userAgent.indexOf('Opera') !== -1 || userAgent.indexOf('OPR') !== -1) detectedBrowser = 'Opera';
    setBrowser(detectedBrowser);
  }, []);

  const getPreciseLocation = () => {
    setLocError(null);
    if (!navigator.geolocation) {
      setLocError('GPS tidak didukung');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Reverse geocoding using OpenStreetMap Nominatim
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
          const data = await response.json();
          
          if (data && data.address) {
            const addr = data.address;
            // Try to get the most specific location parts (village, district, city, province)
            const village = addr.village || addr.suburb || addr.neighbourhood || addr.hamlet;
            const district = addr.city_district || addr.county || addr.district;
            const city = addr.city || addr.town || addr.municipality;
            const province = addr.state || addr.region;
            
            const preciseParts = [];
            if (village) preciseParts.push(village);
            if (district) preciseParts.push(district);
            if (city) preciseParts.push(city);
            if (province) preciseParts.push(province);
            
            if (preciseParts.length > 0) {
              setLocation(preciseParts.join(', '));
              setIsPrecise(true);
            } else {
              setLocation(data.display_name || 'Lokasi detail tidak ditemukan');
              setIsPrecise(true);
            }
          }
        } catch (error) {
          console.error('Error fetching precise location:', error);
          setLocError('Gagal mendapatkan detail lokasi');
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocError('Izin lokasi ditolak');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="flex flex-wrap justify-center gap-4 mt-6">
      <div className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-dark-surface/40 border border-white/5 backdrop-blur-sm">
        <Globe className="h-3 w-3 text-neon-cyan" />
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">IP:</span>
        <span className="text-[10px] font-mono text-neon-cyan font-bold">{ip}</span>
      </div>

      <div className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-dark-surface/40 border border-white/5 backdrop-blur-sm group relative">
        <MapPin className={`h-3 w-3 ${isPrecise ? 'text-green-400' : locError ? 'text-red-400' : 'text-neon-purple'}`} />
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Loc:</span>
        <span className={`text-[10px] font-mono font-bold ${isPrecise ? 'text-green-400' : locError ? 'text-red-400' : 'text-neon-purple'}`}>
          {locError ? locError : location}
        </span>
        
        {!isPrecise && !locError && (
          <button 
            onClick={getPreciseLocation}
            disabled={isLocating}
            className="ml-2 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full p-1 transition-colors disabled:opacity-50"
            title="Deteksi lokasi akurat (GPS)"
          >
            {isLocating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Navigation className="h-3 w-3" />}
          </button>
        )}
      </div>
      
      <div className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-dark-surface/40 border border-white/5 backdrop-blur-sm">
        <Monitor className="h-3 w-3 text-neon-cyan" />
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">OS:</span>
        <span className="text-[10px] font-mono text-neon-cyan font-bold">{os}</span>
      </div>

      <div className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-dark-surface/40 border border-white/5 backdrop-blur-sm">
        <Chrome className="h-3 w-3 text-neon-purple" />
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Browser:</span>
        <span className="text-[10px] font-mono text-neon-purple font-bold">{browser}</span>
      </div>
    </div>
  );
}
