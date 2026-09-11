import React, { useState, useEffect, useMemo } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { NeonButton } from '../components/ui/NeonButton';
import { Trophy, Medal, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../lib/api';

export function Leaderboard() {
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedSection, setSelectedSection] = useState('All');
  const [loading, setLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [classConfigs, setClassConfigs] = useState([]);
  const [rankBy, setRankBy] = useState('Marks');

  const fetchStudentDetails = async (id) => {
    try {
      setSelectedStudentId(id);
      setLoadingDetails(true);
      const res = await api.getStudentById(id);
      setStudentDetails(res);
    } catch (err) {
      console.error('Failed to fetch student details:', err);
      alert('Error fetching details.');
      setSelectedStudentId(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const res = await api.getLeaderboard(selectedClass, selectedSection);
      setLeaderboard(res.data || []);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
      alert('Error fetching leaderboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadConfigs = async () => {
      try {
        const res = await api.getClassConfigs();
        setClassConfigs(Array.isArray(res) ? res : (res.data || []));
      } catch (err) {
        console.error('Failed to fetch configs', err);
      }
    };
    loadConfigs();
  }, []);

  useEffect(() => {
    fetchLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, selectedSection]);

  const derivedLeaderboard = useMemo(() => {
    if (!leaderboard || leaderboard.length === 0) return [];
    
    // 1. Calculate percentage for each student
    let processed = leaderboard.map(student => {
      const standard = String(student.standard);
      const maxMarks = (standard === '11' || standard === '12') ? 600 : 500;
      const percentage = (student.totalMarks / maxMarks) * 100;
      return {
        ...student,
        calculatedPercentage: percentage,
        displayPercentage: percentage.toFixed(2) + '%'
      };
    });

    // 2. Sort based on rankBy
    processed.sort((a, b) => {
      if (rankBy === 'Marks') {
        if (b.totalMarks !== a.totalMarks) {
          return b.totalMarks - a.totalMarks; // DESC marks
        }
        return b.calculatedPercentage - a.calculatedPercentage; // DESC percentage
      } else {
        if (b.calculatedPercentage !== a.calculatedPercentage) {
          return b.calculatedPercentage - a.calculatedPercentage; // DESC percentage
        }
        return b.totalMarks - a.totalMarks; // DESC marks
      }
    });

    // 3. Dense Ranking and Ties
    let currentRank = 0;
    let prevMarks = null;
    let prevPercentage = null;

    processed.forEach((student) => {
      const isTie = prevMarks !== null 
        && prevMarks === student.totalMarks 
        && prevPercentage === student.calculatedPercentage;

      if (!isTie) {
        currentRank++;
      }
      
      student.computedRank = currentRank;
      student.position = currentRank;
      student.showPosition = !isTie;
      
      prevMarks = student.totalMarks;
      prevPercentage = student.calculatedPercentage;
    });

    return processed;
  }, [leaderboard, rankBy]);

  const renderRankIcon = (rank) => {
    switch(rank) {
      case 1: return (
        <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center drop-shadow-md transition-transform hover:scale-110">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path d="M 10 18 C 5 18 2 13 2 8" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M 2 8 Q 3 5 5 7 Q 4 9 2 8 Z" fill="#FBBF24" />
            <path d="M 3 11 Q 5 8 7 10 Q 6 12 3 11 Z" fill="#FBBF24" />
            <path d="M 5 14 Q 7 11 9 13 Q 8 15 5 14 Z" fill="#FBBF24" />
            <path d="M 7 17 Q 9 14 11 16 Q 10 18 7 17 Z" fill="#FBBF24" />
            <path d="M 14 18 C 19 18 22 13 22 8" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M 22 8 Q 21 5 19 7 Q 20 9 22 8 Z" fill="#FBBF24" />
            <path d="M 21 11 Q 19 8 17 10 Q 18 12 21 11 Z" fill="#FBBF24" />
            <path d="M 19 14 Q 17 11 15 13 Q 16 15 19 14 Z" fill="#FBBF24" />
            <path d="M 17 17 Q 15 14 13 16 Q 14 18 17 17 Z" fill="#FBBF24" />
            <rect x="7" y="21" width="10" height="2" rx="1" fill="#F59E0B" />
            <rect x="8" y="17" width="8" height="4" rx="1" fill="#475569" />
            <rect x="11" y="14" width="2" height="3" fill="#D97706" />
            <path d="M12 2 l2 6 h6 l-4.8 3.5 1.8 5.5 -5 -3.8 -5 3.8 1.8 -5.5 -4.8 -3.5 h6 z" fill="#FBBF24" stroke="#D97706" strokeWidth="1" strokeLinejoin="round" />
            <circle cx="12" cy="9.5" r="3.5" fill="#FEF3C7" />
            <text x="12" y="12.8" fill="#D97706" fontSize="10" fontWeight="900" textAnchor="middle" style={{fontFamily: 'system-ui, sans-serif'}}>1</text>
          </svg>
        </div>
      );
      case 2: return (
        <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center drop-shadow-md transition-transform hover:scale-110">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path d="M4.5 2.5 L12 9 L19.5 2.5 L15.5 10 L8.5 10 Z" fill="#3B82F6" />
            <path d="M12 11.5 L9 9 L15 9 Z" fill="#2563EB" />
            <circle cx="12" cy="15" r="7.5" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1" />
            <circle cx="12" cy="15" r="5.5" fill="#F8FAFC" />
            <text x="12" y="18.8" fill="#475569" fontSize="11" fontWeight="900" textAnchor="middle" style={{fontFamily: 'system-ui, sans-serif'}}>2</text>
          </svg>
        </div>
      );
      case 3: return (
        <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center drop-shadow-md transition-transform hover:scale-110">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path d="M4.5 2.5 L12 9 L19.5 2.5 L15.5 10 L8.5 10 Z" fill="#3B82F6" />
            <path d="M12 11.5 L9 9 L15 9 Z" fill="#2563EB" />
            <circle cx="12" cy="15" r="7.5" fill="#CB8A66" stroke="#B87350" strokeWidth="1" />
            <circle cx="12" cy="15" r="5.5" fill="#E59D77" />
            <text x="12" y="18.8" fill="#5C311E" fontSize="11" fontWeight="900" textAnchor="middle" style={{fontFamily: 'system-ui, sans-serif'}}>3</text>
          </svg>
        </div>
      );
      default: return <div className="w-8 h-8 flex items-center justify-center font-bold text-xl text-[#4C677C]/60  ">{rank}</div>;
    }
  };

  const getTitle = () => {
    if (selectedClass === 'All') return 'Whole School Leaderboard';
    if (selectedSection === 'All') return `Standard ${selectedClass} Leaderboard`;
    return `Standard ${selectedClass} - Section ${selectedSection} Leaderboard`;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <h1 className="text-3xl font-bold text-[#2E1C40] dark:text-gray-900 drop-shadow-sm">
          {getTitle()}
        </h1>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto mt-4 md:mt-0">
          <select 
            value={selectedClass} 
            onChange={e => {
              setSelectedClass(e.target.value);
              setSelectedSection('All');
            }}
            className="glass-input w-full sm:w-auto dark:!text-gray-900 dark:bg-transparent [&>option]:bg-white dark:[&>option]:bg-white dark:[&>option]:text-gray-900"
          >
            <option value="All">All Standards (Whole School)</option>
            <option value="6">Standard 6</option>
            <option value="7">Standard 7</option>
            <option value="8">Standard 8</option>
            <option value="9">Standard 9</option>
            <option value="10">Standard 10</option>
            <option value="11">Standard 11</option>
            <option value="12">Standard 12</option>
          </select>
          <select 
            value={selectedSection} 
            onChange={e => setSelectedSection(e.target.value)}
            className="glass-input w-full sm:w-auto dark:!text-gray-900 dark:bg-transparent [&>option]:bg-white dark:[&>option]:bg-white dark:[&>option]:text-gray-900"
            disabled={selectedClass === 'All'}
          >
            <option value="All">All Sections</option>
            {classConfigs
              .filter(c => String(c.standard) === String(selectedClass))
              .map(c => c.section)
              .filter((v, i, a) => a.indexOf(v) === i) // unique
              .sort()
              .map(sec => (
                <option key={sec} value={sec}>Section {sec}</option>
              ))}
          </select>
          <select
            value={rankBy}
            onChange={e => setRankBy(e.target.value)}
            className="glass-input w-full sm:w-auto dark:!text-gray-900 dark:bg-transparent [&>option]:bg-white dark:[&>option]:bg-white dark:[&>option]:text-gray-900"
          >
            <option value="Marks">Rank By: Marks</option>
            <option value="Percentage">Rank By: Percentage</option>
          </select>
        </div>
      </div>

      <div className="space-y-4 mt-8">
        {loading ? (
          <div className="text-center py-10 text-[#4C677C] dark:text-gray-400">Calculating Ranks...</div>
        ) : (
          derivedLeaderboard.map((student) => (
            <div 
              key={student._id} 
              onClick={() => fetchStudentDetails(student._id)}
              className={cn(
                "glass-card p-3 sm:p-4 flex flex-row items-center gap-3 sm:gap-6 transition-all duration-300 hover:scale-[1.02] cursor-pointer",
                student.computedRank === 1 ? "border-[#AE634A]/50 shadow-md bg-[#FDF9F7] dark:bg-[#AE634A]/10" : "",
                student.computedRank === 2 ? "border-adminSidebar/50 bg-[#F2FCFA] dark:bg-adminSidebar/10" : "",
                student.computedRank === 3 ? "border-[#732A26]/50 bg-[#FCF9F9] dark:bg-[#732A26]/10" : "",
                student.computedRank > 3 ? "border-[#E5D9C4] dark:border-[#4C677C]/30" : ""
              )}
            >
              {/* Position Column */}
              <div className="w-10 sm:w-14 flex flex-col items-center justify-center shrink-0 border-r border-[#E5D9C4]/50 dark:border-gray-700/50 pr-2 sm:pr-4">
                {student.showPosition ? (
                  <>
                    <span className="text-[9px] sm:text-[10px] text-[#4C677C] dark:text-gray-400 font-bold uppercase tracking-wider mb-0.5">Pos</span>
                    <span className="text-lg sm:text-2xl font-black text-[#2E1C40] dark:text-white">{student.position}</span>
                  </>
                ) : (
                  <div className="h-[44px] sm:h-[52px]"></div>
                )}
              </div>

              {/* Rank Column */}
              <div className="w-10 sm:w-14 flex flex-col items-center justify-center shrink-0">
                <span className="text-[9px] sm:text-[10px] text-[#4C677C] dark:text-gray-400 font-bold uppercase tracking-wider mb-0.5">Rank</span>
                <div className="transform scale-75 sm:scale-100 origin-top">
                  {renderRankIcon(student.computedRank)}
                </div>
              </div>
              
              <img 
                src={student.photoUrl || 'https://placehold.co/150'} 
                alt={student.name}
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-white/20 shrink-0"
              />
              
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold truncate text-[#2E1C40] dark:text-gray-900">{student.name}</h3>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[#4C677C] dark:text-gray-300 text-xs sm:text-sm mt-1">
                  <span className="whitespace-nowrap">EMIS No: {student.emisNumber}</span>
                  {(selectedClass === 'All' || selectedSection === 'All') && (
                    <span className="bg-[#D8FDF6]/40 dark:bg-white text-[#2E1C40] dark:text-gray-900 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold whitespace-nowrap inline-block">
                      Std {student.standard} - {student.section}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-4 sm:gap-8 shrink-0 text-right pr-2">
                <div className="flex flex-col items-end">
                  <div className="text-[10px] sm:text-xs text-[#4C677C] dark:text-gray-400 font-bold uppercase tracking-wider mb-0.5">Marks</div>
                  <div className={cn(
                    "text-base sm:text-xl font-black",
                    rankBy === 'Marks' ? "text-[#2E1C40] dark:text-white text-lg sm:text-2xl" : "text-[#4C677C] dark:text-gray-300",
                    student.computedRank === 1 && rankBy === 'Marks' ? 'text-[#AE634A]' : '',
                    student.computedRank === 2 && rankBy === 'Marks' ? 'text-adminSidebar' : '',
                    student.computedRank === 3 && rankBy === 'Marks' ? 'text-[#732A26]' : ''
                  )}>
                    {student.totalMarks}
                  </div>
                </div>
                
                <div className="flex flex-col items-end">
                  <div className="text-[10px] sm:text-xs text-[#4C677C] dark:text-gray-400 font-bold uppercase tracking-wider mb-0.5">%</div>
                  <div className={cn(
                    "text-base sm:text-xl font-black",
                    rankBy === 'Percentage' ? "text-[#2E1C40] dark:text-white text-lg sm:text-2xl" : "text-[#4C677C] dark:text-gray-300",
                    student.computedRank === 1 && rankBy === 'Percentage' ? 'text-[#AE634A]' : '',
                    student.computedRank === 2 && rankBy === 'Percentage' ? 'text-adminSidebar' : '',
                    student.computedRank === 3 && rankBy === 'Percentage' ? 'text-[#732A26]' : ''
                  )}>
                    {student.displayPercentage}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {selectedStudentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg my-auto">
            <GlassCard className="w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center mb-6 sticky top-0 bg-white dark:bg-white backdrop-blur-md py-4 border-b border-[#E5D9C4] dark:border-[#4C677C]/30 z-10 -mx-6 px-6 -mt-6">
                <h2 className="text-xl font-bold text-[#2E1C40] dark:text-gray-900">
                  Student Details
                </h2>
                <button 
                  onClick={() => { setSelectedStudentId(null); setStudentDetails(null); }} 
                  className="p-2 text-[#4C677C]/60 hover:text-[#2E1C40] dark:text-gray-400 dark:hover:text-gray-900 transition-colors rounded-full hover:bg-[#E5D9C4] dark:hover:bg-[#2E1C40]/50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loadingDetails ? (
                <div className="text-center py-10 text-[#4C677C] dark:text-gray-400">Loading details...</div>
              ) : studentDetails ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <img 
                      src={studentDetails.photoUrl || 'https://placehold.co/150'} 
                      alt={studentDetails.name}
                      className="w-20 h-20 rounded-xl object-cover border-2 border-white/20"
                    />
                    <div>
                      <h3 className="text-2xl font-bold text-[#2E1C40] dark:text-gray-900">{studentDetails.name}</h3>
                      <div className="text-[#4C677C] dark:text-gray-300 font-medium">EMIS No: {studentDetails.emisNumber}</div>
                      <div className="text-[#4C677C] dark:text-gray-300 font-medium">Class: Std {studentDetails.standard} - {studentDetails.section}</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-bold text-[#2E1C40] dark:text-gray-900 text-lg border-b border-[#E5D9C4] dark:border-[#4C677C]/30 pb-2">Academic Performance</h4>
                    {studentDetails.terms && studentDetails.terms.length > 0 ? (
                      studentDetails.terms.map(term => (
                        <div key={term.termName} className="bg-white/40 dark:bg-gray-900/10 p-4 rounded-xl border border-[#E5D9C4]/50 dark:border-[#4C677C]/30">
                          <h5 className="font-bold text-[#AE634A] dark:text-[#FA7848] mb-3">{term.termName}</h5>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {term.marks && term.marks.map(mark => (
                              <div key={mark.subject} className="bg-white/60 dark:bg-[#121212]/60 p-2 rounded-lg border border-[#E5D9C4]/40 dark:border-[#4C677C]/20 text-center shadow-sm">
                                <div className="text-xs text-[#4C677C] dark:text-gray-400 mb-1">{mark.subject}</div>
                                <div className="font-bold text-[#2E1C40] dark:text-gray-900">{mark.score}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-[#4C677C] dark:text-gray-400 italic">No marks recorded yet.</div>
                    )}
                  </div>
                </div>
              ) : null}
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
}
