import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { NeonButton } from '../components/ui/NeonButton';
import { Printer, FileOutput, Share2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { useClassConfig } from '../context/ClassConfigContext';
import { StudyCertificatePrint } from '../components/certificates/StudyCertificatePrint';
import { RankCardPrint } from '../components/certificates/RankCardPrint';

export function Certificates() {
  const [students, setStudents] = useState([]);
  const [certificateType, setCertificateType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    language: '',
    standard: '',
    section: '',
    studentId: ''
  });

  const { dbUser } = useAuth();
  const { classConfigs } = useClassConfig();
  const printRef = useRef();

  let availableStandards = [];
  let availableSections = [];

  if (dbUser?.role === 'admin') {
    availableStandards = [...new Set(classConfigs.map(c => c.standard))].sort((a,b) => Number(a) - Number(b));
    availableSections = classConfigs.filter(c => c.standard === filters.standard).map(c => c.section).sort();
  } else if (dbUser?.assignedClasses) {
    availableStandards = [...new Set(dbUser.assignedClasses.map(c => c.standard))].sort((a,b) => Number(a) - Number(b));
    availableSections = dbUser.assignedClasses
      .filter(c => c.standard === filters.standard)
      .map(c => c.section)
      .sort();
  }

  useEffect(() => {
    const fetchStudents = async () => {
      if (!filters.standard || !filters.section) {
        setStudents([]);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const response = await api.getStudents(filters.standard, filters.section);
        setStudents(response.data || []);
      } catch (err) {
        console.error('Error fetching students:', err);
        setError('Failed to load students');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [filters.standard, filters.section]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
      // Reset dependent fields when parent changes
      ...(name === 'standard' && { section: '', studentId: '' }),
      ...(name === 'section' && { studentId: '' })
    }));

    if (name === 'studentId') {
      const student = students.find(s => s._id === value);
      setSelectedStudent(student || null);
    } else if (name === 'standard' || name === 'section') {
      setSelectedStudent(null);
    }
  };

  const handlePrint = () => {
    if (!certificateType) {
      alert("Please select a certificate type.");
      return;
    }
    if (!filters.language) {
      alert("Please select a language.");
      return;
    }
    if (!selectedStudent) {
      alert("Please select a student first.");
      return;
    }
    window.print();
  };

  const handleShare = async () => {
    if (!certificateType) {
      alert("Please select a certificate type.");
      return;
    }
    if (!filters.language) {
      alert("Please select a language.");
      return;
    }
    if (!selectedStudent) {
      alert("Please select a student first.");
      return;
    }

    const title = certificateType === 'STUDY' ? 'Study Certificate' : 'Rank Card';
    const text = `Check out the ${title} for ${selectedStudent.name} (${selectedStudent.standard}-${selectedStudent.section})`;
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: title,
          text: text,
          url: url
        });
      } else {
        // Fallback if Web Share API is not supported
        alert("Web Share API is not supported in your browser.");
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-white dark:to-gray-300 drop-shadow-sm">
            Study Certificate App
          </h1>
          <p className="text-[#4C677C] dark:text-gray-300 mt-1">Select details to generate certificate</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6">
        <GlassCard className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[#2E1C40]  ">
              <tbody>
                <tr className="border-b border-indigo-50 dark:border-[#4C677C]/30">
                  <th className="py-3 font-bold text-[#4C677C] dark:text-[#E5D9C4]  w-1/3">Certificate Type</th>
                  <td className="py-3">
                    <select
                      value={certificateType}
                      onChange={(e) => setCertificateType(e.target.value)}
                      className="glass-input w-full font-bold text-[#2E1C40] dark:!text-gray-900 bg-white dark:bg-transparent shadow-sm border border-[#E5D9C4] dark:border-[#4C677C]/30 focus:ring-indigo-400 disabled:opacity-50 [&>option]:bg-white dark:[&>option]:bg-white dark:[&>option]:text-gray-900"
                    >
                      <option value="">Select Certificate Type</option>
                      <option value="STUDY">Study Certificate</option>
                      <option value="RANK">Rank Card</option>
                    </select>
                  </td>
                </tr>
                <tr className="border-b border-indigo-50 dark:border-[#4C677C]/30">
                  <th className="py-3 font-bold text-[#4C677C] dark:text-[#E5D9C4]  w-1/3">Language</th>
                  <td className="py-3">
                    <select
                      name="language"
                      value={filters.language}
                      onChange={handleFilterChange}
                      className="glass-input w-full font-bold text-[#2E1C40] dark:!text-gray-900 bg-white dark:bg-transparent shadow-sm border border-[#E5D9C4] dark:border-[#4C677C]/30 focus:ring-indigo-400 disabled:opacity-50 [&>option]:bg-white dark:[&>option]:bg-white dark:[&>option]:text-gray-900"
                    >
                      <option value="">Select Language</option>
                      <option value="TAMIL">tamil</option>
                      <option value="ENGLISH">english</option>
                    </select>
                  </td>
                </tr>
                <tr className="border-b border-indigo-50 dark:border-[#4C677C]/30">
                  <th className="py-3 font-bold text-[#4C677C] dark:text-[#E5D9C4] ">Class</th>
                  <td className="py-3">
                    <select
                      name="standard"
                      value={filters.standard}
                      onChange={handleFilterChange}
                      className="glass-input w-full font-bold text-[#2E1C40] dark:!text-gray-900 bg-white dark:bg-transparent shadow-sm border border-[#E5D9C4] dark:border-[#4C677C]/30 focus:ring-indigo-400 disabled:opacity-50 [&>option]:bg-white dark:[&>option]:bg-white dark:[&>option]:text-gray-900"
                    >
                      <option value="">Select Class</option>
                      {availableStandards.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </td>
                </tr>
                <tr className="border-b border-indigo-50 dark:border-[#4C677C]/30">
                  <th className="py-3 font-bold text-[#4C677C] dark:text-[#E5D9C4] ">Section</th>
                  <td className="py-3">
                    <select
                      name="section"
                      value={filters.section}
                      onChange={handleFilterChange}
                      disabled={!filters.standard}
                      className="glass-input w-full font-bold text-[#2E1C40] dark:!text-gray-900 bg-white dark:bg-transparent shadow-sm border border-[#E5D9C4] dark:border-[#4C677C]/30 focus:ring-indigo-400 disabled:opacity-50 [&>option]:bg-white dark:[&>option]:bg-white dark:[&>option]:text-gray-900"
                    >
                      <option value="">Select Section</option>
                      {availableSections.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
                <tr className="border-b border-indigo-50 dark:border-[#4C677C]/30">
                  <th className="py-3 font-bold text-[#4C677C] dark:text-[#E5D9C4] ">Student Name</th>
                  <td className="py-3">
                    <select
                      name="studentId"
                      value={filters.studentId}
                      onChange={handleFilterChange}
                      disabled={!filters.section}
                      className="glass-input w-full font-bold text-[#2E1C40] dark:!text-gray-900 bg-white dark:bg-transparent shadow-sm border border-[#E5D9C4] dark:border-[#4C677C]/30 focus:ring-indigo-400 disabled:opacity-50 [&>option]:bg-white dark:[&>option]:bg-white dark:[&>option]:text-gray-900"
                    >
                      <option value="">Select Student</option>
                      {students.map(s => (
                        <option key={s._id} value={s._id}>{s.name}</option>
                      ))}
                    </select>
                  </td>
                </tr>
                <tr>
                  <th className="py-3 font-bold text-[#4C677C] dark:text-[#E5D9C4] ">EMIS Number</th>
                  <td className="py-3">
                    <div className="w-full bg-[#D8FDF6]/40 border border-[#E5D9C4] dark:border-[#4C677C]/30 dark:bg-[#121212] rounded-xl px-4 py-3 text-[#2E1C40] dark:text-gray-900 font-bold">
                      {selectedStudent ? selectedStudent.emisNumber : '-'}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </GlassCard>

        <div className="flex flex-col gap-4 justify-center items-center">
          <NeonButton 
            onClick={handlePrint}
            disabled={!selectedStudent}
            className="w-full py-4 text-lg flex items-center justify-center gap-2"
          >
            <Printer className="w-6 h-6" />
            PRINT PREVIEW
          </NeonButton>
          
          <button
            onClick={handleShare}
            disabled={!selectedStudent}
            className="w-full py-4 text-lg flex items-center justify-center gap-2 bg-[#62D4CA]/20 hover:bg-[#62D4CA]/40 text-[#2E1C40] dark:text-white border border-[#62D4CA]/50 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Share2 className="w-6 h-6" />
            SHARE
          </button>
        </div>
      </div>

      <GlassCard className="p-6">
        <h2 className="text-xl font-bold mb-4 bg-[#D8FDF6]/40 dark:bg-white text-[#2E1C40] dark:text-gray-900 p-3 rounded-xl">Student Summary</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[#2E1C40]  ">
            <tbody>
              <tr className="border-b border-indigo-50 dark:border-[#4C677C]/30">
                <th className="py-3 font-bold text-[#4C677C] dark:text-[#E5D9C4]  w-1/4">DOB:</th>
                <td className="py-3 font-bold text-indigo-950 dark:text-gray-900">{selectedStudent?.dob ? selectedStudent.dob.split('-').reverse().join('-') : '-'}</td>
              </tr>
              <tr className="border-b border-indigo-50 dark:border-[#4C677C]/30">
                <th className="py-3 font-bold text-[#4C677C] dark:text-[#E5D9C4] ">Father's Name:</th>
                <td className="py-3 font-bold text-indigo-950 dark:text-gray-900">{selectedStudent?.fatherName || '-'}</td>
              </tr>
              <tr>
                <th className="py-3 font-bold text-[#4C677C] dark:text-[#E5D9C4] ">Address:</th>
                <td className="py-3 font-bold text-indigo-950 dark:text-gray-900">{selectedStudent?.address || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Hidden Print Component */}
      {certificateType === 'STUDY' ? (
        <StudyCertificatePrint ref={printRef} student={selectedStudent} language={filters.language} />
      ) : (
        <RankCardPrint ref={printRef} student={selectedStudent} language={filters.language} />
      )}

    </div>
  );
}
