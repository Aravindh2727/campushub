import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { NeonButton } from '../components/ui/NeonButton';
import { api } from '../lib/api';
import { compressImage } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { Megaphone, Plus, Camera, Upload, Trash2, Calendar, Image as ImageIcon, FileText } from 'lucide-react';
import { FilePreviewModal } from '../components/ui/FilePreviewModal';

export function Circulars() {
  const [circulars, setCirculars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const { dbUser } = useAuth();

  const [newCircular, setNewCircular] = useState({
    title: '',
    description: '',
    audience: 'All'
  });
  
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const fetchCirculars = async () => {
    try {
      setLoading(true);
      const res = await api.getCirculars();
      setCirculars(res.data || []);
    } catch (err) {
      console.error('Failed to fetch circulars', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCirculars();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const resetForm = () => {
    setNewCircular({ title: '', description: '', audience: 'All' });
    setFile(null);
    setPreviewUrl(null);
    setIsAdding(false);
  };

  const fileToBase64 = (f) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(f);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      let fileUrl = null;
      let fileType = null;
      let fileName = null;
      
      if (file) {
        fileName = file.name;
        if (file.type.startsWith('image/')) {
          fileUrl = await compressImage(file, 0.6); // Compress for performance
          fileType = 'image';
        } else {
          // For PDFs, docs, etc. Convert directly to base64
          // Note: Be aware of 16MB MongoDB limit. Usually fine for typical announcements
          fileUrl = await fileToBase64(file);
          fileType = file.type || 'document';
        }
      }

      await api.addCircular({
        ...newCircular,
        fileUrl,
        fileType,
        fileName
      });
      
      resetForm();
      fetchCirculars();
    } catch (err) {
      console.error('Failed to add circular', err);
      alert('Error adding circular.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this circular?')) return;
    try {
      await api.deleteCircular(id);
      fetchCirculars();
    } catch (err) {
      console.error('Failed to delete circular', err);
      alert('Error deleting circular.');
    }
  };

  // Only Admin should add/delete
  const isAdmin = dbUser?.role === 'admin';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-black text-[#2E1C40] dark:text-gray-900 drop-shadow-sm flex items-start md:items-center">
          <Megaphone className="w-8 h-8 mr-3 text-orange-500 shrink-0 mt-1 md:mt-0" />
          <span>Circulars & Announcements</span>
        </h1>
        {isAdmin && !isAdding && (
          <NeonButton onClick={() => setIsAdding(true)} className="bg-orange-500 text-gray-900 flex items-center border-orange-400 self-start md:self-auto shrink-0">
            <Plus className="w-5 h-5 mr-2" />
            Add Circular
          </NeonButton>
        )}
      </div>

      {isAdding && (
        <GlassCard className="border border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.2)]">
          <h2 className="text-xl font-bold text-[#2E1C40] dark:text-gray-900 mb-4">Post New Circular</h2>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[#4C677C] dark:text-[#E5D9C4] mb-1">Title</label>
              <input 
                type="text"
                required
                value={newCircular.title}
                onChange={e => setNewCircular({...newCircular, title: e.target.value})}
                className="glass-input w-full dark:text-gray-900"
                placeholder="e.g. Annual Sports Day Announcement"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-[#4C677C] dark:text-[#E5D9C4] mb-1">Description</label>
              <textarea 
                required
                value={newCircular.description}
                onChange={e => setNewCircular({...newCircular, description: e.target.value})}
                className="glass-input w-full dark:text-gray-900 h-32"
                placeholder="Details of the announcement..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#4C677C] dark:text-[#E5D9C4] mb-1">Target Audience</label>
              <select 
                value={newCircular.audience}
                onChange={e => setNewCircular({...newCircular, audience: e.target.value})}
                className="glass-input w-full dark:text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              >
                <option value="All" className="dark:bg-[#1A1A24]">All (Teachers & Students)</option>
                <option value="Teacher" className="dark:bg-[#1A1A24]">Teachers Only</option>
                <option value="Student" className="dark:bg-[#1A1A24]">Students Only</option>
              </select>
            </div>

            <div className="pt-4 border-t border-[#E5D9C4]/40 dark:border-[#4C677C]/30">
              <label className="block text-sm font-bold text-[#4C677C] dark:text-[#E5D9C4] mb-2">Attach File (Optional)</label>
              {file && (
                <div className="relative mb-3 inline-block bg-gray-500 dark:bg-gray-900/10 p-3 rounded-lg border border-[#E5D9C4] dark:border-gray-200">
                  <div className="flex items-center gap-2 pr-6">
                    {file.type.startsWith('image/') ? (
                      <ImageIcon className="w-5 h-5 text-adminSidebar" />
                    ) : (
                      <FileText className="w-5 h-5 text-orange-500" />
                    )}
                    <span className="text-sm font-medium text-[#2E1C40] dark:text-gray-900 truncate max-w-[200px]">
                      {file.name}
                    </span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => { setFile(null); setPreviewUrl(null); }}
                    className="absolute -top-2 -right-2 bg-red-500 text-gray-900 rounded-full p-1 shadow-md hover:bg-red-600 transition"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
              <div className="flex gap-3 max-w-md">
                <label className="flex-1 flex items-center justify-center cursor-pointer py-2 px-4 rounded-xl font-bold text-sm bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 dark:text-orange-400 dark:hover:bg-orange-500/30 transition-colors border border-orange-500/30">
                  <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
                  <Camera className="w-4 h-4 mr-2" /> Take Photo
                </label>
                <label className="flex-1 flex items-center justify-center cursor-pointer py-2 px-4 rounded-xl font-bold text-sm bg-[#2E1C40]/5 text-[#2E1C40] hover:bg-[#2E1C40]/10 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-100 transition-colors border border-[#4C677C]/20">
                  <input type="file" accept="*/*" onChange={handleFileChange} className="hidden" />
                  <Upload className="w-4 h-4 mr-2" /> Upload File
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4">
              <button 
                type="button" 
                onClick={resetForm}
                className="px-4 py-2 font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                disabled={loading}
              >
                Cancel
              </button>
              <NeonButton type="submit" disabled={loading} className="bg-orange-500 text-gray-900 border-orange-400">
                {loading ? 'Posting...' : 'Post Circular'}
              </NeonButton>
            </div>
          </form>
        </GlassCard>
      )}

      {loading && !isAdding ? (
        <div className="text-center py-12">Loading...</div>
      ) : circulars.length === 0 ? (
        <div className="text-center py-12 text-[#4C677C] dark:text-[#E5D9C4]/60 bg-white/30 dark:bg-[#1A1A24]/30 rounded-xl">
          <Megaphone className="w-12 h-12 mx-auto opacity-50 mb-3" />
          <p>No active circulars at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {circulars.map(circular => (
            <GlassCard key={circular._id} className="flex flex-col relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
              
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-orange-600 bg-orange-100 dark:bg-orange-500/20 dark:text-orange-400 px-2 py-1 rounded-md flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(circular.createdAt).toLocaleDateString()}
                  </span>
                  {circular.audience && circular.audience !== 'All' && (
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md ${
                      circular.audience === 'Teacher' 
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' 
                        : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                    }`}>
                      {circular.audience}s Only
                    </span>
                  )}
                </div>
                {isAdmin && (
                  <button 
                    onClick={() => handleDelete(circular._id)}
                    className="text-red-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 bg-white/80 dark:bg-gray-900/50 p-1 rounded-md"
                    title="Delete Circular"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <h3 className="text-xl font-bold text-[#2E1C40] dark:text-gray-900 mb-2">{circular.title}</h3>
              <p className="text-[#4C677C] dark:text-gray-300 text-sm mb-4 flex-1 whitespace-pre-wrap">
                {circular.description}
              </p>
              
              {circular.fileUrl && circular.fileType === 'image' && (
                <div 
                  className="mb-4 mt-2 rounded-xl overflow-hidden border border-[#E5D9C4]/40 dark:border-[#4C677C]/30 bg-black/5 cursor-pointer"
                  onClick={() => setPreviewFile(circular)}
                >
                  <img src={circular.fileUrl} alt="Circular attachment" className="w-full h-48 object-cover hover:scale-105 transition-transform" />
                </div>
              )}
              
              {circular.fileUrl && circular.fileType !== 'image' && (
                <button 
                  onClick={() => setPreviewFile(circular)}
                  className="mb-4 mt-2 p-3 rounded-xl border border-orange-200 dark:border-orange-900/30 bg-orange-50 dark:bg-orange-900/10 flex items-center gap-3 hover:bg-orange-100 dark:hover:bg-orange-900/20 transition-colors group text-left w-full"
                >
                  <div className="p-2 bg-orange-500/10 rounded-lg group-hover:scale-110 transition-transform shrink-0">
                    <FileText className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#2E1C40] dark:text-gray-900 truncate">
                      {circular.fileName || "View Attachment"}
                    </p>
                    <p className="text-xs text-[#4C677C] dark:text-gray-400">
                      Click to preview
                    </p>
                  </div>
                </button>
              )}
              
              <div className="mt-auto pt-4 border-t border-[#E5D9C4]/40 dark:border-[#4C677C]/30 flex justify-between items-center">
                <div className="text-xs font-bold text-[#4C677C] dark:text-[#E5D9C4]">
                  Posted by: {circular.postedBy}
                </div>
                <div className="text-[10px] text-[#4C677C]/50 dark:text-[#E5D9C4]/40">
                  Auto-deletes in 7 days
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {previewFile && (
        <FilePreviewModal
          isOpen={!!previewFile}
          onClose={() => setPreviewFile(null)}
          fileUrl={previewFile.fileUrl}
          fileType={previewFile.fileType}
          fileName={previewFile.fileName}
        />
      )}
    </div>
  );
}
