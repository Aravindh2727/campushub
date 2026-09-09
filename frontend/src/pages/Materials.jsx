import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { useAuth } from '../context/AuthContext';
import { NeonButton } from '../components/ui/NeonButton';
import { api } from '../lib/api';
import { useClassConfig } from '../context/ClassConfigContext';
import { Trash2, Plus, Edit, BookOpen, Link as LinkIcon, ExternalLink, Calendar } from 'lucide-react';

export function Materials() {
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedSection, setSelectedSection] = useState('All');
  const [materialsList, setMaterialsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const { classConfigs } = useClassConfig();
  
  let currentSubjects = [];
  if (selectedClass === 'All') {
    currentSubjects = [...new Set(classConfigs.flatMap(c => c.subjects))];
  } else if (selectedSection === 'All') {
    currentSubjects = [...new Set(classConfigs.filter(c => c.standard === selectedClass).flatMap(c => c.subjects))];
  } else {
    currentSubjects = classConfigs.find(c => c.standard === selectedClass && c.section === selectedSection)?.subjects || [];
  }

  const [formState, setFormState] = useState({
    title: '',
    description: '',
    subject: 'Tamil',
    link: ''
  });

  const { dbUser } = useAuth();
  
  let availableStandards = [];
  let availableSections = [];

  if (dbUser?.role === 'admin') {
    availableStandards = [...new Set(classConfigs.map(c => c.standard))].sort((a,b) => Number(a) - Number(b));
    availableSections = classConfigs.filter(c => c.standard === selectedClass).map(c => c.section).sort();
  } else if (dbUser?.assignedClasses) {
    availableStandards = [...new Set(dbUser.assignedClasses.map(c => c.standard))].sort((a,b) => Number(a) - Number(b));
    availableSections = dbUser.assignedClasses
      .filter(c => c.standard === selectedClass)
      .map(c => c.section)
      .sort();
  }

  const isClassSelected = selectedClass !== 'All' && selectedSection !== 'All';

  const hasFullAccess = isClassSelected && (
    dbUser?.role === 'admin' || (
      dbUser?.assignedClasses?.find(c => c.standard === selectedClass && c.section === selectedSection)?.accessLevel !== 'view'
    )
  );

  useEffect(() => {
    if (availableStandards.length > 0 && !availableStandards.includes(selectedClass)) {
      setSelectedClass(availableStandards[0]);
    }
  }, [availableStandards, selectedClass]);

  useEffect(() => {
    if (availableSections.length > 0 && !availableSections.includes(selectedSection)) {
      setSelectedSection(availableSections[0]);
    }
  }, [availableSections, selectedSection, selectedClass]);

  const loadMaterials = async () => {
    if (!isClassSelected) return;
    try {
      setLoading(true);
      const res = await api.getMaterialsByClass(selectedClass, selectedSection);
      setMaterialsList(res.data || []);
    } catch (err) {
      console.error('Failed to load materials', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isClassSelected) {
      loadMaterials();
    } else {
      setMaterialsList([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, selectedSection]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formState.link) {
      alert("Please provide a material link (e.g. Google Drive link).");
      return;
    }

    setLoading(true);
    
    try {
      if (editingId) {
        await api.updateMaterial(editingId, {
          ...formState,
          standard: selectedClass,
          section: selectedSection,
        });
      } else {
        await api.addMaterial({
          ...formState,
          standard: selectedClass,
          section: selectedSection,
        });
      }
      
      setIsAdding(false);
      setEditingId(null);
      resetForm();
      loadMaterials();
    } catch (err) {
      console.error('Failed to save material', err);
      alert('Error saving material.');
    } finally {
      setLoading(false);
    }
  };
  
  const resetForm = () => {
    setFormState({
      title: '',
      description: '',
      subject: currentSubjects[0] || 'Tamil',
      link: ''
    });
  };

  const handleEdit = (material) => {
    setFormState({
      title: material.title,
      description: material.description || '',
      subject: material.subject,
      link: material.link
    });
    setEditingId(material._id);
    setIsAdding(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this material?')) return;
    try {
      await api.deleteMaterial(id);
      loadMaterials();
    } catch (err) {
      console.error('Failed to delete material', err);
      alert('Error deleting material.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-black text-[#2E1C40] dark:text-gray-900 drop-shadow-sm flex items-start md:items-center">
          <BookOpen className="w-8 h-8 mr-3 text-adminSidebar shrink-0 mt-1 md:mt-0" />
          <span>Study Materials (Drive Links)</span>
        </h1>
        {hasFullAccess && !isAdding && (
          <NeonButton onClick={() => { setIsAdding(true); setEditingId(null); resetForm(); }} className="bg-adminSidebar text-white text-[#2E1C40] flex items-center self-start md:self-auto shrink-0">
            <Plus className="w-5 h-5 mr-2" />
            Add Material Link
          </NeonButton>
        )}
      </div>

      <GlassCard className="mb-6">
        <div className="flex flex-col md:flex-row gap-4 md:items-end">
          <div className="flex-1 space-y-2 w-full md:w-auto">
            <label className="block text-sm font-bold text-[#4C677C] dark:text-[#E5D9C4]">Class</label>
            <select 
              value={selectedClass} 
              onChange={e => {
                setSelectedClass(e.target.value);
                if (e.target.value === 'All') setSelectedSection('All');
              }}
              className="glass-input w-full font-bold text-[#2E1C40] dark:!text-gray-900 bg-white dark:bg-transparent shadow-sm border border-[#E5D9C4] dark:border-[#4C677C]/30 focus:ring-[#62D4CA] [&>option]:bg-white dark:[&>option]:bg-white"
            >
              <option value="All">Select Class</option>
              {availableStandards.map(std => (
                <option key={std} value={std}>Standard {std}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 space-y-2 w-full md:w-auto">
            <label className="block text-sm font-bold text-[#4C677C] dark:text-[#E5D9C4]">Section</label>
            <select 
              value={selectedSection} 
              onChange={e => setSelectedSection(e.target.value)}
              className="glass-input w-full font-bold text-[#2E1C40] dark:!text-gray-900 bg-white dark:bg-transparent shadow-sm border border-[#E5D9C4] dark:border-[#4C677C]/30 focus:ring-[#62D4CA] [&>option]:bg-white dark:[&>option]:bg-white"
              disabled={selectedClass === 'All'}
            >
              <option value="All">Select Section</option>
              {availableSections.map(sec => (
                <option key={sec} value={sec}>{sec}</option>
              ))}
            </select>
          </div>
        </div>
      </GlassCard>

      {isAdding && (
        <GlassCard className="border border-adminSidebar shadow-[0_0_15px_rgba(98,212,202,0.3)]">
          <h2 className="text-xl font-bold text-[#2E1C40] dark:text-gray-900 mb-4">{editingId ? 'Edit Material Link' : 'Add Material Link'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-[#4C677C] dark:text-[#E5D9C4] mb-1">Title</label>
                <input 
                  type="text"
                  required
                  value={formState.title}
                  onChange={e => setFormState({...formState, title: e.target.value})}
                  className="glass-input w-full dark:text-gray-900"
                  placeholder="e.g. Science Chapter 4 PDF"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#4C677C] dark:text-[#E5D9C4] mb-1">Subject</label>
                <select 
                  required
                  value={formState.subject}
                  onChange={e => setFormState({...formState, subject: e.target.value})}
                  className="glass-input w-full dark:text-gray-900 [&>option]:bg-white dark:[&>option]:bg-white"
                >
                  {currentSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-[#4C677C] dark:text-[#E5D9C4] mb-1">Material Link (Google Drive, DropBox, etc)</label>
                <input 
                  type="url"
                  required
                  value={formState.link}
                  onChange={e => setFormState({...formState, link: e.target.value})}
                  className="glass-input w-full dark:text-gray-900"
                  placeholder="https://drive.google.com/..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-[#4C677C] dark:text-[#E5D9C4] mb-1">Description (Optional)</label>
                <textarea 
                  value={formState.description}
                  onChange={e => setFormState({...formState, description: e.target.value})}
                  className="glass-input w-full dark:text-gray-900 h-24"
                  placeholder="Additional instructions..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4">
              <button 
                type="button" 
                onClick={() => { setIsAdding(false); setEditingId(null); resetForm(); }}
                className="px-4 py-2 font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                disabled={loading}
              >
                Cancel
              </button>
              <NeonButton type="submit" disabled={loading} className="bg-adminSidebar text-white text-[#2E1C40]">
                {loading ? 'Saving...' : 'Save Link'}
              </NeonButton>
            </div>
          </form>
        </GlassCard>
      )}

      {!isClassSelected ? (
        <div className="text-center py-12 text-[#4C677C] dark:text-[#E5D9C4]/60">
          Select a class and section to view materials
        </div>
      ) : loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : materialsList.length === 0 ? (
        <div className="text-center py-12 text-[#4C677C] dark:text-[#E5D9C4]/60 bg-white/30 dark:bg-[#1A1A24]/30 rounded-xl">
          <LinkIcon className="w-12 h-12 mx-auto opacity-50 mb-3" />
          <p>No study materials assigned for this class yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materialsList.map(mat => (
            <GlassCard key={mat._id} className="flex flex-col relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#62D4CA] text-white"></div>
              <div className="flex justify-between items-start mb-2">
                <span className="bg-[#62D4CA]/20 text-[#2E1C40] dark:text-[#62D4CA] px-3 py-1 rounded-full text-xs font-bold">
                  {mat.subject}
                </span>
                {hasFullAccess && (
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleEdit(mat)}
                      className="text-[#62D4CA] hover:text-[#4ABDB3] transition-colors bg-white/80 dark:bg-gray-900/50 p-1 rounded-md"
                      title="Edit Material"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(mat._id)}
                      className="text-red-400 hover:text-red-600 transition-colors bg-white/80 dark:bg-gray-900/50 p-1 rounded-md"
                      title="Delete Material"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <h3 className="text-xl font-bold text-[#2E1C40] dark:text-gray-900 mb-2">{mat.title}</h3>
              {mat.description && (
                <p className="text-[#4C677C] dark:text-gray-300 text-sm mb-4">
                  {mat.description}
                </p>
              )}
              
              <div className="mt-2 mb-4">
                <a 
                  href={mat.link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center text-sm font-bold bg-[#62D4CA]/10 hover:bg-[#62D4CA]/20 text-[#2E1C40] dark:text-[#62D4CA] p-3 rounded-xl border border-[#62D4CA]/30 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Material Link
                </a>
              </div>
              
              <div className="mt-auto pt-4 border-t border-[#E5D9C4]/40 dark:border-[#4C677C]/30 flex justify-between items-center mt-2">
                <div className="text-xs text-[#4C677C]/60 dark:text-[#E5D9C4]/50">
                  Uploaded by: {mat.uploadedBy}
                </div>
                <div className="text-[10px] text-[#4C677C]/40 dark:text-[#E5D9C4]/30 flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {new Date(mat.createdAt).toLocaleDateString()}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
