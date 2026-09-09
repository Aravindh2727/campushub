import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { X, User, BookOpen, Calendar, MapPin, Award } from 'lucide-react';

export function StudentProfileModal({ studentId, onClose }) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!studentId) return;
    
    const fetchStudent = async () => {
      try {
        setLoading(true);
        const data = await api.getStudentById(studentId);
        setStudent(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching student profile:", err);
        setError("Failed to load student profile.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchStudent();
  }, [studentId]);

  useEffect(() => {
    if (!studentId) return;

    // Push a temporary history state to intercept the back button
    window.history.pushState({ studentModalOpen: true }, '');

    const handlePopState = () => {
      // Hardware back button pressed
      onClose();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [studentId, onClose]);

  const handleClose = () => {
    if (window.history.state && window.history.state.studentModalOpen) {
      // User manually clicked close. Clean up the temporary history state.
      window.history.back();
    } else {
      onClose();
    }
  };

  if (!studentId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white dark:bg-[#0B0F19] rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-gray-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Background */}
        <div className="h-32 bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-800">
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 text-gray-900 rounded-full transition-colors backdrop-blur-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-500 dark:text-slate-400">Loading profile...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-500">{error}</p>
            <button onClick={handleClose} className="mt-4 px-4 py-2 bg-slate-100 dark:bg-gray-50 rounded-lg text-slate-700 dark:text-slate-300">Close</button>
          </div>
        ) : student ? (
          <div className="px-6 pb-6">
            {/* Profile Photo Avatar */}
            <div className="relative flex justify-center -mt-16 mb-4">
              <div className="w-32 h-32 rounded-full border-4 border-white dark:border-[#0B0F19] bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden shadow-lg">
                {student.photoUrl ? (
                  <img src={student.photoUrl} alt={student.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-slate-400" />
                )}
              </div>
            </div>

            {/* Basic Info */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-gray-900 mb-1">{student.name}</h2>
              {student.tamilName && <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{student.tamilName}</p>}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-sm font-semibold">
                <BookOpen className="w-4 h-4" />
                Class {student.standard}-{student.section}
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-gray-50 p-3 rounded-xl">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider font-semibold">EMIS Number</p>
                <p className="font-medium text-slate-800 dark:text-gray-900">{student.emisNumber || 'N/A'}</p>
              </div>
              <div className="bg-slate-50 dark:bg-gray-50 p-3 rounded-xl">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider font-semibold">Medium</p>
                <p className="font-medium text-slate-800 dark:text-gray-900">{student.medium || 'N/A'}</p>
              </div>
              <div className="bg-slate-50 dark:bg-gray-50 p-3 rounded-xl">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider font-semibold">Father's Name</p>
                <p className="font-medium text-slate-800 dark:text-gray-900">{student.fatherName || 'N/A'}</p>
              </div>
              <div className="bg-slate-50 dark:bg-gray-50 p-3 rounded-xl">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider font-semibold">Gender</p>
                <p className="font-medium text-slate-800 dark:text-gray-900">{student.gender || 'N/A'}</p>
              </div>
              <div className="bg-slate-50 dark:bg-gray-50 p-3 rounded-xl col-span-2 flex gap-3 items-center">
                <Calendar className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Date of Birth</p>
                  <p className="font-medium text-slate-800 dark:text-gray-900">{student.dob ? student.dob.split('-').reverse().join('-') : 'N/A'}</p>
                </div>
              </div>
              {student.address && (
                <div className="bg-slate-50 dark:bg-gray-50 p-3 rounded-xl col-span-2 flex gap-3 items-start">
                  <MapPin className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Address</p>
                    <p className="font-medium text-slate-800 dark:text-gray-900 text-sm">{student.address}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Total Marks (if terms exist) */}
            {student.terms && student.terms.length > 0 && (
              <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-100 dark:border-amber-900/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg text-amber-600 dark:text-amber-500">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider">Total Score</p>
                    <p className="text-sm text-amber-900 dark:text-amber-200">Across all terms</p>
                  </div>
                </div>
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                  {student.terms.reduce((totalAcc, term) => {
                    const termTotal = (term.marks || []).reduce((termAcc, m) => termAcc + (Number(m.score) || 0), 0);
                    return totalAcc + termTotal;
                  }, 0)}
                </div>
              </div>
            )}
            
          </div>
        ) : null}
      </div>
    </div>
  );
}
