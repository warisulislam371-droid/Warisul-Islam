import React, { useState } from 'react';
import { dbLocal } from '../db';
import { Blog, User } from '../types';
import { BookOpen, Plus, Trash2, Calendar, User as UserIcon, Tag, Globe, FileText, CheckCircle } from 'lucide-react';

interface BlogSectionProps {
  currentUser: User | null;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function BlogSection({ currentUser, addToast }: BlogSectionProps) {
  const [blogs, setBlogs] = useState<Blog[]>(dbLocal.getBlogs());
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newTags, setNewTags] = useState('');
  const [newImage, setNewImage] = useState('https://images.unsplash.com/photo-1579684389782-64d84b5e901a');
  const [newSeoTitle, setNewSeoTitle] = useState('');
  const [newSeoDesc, setNewSeoDesc] = useState('');

  const isAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'admin';

  const handlePublishBlog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    const newBlog: Blog = {
      id: `blog-${Date.now()}`,
      title: newTitle,
      content: newContent,
      author: newAuthor || currentUser?.name || 'HealNex Research Desk',
      tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
      image: newImage,
      seoTitle: newSeoTitle || newTitle,
      seoDescription: newSeoDesc || newContent.slice(0, 150),
      createdAt: new Date().toISOString()
    };

    const updated = [newBlog, ...blogs];
    dbLocal.saveBlogs(updated);
    setBlogs(updated);

    // Reset Form
    setNewTitle('');
    setNewContent('');
    setNewAuthor('');
    setNewTags('');
    setNewSeoTitle('');
    setNewSeoDesc('');
    setShowAddForm(false);

    addToast('Clinical blog published successfully! Canonical URL initialized.', 'success');
  };

  const handleDeleteBlog = (blogId: string) => {
    if (!confirm('Are you sure you want to delete this clinical guide?')) return;
    const updated = blogs.filter(b => b.id !== blogId);
    dbLocal.saveBlogs(updated);
    setBlogs(updated);
  };

  return (
    <div className="w-full font-sans">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-display flex items-center gap-2">
            <BookOpen className="w-6.5 h-6.5 text-teal-700" />
            HealNex Biomedical Knowledge Center
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Clinical procurement methodologies, equipment maintenance directories, and supply chain insights.
          </p>
        </div>

        {/* Admin publisher toggle */}
        {isAdmin && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
          >
            <Plus className="w-4 h-4" />
            {showAddForm ? 'Close Editor' : 'Publish Article'}
          </button>
        )}
      </div>

      {/* Publisher edit dashboard */}
      {showAddForm && isAdmin && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-3xl mx-auto mb-8 animate-scale-up text-xs font-semibold">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <FileText className="w-4.5 h-4.5 text-teal-700" />
            Clinical Editorial Suite
          </h3>

          <form onSubmit={handlePublishBlog} className="space-y-4">
            <div>
              <label className="text-slate-500 block mb-1">Article Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Advancements in High-Flow Nasal Cannula therapy"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-teal-700 transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-500 block mb-1">Author Credentials</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Jane Smith, MD"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none"
                />
              </div>
              <div>
                <label className="text-slate-500 block mb-1">Categorized Tags (comma split)</label>
                <input
                  type="text"
                  placeholder="e.g. ICU, Ventilation, Clinical Guide"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-500 block mb-1">Article Content *</label>
              <textarea
                rows={6}
                required
                placeholder="Write full clinical guide, calibration standards, procedural recommendations..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-teal-700"
              />
            </div>

            {/* SEO Optimization Fields block */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
              <p className="text-[10px] text-teal-800 uppercase font-bold tracking-wider flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" />
                SEO Metadata Optimization
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 block mb-1 text-[11px]">Meta SEO Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Clinical ICU Ventilation Guide - HealNex"
                    value={newSeoTitle}
                    onChange={(e) => setNewSeoTitle(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 outline-none font-sans"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1 text-[11px]">Meta SEO Description</label>
                  <input
                    type="text"
                    placeholder="Highly scannable summary for search engines"
                    value={newSeoDesc}
                    onChange={(e) => setNewSeoDesc(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 outline-none font-sans"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400">Canonical URL Auto-allocated: <strong className="font-mono text-slate-600">https://healnexmedibazar.com/blog/canonical</strong></p>
            </div>

            <button
              type="submit"
              className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-2.5 rounded-xl uppercase tracking-wider transition cursor-pointer"
            >
              Publish Article
            </button>
          </form>
        </div>
      )}

      {/* Blogs list grid representation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs font-semibold">
        {blogs.map((blog) => (
          <div
            key={blog.id}
            className="bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 shadow-sm overflow-hidden flex flex-col justify-between group transition hover:shadow-md"
          >
            <div className="h-48 overflow-hidden relative bg-slate-100">
              <img
                src={blog.image}
                alt={blog.title}
                className="w-full h-full object-cover transition-transform group-hover:scale-102"
              />
              {isAdmin && (
                <button
                  onClick={() => handleDeleteBlog(blog.id)}
                  className="p-1.5 bg-white text-slate-400 hover:text-rose-600 rounded-lg absolute top-3 right-3 shadow"
                  title="Delete article"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {blog.tags.map((tag, i) => (
                    <span key={i} className="bg-teal-50 text-teal-800 border border-teal-100/50 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-0.5">
                      <Tag className="w-2.5 h-2.5" />
                      {tag}
                    </span>
                  ))}
                </div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug group-hover:text-teal-700 transition">
                  {blog.title}
                </h3>
                <p className="text-[11px] text-slate-500 mt-2 font-normal leading-relaxed">
                  {blog.content}
                </p>
              </div>

              <div className="flex items-center gap-4 text-[10px] text-slate-400 border-t border-slate-50 pt-3 mt-4 shrink-0 font-medium">
                <span className="flex items-center gap-1">
                  <UserIcon className="w-3.5 h-3.5 text-slate-300" />
                  {blog.author}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-300" />
                  {new Date(blog.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
