import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { useAuth } from '../context/AuthContext';
import { NeonButton } from '../components/ui/NeonButton';
import { api } from '../lib/api';
import { User, Mail, Shield, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';

export function Profile() {
  const { dbUser } = useAuth();
  
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (dbUser) {
      setName(dbUser.name || '');
    }
  }, [dbUser]);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ text: '', type: '' });

    try {
      await api.updateProfile({ name });
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
      setIsEditing(false);
      // Note: In a full app, we might want to refresh dbUser in AuthContext here, 
      // but a reload or next login will pick it up anyway.
    } catch (error) {
      console.error(error);
      setMessage({ text: 'Failed to update profile.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!dbUser) return null;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="mb-2">
        <h1 className="text-4xl font-black text-[#2E1C40] dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:to-gray-400 drop-shadow-sm tracking-tight mb-2">
          My Profile
        </h1>
        <p className="text-[#4C677C] dark:text-gray-400 font-medium">Manage your account settings and teaching responsibilities.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Profile Details Form */}
        <GlassCard className="p-6 md:p-8 relative overflow-hidden group bg-white border-[#E5D9C4] dark:border-gray-200 dark:bg-white/60 shadow-xl dark:shadow-2xl">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-adminSidebar text-white/5 rounded-full blur-3xl -z-10 group-hover:bg-adminSidebar/10 transition-all duration-700"></div>

          <div className="flex items-center gap-5 mb-8">
            <div className="p-4 bg-gradient-to-br from-[#62D4CA]/20 to-[#62D4CA]/5 border border-adminSidebar/30 shadow-[0_0_20px_rgba(98,212,202,0.15)] rounded-2xl">
              <User className="w-7 h-7 text-adminSidebar" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#2E1C40] dark:text-gray-900 tracking-tight">Account Details</h2>
              <p className="text-sm text-[#4C677C] dark:text-gray-400 mt-1">Personal information & settings</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-[#4C677C] dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-adminSidebar" />
                Display Name
              </label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isEditing}
                className={`w-full px-5 py-4 rounded-xl font-bold text-[#2E1C40] dark:text-gray-900 transition-all outline-none 
                  ${!isEditing 
                    ? 'bg-[#F2FCFA] border border-[#E5D9C4] dark:bg-gray-50 dark:border-gray-200 opacity-80 cursor-not-allowed text-[#4C677C] dark:text-gray-300' 
                    : 'bg-white border border-[#E5D9C4] dark:bg-gray-100 dark:border-adminSidebar/50 focus:border-adminSidebar focus:ring-4 focus:ring-[#62D4CA]/10 shadow-sm dark:shadow-[0_0_15px_rgba(98,212,202,0.1)]'
                  }`}
                placeholder="Enter your name"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4C677C] dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#FA7848]" />
                Email Address
              </label>
              <input 
                type="email" 
                value={dbUser.email}
                className="w-full px-5 py-4 rounded-xl font-bold text-[#4C677C] dark:text-gray-400 bg-[#F2FCFA] dark:bg-gray-900/10 border border-[#E5D9C4] dark:border-gray-200 cursor-not-allowed"
                disabled
              />
              <p className="text-xs text-[#4C677C]/80 dark:text-gray-500 mt-2.5 font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> Email cannot be changed for security reasons.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4C677C] dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#AE634A]" />
                Role & Status
              </label>
              <div className="flex items-center gap-3">
                <span className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-widest border shadow-sm ${
                  dbUser.role === 'admin' 
                    ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-500/30 dark:shadow-[0_0_15px_rgba(168,85,247,0.15)]' 
                    : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30 dark:shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                }`}>
                  {dbUser.role.toUpperCase()}
                </span>
                
                <span className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-widest border shadow-sm ${
                  (dbUser.status || 'approved') === 'approved' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30 dark:shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                    : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30 dark:shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                }`}>
                  {(dbUser.status || 'approved').toUpperCase()}
                </span>
              </div>
            </div>

            {message.text && (
              <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-bold border ${
                message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
              }`}>
                {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                {message.text}
              </div>
            )}

            <div className="pt-8 mt-4 border-t border-[#E5D9C4] dark:border-gray-200 flex flex-wrap gap-4">
              {!isEditing ? (
                <button 
                  type="button" 
                  onClick={(e) => { e.preventDefault(); setIsEditing(true); }}
                  className="px-8 py-3.5 rounded-xl font-bold text-[#0B132B] bg-adminSidebar text-white hover:bg-[#4ebab0] hover:shadow-[0_0_25px_rgba(98,212,202,0.4)] transition-all duration-300 flex items-center gap-2 transform hover:-translate-y-0.5"
                >
                  <User className="w-5 h-5" />
                  Edit Profile
                </button>
              ) : (
                <>
                  <button 
                    type="submit" 
                    disabled={isSaving || !name.trim()}
                    className="px-8 py-3.5 rounded-xl font-bold text-[#0B132B] bg-adminSidebar text-white hover:bg-[#4ebab0] hover:shadow-[0_0_25px_rgba(98,212,202,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transform hover:-translate-y-0.5 flex items-center gap-2"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setIsEditing(false); setName(dbUser.name || ''); setMessage({text: '', type: ''}); }}
                    className="px-8 py-3.5 rounded-xl font-bold text-[#4C677C] bg-white border border-[#E5D9C4] hover:bg-[#F2FCFA] hover:text-[#2E1C40] dark:text-gray-300 dark:bg-gray-50 dark:border-gray-200 dark:hover:bg-gray-100 dark:hover:text-gray-900 transition-all duration-300"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </form>
        </GlassCard>

        {/* Assigned Classes */}
        <GlassCard className="p-6 md:p-8 h-fit relative overflow-hidden group bg-white border-[#E5D9C4] dark:border-gray-200 dark:bg-white/60 shadow-xl dark:shadow-2xl">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#FA7848]/5 rounded-full blur-3xl -z-10 group-hover:bg-[#FA7848]/10 transition-all duration-700"></div>

          <div className="flex items-center gap-5 mb-8">
            <div className="p-4 bg-gradient-to-br from-[#FA7848]/20 to-[#FA7848]/5 border border-[#FA7848]/30 shadow-[0_0_20px_rgba(250,120,72,0.15)] rounded-2xl">
              <BookOpen className="w-7 h-7 text-[#FA7848]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#2E1C40] dark:text-gray-900 tracking-tight">Assigned Classes</h2>
              <p className="text-sm text-[#4C677C] dark:text-gray-400 mt-1">Your teaching responsibilities</p>
            </div>
          </div>

          {dbUser.role === 'admin' ? (
            <div className="bg-gradient-to-r from-[#62D4CA]/10 to-transparent border-l-4 border-adminSidebar p-6 rounded-r-2xl">
              <div className="flex items-start gap-4">
                <Shield className="w-6 h-6 text-adminSidebar mt-0.5 flex-shrink-0 drop-shadow-[0_0_8px_rgba(98,212,202,0.5)]" />
                <div>
                  <h3 className="font-bold text-[#2E1C40] dark:text-gray-900 text-lg mb-2">Full Administrator Access</h3>
                  <p className="text-[#4C677C] dark:text-gray-300 leading-relaxed">
                    As an Admin, you have unrestricted access to all classes, sections, and records within the institution.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {dbUser.assignedClasses && dbUser.assignedClasses.length > 0 ? (
                dbUser.assignedClasses.map((ac, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-[#F2FCFA] dark:bg-gray-50 border border-[#E5D9C4] dark:border-gray-200 hover:bg-[#E5F9F6] dark:hover:bg-gray-100 hover:border-adminSidebar/30 dark:hover:border-white/20 rounded-2xl transition-all duration-300 gap-4 group/item">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-xl bg-adminSidebar/10 border border-adminSidebar/20 flex items-center justify-center text-adminSidebar font-black text-lg group-hover/item:scale-105 transition-transform">
                        {ac.standard}
                      </div>
                      <div>
                        <div className="font-bold text-[#2E1C40] dark:text-gray-900 text-lg">Standard {ac.standard}</div>
                        <div className="text-[#4C677C] dark:text-gray-400 font-medium">Section {ac.section}</div>
                      </div>
                    </div>
                    <div>
                      {ac.accessLevel === 'view' ? (
                        <span className="px-4 py-1.5 text-xs font-bold tracking-wider rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30">
                          VIEW ONLY
                        </span>
                      ) : (
                        <span className="px-4 py-1.5 text-xs font-bold tracking-wider rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30">
                          FULL ACCESS
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center p-10 bg-[#F2FCFA] dark:bg-gray-50 rounded-3xl border border-[#E5D9C4] dark:border-gray-200 border-dashed">
                  <div className="w-16 h-16 bg-white dark:bg-gray-50 shadow-sm dark:shadow-none rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#E5D9C4] dark:border-transparent">
                    <BookOpen className="w-8 h-8 text-[#4C677C] dark:text-gray-500" />
                  </div>
                  <p className="text-[#2E1C40] dark:text-gray-300 font-bold text-lg mb-2">No classes assigned</p>
                  <p className="text-[#4C677C] dark:text-gray-500">Please contact an administrator to get your classes assigned.</p>
                </div>
              )}
            </div>
          )}
        </GlassCard>

      </div>
    </div>
  );
}
