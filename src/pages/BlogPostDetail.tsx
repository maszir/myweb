import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { db, doc, getDoc, OperationType, handleFirestoreError } from '../firebase';
import { BlogPost } from '../types';
import { motion } from 'motion/react';
import { ArrowLeft, Calendar, Tag } from 'lucide-react';
import Markdown from 'react-markdown';
import SEO from '../components/SEO';

export default function BlogPostDetail() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;

    const fetchPost = async () => {
      try {
        const docRef = doc(db, 'posts', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPost({ id: docSnap.id, ...docSnap.data() } as BlogPost);
        } else {
          navigate('/');
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `posts/${id}`);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900"></div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-4xl"
    >
      <SEO 
        title={post.title}
        description={post.excerpt}
        image={post.imageUrl}
        type="article"
      />
      <Link
        to="/"
        className="mb-8 inline-flex items-center text-sm font-medium text-gray-400 hover:text-neon-cyan transition-colors drop-shadow-[0_0_5px_rgba(0,240,255,0)] hover:drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to blog
      </Link>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-dark-surface/80 backdrop-blur-md shadow-[0_0_40px_rgba(0,0,0,0.5)]">
        <div className="aspect-video w-full bg-black/80 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-dark-surface to-transparent z-10"></div>
          <img
            src={post.imageUrl}
            alt={post.title}
            className="h-full w-full object-cover opacity-70"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="p-8 sm:p-12 relative z-20 -mt-20">
          <div className="flex flex-wrap gap-4 text-sm text-neon-cyan mb-6 drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]">
            <div className="flex items-center bg-neon-cyan/10 px-3 py-1 rounded-full border border-neon-cyan/30">
              <Tag className="mr-1.5 h-4 w-4" />
              {post.category || "General"}
            </div>
            <div className="flex items-center bg-neon-purple/10 text-neon-purple px-3 py-1 rounded-full border border-neon-purple/30 drop-shadow-[0_0_5px_rgba(176,38,255,0.5)]">
              <Calendar className="mr-1.5 h-4 w-4" />
              {post.createdAt?.toDate().toLocaleDateString()}
            </div>
            {post.tags && post.tags.map(tag => (
              <div key={tag} className="flex items-center bg-white/5 text-gray-400 px-3 py-1 rounded-full border border-white/10">
                #{tag}
              </div>
            ))}
          </div>
          
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
            {post.title}
          </h1>
          
          <div className="mt-8 prose prose-invert max-w-none">
            <div className="text-lg leading-relaxed text-gray-300">
              <Markdown>{post.content}</Markdown>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
