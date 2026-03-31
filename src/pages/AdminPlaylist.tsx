import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { db, doc, collection, getDocs, deleteDoc, addDoc, setDoc, query, orderBy, OperationType, handleFirestoreError, serverTimestamp } from '../firebase';
import { Track } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Music, Plus, Trash2, Pencil, X, Save, Music2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminPlaylist() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [newTrack, setNewTrack] = useState({ title: '', artist: '', url: '', cover: '', category: '', tags: '' });
  const [isAddingTrack, setIsAddingTrack] = useState(false);
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [trackToDelete, setTrackToDelete] = useState<Track | null>(null);

  const categories = Array.from(new Set(tracks.map(t => t.category).filter(Boolean)));

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/login');
      return;
    }
  }, [isAdmin, authLoading, navigate]);

  const fetchTracks = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'playlist'), orderBy('order', 'asc'));
      const querySnapshot = await getDocs(q);
      const tracksData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Track[];
      setTracks(tracksData);
    } catch (error) {
      console.error('Error fetching tracks:', error);
      handleFirestoreError(error, OperationType.LIST, 'playlist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchTracks();
    }
  }, [isAdmin]);

  const handleAddTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrack.title || !newTrack.url) return;

    try {
      setSaving(true);
      const trackData = {
        title: newTrack.title,
        artist: newTrack.artist,
        url: newTrack.url,
        cover: newTrack.cover,
        category: newTrack.category,
        tags: newTrack.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
      };

      if (editingTrackId) {
        await setDoc(doc(db, 'playlist', editingTrackId), {
          ...trackData,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } else {
        await addDoc(collection(db, 'playlist'), {
          ...trackData,
          order: tracks.length,
          createdAt: serverTimestamp()
        });
      }
      setNewTrack({ title: '', artist: '', url: '', cover: '', category: '', tags: '' });
      setIsAddingTrack(false);
      setEditingTrackId(null);
      fetchTracks();
    } catch (error) {
      console.error('Error saving track:', error);
      handleFirestoreError(error, OperationType.WRITE, 'playlist');
    } finally {
      setSaving(false);
    }
  };

  const handleEditTrack = (track: Track) => {
    setNewTrack({
      title: track.title,
      artist: track.artist,
      url: track.url,
      cover: track.cover,
      category: track.category || '',
      tags: track.tags?.join(', ') || ''
    });
    setEditingTrackId(track.id);
    setIsAddingTrack(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteTrack = (track: Track) => {
    setTrackToDelete(track);
  };

  const confirmDeleteTrack = async () => {
    if (!trackToDelete) return;
    try {
      await deleteDoc(doc(db, 'playlist', trackToDelete.id));
      setTrackToDelete(null);
      fetchTracks();
    } catch (error) {
      console.error('Error deleting track:', error);
      handleFirestoreError(error, OperationType.DELETE, `playlist/${trackToDelete.id}`);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-neon-cyan"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-black text-white flex items-center tracking-tight drop-shadow-[0_0_10px_rgba(0,240,255,0.3)]">
          <Music2 className="mr-3 h-8 w-8 text-neon-cyan" />
          Playlist Management
        </h1>
        <p className="text-gray-400">Add, edit, or remove tracks from your website's music player.</p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between bg-dark-surface/50 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 rounded-full bg-neon-cyan/10 flex items-center justify-center">
              <Music className="h-5 w-5 text-neon-cyan" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">{tracks.length} Tracks</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Currently in playlist</p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsAddingTrack(!isAddingTrack);
              if (isAddingTrack) {
                setEditingTrackId(null);
                setNewTrack({ title: '', artist: '', url: '', cover: '', category: '', tags: '' });
              }
            }}
            className="inline-flex items-center rounded-xl bg-neon-cyan/10 border border-neon-cyan/50 px-6 py-2.5 text-sm font-bold text-neon-cyan transition-all hover:bg-neon-cyan hover:text-black hover:shadow-[0_0_15px_rgba(0,240,255,0.4)]"
          >
            {isAddingTrack ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
            {isAddingTrack ? 'Cancel' : 'Add New Track'}
          </button>
        </div>

        <AnimatePresence>
          {isAddingTrack && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="rounded-3xl border border-white/10 bg-dark-surface/50 backdrop-blur-xl p-8 shadow-2xl"
            >
              <form onSubmit={handleAddTrack} className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Track Title</label>
                  <input
                    type="text"
                    required
                    value={newTrack.title}
                    onChange={(e) => setNewTrack({ ...newTrack, title: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all"
                    placeholder="e.g. Cyber City Night"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Artist Name</label>
                  <input
                    type="text"
                    required
                    value={newTrack.artist}
                    onChange={(e) => setNewTrack({ ...newTrack, artist: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all"
                    placeholder="e.g. Synth Master"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">
                    MP3 Direct URL
                  </label>
                  <input
                    type="url"
                    required
                    value={newTrack.url}
                    onChange={(e) => setNewTrack({ ...newTrack, url: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all"
                    placeholder="https://example.com/song.mp3"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Cover Image URL</label>
                  <input
                    type="url"
                    required
                    value={newTrack.cover}
                    onChange={(e) => setNewTrack({ ...newTrack, cover: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all"
                    placeholder="https://example.com/cover.jpg"
                  />
                </div>
                <div className="space-y-2 relative">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Category</label>
                  <input
                    type="text"
                    value={newTrack.category}
                    onChange={(e) => setNewTrack({ ...newTrack, category: e.target.value })}
                    onFocus={() => setShowCategoryDropdown(true)}
                    onBlur={() => setTimeout(() => setShowCategoryDropdown(false), 200)}
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all"
                    placeholder="e.g. DJ, Remix"
                  />
                  {showCategoryDropdown && categories.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-dark-surface border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                      {categories.map(cat => (
                        <div
                          key={cat}
                          onClick={() => {
                            setNewTrack({ ...newTrack, category: cat as string });
                            setShowCategoryDropdown(false);
                          }}
                          className="px-4 py-3 text-sm text-gray-300 hover:bg-neon-cyan/20 hover:text-neon-cyan cursor-pointer transition-colors"
                        >
                          {cat}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={newTrack.tags}
                    onChange={(e) => setNewTrack({ ...newTrack, tags: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all"
                    placeholder="e.g. SadVibes, Chill, Lo-fi"
                  />
                </div>
                <div className="sm:col-span-2 flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center rounded-xl bg-neon-cyan px-10 py-3 text-sm font-black text-black hover:shadow-[0_0_20px_rgba(0,240,255,0.6)] transition-all disabled:opacity-50"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Saving...' : (editingTrackId ? 'Update Track' : 'Add to Playlist')}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col gap-4 w-full overflow-hidden">
          {tracks.length === 0 ? (
            <div className="text-center py-20 rounded-3xl border-2 border-dashed border-white/5 bg-white/[0.02] flex flex-col items-center">
              <Music className="h-12 w-12 text-gray-700 mb-4" />
              <p className="text-gray-500 font-medium">Your playlist is empty.</p>
              <p className="text-xs text-gray-600 mt-1">Add some tracks to get started.</p>
            </div>
          ) : (
            tracks.map((track, index) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                key={track.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border border-white/10 bg-dark-surface/40 group hover:border-neon-cyan/40 hover:bg-dark-surface/60 transition-all shadow-lg overflow-hidden w-full"
              >
                <div className="flex items-start sm:items-center space-x-4 w-full min-w-0">
                  <div className="relative h-14 w-14 flex-shrink-0">
                    <img src={track.cover} alt="" className="h-full w-full rounded-xl object-cover border border-white/10 shadow-md" />
                    <div className="absolute -top-2 -left-2 h-6 w-6 rounded-full bg-black/80 border border-white/10 flex items-center justify-center text-[10px] font-black text-neon-cyan">
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <h4 className="text-base font-black text-white group-hover:text-neon-cyan transition-colors truncate">{track.title}</h4>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider truncate">
                      {track.artist}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {track.category && (
                        <span className="px-2 py-0.5 rounded-md bg-neon-cyan/10 border border-neon-cyan/30 text-[9px] font-bold text-neon-cyan uppercase tracking-wider">
                          {track.category}
                        </span>
                      )}
                      {track.tags?.map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded-md bg-neon-purple/10 border border-neon-purple/30 text-[9px] font-bold text-neon-purple uppercase tracking-wider">
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-600 mt-1 truncate w-full block">{track.url}</p>
                  </div>
                </div>
                <div className="flex items-center justify-end space-x-2 w-full sm:w-auto flex-shrink-0 sm:self-auto border-t border-white/5 sm:border-0 pt-3 sm:pt-0 mt-1 sm:mt-0">
                  <button
                    onClick={() => handleEditTrack(track)}
                    className="flex-1 sm:flex-none flex items-center justify-center p-2 sm:p-3 rounded-xl text-gray-400 hover:text-neon-cyan hover:bg-neon-cyan/10 bg-white/5 sm:bg-transparent transition-all"
                    title="Edit Track"
                  >
                    <Pencil className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-0" />
                    <span className="text-xs font-bold sm:hidden">Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteTrack(track)}
                    className="flex-1 sm:flex-none flex items-center justify-center p-2 sm:p-3 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-500/10 bg-white/5 sm:bg-transparent transition-all"
                    title="Delete Track"
                  >
                    <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-0" />
                    <span className="text-xs font-bold sm:hidden">Delete</span>
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {trackToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-dark-surface border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <h3 className="text-xl font-black text-white mb-2">Delete Track?</h3>
              <p className="text-gray-400 text-sm mb-6">
                Are you sure you want to remove <span className="text-neon-cyan font-bold">"{trackToDelete.title}"</span> from the playlist? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setTrackToDelete(null)}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteTrack}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
