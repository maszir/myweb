import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { db, collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp, OperationType, handleFirestoreError } from '../firebase';
import { BlogPost } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Edit2, X, Save, FileText, Image as ImageIcon, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import AdminVisitorReports from '../components/AdminVisitorReports';

export default function AdminDashboard() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [restoreDraftData, setRestoreDraftData] = useState<any | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    imageUrl: '',
    category: '',
    tags: '',
    status: 'published' as 'published' | 'draft'
  });

  // Auto-save draft for new posts
  useEffect(() => {
    if (isModalOpen && !editingPost) {
      const timer = setTimeout(() => {
        localStorage.setItem('blog_post_draft', JSON.stringify(formData));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [formData, isModalOpen, editingPost]);

  const restoreDraft = () => {
    const savedDraft = localStorage.getItem('blog_post_draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setFormData(draft);
        localStorage.removeItem('blog_post_draft');
      } catch (err) {
        console.error('Failed to restore draft', err);
      }
    }
  };

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/login');
      return;
    }
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (!isAdmin) return;

    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));
      setPosts(postsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'posts');
    });

    return unsubscribe;
  }, [isAdmin]);

  const handleOpenModal = (post?: BlogPost) => {
    if (post) {
      setEditingPost(post);
      setFormData({
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        imageUrl: post.imageUrl,
        category: post.category || '',
        tags: post.tags?.join(', ') || '',
        status: post.status || 'published'
      });
    } else {
      setEditingPost(null);
      const savedDraft = localStorage.getItem('blog_post_draft');
      if (savedDraft) {
        try {
          setRestoreDraftData(JSON.parse(savedDraft));
          return; // Don't open modal yet, wait for restore decision
        } catch (err) {
          setFormData({
            title: '',
            excerpt: '',
            content: '',
            imageUrl: '',
            category: '',
            tags: '',
            status: 'published'
          });
        }
      } else {
        setFormData({
          title: '',
          excerpt: '',
          content: '',
          imageUrl: '',
          category: '',
          tags: '',
          status: 'published'
        });
      }
    }
    setIsModalOpen(true);
  };

  const handleConfirmRestore = (shouldRestore: boolean) => {
    if (shouldRestore && restoreDraftData) {
      setFormData(restoreDraftData);
    } else {
      setFormData({
        title: '',
        excerpt: '',
        content: '',
        imageUrl: '',
        category: '',
        tags: '',
        status: 'published'
      });
    }
    setRestoreDraftData(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (!editingPost && (formData.title || formData.content)) {
      localStorage.setItem('blog_post_draft', JSON.stringify(formData));
    } else {
      localStorage.removeItem('blog_post_draft');
    }
    setIsModalOpen(false);
    setEditingPost(null);
  };

  const handleSubmit = async (e: React.FormEvent, statusOverride?: 'published' | 'draft') => {
    e.preventDefault();
    const finalStatus = statusOverride || formData.status;
    const tagsArray = formData.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    try {
      if (editingPost) {
        const docRef = doc(db, 'posts', editingPost.id);
        await updateDoc(docRef, {
          ...formData,
          tags: tagsArray,
          status: finalStatus,
          updatedAt: Timestamp.now()
        });
      } else {
        await addDoc(collection(db, 'posts'), {
          ...formData,
          tags: tagsArray,
          status: finalStatus,
          createdAt: Timestamp.now()
        });
        localStorage.removeItem('blog_post_draft');
      }
      handleCloseModal();
    } catch (error) {
      handleFirestoreError(error, editingPost ? OperationType.UPDATE : OperationType.CREATE, 'posts');
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteDoc(doc(db, 'posts', deleteConfirmId));
      setDeleteConfirmId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `posts/${deleteConfirmId}`);
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">Admin Dashboard</h1>
          <p className="mt-1 text-gray-400">Manage your blog posts and content.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center rounded-xl bg-neon-cyan/10 border border-neon-cyan/50 px-4 py-2.5 text-sm font-semibold text-neon-cyan transition-all hover:bg-neon-cyan hover:text-black hover:shadow-[0_0_15px_rgba(0,240,255,0.4)]"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Post
        </button>
      </div>

      <AdminVisitorReports />

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-dark-surface/50 backdrop-blur-sm shadow-[0_0_20px_rgba(0,0,0,0.3)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-black/40 text-xs font-semibold uppercase tracking-wider text-gray-400">
            <tr>
              <th className="px-6 py-4">Post</th>
              <th className="px-6 py-4 hidden sm:table-cell">Category</th>
              <th className="px-6 py-4 hidden md:table-cell">Status</th>
              <th className="px-6 py-4 hidden lg:table-cell">Date</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {posts.map((post) => (
              <tr key={post.id} className="group hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-black/50 border border-white/10 hidden sm:block">
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <div className="font-semibold text-white">{post.title}</div>
                      <div className="text-gray-400 line-clamp-1 max-w-[150px] sm:max-w-xs">{post.excerpt}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 hidden sm:table-cell">
                  <span className="inline-flex items-center rounded-full bg-neon-purple/10 border border-neon-purple/30 px-2.5 py-0.5 text-xs font-medium text-neon-purple">
                    {post.category || 'General'}
                  </span>
                </td>
                <td className="px-6 py-4 hidden md:table-cell">
                  <span className={cn(
                    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                    post.status === 'published' 
                      ? "bg-green-500/10 border-green-500/30 text-green-400"
                      : "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
                  )}>
                    {post.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-400 hidden lg:table-cell">
                  {post.createdAt?.toDate().toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleOpenModal(post)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-neon-cyan/20 hover:text-neon-cyan transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {posts.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            No posts found. Click "Add Post" to get started.
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-dark-surface shadow-[0_0_40px_rgba(0,0,0,0.8)]"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 px-6 py-4 bg-dark-surface/90 backdrop-blur-md">
                <h2 className="text-xl font-bold text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
                  {editingPost ? 'Edit Post' : 'Add New Post'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="rounded-full p-2 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={(e) => handleSubmit(e)} className="p-6 space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300">Post Title</label>
                    <input
                      required
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all"
                      placeholder="e.g. My New Blog Post"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300">Category</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all"
                      placeholder="e.g. Tech"
                    />
                  </div>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300">Tags (comma separated)</label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all"
                      placeholder="e.g. DJ, SadVibes"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'published' | 'draft' })}
                      className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2.5 text-sm text-white focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all"
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-300">Image URL</label>
                  <div className="relative">
                    <ImageIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <input
                      required
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-black/50 pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all"
                      placeholder="https://images.unsplash.com/..."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-300">Excerpt (Short Summary)</label>
                  <input
                    required
                    type="text"
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all"
                    placeholder="Briefly describe the post..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-300">Content (Markdown supported)</label>
                  <textarea
                    required
                    rows={8}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all"
                    placeholder="Write your blog post content here..."
                  />
                </div>
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="w-full sm:w-auto rounded-xl px-6 py-2.5 text-sm font-semibold text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={(e) => handleSubmit(e, 'draft')}
                      className="inline-flex items-center justify-center rounded-xl bg-white/5 border border-white/10 px-6 py-2.5 text-sm font-semibold text-gray-300 transition-all hover:bg-white/10 hover:text-white"
                    >
                      Save as Draft
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center rounded-xl bg-neon-cyan/10 border border-neon-cyan/50 px-8 py-2.5 text-sm font-semibold text-neon-cyan transition-all hover:bg-neon-cyan hover:text-black hover:shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {editingPost ? 'Update Post' : 'Publish Post'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmId(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-dark-surface p-8 shadow-[0_0_50px_rgba(255,0,0,0.2)]"
            >
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                  <Trash2 className="h-8 w-8" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-white">Delete Post?</h3>
                <p className="mb-8 text-gray-400">
                  Are you sure you want to delete this post? This action cannot be undone.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="flex-1 rounded-xl bg-white/5 px-4 py-3 text-sm font-semibold text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Restore Draft Modal */}
      <AnimatePresence>
        {restoreDraftData && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => handleConfirmRestore(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-dark-surface p-8 shadow-[0_0_50px_rgba(0,240,255,0.2)]"
            >
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neon-cyan/10 text-neon-cyan">
                  <FileText className="h-8 w-8" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-white">Restore Draft?</h3>
                <p className="mb-8 text-gray-400">
                  You have an unsaved draft from your previous session. Would you like to restore it?
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleConfirmRestore(false)}
                    className="flex-1 rounded-xl bg-white/5 px-4 py-3 text-sm font-semibold text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    Discard
                  </button>
                  <button
                    onClick={() => handleConfirmRestore(true)}
                    className="flex-1 rounded-xl bg-neon-cyan px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-white shadow-[0_0_20px_rgba(0,240,255,0.4)]"
                  >
                    Restore
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
