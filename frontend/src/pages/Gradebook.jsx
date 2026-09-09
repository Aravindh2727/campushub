import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { useAuth } from '../context/AuthContext';
import { NeonButton } from '../components/ui/NeonButton';
import { api } from '../lib/api';
import { appState } from '../lib/appState';
import { useClassConfig } from '../context/ClassConfigContext';



export function Gradebook() {
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedSection, setSelectedSection] = useState('All');
  const [selectedTerm, setSelectedTerm] = useState('All Terms');
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { dbUser } = useAuth();
  const { classConfigs } = useClassConfig();
  
  let currentSubjects = [];
  if (selectedClass === 'All') {
    currentSubjects = [...new Set(classConfigs.flatMap(c => c.subjects))];
  } else if (selectedSection === 'All') {
    currentSubjects = [...new Set(classConfigs.filter(c => c.standard === selectedClass).flatMap(c => c.subjects))];
  } else {
    currentSubjects = classConfigs.find(c => c.standard === selectedClass && c.section === selectedSection)?.subjects || [];
  }
  
  // Compute available standards and sections based on user role
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

  const isReportView = selectedClass === 'All' || selectedSection === 'All' || selectedTerm === 'All Terms';

  const hasFullAccess = !isReportView && (
    dbUser?.role === 'admin' || (
      dbUser?.assignedClasses?.find(c => c.standard === selectedClass && c.section === selectedSection)?.accessLevel !== 'view'
    )
  );

  React.useEffect(() => {
    if (availableStandards.length > 0 && !availableStandards.includes(selectedClass)) {
      setSelectedClass(availableStandards[0]);
    }
  }, [availableStandards, selectedClass]);

  React.useEffect(() => {
    if (availableSections.length > 0 && !availableSections.includes(selectedSection)) {
      setSelectedSection(availableSections[0]);
    }
  }, [availableSections, selectedSection, selectedClass]);

  const [marks, setMarks] = useState({});

  const handleMarkChange = (studentId, subject, value) => {
    setMarks(prev => ({
      ...prev,
      [`${studentId}-${subject}`]: value
    }));
    appState.setFormDirty('Gradebook', true);
  };

  useEffect(() => {
    return () => appState.setFormDirty('Gradebook', false);
  }, []);

  const loadStudents = async () => {
    try {
      setLoadingStudents(true);
      const res = await api.getStudents(selectedClass, selectedSection);
      setStudents(res.data || []);
    } catch (err) {
      console.error('Failed to load students', err);
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, selectedSection]);

  useEffect(() => {
    const newMarks = {};
    students.forEach(student => {
      let studentTotal = 0;
      
      currentSubjects.forEach(sub => {
        let score = 0;
        
        if (selectedTerm === 'All Terms') {
          // Sum across all terms
          student.terms?.forEach(termData => {
            if (termData.marks) {
              const markObj = termData.marks.find(m => m.subject === sub);
              if (markObj !== undefined) {
                score += Number(markObj.score);
              }
            }
          });
        } else {
          // Single term
          const termData = student.terms?.find(t => t.termName === selectedTerm);
          if (termData && termData.marks) {
            const markObj = termData.marks.find(m => m.subject === sub);
            if (markObj !== undefined) {
              score = Number(markObj.score);
            }
          }
        }
        
        newMarks[`${student._id}-${sub}`] = score;
      });
    });
    setMarks(newMarks);
  }, [students, selectedTerm]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      // Group marks by student ID
      const studentUpdates = {};
      
      Object.entries(marks).forEach(([key, score]) => {
        const firstHyphen = key.indexOf('-');
        const studentId = key.substring(0, firstHyphen);
        const subject = key.substring(firstHyphen + 1);

        if (!studentUpdates[studentId]) {
          studentUpdates[studentId] = [];
        }
        // Convert score to Number
        studentUpdates[studentId].push({ subject, score: Number(score) });
      });

      // Submit all updates sequentially to prevent server overload (500 errors)
      for (const [studentId, marksArray] of Object.entries(studentUpdates)) {
        await api.updateMarks(studentId, selectedTerm, marksArray);
      }

      appState.setFormDirty('Gradebook', false);
      alert(`${selectedTerm} marks saved successfully!`);
    } catch (err) {
      console.error('Failed to save marks', err);
      alert('Error saving marks.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black text-[#2E1C40] dark:text-gray-900 drop-shadow-sm">
        Term Gradebook
      </h1>

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
              className="glass-input w-full font-bold text-[#2E1C40] dark:!text-gray-900 bg-white dark:bg-transparent shadow-sm border border-[#E5D9C4] dark:border-[#4C677C]/30 focus:ring-[#62D4CA] disabled:opacity-50 [&>option]:bg-white dark:[&>option]:bg-white dark:[&>option]:text-gray-900"
            >
              <option value="All">All Standards</option>
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
              className="glass-input w-full font-bold text-[#2E1C40] dark:!text-gray-900 bg-white dark:bg-transparent shadow-sm border border-[#E5D9C4] dark:border-[#4C677C]/30 focus:ring-[#62D4CA] disabled:opacity-50 [&>option]:bg-white dark:[&>option]:bg-white dark:[&>option]:text-gray-900"
              disabled={selectedClass === 'All'}
            >
              <option value="All">All Sections</option>
              {availableSections.map(sec => (
                <option key={sec} value={sec}>{sec}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 space-y-2 w-full md:w-auto">
            <label className="block text-sm font-bold text-[#4C677C] dark:text-[#E5D9C4]">Term</label>
            <select 
              value={selectedTerm} 
              onChange={e => setSelectedTerm(e.target.value)}
              className="glass-input w-full font-bold text-[#2E1C40] dark:!text-gray-900 bg-white dark:bg-transparent shadow-sm border border-[#E5D9C4] dark:border-[#4C677C]/30 focus:ring-[#62D4CA] disabled:opacity-50 [&>option]:bg-white dark:[&>option]:bg-white dark:[&>option]:text-gray-900"
            >
              <option value="All Terms">All Terms (Total Sum)</option>
              <option value="First Midterm">First Midterm</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Second Midterm">Second Midterm</option>
              <option value="Half-Yearly">Half-Yearly</option>
              <option value="Third Midterm">Third Midterm</option>
              <option value="Annual">Annual</option>
            </select>
          </div>
          <div className="flex-none w-full md:w-auto pt-2 md:pt-0">
            <NeonButton onClick={loadStudents} disabled={loadingStudents} className="w-full md:w-auto">
              {loadingStudents ? 'Loading...' : 'Load Students'}
            </NeonButton>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <form onSubmit={handleSave}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#D8FDF6]/40 dark:bg-white text-[#4C677C] dark:text-[#E5D9C4]">
                <tr className="border-b border-[#E5D9C4] dark:border-[#4C677C]/30">
                  <th className="p-4 font-bold rounded-tl-lg whitespace-nowrap">EMIS No</th>
                  <th className="p-4 font-bold whitespace-nowrap">Name</th>
                  {currentSubjects.map(sub => (
                    <th key={sub} className="p-4 font-bold">{sub}</th>
                  ))}
                  <th className="p-4 font-black text-[#732A26] dark:text-[#FA7848] rounded-tr-lg">Total</th>
                </tr>
              </thead>
              <tbody>
                {students.map(student => (
                  <tr key={student._id} className="border-b border-[#E5D9C4]/40 dark:border-[#4C677C]/30 hover:bg-[#D8FDF6]/20 dark:hover:bg-[#2E1C40]/20 transition-colors">
                    <td className="p-4 text-[#4C677C] dark:text-gray-300 font-medium whitespace-nowrap">
                      {student.emisNumber}
                      {isReportView && <span className="ml-2 bg-adminSidebar/20 text-[#2E1C40] dark:text-gray-900 px-2 py-0.5 rounded-full text-xs font-bold inline-block whitespace-nowrap">Std {student.standard}-{student.section}</span>}
                    </td>
                    <td className="p-4 font-bold text-[#2E1C40] dark:text-gray-900 whitespace-nowrap">{student.name}</td>
                    {currentSubjects.map(sub => (
                      <td key={sub} className="p-4">
                        <input 
                          type="number"
                          min="0"
                          max={selectedTerm === 'All Terms' ? "300" : "100"}
                          required
                          value={marks[`${student._id}-${sub}`] !== undefined && marks[`${student._id}-${sub}`] !== '' ? marks[`${student._id}-${sub}`] : 0}
                          onChange={(e) => handleMarkChange(student._id, sub, e.target.value)}
                          className={`glass-input w-20 text-center font-bold text-[#2E1C40] dark:text-gray-900 bg-white dark:bg-[#121212] shadow-sm border border-[#E5D9C4] dark:border-[#4C677C]/50 ${!hasFullAccess ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-800 border-none shadow-none' : ''}`}
                          disabled={!hasFullAccess}
                        />
                      </td>
                    ))}
                    <td className="p-4 font-black text-[#732A26] dark:text-[#FA7848] text-lg">
                      {currentSubjects.reduce((sum, sub) => sum + (Number(marks[`${student._id}-${sub}`]) || 0), 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 flex justify-end">
            {hasFullAccess ? (
              <NeonButton type="submit" disabled={isSaving} className="bg-adminSidebar text-white text-[#2E1C40]">
                {isSaving ? 'Saving...' : `Save ${selectedTerm} Marks`}
              </NeonButton>
            ) : (
              <p className="text-[#4C677C]/60 dark:text-gray-400 text-sm italic">
                {isReportView ? 'Report views are read-only.' : 'You have view-only access to this class.'}
              </p>
            )}
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
