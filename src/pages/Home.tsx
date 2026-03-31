import React, { useEffect, useState } from 'react';
import { db, collection, query, orderBy, onSnapshot, OperationType, handleFirestoreError, doc, where } from '../firebase';
import { BlogPost, Settings } from '../types';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink, Gamepad2, Wrench, Sparkles, PackageSearch, Music, Users, Heart, MessageCircle, Share2, Eye, Globe, Download, Video, FileDown, Image as ImageIcon } from 'lucide-react';
import SEO from '../components/SEO';
import TypingText from '../components/TypingText';
import Clock from '../components/Clock';
import IPDetector from '../components/IPDetector';
import VisitorCounter from '../components/VisitorCounter';
import MusicPlayer from '../components/MusicPlayer';
import IPLookup from './IPLookup';
import { safeStringify } from '../lib/utils';

export default function Home() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  // Category states
  const [selectedCategory, setSelectedCategory] = useState('game');
  const [selectedBlogCategory, setSelectedBlogCategory] = useState('All');
  const [selectedTag, setSelectedTag] = useState('All');

  const filteredPosts = posts.filter(post => {
    const matchesCategory = selectedBlogCategory === 'All' || post.category === selectedBlogCategory;
    const matchesTag = selectedTag === 'All' || post.tags?.includes(selectedTag);
    return matchesCategory && matchesTag;
  });

  const blogCategories = ['All', ...new Set(posts.map(post => post.category).filter(Boolean) as string[])];
  const blogTags = ['All', ...new Set(posts.flatMap(post => post.tags || []).filter(Boolean) as string[])];

  // Game Checker states
  const [selectedGame, setSelectedGame] = useState('mlbb');
  const [checkUid, setCheckUid] = useState('');
  const [checkZone, setCheckZone] = useState('');
  const [checkResult, setCheckResult] = useState<any>(null);
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkError, setCheckError] = useState('');

  // Resi Checker states
  const [resiInput, setResiInput] = useState('');
  const [selectedCourier, setSelectedCourier] = useState('shopee-express');
  const [resiResult, setResiResult] = useState<any>(null);
  const [resiLoading, setResiLoading] = useState(false);
  const [resiError, setResiError] = useState('');

  // TikTok Stalker states
  const [tiktokUsername, setTiktokUsername] = useState('');
  const [tiktokResult, setTiktokResult] = useState<any>(null);
  const [tiktokLoading, setTiktokLoading] = useState(false);
  const [tiktokError, setTiktokError] = useState('');

  // Downloader states
  const [downloadUrl, setDownloadUrl] = useState('');
  const [selectedDownloadType, setSelectedDownloadType] = useState('aio');
  const [downloadResult, setDownloadResult] = useState<any>(null);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  const CATEGORIES = [
    { id: 'game', name: 'Game Tools', icon: Gamepad2 },
    { id: 'utility', name: 'CEK RESI', icon: PackageSearch },
    { id: 'social', name: 'Social Stalk', icon: Music },
    { id: 'downloader', name: 'Downloader', icon: Download },
    { id: 'iplookup', name: 'IP Lookup', icon: Globe },
    { id: 'other', name: 'Other Tools', icon: Sparkles }
  ];

  const DOWNLOAD_TYPES = [
    { id: 'aio', name: 'All In One' },
    { id: 'instagram', name: 'Instagram' }
  ];

  const GAMES = [
    { id: 'mlbb', name: 'Mobile Legends (v1)', needsZone: true, provider: 'sanka' },
    { id: 'mlbb2', name: 'Mobile Legends (v2)', needsZone: true, provider: 'velixs' },
    { id: 'freefire', name: 'Free Fire', needsZone: false, provider: 'velixs' },
    { id: 'codm', name: 'Call of Duty Mobile', needsZone: false, provider: 'velixs' },
    { id: 'aov', name: 'Arena of Valor', needsZone: false, provider: 'velixs' }
  ];

  const COURIERS = [
    { id: 'shopee-express', name: 'Shopee Express' },
    { id: 'ninja', name: 'Ninja Xpress' },
    { id: 'lion-parcel', name: 'Lion Parcel' },
    { id: 'pos-indonesia', name: 'POS Indonesia' },
    { id: 'tiki', name: 'TIKI' },
    { id: 'acommerce', name: 'aCommerce' },
    { id: 'gtl-goto-logistics', name: 'GoTo Logistics (GTL)' },
    { id: 'paxel', name: 'Paxel' },
    { id: 'sap-express', name: 'SAP Express' },
    { id: 'indah-logistik-cargo', name: 'Indah Logistik Cargo' },
    { id: 'lazada-express-lex', name: 'Lazada Express (LEX)' },
    { id: 'lazada-logistics', name: 'Lazada Logistics' },
    { id: 'janio-asia', name: 'Janio Asia' },
    { id: 'jet-express', name: 'JET Express' },
    { id: 'pcp-express', name: 'PCP Express' },
    { id: 'pt-ncs', name: 'NCS' },
    { id: 'nss-express', name: 'NSS Express' },
    { id: 'grab-express', name: 'Grab Express' },
    { id: 'rcl-red-carpet-logistics', name: 'Red Carpet Logistics' },
    { id: 'qrim-express', name: 'QRIM Express' },
    { id: 'ark-xpress', name: 'ARK Xpress' },
    { id: 'standard-express-lwe', name: 'Standard Express (LWE)' },
    { id: 'luar-negeri-bea-cukai', name: 'Luar Negeri (Bea Cukai)' }
  ];

  const handleGameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedGame(e.target.value);
    setCheckResult(null);
    setCheckError('');
    setCheckUid('');
    setCheckZone('');
  };

  const handleCheckSubmit = async () => {
    if (!checkUid) {
      setCheckError('User ID harus diisi');
      return;
    }
    const game = GAMES.find(g => g.id === selectedGame);
    if (game?.needsZone && !checkZone) {
      setCheckError('Zone ID harus diisi');
      return;
    }

    setCheckLoading(true);
    setCheckError('');
    setCheckResult(null);

    try {
      let response;
      if (game?.provider === 'sanka') {
        response = await fetch(`/api/check-ml?uid=${checkUid}&zone=${checkZone}`);
      } else {
        response = await fetch(`/api/check-game?game=${selectedGame}&uid=${checkUid}&zone=${checkZone}`);
      }
      const data = await response.json();
      setCheckResult(data);
    } catch (err) {
      setCheckError('Gagal mengecek ID. Coba lagi nanti.');
      console.error(err);
    } finally {
      setCheckLoading(false);
    }
  };

  const renderGameResult = (result: any, uid: string, zone: string) => {
    if (!result) return null;
    if (typeof result === 'string') return <p className="text-neon-cyan font-bold text-center">{result}</p>;
    
    const payload = (typeof result.result === 'object' && result.result !== null) ? result.result : (result.data || result);
    const nickname = payload.username || payload.userName || payload.nickname || payload.name || (typeof result.result === 'string' ? result.result : null);
    const errorMsg = result.error || result.message || (result.status === false ? "ID tidak ditemukan" : null);

    if (errorMsg && !nickname) {
      return <p className="text-sm text-red-400 text-center">{errorMsg}</p>;
    }

    if (nickname) {
      return (
        <div className="space-y-4">
          <div className="text-center border-b border-white/10 pb-4">
            <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Nickname Ditemukan</p>
            <p className="text-2xl font-bold text-neon-cyan drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]">
              {nickname}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              UID: {payload.uid || uid} {zone && `• Zone: ${payload.zone || zone}`}
              {payload.region && ` • Region: ${payload.region}`}
            </p>
          </div>
          
          {payload.first_recharge_bonus && Array.isArray(payload.first_recharge_bonus) && (
            <div>
              <p className="text-xs text-neon-purple mb-3 uppercase tracking-wider font-semibold text-center">First Recharge Bonus</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {payload.first_recharge_bonus.map((bonus: any, idx: number) => (
                  <div 
                    key={idx} 
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs font-medium transition-all ${
                      bonus.available 
                        ? 'bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan shadow-[0_0_10px_rgba(0,240,255,0.1)]' 
                        : 'bg-gray-800/50 border-gray-700 text-gray-500'
                    }`}
                  >
                    <span>{bonus.title}</span>
                    <span className="text-[10px] mt-1 opacity-80">{bonus.available ? 'Tersedia' : 'Sudah Diklaim'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="text-left space-y-2 w-full">
        <p className="text-xs text-neon-cyan mb-3 border-b border-neon-cyan/20 pb-2 uppercase tracking-wider font-semibold">Detail Akun</p>
        {Object.entries(payload).map(([key, value]) => {
          if (typeof value === 'object' || typeof value === 'function') return null;
          return (
            <div key={key} className="flex justify-between text-sm border-b border-white/5 pb-2">
              <span className="text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}</span>
              <span className="text-white font-medium text-right">{String(value)}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderTiktokResult = (result: any) => {
    if (!result) return null;

    // Handle different API response structures
    const payload = result.result || result.data || result;
    const user = payload.user || payload;
    const stats = payload.stats || payload;

    // Debug log to help identify the structure if it still fails
    console.log('TikTok Stalker Result:', result);

    const tiktokId = user.id || user.userId || user.uid || user.unique_id || user.uniqueId || 'Unknown';
    const nickname = user.nickname || user.name || user.nickName || user.display_name || 'Unknown';
    const uniqueId = user.uniqueId || user.username || user.unique_id || user.id || 'Unknown';
    const avatar = user.avatar || user.avatarThumb || user.avatarLarger || user.avatar_thumb || user.avatar_medium || `https://ui-avatars.com/api/?name=${nickname}&background=random`;
    const signature = user.signature || user.bio || user.desc || user.description || '';
    const region = user.region || user.country || user.location || user.country_code || user.countryCode || payload.region || payload.country || 'Unknown';
    const language = user.language || user.lang || user.language_code || 'Unknown';
    const verified = user.verified || user.is_verified || user.isVerified || false;

    const followers = stats.followerCount || stats.followers || stats.follower_count || stats.follower || user.followerCount || user.followers || 0;
    const hearts = stats.heartCount || stats.hearts || stats.heart || stats.diggCount || stats.likes || stats.heart_count || user.heartCount || user.hearts || 0;
    const following = stats.followingCount || stats.following || stats.following_count || stats.following_user || user.followingCount || user.following || 0;
    const videos = stats.videoCount || stats.videos || stats.video_count || stats.video || stats.aweme_count || stats.awemeCount || stats.total_videos || stats.totalVideos || stats.post_count || stats.postCount || user.videoCount || user.videos || user.aweme_count || 0;

    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-neon-cyan/20 blur-md"></div>
            <img 
              src={avatar} 
              alt={nickname} 
              className="relative h-24 w-24 rounded-full border-2 border-neon-cyan object-cover shadow-[0_0_15px_rgba(0,240,255,0.3)]"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h4 className="text-xl font-bold text-white">{nickname}</h4>
            <p className="text-neon-cyan text-sm font-medium">@{uniqueId}</p>
            <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest font-bold">ID: {tiktokId}</p>
          </div>
          {signature && (
            <p className="text-gray-400 text-sm max-w-md italic">"{signature}"</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl bg-black/40 border border-white/5 p-3 text-center transition-all hover:border-neon-cyan/30">
            <div className="flex justify-center mb-1 text-neon-cyan">
              <Users className="h-4 w-4" />
            </div>
            <div className="text-lg font-bold text-white">{Number(followers).toLocaleString()}</div>
            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Followers</div>
          </div>
          <div className="rounded-xl bg-black/40 border border-white/5 p-3 text-center transition-all hover:border-neon-purple/30">
            <div className="flex justify-center mb-1 text-neon-purple">
              <Heart className="h-4 w-4" />
            </div>
            <div className="text-lg font-bold text-white">{Number(hearts).toLocaleString()}</div>
            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Hearts</div>
          </div>
          <div className="rounded-xl bg-black/40 border border-white/5 p-3 text-center transition-all hover:border-neon-cyan/30">
            <div className="flex justify-center mb-1 text-neon-cyan">
              <Users className="h-4 w-4" />
            </div>
            <div className="text-lg font-bold text-white">{Number(following).toLocaleString()}</div>
            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Following</div>
          </div>
          <div className="rounded-xl bg-black/40 border border-white/5 p-3 text-center transition-all hover:border-neon-purple/30">
            <div className="flex justify-center mb-1 text-neon-purple">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="text-lg font-bold text-white">{Number(videos).toLocaleString()}</div>
            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Total Videos</div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-xl bg-black/40 border border-white/5 p-4">
            <div className="flex items-center space-x-3">
              <div className="text-neon-cyan">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="text-sm text-gray-300">Verified Account</span>
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${verified ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>
              {verified ? 'YES' : 'NO'}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-black/40 border border-white/5 p-4">
            <div className="flex items-center space-x-3">
              <div className="text-neon-purple">
                <Globe className="h-5 w-5" />
              </div>
              <span className="text-sm text-gray-300">Region / Lang</span>
            </div>
            <span className="text-xs font-bold text-white bg-white/5 px-2 py-1 rounded-full border border-white/10">
              {region} / {language}
            </span>
          </div>
        </div>

        {/* Debug Raw Data Toggle (Optional, but helpful for debugging) */}
        <details className="mt-4">
          <summary className="text-[10px] text-gray-600 cursor-pointer hover:text-gray-400 transition-colors uppercase tracking-widest font-bold">Show Raw Data</summary>
          <pre className="mt-2 p-4 bg-black/50 rounded-xl border border-white/5 text-[10px] text-gray-500 overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </details>
        
        <a 
          href={`https://www.tiktok.com/@${uniqueId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center py-3 rounded-xl bg-neon-cyan/10 border border-neon-cyan/50 text-neon-cyan font-bold transition-all hover:bg-neon-cyan hover:text-black shadow-[0_0_15px_rgba(0,240,255,0.2)]"
        >
          View Profile on TikTok
        </a>
      </div>
    );
  };

  const handleResiSubmit = async () => {
    if (!resiInput) {
      setResiError('Nomor resi harus diisi');
      return;
    }
    setResiLoading(true);
    setResiError('');
    setResiResult(null);

    try {
      const response = await fetch(`/api/check-resi?resi=${resiInput}&kurir=${selectedCourier}`);
      const data = await response.json();
      
      if (data.error || data.status === false || data.status === 400) {
        setResiError(data.error || data.message || 'Gagal mengecek resi');
      } else {
        setResiResult(data);
      }
    } catch (err) {
      setResiError('Terjadi kesalahan saat menghubungi server');
    } finally {
      setResiLoading(false);
    }
  };

  const handleTiktokSubmit = async () => {
    if (!tiktokUsername) {
      setTiktokError('Username TikTok harus diisi');
      return;
    }

    setTiktokLoading(true);
    setTiktokError('');
    setTiktokResult(null);

    try {
      const response = await fetch(`/api/stalk-tiktok?username=${tiktokUsername}`);
      const data = await response.json();
      
      if (data.status === 'success' || data.result) {
        setTiktokResult(data.result || data);
      } else {
        setTiktokError(data.message || 'Gagal melakukan stalking TikTok. Pastikan username benar.');
      }
    } catch (error) {
      console.error('Error stalking TikTok:', error);
      setTiktokError('Gagal melakukan stalking TikTok. Silakan coba lagi nanti.');
    } finally {
      setTiktokLoading(false);
    }
  };

  const handleDownloadSubmit = async () => {
    if (!downloadUrl) {
      setDownloadError('URL harus diisi');
      return;
    }

    setDownloadLoading(true);
    setDownloadError('');
    setDownloadResult(null);

    try {
      const response = await fetch(`/api/download?type=${selectedDownloadType}&url=${encodeURIComponent(downloadUrl)}`);
      const data = await response.json();
      
      if (data.status === 'success' || data.result || data.data || data.url || data.links) {
        setDownloadResult(data.result || data.data || data);
      } else {
        setDownloadError(data.message || 'Gagal mengunduh. Pastikan URL benar.');
      }
    } catch (error) {
      console.error('Error downloading:', error);
      setDownloadError('Gagal mengunduh. Silakan coba lagi nanti.');
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      // Use our server-side proxy to bypass CORS and force download
      const proxyUrl = `/api/proxy-download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
      
      // We use fetch to the proxy first so we can catch errors (like if the proxy returns 400 HTML error)
      // Since the proxy is on the same origin, this won't have CORS issues
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Download failed with status ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error('The downloaded file appears to be a webpage instead of media. The source link might be invalid.');
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);
    } catch (error) {
      console.error('Download failed:', error);
      alert(error instanceof Error ? error.message : 'Download failed. The media source might be protected or invalid.');
    }
  };

  const renderDownloaderResult = (result: any) => {
    if (!result) return null;

    const payload = result.result || result.data || result;
    
    // Handle array of results (e.g. Spotify playlist or multiple images)
    // More robust detection of items list
    let rawItems = Array.isArray(payload) 
      ? payload 
      : (payload.items || payload.list || payload.medias || payload.media || payload.urls || payload.links || payload.data || payload.images || payload.videos || payload.result || (payload.url ? [payload] : null));
    
    if (rawItems && !Array.isArray(rawItems)) {
      rawItems = [rawItems];
    }
    
    const items = rawItems || [];

    const renderItem = (item: any, index?: number) => {
      const isStringItem = typeof item === 'string';
      const title = item.title || item.caption || item.desc || item.description || item.alt || (index !== undefined ? `Item ${index + 1}` : 'Download Result');
      
      // Helper to check if a URL is likely a media file and not a webpage
      const isMediaUrl = (url: string) => {
        if (!url || typeof url !== 'string' || !url.startsWith('http')) return false;
        const lowerUrl = url.toLowerCase();
        
        // Exclude common social media post patterns that are NOT direct media links
        // These are webpages, not files.
        const postPatterns = [
          'pinterest.com/pin/',
          'pin.it/',
          'instagram.com/p/',
          'instagram.com/reels/',
          'instagram.com/tv/',
          'facebook.com/watch',
          'facebook.com/reels',
          'facebook.com/story',
          'tiktok.com/@',
          'twitter.com/',
          'x.com/',
          'threads.net/post/',
          'youtube.com/watch',
          'youtu.be/'
        ];
        if (postPatterns.some(p => lowerUrl.includes(p))) return false;
        
        // If it contains common media CDN subdomains, it's definitely a media URL
        const mediaCDNs = [
          'pinimg.com', 
          'fbcdn.net', 
          'twimg.com', 
          'cdninstagram.com', 
          'ttwstatic.com', 
          'tiktokcdn.com', 
          'v.pinimg.com', 
          'i.pinimg.com', 
          'scontent', 
          'cdninstagram',
          'googlevideo.com',
          'ytimg.com',
          'media.tumblr.com'
        ];
        if (mediaCDNs.some(cdn => lowerUrl.includes(cdn))) return true;

        // If it has a common media extension at the end of the path
        const mediaExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.mp3', '.m4a', '.m3u8', '.mov', '.avi', '.m4v', '.wav'];
        const urlPath = lowerUrl.split('?')[0];
        if (mediaExtensions.some(ext => urlPath.endsWith(ext))) return true;

        // If it's a direct link from a known downloader API result field that usually contains media
        // AND it doesn't look like a typical webpage
        if (lowerUrl.includes('video') || lowerUrl.includes('image') || lowerUrl.includes('media') || lowerUrl.includes('download')) {
           // Double check it's not a known post domain
           const postDomains = ['pinterest.com', 'instagram.com', 'facebook.com', 'tiktok.com', 'twitter.com', 'x.com', 'youtube.com', 'youtu.be'];
           if (postDomains.some(d => lowerUrl.includes(d) && !lowerUrl.includes('cdn') && !lowerUrl.includes('static'))) {
             return false;
           }
           return true;
        }

        return false;
      };

      const rawThumbnail = item.thumbnail || item.thumb || item.cover || item.image || item.picture || item.img || item.preview || item.display_url || item.src || item.media_url || item.url || '';
      const thumbnail = isMediaUrl(rawThumbnail) ? rawThumbnail : '';
      
      const author = item.author || item.creator || item.owner || item.user || '';
      
      // Media links extraction
      const links = item.links || item.urls || item.download || item.downloads || item.medias || item.media || item.sources || item.media_url || item.result || [];
      
      const rawVideoUrl = item.video || item.mp4 || item.url || item.link || item.download_url || item.source || item.media_url || item.result || (isStringItem && item.startsWith('http') ? item : '');
      const videoUrl = isMediaUrl(rawVideoUrl) ? rawVideoUrl : '';
      
      const rawAudioUrl = item.audio || item.mp3 || item.music || item.audio_url || item.audio_link || '';
      const audioUrl = isMediaUrl(rawAudioUrl) ? rawAudioUrl : '';

      // Determine if it's likely a video or image
      const type = (item.type || '').toLowerCase();
      const isVideo = type.includes('video') || 
                      (typeof videoUrl === 'string' && (
                        videoUrl.toLowerCase().includes('.mp4') || 
                        videoUrl.toLowerCase().includes('.mov') || 
                        videoUrl.toLowerCase().includes('.m3u8') || 
                        videoUrl.toLowerCase().includes('video') ||
                        videoUrl.toLowerCase().includes('googlevideo')
                      ));
      const isAudio = type.includes('audio') || 
                      (typeof audioUrl === 'string' && (audioUrl.toLowerCase().includes('.mp3') || audioUrl.toLowerCase().includes('audio'))) ||
                      (typeof videoUrl === 'string' && videoUrl.toLowerCase().includes('.mp3'));

      // If we have a single URL but no links array, try to make it an array
      const allLinks = Array.isArray(links) ? [...links] : [];
      
      // If we have no links but we have a medias array in the root (sometimes payload is the item)
      const finalLinks = (allLinks.length > 0 ? allLinks : (Array.isArray(item.medias) ? item.medias : (Array.isArray(item.media) ? item.media : (typeof item.medias === 'object' && item.medias !== null ? Object.entries(item.medias).map(([k, v]: [string, any]) => ({ url: v.url || v, type: k })) : (item.url ? [{ url: item.url, type: isVideo ? 'Video' : 'Image' }] : [])))))
        .filter((l: any) => {
          const u = l.url || l.link || (typeof l === 'string' ? l : '');
          return isMediaUrl(u);
        });

      // Aggressive preview selection
      const getBestPreview = () => {
        let url = '';
        if (thumbnail && typeof thumbnail === 'string' && thumbnail.startsWith('http')) {
          url = thumbnail;
        } else if (!isVideo && videoUrl && typeof videoUrl === 'string' && videoUrl.startsWith('http')) {
          url = videoUrl;
        } else if (Array.isArray(finalLinks)) {
          const imgLink = finalLinks.find((l: any) => {
            const u = l.url || l.link || (typeof l === 'string' ? l : '');
            return u && typeof u === 'string' && u.startsWith('http') && (u.match(/\.(jpeg|jpg|gif|png|webp|bmp)$/i) || (l.type && l.type.includes('image')));
          });
          if (imgLink) {
            url = imgLink.url || imgLink.link || (typeof imgLink === 'string' ? imgLink : '');
          }
        }
        
        if (!url || typeof url !== 'string' || !url.startsWith('http')) {
          url = (typeof thumbnail === 'string' ? thumbnail : '') || (typeof videoUrl === 'string' ? videoUrl : '');
        }
        
        // Use weserv.nl proxy for Instagram/Facebook/Twitter/TikTok/Pinterest images to bypass hotlinking protection
        if (url && typeof url === 'string' && url.startsWith('http') && !isVideo) {
          const lowerUrl = url.toLowerCase();
          if (lowerUrl.includes('instagram.com') || lowerUrl.includes('fbcdn.net') || lowerUrl.includes('twimg.com') || lowerUrl.includes('tiktokcdn.com') || lowerUrl.includes('ttwstatic.com') || lowerUrl.includes('pinimg.com') || lowerUrl.includes('pinterest.com')) {
            return `https://images.weserv.nl/?url=${encodeURIComponent(url)}&default=${encodeURIComponent(url)}`;
          }
        }
        
        return url;
      };

      const previewUrl = getBestPreview();

      return (
        <div key={index} className="bg-black/40 rounded-2xl border border-white/10 p-5 space-y-6 transition-all hover:border-neon-purple/30">
          {/* Media Preview */}
          <div className="w-full rounded-xl overflow-hidden border border-white/10 bg-black/60 shadow-2xl">
            {isVideo && videoUrl && typeof videoUrl === 'string' && videoUrl.startsWith('http') ? (
              <video 
                src={videoUrl} 
                controls 
                className="w-full aspect-video object-contain bg-black"
                poster={thumbnail}
              >
                Your browser does not support the video tag.
              </video>
            ) : previewUrl && typeof previewUrl === 'string' && previewUrl.startsWith('http') ? (
              <img 
                src={previewUrl} 
                alt={title} 
                className="w-full h-auto max-h-[500px] object-contain mx-auto"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
            ) : (
              <div className="aspect-video flex items-center justify-center text-gray-700">
                {isAudio ? <Music className="w-12 h-12 opacity-20" /> : <Video className="w-12 h-12 opacity-20" />}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-xl font-bold text-white leading-tight">{title}</h4>
              {author && (
                <p className="text-sm text-neon-cyan font-bold uppercase tracking-wider flex items-center opacity-80">
                  <Users className="w-4 h-4 mr-2" />
                  {author}
                </p>
              )}
            </div>
            
            <div className="flex flex-wrap gap-3 pt-2">
              {/* Direct Media Link */}
              {videoUrl && typeof videoUrl === 'string' && videoUrl.startsWith('http') && (
                <button 
                  onClick={() => handleDownload(videoUrl, `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${isAudio ? 'mp3' : isVideo ? 'mp4' : 'media'}`)}
                  className={`flex items-center px-6 py-3 rounded-xl border text-sm font-black uppercase tracking-widest transition-all shadow-lg ${
                    isAudio 
                      ? 'bg-neon-purple/20 border-neon-purple/50 text-neon-purple hover:bg-neon-purple hover:text-black shadow-neon-purple/20' 
                      : isVideo
                        ? 'bg-neon-cyan/20 border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan hover:text-black shadow-neon-cyan/20'
                        : 'bg-white/10 border-white/30 text-white hover:bg-white hover:text-black'
                  }`}
                >
                  {isAudio ? <Music className="w-4 h-4 mr-2" /> : isVideo ? <Video className="w-4 h-4 mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                  Download {isAudio ? 'Audio' : isVideo ? 'Video' : 'Media'}
                </button>
              )}

              {/* Direct Audio Link (if separate) */}
              {audioUrl && typeof audioUrl === 'string' && audioUrl.startsWith('http') && audioUrl !== videoUrl && (
                <button 
                  onClick={() => handleDownload(audioUrl, `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_audio.mp3`)}
                  className="flex items-center px-6 py-3 rounded-xl bg-neon-purple/20 border border-neon-purple/50 text-neon-purple text-sm font-black uppercase tracking-widest hover:bg-neon-purple hover:text-black transition-all shadow-[0_0_20px_rgba(176,38,255,0.2)]"
                >
                  <Music className="w-4 h-4 mr-2" />
                  Download Audio
                </button>
              )}

              {/* Array of Links (including medias) */}
              {Array.isArray(finalLinks) && finalLinks.map((link: any, idx: number) => {
                const lUrl = link.url || link.link || link.download_url || (typeof link === 'string' ? link : '');
                if (!lUrl || typeof lUrl !== 'string' || !lUrl.startsWith('http')) return null;
                
                // Avoid duplicate buttons if videoUrl/audioUrl already handled it
                if (lUrl === videoUrl || lUrl === audioUrl) return null;

                const lType = link.type || link.quality || link.name || (lUrl.includes('.mp3') ? 'Audio' : lUrl.includes('.mp4') ? 'Video' : `Download ${idx + 1}`);
                const isAudio = lType.toLowerCase().includes('audio') || lType.toLowerCase().includes('mp3');
                const isVideo = lType.toLowerCase().includes('video') || lType.toLowerCase().includes('mp4') || lType.toLowerCase().includes('hd');
                const ext = isAudio ? 'mp3' : isVideo ? 'mp4' : 'media';
                
                return (
                  <button 
                    key={idx}
                    onClick={() => handleDownload(lUrl, `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${idx + 1}.${ext}`)}
                    className={`flex items-center px-6 py-3 rounded-xl border text-sm font-black uppercase tracking-widest transition-all ${
                      isAudio 
                        ? 'bg-neon-purple/10 border-neon-purple/30 text-neon-purple hover:bg-neon-purple hover:text-black' 
                        : isVideo
                          ? 'bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan hover:text-black'
                          : 'bg-white/5 border-white/20 text-white hover:bg-white hover:text-black'
                    }`}
                  >
                    {isAudio ? <Music className="w-4 h-4 mr-2" /> : isVideo ? <Video className="w-4 h-4 mr-2" /> : <FileDown className="w-4 h-4 mr-2" />}
                    {lType}
                  </button>
                );
              })}

              {/* Fallback: Search object for any HTTP links if nothing found yet */}
              {!videoUrl && !audioUrl && (!Array.isArray(finalLinks) || finalLinks.length === 0) && typeof item === 'object' && (
                Object.entries(item).map(([key, value]: [string, any]) => {
                  if (typeof value === 'string' && value.startsWith('http') && isMediaUrl(value) && !['thumbnail', 'thumb', 'cover', 'image', 'picture', 'img', 'avatar', 'profile'].includes(key.toLowerCase())) {
                    return (
                      <button 
                        key={key}
                        onClick={() => handleDownload(value, `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${key}.media`)}
                        className="flex items-center px-6 py-3 rounded-xl bg-white/5 border border-white/20 text-white text-sm font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                      >
                        <FileDown className="w-4 h-4 mr-2" />
                        {key.replace(/_/g, ' ')}
                      </button>
                    );
                  }
                  return null;
                })
              )}
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-6 w-full">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-black text-neon-purple uppercase tracking-[0.2em] flex items-center">
            <Download className="w-4 h-4 mr-2" />
            Download Ready
          </h4>
          {items && (
            <span className="text-[10px] font-bold text-gray-500 bg-white/5 px-2 py-1 rounded-md border border-white/10 uppercase tracking-widest">
              {items.length} Items Found
            </span>
          )}
        </div>

        <div className="space-y-6">
          {items ? (
            items.map((item: any, idx: number) => renderItem(item, idx))
          ) : (
            renderItem(payload)
          )}
        </div>
      </div>
    );
  };

  const renderResiResult = (result: any) => {
    if (!result) return null;
    
    // Check if there is data object
    const data = result.result || result.data || result;
    const history = data.history || [];
    
    // Extract summary fields
    const summary = {
      "Ekspedisi": data.expedition || data.courier || "-",
      "No. Resi": data.receipt_number || data.awb || "-",
      "Status": data.status || "-",
      "Tgl Pengiriman": data.delivery_date || data.date || "-",
      "Posisi Terakhir": data.last_position || data.location || "-"
    };

    const isDelivered = summary.Status.toLowerCase().includes('delivered') || summary.Status.toLowerCase().includes('berhasil');
    
    return (
      <div className="text-left space-y-6 w-full">
        {/* Summary Card */}
        <div className="bg-black/40 p-5 rounded-2xl border border-white/10 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-neon-purple/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
          
          <div className="flex items-center justify-between mb-6 relative z-10">
            <h4 className="text-sm font-bold text-neon-purple uppercase tracking-wider flex items-center">
              <PackageSearch className="w-4 h-4 mr-2" />
              Detail Pengiriman
            </h4>
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
              isDelivered 
                ? 'bg-green-500/10 text-green-400 border-green-500/30' 
                : 'bg-neon-purple/10 text-neon-purple border-neon-purple/30'
            }`}>
              {summary.Status}
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
            {Object.entries(summary).map(([key, value]) => {
              if (key === 'Status') return null; // Already shown in badge
              return (
                <div key={key} className="flex flex-col space-y-1">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">{key}</span>
                  <span className="text-sm text-white font-medium">{String(value)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* History Section */}
        {history.length > 0 ? (
          <div className="bg-black/20 p-5 rounded-2xl border border-white/5">
            <h4 className="text-sm font-bold text-gray-300 mb-6 uppercase tracking-wider">Riwayat Perjalanan</h4>
            <div className="space-y-0 pl-4 border-l-2 border-neon-purple/20 ml-2 relative">
              {history.map((item: any, idx: number) => (
                <div key={idx} className="relative pl-6 pb-6 last:pb-0">
                  {/* Timeline dot */}
                  <div className={`absolute -left-[25px] top-1 h-3 w-3 rounded-full border-2 border-dark-surface ${
                    idx === 0 
                      ? 'bg-neon-purple shadow-[0_0_10px_rgba(176,38,255,0.8)]' 
                      : 'bg-gray-600'
                  }`}></div>
                  
                  <div className={`flex flex-col ${idx === 0 ? 'opacity-100' : 'opacity-60 hover:opacity-100 transition-opacity'}`}>
                    <span className={`text-xs font-bold mb-1 ${idx === 0 ? 'text-neon-purple' : 'text-gray-400'}`}>
                      {item.date || item.time || ''}
                    </span>
                    <span className="text-sm text-gray-200 leading-relaxed">
                      {item.desc || item.description || item.status || safeStringify(item)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          !data.expedition && (
            <div className="text-sm text-gray-300 space-y-2">
              <pre className="whitespace-pre-wrap font-mono text-xs bg-black/30 p-4 rounded-lg border border-white/5 overflow-x-auto">
                {safeStringify(result)}
              </pre>
            </div>
          )
        )}
      </div>
    );
  };

  useEffect(() => {
    const q = query(
      collection(db, 'posts'), 
      where('status', '==', 'published'),
      orderBy('createdAt', 'desc')
    );
    const unsubscribePosts = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));
      setPosts(postsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'posts');
    });

    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data() as Settings);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/global');
    });

    return () => {
      unsubscribePosts();
      unsubscribeSettings();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-20">
      <SEO />
      {/* Hero Section */}
      <section className="py-20 text-center relative">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(0,240,255,0.15),transparent_50%)]"></div>
        
        {/* Profile Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-10 flex flex-col items-center space-y-12"
        >
          <div className="flex flex-col items-center">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-neon-cyan to-neon-purple rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative h-40 w-40 rounded-full border-2 border-white/10 overflow-hidden bg-black/50">
                <img 
                  src={settings?.profileImageUrl || "https://picsum.photos/seed/avatar/200/200"} 
                  alt="Profile" 
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <div className="mt-4 h-8">
              <TypingText 
                text={settings?.profileName || "Muhammad Zir ."} 
                className="text-xl font-bold text-white tracking-widest uppercase"
                speed={150}
                startDelay={2000}
              />
            </div>
          </div>

          {/* Clock */}
          <div className="w-full max-w-2xl space-y-6">
            <Clock />
            <MusicPlayer />
            <IPDetector />
          </div>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-bold tracking-tight sm:text-7xl text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-purple drop-shadow-[0_0_15px_rgba(0,240,255,0.3)]"
        >
          {settings?.heroTitle || "Showcasing Creative Excellence"}
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-gray-400"
        >
          {settings?.heroSubtitle || "A collection of projects that blend design, technology, and purpose."}
        </motion.p>
      </section>

      {/* Tools Section */}
      <section className="mt-20">
        <div className="mb-12 flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">Tools Categories</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-neon-purple/50 to-transparent mx-8 hidden sm:block"></div>
        </div>
        
        {/* Category Pills */}
        <div className="flex flex-wrap gap-4 mb-10 justify-center">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-full border transition-all ${
                  isActive 
                    ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan shadow-[0_0_15px_rgba(0,240,255,0.3)]' 
                    : 'bg-dark-surface/50 border-white/10 text-gray-400 hover:text-white hover:border-white/30'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-semibold tracking-wide">{cat.name}</span>
              </button>
            );
          })}
        </div>

        <div className="max-w-2xl mx-auto">
          {selectedCategory === 'game' && (
            <div className="relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-dark-surface/50 backdrop-blur-sm p-6 transition-all hover:border-neon-cyan/50 hover:shadow-[0_0_30px_rgba(0,240,255,0.15)]">
              <div className="flex items-center space-x-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30">
                  <Gamepad2 className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-white">Game ID Checker</h3>
              </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-400">Pilih Game</label>
                <select
                  value={selectedGame}
                  onChange={handleGameChange}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2 text-sm text-white focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all appearance-none"
                >
                  {GAMES.map(game => (
                    <option key={game.id} value={game.id} className="bg-dark-surface text-white">
                      {game.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400">User ID</label>
                <input
                  type="text"
                  value={checkUid}
                  onChange={(e) => setCheckUid(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2 text-sm text-white placeholder-gray-600 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all"
                  placeholder="Masukkan User ID"
                />
              </div>
              
              {GAMES.find(g => g.id === selectedGame)?.needsZone && (
                <div>
                  <label className="text-xs font-semibold text-gray-400">Zone ID</label>
                  <input
                    type="text"
                    value={checkZone}
                    onChange={(e) => setCheckZone(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2 text-sm text-white placeholder-gray-600 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all"
                    placeholder="Masukkan Zone ID"
                  />
                </div>
              )}
              
              <button
                onClick={handleCheckSubmit}
                disabled={checkLoading}
                className="w-full rounded-xl bg-neon-cyan/20 border border-neon-cyan/50 px-4 py-2 text-sm font-semibold text-neon-cyan transition-all hover:bg-neon-cyan hover:text-black hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] disabled:opacity-50 mt-2"
              >
                {checkLoading ? 'Mengecek...' : 'Cek ID'}
              </button>

              {checkError && (
                <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
                  {checkError}
                </div>
              )}

              {checkResult && (
                <div className="mt-4 rounded-xl bg-neon-cyan/5 border border-neon-cyan/20 p-5 shadow-[inset_0_0_20px_rgba(0,240,255,0.05)] overflow-x-auto">
                  {renderGameResult(checkResult, checkUid, checkZone)}
                </div>
              )}
            </div>
          </div>
          )}

          {selectedCategory === 'utility' && (
            <div className="relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-dark-surface/50 backdrop-blur-sm p-6 transition-all hover:border-neon-purple/50 hover:shadow-[0_0_30px_rgba(176,38,255,0.15)]">
              <div className="flex items-center space-x-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neon-purple/20 text-neon-purple border border-neon-purple/30">
                  <PackageSearch className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-white">Cek Resi Pengiriman</h3>
              </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-400">Pilih Kurir</label>
                <select
                  value={selectedCourier}
                  onChange={(e) => {
                    setSelectedCourier(e.target.value);
                    setResiResult(null);
                    setResiError('');
                    setResiInput('');
                  }}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2 text-sm text-white focus:border-neon-purple focus:outline-none focus:ring-1 focus:ring-neon-purple transition-all appearance-none"
                >
                  {COURIERS.map(courier => (
                    <option key={courier.id} value={courier.id} className="bg-dark-surface text-white">
                      {courier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400">Nomor Resi</label>
                <input
                  type="text"
                  value={resiInput}
                  onChange={(e) => setResiInput(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2 text-sm text-white placeholder-gray-600 focus:border-neon-purple focus:outline-none focus:ring-1 focus:ring-neon-purple transition-all"
                  placeholder="Masukkan Nomor Resi"
                />
              </div>
              
              <button
                onClick={handleResiSubmit}
                disabled={resiLoading}
                className="w-full rounded-xl bg-neon-purple/20 border border-neon-purple/50 px-4 py-2 text-sm font-semibold text-neon-purple transition-all hover:bg-neon-purple hover:text-white hover:shadow-[0_0_15px_rgba(176,38,255,0.4)] disabled:opacity-50 mt-2"
              >
                {resiLoading ? 'Mengecek...' : 'Cek Resi'}
              </button>

              {resiError && (
                <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
                  {resiError}
                </div>
              )}

              {resiResult && (
                <div className="mt-4 rounded-xl bg-neon-purple/5 border border-neon-purple/20 p-5 shadow-[inset_0_0_20px_rgba(176,38,255,0.05)] overflow-x-auto">
                  {renderResiResult(resiResult)}
                </div>
              )}
            </div>
          </div>
          )}

          {selectedCategory === 'social' && (
            <div className="relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-dark-surface/50 backdrop-blur-sm p-6 transition-all hover:border-neon-cyan/50 hover:shadow-[0_0_30px_rgba(0,240,255,0.15)]">
              <div className="flex items-center space-x-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30">
                  <Music className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-white">TikTok Stalker</h3>
              </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-400">Username TikTok</label>
                <div className="relative mt-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">@</span>
                  <input
                    type="text"
                    value={tiktokUsername}
                    onChange={(e) => setTiktokUsername(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/50 pl-10 pr-4 py-2 text-sm text-white placeholder-gray-600 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all"
                    placeholder="username"
                  />
                </div>
              </div>
              
              <button
                onClick={handleTiktokSubmit}
                disabled={tiktokLoading}
                className="w-full rounded-xl bg-neon-cyan/20 border border-neon-cyan/50 px-4 py-2 text-sm font-semibold text-neon-cyan transition-all hover:bg-neon-cyan hover:text-black hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] disabled:opacity-50 mt-2"
              >
                {tiktokLoading ? 'Stalking...' : 'Stalk User'}
              </button>

              {tiktokError && (
                <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
                  {tiktokError}
                </div>
              )}

              {tiktokResult && (
                <div className="mt-4 rounded-xl bg-neon-cyan/5 border border-neon-cyan/20 p-5 shadow-[inset_0_0_20px_rgba(0,240,255,0.05)]">
                  {renderTiktokResult(tiktokResult)}
                </div>
              )}
            </div>
          </div>
          )}

          {selectedCategory === 'downloader' && (
            <div className="relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-dark-surface/50 backdrop-blur-sm p-6 transition-all hover:border-neon-purple/50 hover:shadow-[0_0_30px_rgba(176,38,255,0.15)]">
              <div className="flex items-center space-x-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neon-purple/20 text-neon-purple border border-neon-purple/30">
                  <Download className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-white">Media Downloader</h3>
              </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-400">Pilih Platform</label>
                <select
                  value={selectedDownloadType}
                  onChange={(e) => {
                    setSelectedDownloadType(e.target.value);
                    setDownloadResult(null);
                    setDownloadError('');
                  }}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2 text-sm text-white focus:border-neon-purple focus:outline-none focus:ring-1 focus:ring-neon-purple transition-all appearance-none"
                >
                  {DOWNLOAD_TYPES.map(type => (
                    <option key={type.id} value={type.id} className="bg-dark-surface text-white">
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400">URL Media</label>
                <input
                  type="text"
                  value={downloadUrl}
                  onChange={(e) => setDownloadUrl(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2 text-sm text-white placeholder-gray-600 focus:border-neon-purple focus:outline-none focus:ring-1 focus:ring-neon-purple transition-all"
                  placeholder="Masukkan URL (e.g. https://tiktok.com/...)"
                />
              </div>
              
              <button
                onClick={handleDownloadSubmit}
                disabled={downloadLoading}
                className="w-full rounded-xl bg-neon-purple/20 border border-neon-purple/50 px-4 py-2 text-sm font-semibold text-neon-purple transition-all hover:bg-neon-purple hover:text-white hover:shadow-[0_0_15px_rgba(176,38,255,0.4)] disabled:opacity-50 mt-2"
              >
                {downloadLoading ? 'Memproses...' : 'Download'}
              </button>

              {downloadError && (
                <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
                  {downloadError}
                </div>
              )}

              {downloadResult && (
                <div className="mt-4 rounded-xl bg-neon-purple/5 border border-neon-purple/20 p-5 shadow-[inset_0_0_20px_rgba(176,38,255,0.05)]">
                  {renderDownloaderResult(downloadResult)}
                </div>
              )}
            </div>
          </div>
          )}

          {selectedCategory === 'iplookup' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full"
            >
              <IPLookup embedded={true} />
            </motion.div>
          )}

          {selectedCategory === 'other' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center p-12 text-center border border-white/10 rounded-2xl bg-dark-surface/30 backdrop-blur-sm"
            >
              <Sparkles className="h-12 w-12 text-neon-purple mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-white mb-2">Coming Soon</h3>
              <p className="text-gray-400">We are working on adding more tools to this category. Stay tuned!</p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section>
        <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <h2 className="text-2xl font-bold tracking-tight text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">Latest Blog Posts</h2>
          
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-wrap items-center gap-2 mr-4">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Category:</span>
              {blogCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedBlogCategory(cat)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${
                    selectedBlogCategory === cat
                      ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                      : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/20'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {blogTags.length > 1 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Tags:</span>
                {blogTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${
                      selectedTag === tag
                        ? 'bg-neon-purple/20 border-neon-purple text-neon-purple shadow-[0_0_10px_rgba(176,38,255,0.2)]'
                        : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/20'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-dark-surface/50 backdrop-blur-sm transition-all hover:border-neon-cyan/50 hover:shadow-[0_0_30px_rgba(0,240,255,0.15)]"
            >
              <div className="aspect-[16/10] overflow-hidden bg-black/50">
                <img
                  src={post.imageUrl}
                  alt={post.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-neon-purple drop-shadow-[0_0_5px_rgba(176,38,255,0.5)]">
                    {post.category || "Blog"}
                  </span>
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex gap-2">
                      {post.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-[10px] font-bold text-neon-cyan opacity-70">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <h3 className="mt-2 text-xl font-bold text-white">{post.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-gray-400">{post.excerpt}</p>
                <div className="mt-auto pt-6 flex items-center justify-between">
                  <Link
                    to={`/post/${post.id}`}
                    className="inline-flex items-center text-sm font-semibold text-neon-cyan hover:text-white transition-colors drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]"
                  >
                    Read More
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        {filteredPosts.length === 0 && (
          <div className="py-20 text-center text-gray-500 border border-white/5 rounded-2xl bg-white/5 backdrop-blur-sm">
            No blog posts found matching your filters.
          </div>
        )}
      </section>

      {/* Visitor Counter Section */}
      <section className="mt-20 mb-10">
        <VisitorCounter />
      </section>
    </div>
  );
}
