import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Music as MusicIcon, ListMusic, X, Shuffle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, collection, query, orderBy, onSnapshot } from '../firebase';
import { Track } from '../types';

export default function MusicPlayer() {
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [filteredPlaylist, setFilteredPlaylist] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTag, setSelectedTag] = useState('All');
  const [isShuffle, setIsShuffle] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentTrackIdRef = useRef<string | null>(null);

  useEffect(() => {
    const filtered = playlist.filter(track => {
      const matchesCategory = selectedCategory === 'All' || track.category === selectedCategory;
      const matchesTag = selectedTag === 'All' || track.tags?.includes(selectedTag);
      return matchesCategory && matchesTag;
    });

    setFilteredPlaylist(filtered);
    
    // Find index of current track in new filteredPlaylist
    const newIndex = currentTrackIdRef.current ? filtered.findIndex(t => t.id === currentTrackIdRef.current) : 0;
    setCurrentTrackIndex(newIndex !== -1 ? newIndex : 0);
  }, [playlist, selectedCategory, selectedTag]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => {
          console.error("Audio play error:", e);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const { currentTime, duration } = audioRef.current;
      if (duration > 0) {
        setProgress((currentTime / duration) * 100);
      }
    }
  };

  const categories = ['All', ...new Set(playlist.map(t => t.category).filter(Boolean) as string[])];
  const tags = ['All', ...new Set(playlist.flatMap(t => t.tags || []).filter(Boolean) as string[])];

  const currentTrack = filteredPlaylist[currentTrackIndex] || null;

  useEffect(() => {
    if (filteredPlaylist.length > 0 && currentTrackIndex >= filteredPlaylist.length) {
      setCurrentTrackIndex(0);
    }
  }, [filteredPlaylist.length, currentTrackIndex]);

  useEffect(() => {
    const q = query(collection(db, 'playlist'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const tracksData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Track[];
        setPlaylist(tracksData);
        
        // Ensure currentTrackIndex is within bounds
        setCurrentTrackIndex(prev => {
          const newIndex = prev >= tracksData.length ? 0 : prev;
          currentTrackIdRef.current = tracksData[newIndex]?.id || null;
          return newIndex;
        });
      } else {
        setPlaylist([]);
        setCurrentTrackIndex(0);
      }
    });
    return unsubscribe;
  }, []);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleProgress = (state: any) => {
    setProgress(state.played * 100);
  };

  const handleTrackEnd = () => {
    nextTrack();
  };

  const nextTrack = () => {
    if (filteredPlaylist.length === 0) return;
    
    if (isShuffle && filteredPlaylist.length > 1) {
      let nextIndex = Math.floor(Math.random() * filteredPlaylist.length);
      // Ensure we don't pick the same track if possible
      while (nextIndex === currentTrackIndex) {
        nextIndex = Math.floor(Math.random() * filteredPlaylist.length);
      }
      setCurrentTrackIndex(nextIndex);
    } else {
      setCurrentTrackIndex((prev) => (prev + 1) % filteredPlaylist.length);
    }
    setIsPlaying(true);
  };

  const prevTrack = () => {
    if (filteredPlaylist.length === 0) return;
    const prevIndex = (currentTrackIndex - 1 + filteredPlaylist.length) % filteredPlaylist.length;
    setCurrentTrackIndex(prevIndex);
    currentTrackIdRef.current = filteredPlaylist[prevIndex].id;
    setIsPlaying(true);
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = parseFloat(e.target.value);
    setProgress(newProgress);
    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = (newProgress / 100) * audioRef.current.duration;
    }
  };

  if (!currentTrack) return null;

  return (
    <div className="w-full flex flex-col items-center mt-8">
      <AnimatePresence>
        {showPlaylist && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-full max-w-md bg-dark-surface/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black text-neon-cyan uppercase tracking-widest">Playlist</h3>
              <button onClick={() => setShowPlaylist(false)} className="text-gray-500 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Filters */}
            <div className="mb-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Category:</span>
                <div className="flex flex-wrap gap-1">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => {
                        currentTrackIdRef.current = currentTrack?.id || null;
                        setSelectedCategory(cat);
                      }}
                      className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider transition-all border ${
                        selectedCategory === cat
                          ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan shadow-[0_0_5px_rgba(0,240,255,0.2)]'
                          : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {tags.length > 1 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Tags:</span>
                  <div className="flex flex-wrap gap-1">
                    {tags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => {
                          currentTrackIdRef.current = currentTrack?.id || null;
                          setSelectedTag(tag);
                        }}
                        className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider transition-all border ${
                          selectedTag === tag
                            ? 'bg-neon-purple/20 border-neon-purple text-neon-purple shadow-[0_0_5px_rgba(176,38,255,0.2)]'
                            : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {filteredPlaylist.length === 0 ? (
                <div className="text-center py-8 text-[10px] text-gray-500 italic">
                  No tracks found matching your filters.
                </div>
              ) : (
                filteredPlaylist.map((track, index) => (
                  <button
                    key={track.id}
                    onClick={() => {
                      currentTrackIdRef.current = track.id;
                      setCurrentTrackIndex(index);
                      setIsPlaying(true);
                    }}
                    className={`w-full flex items-center space-x-3 p-2 rounded-lg transition-all ${
                      currentTrackIndex === index 
                        ? 'bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan' 
                        : 'hover:bg-white/5 text-gray-400'
                    }`}
                  >
                    <img src={track.cover} alt="" className="h-8 w-8 rounded object-cover" />
                    <div className="flex-1 text-left truncate">
                      <p className="text-xs font-bold truncate">{track.title}</p>
                      <div className="flex items-center gap-2 truncate">
                        <p className="text-[9px] opacity-60 truncate">{track.artist}</p>
                        {track.category && (
                          <span className="text-[8px] text-neon-cyan/60 uppercase font-bold">[{track.category}]</span>
                        )}
                      </div>
                      {track.tags && track.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {track.tags.map(tag => (
                            <span key={tag} className="text-[7px] text-neon-purple/60 font-bold uppercase tracking-tighter">#{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    {currentTrackIndex === index && isPlaying && (
                      <div className="flex space-x-0.5">
                        <div className="w-0.5 h-3 bg-neon-cyan animate-pulse"></div>
                        <div className="w-0.5 h-4 bg-neon-cyan animate-pulse delay-75"></div>
                        <div className="w-0.5 h-2 bg-neon-cyan animate-pulse delay-150"></div>
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-[320px] bg-dark-surface/80 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-[0_0_30px_rgba(0,0,0,0.5)] group overflow-hidden">
        <audio
          ref={audioRef}
          src={currentTrack.url}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleTrackEnd}
          autoPlay={isPlaying}
          className="hidden"
        />
        
        <div className="flex items-center space-x-3">
          {/* Cover Art */}
          <div className="relative h-12 w-12 flex-shrink-0">
            <div className={`absolute inset-0 bg-gradient-to-r from-neon-cyan to-neon-purple rounded-xl blur-sm opacity-20 ${isPlaying ? 'animate-pulse' : ''}`}></div>
            <img 
              src={currentTrack.cover} 
              alt={currentTrack.title} 
              className={`relative h-full w-full rounded-xl object-cover border border-white/10 transition-transform duration-500 ${isPlaying ? 'scale-105' : 'scale-100'}`}
            />
            {isPlaying && (
              <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-neon-cyan shadow-[0_0_10px_rgba(0,240,255,0.8)]">
                <MusicIcon className="h-2 w-2 text-black" />
              </div>
            )}
          </div>

          {/* Info & Controls */}
          <div className="flex-1 min-w-0">
            <div className="mb-1.5">
              <h4 className="text-xs font-black text-white truncate drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
                {currentTrack.title}
              </h4>
              <p className="text-[9px] text-neon-cyan font-bold uppercase tracking-wider opacity-70 truncate">
                {currentTrack.artist}
              </p>
            </div>

            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => setIsShuffle(!isShuffle)}
                  className={`transition-all ${isShuffle ? 'text-neon-cyan' : 'text-gray-400 hover:text-white'}`}
                  title="Shuffle"
                >
                  <Shuffle className="h-3 w-3" />
                </button>
                <button onClick={prevTrack} className="text-gray-400 hover:text-neon-cyan transition-colors">
                  <SkipBack className="h-3.5 w-3.5" />
                </button>
                <button 
                  onClick={togglePlay}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-black hover:bg-neon-cyan transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:shadow-[0_0_15px_rgba(0,240,255,0.5)]"
                >
                  {isPlaying ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current ml-0.5" />}
                </button>
                <button onClick={nextTrack} className="text-gray-400 hover:text-neon-cyan transition-colors">
                  <SkipForward className="h-3.5 w-3.5" />
                </button>
                <button 
                  onClick={() => setShowPlaylist(!showPlaylist)}
                  className={`flex items-center gap-1.5 transition-colors ${showPlaylist ? 'text-neon-cyan' : 'text-gray-400 hover:text-white'}`}
                >
                  <ListMusic className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Playlist</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 flex items-center space-x-2">
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={handleProgressChange}
            className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-neon-cyan"
          />
        </div>

        {/* Animated Music Bars */}
        <div className="mt-3 flex items-center justify-center gap-0.5 h-4">
          {isPlaying && Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={i}
              animate={{ height: [4, 12, 4] }}
              transition={{
                repeat: Infinity,
                duration: 0.6 + (i % 3) * 0.2,
                delay: i * 0.05,
              }}
              className="w-1 bg-neon-cyan/80 rounded-full"
            />
          ))}
        </div>

        {/* Volume Control */}
        <div className="mt-2 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Volume2 className="h-3 w-3 text-gray-500" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-20 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-neon-purple"
          />
        </div>
      </div>
    </div>
  );
}
